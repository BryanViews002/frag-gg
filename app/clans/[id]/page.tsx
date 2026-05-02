'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import type { Clan, User } from '@/types';
import { getAvatarUrl, getRankRingClass, getRankColor } from '@/lib/utils';
import { Shield, Target, Users, Calendar, Trophy, Crosshair } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export default function ClanDetailsPage() {
  const { id } = useParams();
  const supabase = createClient();
  const { profile } = useAuth();
  
  const [clan, setClan] = useState<Clan | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('roster');

  useEffect(() => {
    const fetchClan = async () => {
      setLoading(true);
      const { data: clanData } = await supabase
        .from('clans')
        .select('*, leader:users!leader_id(*)')
        .eq('id', id)
        .single();
      
      if (clanData) setClan(clanData as Clan);

      const { data: membersData } = await supabase
        .from('clan_members')
        .select('role, joined_at, user:users(*)')
        .eq('clan_id', id)
        .order('role', { ascending: true }); // 'leader', 'co-leader', 'member'

      if (membersData) setMembers(membersData);
      
      setLoading(false);
    };

    fetchClan();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin border-accent" /></div>;
  if (!clan) return <div className="min-h-screen flex items-center justify-center font-rajdhani text-2xl text-muted">Clan not found</div>;

  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--bg-primary)' }}>
      {/* ─── CLAN HEADER ─── */}
      <div className="relative py-20 px-4 overflow-hidden border-b border-border text-center"
        style={{ background: 'linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)' }}>
        
        {/* Background Logo Blur */}
        {clan.logo_url && (
          <div className="absolute inset-0 flex items-center justify-center opacity-5 mix-blend-screen pointer-events-none">
            <Image src={clan.logo_url} alt="" width={600} height={600} className="object-cover blur-md" />
          </div>
        )}

        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-secondary border-2 border-border mb-6 flex items-center justify-center overflow-hidden shadow-2xl">
            {clan.logo_url ? <Image src={clan.logo_url} alt={clan.name} width={160} height={160} className="object-cover" /> : <Shield size={64} className="text-muted" />}
          </div>
          
          <h1 className="font-rajdhani font-bold text-4xl md:text-6xl text-primary mb-2">
            {clan.name}
          </h1>
          <div className="text-accent font-orbitron font-bold text-2xl tracking-widest mb-6 border border-accent/30 bg-accent/10 px-4 py-1 rounded">
            [{clan.tag}]
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mb-8 text-sm font-semibold uppercase tracking-widest">
            <div className="flex items-center gap-2 text-secondary"><Users size={16} className="text-accent" /> {members.length} Members</div>
            <div className="flex items-center gap-2 text-secondary"><Calendar size={16} className="text-accent" /> Est. {new Date(clan.created_at).getFullYear()}</div>
            <div className="flex items-center gap-2 text-secondary"><Crosshair size={16} className="text-accent" /> Req: {(clan as any).req_rank}</div>
          </div>

          {!profile?.clan_id && profile?.rank && (
             <button className="btn-accent px-8 py-3 text-lg">Request to Join</button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        <div className="flex gap-2 border-b border-border mb-8 overflow-x-auto scrollbar-hide">
          {['roster', 'about', 'tournaments'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`tab-btn whitespace-nowrap capitalize ${activeTab === tab ? 'active' : ''}`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2">
            
            {activeTab === 'roster' && (
              <div className="space-y-4 animate-slide-up">
                {members.map(m => (
                  <Link key={m.user.id} href={`/players/${m.user.username}`} className="block">
                    <div className="frag-card p-4 flex items-center gap-4 transition-colors hover:bg-white/5 hover:border-accent">
                      <Image src={getAvatarUrl(m.user.avatar_url, m.user.username)} alt="" width={48} height={48} 
                        className={`rounded-full border-2 ${getRankRingClass(m.user.rank)}`} />
                      <div className="flex-1 min-w-0">
                        <div className="font-rajdhani font-bold text-lg text-primary truncate flex items-center gap-2">
                          {m.user.username}
                          {m.role === 'leader' && <Shield size={14} className="text-gold" />}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="badge badge-format" style={{ color: getRankColor(m.user.rank) }}>{m.user.rank || 'Unranked'}</span>
                          <span className="text-muted uppercase tracking-widest font-bold">{m.role}</span>
                        </div>
                      </div>
                      <div className="text-right hidden sm:block">
                        <div className="text-xs text-muted uppercase tracking-widest font-bold">Joined</div>
                        <div className="text-secondary text-sm">{formatDistanceToNow(new Date(m.joined_at))} ago</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {activeTab === 'about' && (
              <div className="frag-card-static p-8 animate-slide-up">
                <h3 className="font-rajdhani font-bold text-2xl text-primary mb-4 border-b border-border pb-2">Clan Description</h3>
                <p className="text-secondary leading-relaxed whitespace-pre-wrap">{clan.description}</p>
              </div>
            )}

            {activeTab === 'tournaments' && (
              <div className="frag-card-static p-8 text-center animate-slide-up">
                <Trophy size={48} className="mx-auto mb-4 opacity-20" />
                <h3 className="font-rajdhani font-bold text-xl text-primary mb-2">Tournament History</h3>
                <p className="text-muted">This clan has not participated in any tracked tournaments yet.</p>
              </div>
            )}

          </div>

          {/* Sidebar */}
          <div>
            <div className="frag-card p-6 sticky top-24 space-y-6">
              
              <div>
                <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-3">Leader</h3>
                <Link href={`/players/${clan.leader?.username}`} className="flex items-center gap-3 p-3 rounded-lg bg-secondary border border-border hover:border-accent transition-colors">
                  <Image src={getAvatarUrl(clan.leader?.avatar_url || null, clan.leader?.username || 'Unknown')} alt="" width={40} height={40} className="rounded-full" />
                  <div>
                    <div className="font-bold text-primary flex items-center gap-1">{clan.leader?.username} <Shield size={12} className="text-gold" /></div>
                    <div className="text-xs text-accent">Commander</div>
                  </div>
                </Link>
              </div>

              <div>
                <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-3">Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-secondary">Global Rank</span>
                    <span className="font-orbitron font-bold text-primary">#---</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-secondary">Tournaments Won</span>
                    <span className="font-orbitron font-bold text-primary">0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-secondary">Total Rep</span>
                    <span className="font-orbitron font-bold text-primary">
                      {members.reduce((acc, m) => acc + (m.user.reputation_score || 0), 0)}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
