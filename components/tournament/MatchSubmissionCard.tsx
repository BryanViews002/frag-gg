'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { Trophy, AlertTriangle } from 'lucide-react';

interface MatchSubmissionCardProps {
  matchId: string;
  teamA: { id: string; name: string };
  teamB: { id: string; name: string };
  onSuccess: () => void;
}

export function MatchSubmissionCard({ matchId, teamA, teamB, onSuccess }: MatchSubmissionCardProps) {
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();

  const handleSubmit = async () => {
    if (!selectedWinner) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('brackets')
        .update({ winner_id: selectedWinner, status: 'confirmed' })
        .eq('id', matchId);

      if (error) throw error;
      toast.success('Result submitted successfully!');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit result');
    } finally {
      setSubmitting(false);
      setConfirming(false);
    }
  };

  if (confirming) {
    return (
      <div className="p-6 bg-[#111] border border-accent rounded-xl text-center animate-scale-in">
        <AlertTriangle size={32} className="mx-auto text-accent mb-4" />
        <h3 className="text-xl font-bold font-rajdhani text-white mb-2">Are you sure?</h3>
        <p className="text-gray-400 mb-6">
          Winner: <span className="text-accent font-bold">{selectedWinner === teamA.id ? teamA.name : teamB.name}</span>
          <br />This cannot be undone.
        </p>
        <div className="flex gap-4 justify-center">
          <button onClick={() => setConfirming(false)} className="btn-secondary">
            CANCEL
          </button>
          <button onClick={handleSubmit} disabled={submitting} className="btn-accent shadow-accent-glow">
            {submitting ? 'CONFIRMING...' : 'YES, CONFIRM'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-secondary border border-border rounded-xl">
      <h3 className="text-sm font-bold text-muted uppercase tracking-widest mb-4 text-center">Submit Result</h3>
      <div className="flex flex-col md:flex-row gap-4 justify-center">
        <button 
          onClick={() => setSelectedWinner(teamA.id)}
          className={`flex-1 p-6 rounded-xl border-2 transition-all font-rajdhani font-bold text-xl
            ${selectedWinner === teamA.id ? 'border-accent bg-accent/20 text-accent shadow-[0_0_15px_rgba(204,255,0,0.3)]' : 'border-[#333] bg-[#111] text-white hover:border-accent/50'}`}
        >
          {teamA.name}
        </button>
        <div className="flex items-center justify-center font-orbitron text-muted font-bold">
          VS
        </div>
        <button 
          onClick={() => setSelectedWinner(teamB.id)}
          className={`flex-1 p-6 rounded-xl border-2 transition-all font-rajdhani font-bold text-xl
            ${selectedWinner === teamB.id ? 'border-accent bg-accent/20 text-accent shadow-[0_0_15px_rgba(204,255,0,0.3)]' : 'border-[#333] bg-[#111] text-white hover:border-accent/50'}`}
        >
          {teamB.name}
        </button>
      </div>

      {selectedWinner && (
        <div className="mt-6 text-center animate-fade-in">
          <button onClick={() => setConfirming(true)} className="btn-accent w-full md:w-auto px-12">
            SUBMIT WINNER
          </button>
        </div>
      )}
    </div>
  );
}
