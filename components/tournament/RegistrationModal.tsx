'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Tournament } from '@/types';
import { X, Search, Check, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { getAvatarUrl, getRankRingClass } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Props {
  tournament: Tournament;
  currentUser: User;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RegistrationModal({ tournament, currentUser, onClose, onSuccess }: Props) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states based on format
  const [teamName, setTeamName] = useState('');
  
  // For teammates (index 1 to 4 depending on format)
  // Index 0 is always currentUser
  const [teammates, setTeammates] = useState<(User | null)[]>([
    null, null, null, null // Up to 4 extra players
  ]);
  const [searchQueries, setSearchQueries] = useState(['', '', '', '']);
  const [searchResults, setSearchResults] = useState<User[][]>([[], [], [], []]);

  const { mode, mp_format, br_format } = tournament;

  // Determine needed slots
  let slots = 1;
  if (mode === 'mp') {
    if (mp_format === '2v2') slots = 2;
    if (mp_format === '3v3') slots = 3;
    if (mp_format === '4v4') slots = 4;
    if (mp_format === '5v5') slots = 5;
  } else if (mode === 'br') {
    if (br_format === 'duo') slots = 2;
    if (br_format === 'squad') slots = 4;
  }

  // Handle Search
  const handleSearch = async (idx: number, query: string) => {
    const newQueries = [...searchQueries];
    newQueries[idx] = query;
    setSearchQueries(newQueries);

    if (query.length < 3) {
      const newResults = [...searchResults];
      newResults[idx] = [];
      setSearchResults(newResults);
      return;
    }

    const { data } = await supabase
      .from('users')
      .select('*')
      .or(`ingame_name.ilike.%${query}%,ingame_uid.ilike.%${query}%,username.ilike.%${query}%`)
      .neq('id', currentUser.id)
      .limit(5);
    
    if (data) {
      const newResults = [...searchResults];
      newResults[idx] = data as User[];
      setSearchResults(newResults);
    }
  };

  const selectUser = (idx: number, user: User) => {
    // Check if user already selected
    if (teammates.some(t => t?.id === user.id)) {
      setError('Player already added to the team.');
      return;
    }
    const newTeammates = [...teammates];
    newTeammates[idx] = user;
    setTeammates(newTeammates);
    setError('');
    
    const newQueries = [...searchQueries];
    newQueries[idx] = '';
    setSearchQueries(newQueries);
  };

  const removeUser = (idx: number) => {
    const newTeammates = [...teammates];
    newTeammates[idx] = null;
    setTeammates(newTeammates);
  };

  const handleSubmit = async () => {
    setError('');
    
    // Validation
    if (slots > 1 && mode === 'mp' && !teamName.trim()) {
      setError('Team name is required.');
      return;
    }
    if (slots > 1 && mode === 'br' && br_format === 'squad' && !teamName.trim()) {
      setError('Squad name is required.');
      return;
    }

    // Check if all slots are filled
    for (let i = 0; i < slots - 1; i++) {
      if (!teammates[i]) {
        setError(`Please fill all player slots.`);
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'mp') {
        const { error: regError } = await supabase.from('mp_registrations').insert({
          tournament_id: tournament.id,
          side: tournament.current_entries === 0 ? 'a' : 'b', // simplified logic
          team_name: slots > 1 ? teamName : currentUser.username,
          captain_id: currentUser.id,
          player2_id: slots >= 2 ? teammates[0]?.id : null,
          player3_id: slots >= 3 ? teammates[1]?.id : null,
          player4_id: slots >= 4 ? teammates[2]?.id : null,
          player5_id: slots >= 5 ? teammates[3]?.id : null,
        });
        if (regError) throw regError;
      } else {
        const { error: regError } = await supabase.from('br_registrations').insert({
          tournament_id: tournament.id,
          entry_name: slots > 1 ? teamName || currentUser.username : currentUser.ingame_name,
          captain_id: currentUser.id,
          player2_id: slots >= 2 ? teammates[0]?.id : null,
          player3_id: slots >= 4 ? teammates[1]?.id : null,
          player4_id: slots >= 4 ? teammates[2]?.id : null,
        });
        if (regError) throw regError;
      }

      // Update tournament current_entries count (normally done via trigger/RPC, keeping it simple here)
      await supabase.rpc('increment_tournament_entries', { t_id: tournament.id });

      toast.success('Registration successful!');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 100 }}>
      <div className="glass-modal w-full max-w-lg p-6 animate-scale-in relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:text-primary transition-colors">
          <X size={24} />
        </button>

        <h2 className="font-rajdhani font-bold text-2xl text-primary mb-2">Register for Tournament</h2>
        <div className="text-sm text-secondary mb-6 flex items-center gap-2">
          <span className={`badge ${mode === 'mp' ? 'badge-mp' : 'badge-br'}`}>{mode.toUpperCase()}</span>
          <span className="badge badge-format">{mp_format || br_format}</span>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-accent bg-accent/10 border border-accent/20 p-3 rounded-lg mb-4 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="space-y-4">
          {slots > 1 && (
            <div>
              <label className="frag-input-label">{mode === 'mp' ? 'Team Name' : 'Duo/Squad Name'}</label>
              <input type="text" className="frag-input" placeholder="Enter name..." value={teamName} onChange={e => setTeamName(e.target.value)} />
            </div>
          )}

          <div>
            <label className="frag-input-label">Captain (You)</label>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary border border-border">
              <Image src={getAvatarUrl(currentUser.avatar_url, currentUser.username)} alt="" width={32} height={32} className={`rounded-full ${getRankRingClass(currentUser.rank)}`} />
              <div>
                <div className="text-sm font-bold text-primary">{currentUser.username}</div>
                <div className="text-xs text-muted">{currentUser.ingame_name} · UID: {currentUser.ingame_uid}</div>
              </div>
              <span className="ml-auto badge" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>CAPTAIN</span>
            </div>
          </div>

          {Array.from({ length: slots - 1 }).map((_, i) => (
            <div key={i}>
              <label className="frag-input-label">Teammate {i + 1}</label>
              
              {teammates[i] ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary border border-border">
                  <Image src={getAvatarUrl(teammates[i]!.avatar_url, teammates[i]!.username)} alt="" width={32} height={32} className={`rounded-full ${getRankRingClass(teammates[i]!.rank)}`} />
                  <div className="flex-1">
                    <div className="text-sm font-bold text-primary">{teammates[i]!.username}</div>
                    <div className="text-xs text-muted">{teammates[i]!.ingame_name} · UID: {teammates[i]!.ingame_uid}</div>
                  </div>
                  <button onClick={() => removeUser(i)} className="text-muted hover:text-accent p-1"><X size={16} /></button>
                </div>
              ) : (
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input type="text" className="frag-input pl-9" placeholder="Search by in-game name or UID..." 
                    value={searchQueries[i]} onChange={e => handleSearch(i, e.target.value)} />
                  
                  {searchResults[i].length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-secondary border border-border rounded-lg shadow-xl z-10 overflow-hidden">
                      {searchResults[i].map(user => (
                        <div key={user.id} onClick={() => selectUser(i, user)}
                          className="flex items-center gap-3 p-3 hover:bg-card-hover cursor-pointer border-b border-border last:border-0 transition-colors">
                          <Image src={getAvatarUrl(user.avatar_url, user.username)} alt="" width={24} height={24} className="rounded-full" />
                          <div>
                            <div className="text-sm font-bold text-primary">{user.username}</div>
                            <div className="text-xs text-muted">{user.ingame_name} · UID: {user.ingame_uid}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          <button onClick={handleSubmit} disabled={loading} className="btn-accent w-full justify-center py-3 mt-4">
            {loading ? 'Processing...' : 'Confirm Registration'}
          </button>
        </div>
      </div>
    </div>
  );
}
