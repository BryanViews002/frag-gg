'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { getAvatarUrl, getRankRingClass, getRankColor, getCountryFlag } from '@/lib/utils';
import ScrollReveal from '@/components/ScrollReveal';
import { Trophy, Shield, Crosshair, Star, ChevronDown, Search, Crown } from 'lucide-react';

export default function LeaderboardsPage() {
  const supabase = createClient();
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'reputation' | 'wins' | 'matches'>('reputation');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      // For this implementation, we order by reputation_score since match/win tracking requires more complex joins/views
      let query = supabase
        .from('users')
        .select('id, username, avatar_url, country, rank, reputation_score, clan:clans(tag)')
        .order('reputation_score', { ascending: false })
        .limit(100);

      if (search) query = query.ilike('username', `%${search}%`);

      const { data } = await query;
      if (data) setPlayers(data);
      setLoading(false);
    };

    const timer = setTimeout(fetchLeaderboard, 300);
    return () => clearTimeout(timer);
  }, [search, sort]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* ─── HEADER ─── */}
      <div className="relative py-16 text-center border-b border-border"
        style={{ background: 'linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)' }}>
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <Trophy size={400} />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <ScrollReveal delay={100}>
            <h1 className="font-rajdhani font-bold text-5xl md:text-6xl mb-4 hero-title-glow">
              GLOBAL RANKINGS
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <p className="text-secondary text-lg mb-8 max-w-2xl mx-auto">The top CODM players on FRAG.GG ranked by reputation and performance.</p>
          </ScrollReveal>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto">
            <div className="relative w-full">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input type="text" className="frag-input pl-10 bg-bg-primary" placeholder="Search player..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {/* Sort toggle (UI only for now, since we sort by rep via API) */}
            <select className="frag-input w-full sm:w-auto bg-bg-primary" value={sort} onChange={e => setSort(e.target.value as any)}>
              <option value="reputation">Sort by Rep</option>
              <option value="wins" disabled>Sort by Wins (Soon)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="frag-card overflow-hidden">
          
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-border bg-secondary text-xs font-bold text-muted uppercase tracking-widest">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-5">Player</div>
            <div className="col-span-2 text-center">Current Rank</div>
            <div className="col-span-2 text-center">Win Rate</div>
            <div className="col-span-2 text-right">Reputation</div>
          </div>

          {/* List */}
          {loading ? (
            <div className="p-8 text-center"><div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin border-accent mx-auto" /></div>
          ) : players.length === 0 ? (
            <div className="p-12 text-center text-muted">No players found.</div>
          ) : (
            <div className="divide-y divide-border">
              {players.map((p, i) => {
                const rankColor = i === 0 ? 'var(--gold)' : i === 1 ? 'var(--silver)' : i === 2 ? 'var(--bronze)' : 'var(--text-muted)';
                const bgHighlight = i === 0 ? 'rgba(255,215,0,0.05)' : i === 1 ? 'rgba(192,192,192,0.05)' : i === 2 ? 'rgba(205,127,50,0.05)' : 'transparent';
                
                return (
                  <Link key={p.id} href={`/players/${p.username}`} className="block group transition-colors hover:bg-white/5" style={{ background: bgHighlight }}>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center">
                      
                      {/* Rank Number */}
                      <div className="col-span-1 hidden md:flex justify-center">
                        <span className="font-orbitron font-bold text-xl" style={{ color: rankColor }}>#{i + 1}</span>
                      </div>

                      {/* Player Info */}
                      <div className="col-span-1 md:col-span-5 flex items-center gap-4">
                        <div className="md:hidden font-orbitron font-bold text-lg w-8 text-center" style={{ color: rankColor }}>{i + 1}</div>
                        <Image src={getAvatarUrl(p.avatar_url, p.username)} alt="" width={48} height={48} 
                          className={`rounded-full border-2 ${getRankRingClass(p.rank)}`} />
                        <div className="flex-1 min-w-0">
                          <div className="font-rajdhani font-bold text-lg text-primary truncate group-hover:text-accent transition-colors flex items-center gap-2">
                            {p.clan && <span className="text-xs text-muted">[{p.clan.tag}]</span>}
                            {p.username}
                          </div>
                          <div className="text-xs text-secondary flex items-center gap-2 mt-0.5">
                            {p.country && <span>{getCountryFlag(p.country)}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Rank Badge */}
                      <div className="col-span-2 hidden md:flex justify-center">
                        <span className="badge badge-format text-xs" style={{ color: getRankColor(p.rank) }}>{p.rank || 'Unranked'}</span>
                      </div>

                      {/* Win Rate — requires match history which is tracked per tournament */}
                      <div className="col-span-2 hidden md:flex justify-center text-muted font-orbitron text-sm">
                        —
                      </div>

                      {/* Reputation */}
                      <div className="col-span-2 flex justify-between md:justify-end items-center md:items-end w-full md:w-auto">
                        <span className="md:hidden text-xs text-muted uppercase">Rep:</span>
                        <div className="flex items-center gap-1 font-orbitron font-bold text-lg text-primary">
                          {p.reputation_score} <Shield size={14} className="text-accent" />
                        </div>
                      </div>

                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
