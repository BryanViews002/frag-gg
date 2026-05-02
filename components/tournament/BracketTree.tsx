'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Trophy, ShieldAlert } from 'lucide-react';
import type { Bracket } from '@/types';

interface BracketTreeProps {
  tournamentId: string;
  isOrganizerOrMod: boolean;
  onMatchSelect?: (match: Bracket) => void;
}

export function BracketTree({ tournamentId, isOrganizerOrMod, onMatchSelect }: BracketTreeProps) {
  const [brackets, setBrackets] = useState<Bracket[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchBrackets = async () => {
      const { data } = await supabase
        .from('brackets')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('round_number', { ascending: true })
        .order('match_number', { ascending: true });

      if (data) setBrackets(data as Bracket[]);
      setLoading(false);
    };

    fetchBrackets();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`bracket_${tournamentId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'brackets', filter: `tournament_id=eq.${tournamentId}` }, (payload) => {
        fetchBrackets();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournamentId, supabase]);

  if (loading) {
    return <div className="animate-pulse flex gap-8 p-8 overflow-x-auto">
      {[1, 2, 3].map(round => (
        <div key={round} className="flex flex-col justify-around gap-4 min-w-[250px]">
          {[...Array(Math.pow(2, 3 - round))].map((_, i) => (
            <div key={i} className="h-20 bg-secondary rounded-lg border border-border"></div>
          ))}
        </div>
      ))}
    </div>;
  }

  if (!brackets.length) {
    return <div className="p-12 text-center text-muted font-rajdhani text-xl">
      Bracket generation pending... 
    </div>;
  }

  // Group by round
  const maxRound = Math.max(...brackets.map(b => b.round_number));
  const rounds = Array.from({ length: maxRound }, (_, i) => i + 1);

  return (
    <div className="flex gap-12 p-8 overflow-x-auto min-h-[500px] bg-[#0a0a0a] rounded-xl border border-border">
      {rounds.map(roundNum => {
        const roundMatches = brackets.filter(b => b.round_number === roundNum);
        
        let roundLabel = `Round ${roundNum}`;
        if (roundNum === maxRound) roundLabel = 'Grand Final';
        else if (roundNum === maxRound - 1) roundLabel = 'Semi Finals';
        else if (roundNum === maxRound - 2) roundLabel = 'Quarter Finals';

        return (
          <div key={roundNum} className="flex flex-col justify-around min-w-[260px] relative">
            <h3 className="absolute -top-8 w-full text-center font-rajdhani font-bold text-muted uppercase tracking-widest">
              {roundLabel}
            </h3>
            
            {roundMatches.map((match, idx) => {
              const isFinal = roundNum === maxRound;
              return (
                <div key={match.id} className="relative my-4 group">
                  {/* Connector Lines to next round */}
                  {!isFinal && (
                    <>
                      <div className="absolute -right-6 top-1/2 w-6 h-[2px] bg-[#333]" />
                      {idx % 2 === 0 ? (
                        <div className="absolute -right-6 top-1/2 w-[2px] h-[calc(50%+1rem)] bg-[#333]" />
                      ) : (
                        <div className="absolute -right-6 bottom-1/2 w-[2px] h-[calc(50%+1rem)] bg-[#333]" />
                      )}
                    </>
                  )}

                  {/* Match Card */}
                  <div 
                    onClick={() => isOrganizerOrMod && onMatchSelect && onMatchSelect(match)}
                    className={`bg-[#111] border rounded-lg overflow-hidden transition-all
                      ${match.status === 'disputed' ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 
                        match.status === 'confirmed' ? 'border-[#333]' : 'border-accent/30 hover:border-accent'}
                      ${isOrganizerOrMod ? 'cursor-pointer hover:-translate-y-1 hover:shadow-xl' : ''}
                    `}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-3 py-1 bg-[#1a1a1a] border-b border-[#333] text-xs font-bold text-muted">
                      <span>M {match.match_number}</span>
                      {match.status === 'disputed' && <span className="text-red-500 flex items-center gap-1"><ShieldAlert size={12}/> DISPUTED</span>}
                      {match.is_bye && <span className="text-accent">AUTO ADVANCE</span>}
                    </div>

                    {/* Slot A */}
                    <div className={`flex items-center justify-between p-3 border-b border-[#222]
                      ${match.winner_id === match.slot_a_id ? 'bg-accent/10 text-white font-bold' : 'text-gray-400'}
                    `}>
                      <div className="truncate mr-2">
                        {match.slot_a_id ? (match as any).slot_a?.team_name || 'Team/Player' : 'TBD'}
                      </div>
                      {match.winner_id === match.slot_a_id && <Trophy size={14} className="text-accent flex-shrink-0" />}
                    </div>

                    {/* Slot B */}
                    <div className={`flex items-center justify-between p-3
                      ${match.winner_id === match.slot_b_id ? 'bg-accent/10 text-white font-bold' : 'text-gray-400'}
                    `}>
                      <div className="truncate mr-2">
                        {match.is_bye ? 'BYE' : match.slot_b_id ? (match as any).slot_b?.team_name || 'Team/Player' : 'TBD'}
                      </div>
                      {match.winner_id === match.slot_b_id && <Trophy size={14} className="text-accent flex-shrink-0" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
