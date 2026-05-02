'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { AlertOctagon, X } from 'lucide-react';

interface DisputeModalProps {
  matchId: string;
  tournamentId: string;
  userId: string;
  onClose: () => void;
}

export function DisputeModal({ matchId, tournamentId, userId, onClose }: DisputeModalProps) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();

  const handleSubmit = async () => {
    if (reason.length < 10) {
      toast.error('Please provide a detailed reason (min 10 chars).');
      return;
    }
    
    setSubmitting(true);
    try {
      // 1. Create dispute record
      const { error: disputeError } = await supabase
        .from('match_disputes')
        .insert({
          match_id: matchId,
          tournament_id: tournamentId,
          raised_by: userId,
          reason
        });

      if (disputeError) throw disputeError;

      // 2. Freeze the match status
      const { error: matchError } = await supabase
        .from('brackets')
        .update({ status: 'disputed' })
        .eq('id', matchId);
        
      if (matchError) throw matchError;

      toast.success('Dispute raised successfully. Admin has been notified.');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to raise dispute');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-[#111] border border-red-500/30 rounded-xl shadow-2xl p-6">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">
          <X size={24} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <AlertOctagon className="text-red-500" size={32} />
          <h2 className="text-2xl font-black font-rajdhani text-white">RAISE DISPUTE</h2>
        </div>

        <p className="text-gray-400 mb-6">
          Raising a dispute will immediately freeze this match and prevent the bracket from progressing. 
          <strong className="text-red-400 block mt-2">
            Warning: False or unfair disputes will result in a 5-point deduction to your Reputation Score.
          </strong>
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">
              Reason for Dispute
            </label>
            <textarea 
              className="w-full bg-[#222] border border-[#333] rounded-lg p-4 text-white focus:border-red-500 focus:outline-none min-h-[120px]"
              placeholder="Explain why you disagree with the submitted result..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <button 
            onClick={handleSubmit}
            disabled={submitting || reason.length < 10}
            className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold uppercase tracking-wider rounded-lg transition-colors"
          >
            {submitting ? 'SUBMITTING...' : 'SUBMIT DISPUTE'}
          </button>
        </div>
      </div>
    </div>
  );
}
