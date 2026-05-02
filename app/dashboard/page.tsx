'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import type { Tournament, Clan } from '@/types';
import TournamentCard from '@/components/tournament/TournamentCard';
import ScrollReveal from '@/components/ScrollReveal';
import { getAvatarUrl, getRankRingClass, getRankColor, getReputationColor, getReputationLabel } from '@/lib/utils';
import { Trophy, Target, Shield, Users, ArrowRight, Megaphone, Plus, ChevronRight } from 'lucide-react';
import Image from 'next/image';

function StatCard({ label, value, icon, suffix = '' }: { label: string; value: string | number; icon: React.ReactNode; suffix?: string }) {
  return (
    <div className="frag-card p-5 flex items-center justify-between">
      <div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
        <p className="font-orbitron font-bold text-3xl mt-1" style={{ color: 'var(--text-primary)' }}>{value}{suffix}</p>
      </div>
      <div className="p-3 rounded-xl" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
        {icon}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { profile, loading: authLoading } = useAuth();
  const supabase = createClient();
  const [stats, setStats] = useState({ entered: 0, won: 0, winRate: 0 });
  const [upcoming, setUpcoming] = useState<Tournament[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [clan, setClan] = useState<Clan | null>(null);
  const [suggested, setSuggested] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const fetchData = async () => {

      // ── Real stats: count registrations across both modes ──
      const [{ count: mpCount }, { count: brCount }] = await Promise.all([
        supabase
          .from('mp_registrations')
          .select('*', { count: 'exact', head: true })
          .or(`captain_id.eq.${profile.id},player2_id.eq.${profile.id},player3_id.eq.${profile.id},player4_id.eq.${profile.id},player5_id.eq.${profile.id}`),
        supabase
          .from('br_registrations')
          .select('*', { count: 'exact', head: true })
          .or(`captain_id.eq.${profile.id},player2_id.eq.${profile.id},player3_id.eq.${profile.id},player4_id.eq.${profile.id}`),
      ]);
      const totalEntered = (mpCount ?? 0) + (brCount ?? 0);
      // Wins and win rate will be calculated from match results in a future update
      setStats({ entered: totalEntered, won: 0, winRate: 0 });

      // Fetch suggested tournaments
      const { data: suggestedData } = await supabase
        .from('tournaments')
        .select('*')
        .eq('status', 'open')
        .limit(3);
      if (suggestedData) setSuggested(suggestedData as Tournament[]);

      // Fetch clan if user is in one
      if (profile.clan_id) {
        const { data: clanData } = await supabase
          .from('clans')
          .select('*, member_count:clan_members(count)')
          .eq('id', profile.clan_id)
          .single();
        if (clanData) setClan(clanData as Clan);
      }

      setLoading(false);
    };
    fetchData();
  }, [profile]);

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin border-accent" /></div>;
  if (!profile) return null;

  const repColor = getReputationColor(profile.reputation_score);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ─── TOP GREETING BAR ─── */}
      <ScrollReveal>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl"
          style={{ background: 'linear-gradient(135deg, rgba(16,16,30,0.8) 0%, rgba(6,6,14,0.9) 100%)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-5">
            <div className={`w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-secondary ${getRankRingClass(profile.rank)}`}>
              <Image src={getAvatarUrl(profile.avatar_url, profile.username)} alt="Avatar" width={64} height={64} className="object-cover" />
            </div>
            <div>
              <h1 className="font-rajdhani font-bold text-2xl md:text-3xl text-primary">
                WELCOME BACK, <span style={{ color: 'var(--accent)' }}>{profile.username.toUpperCase()}</span>
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <span className="badge badge-format" style={{ color: getRankColor(profile.rank) }}>{profile.rank ?? 'Unranked'}</span>
                <span className="badge" style={{ background: `${repColor}22`, color: repColor, border: `1px solid ${repColor}44` }}>
                  {getReputationLabel(profile.reputation_score)}: {profile.reputation_score}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right hidden md:block">
            <div className="text-muted text-sm font-semibold uppercase">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
          </div>
        </div>
      </ScrollReveal>

      {/* ─── STATS ROW ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ScrollReveal delay={0}><StatCard label="Tournaments" value={stats.entered} icon={<Trophy size={24} />} /></ScrollReveal>
        <ScrollReveal delay={80}><StatCard label="Wins" value={stats.won} icon={<Target size={24} />} /></ScrollReveal>
        <ScrollReveal delay={160}><StatCard label="Win Rate" value={stats.winRate} suffix="%" icon={<Users size={24} />} /></ScrollReveal>
        <ScrollReveal delay={240}><StatCard label="Reputation" value={profile.reputation_score} icon={<Shield size={24} />} /></ScrollReveal>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ─── LEFT COLUMN (WIDER) ─── */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Announcements */}
          {announcements.length > 0 && (
            <div className="space-y-3">
              {announcements.map(a => (
                <div key={a.id} className="flex items-start gap-4 p-4 rounded-xl border border-accent-dim bg-accent-dim/10">
                  <Megaphone className="text-accent mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-rajdhani font-bold text-lg text-primary">{a.title}</h3>
                    <p className="text-secondary text-sm mt-1">{a.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upcoming Matches */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-rajdhani font-bold text-xl uppercase tracking-widest text-primary">Upcoming Matches</h2>
            </div>
            {upcoming.length === 0 ? (
              <div className="frag-card-static p-8 text-center border-dashed">
                <Trophy size={40} className="mx-auto mb-3 opacity-20" />
                <p className="text-secondary font-medium">No upcoming matches.</p>
                <Link href="/tournaments" className="text-accent text-sm font-semibold mt-2 inline-flex items-center gap-1 hover:underline">
                  Browse Tournaments <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Upcoming items would map here */}
              </div>
            )}
          </section>

          {/* Recent Results */}
          <section>
            <h2 className="font-rajdhani font-bold text-xl uppercase tracking-widest text-primary mb-4">Recent Results</h2>
            <div className="frag-card-static p-8 text-center border-dashed">
              <Target size={40} className="mx-auto mb-3 opacity-20" />
              <p className="text-secondary font-medium">No recent results.</p>
            </div>
          </section>
        </div>

        {/* ─── RIGHT COLUMN (NARROWER) ─── */}
        <div className="space-y-8">
          
          {/* Quick Actions */}
          <section>
            <h2 className="font-rajdhani font-bold text-lg uppercase tracking-widest text-primary mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/tournaments/create" className="frag-card p-4 flex flex-col items-center text-center gap-2 group hover:border-accent">
                <div className="p-2 rounded-full bg-accent-dim text-accent group-hover:scale-110 transition-transform"><Plus size={20} /></div>
                <span className="text-sm font-semibold text-secondary group-hover:text-primary">Create Tourney</span>
              </Link>
              <Link href="/tournaments" className="frag-card p-4 flex flex-col items-center text-center gap-2 group hover:border-accent">
                <div className="p-2 rounded-full bg-accent-dim text-accent group-hover:scale-110 transition-transform"><Trophy size={20} /></div>
                <span className="text-sm font-semibold text-secondary group-hover:text-primary">Browse All</span>
              </Link>
              <Link href="/find-teammates" className="frag-card p-4 flex flex-col items-center text-center gap-2 group hover:border-accent">
                <div className="p-2 rounded-full bg-accent-dim text-accent group-hover:scale-110 transition-transform"><Users size={20} /></div>
                <span className="text-sm font-semibold text-secondary group-hover:text-primary">Find Team</span>
              </Link>
              <Link href="/profile/edit" className="frag-card p-4 flex flex-col items-center text-center gap-2 group hover:border-accent">
                <div className="p-2 rounded-full bg-accent-dim text-accent group-hover:scale-110 transition-transform"><Target size={20} /></div>
                <span className="text-sm font-semibold text-secondary group-hover:text-primary">Edit Profile</span>
              </Link>
            </div>
          </section>

          {/* Your Clan */}
          <section>
            <h2 className="font-rajdhani font-bold text-lg uppercase tracking-widest text-primary mb-4">Your Clan</h2>
            {clan ? (
              <div className="frag-card p-5 flex items-center gap-4 cursor-pointer hover:border-accent" onClick={() => {}}>
                <div className="w-12 h-12 rounded-xl bg-secondary border border-border flex items-center justify-center overflow-hidden">
                  {clan.logo_url ? <Image src={clan.logo_url} alt={clan.name} width={48} height={48} className="object-cover" /> : <Shield size={24} className="text-muted" />}
                </div>
                <div className="flex-1">
                  <div className="font-rajdhani font-bold text-lg text-primary">{clan.name} <span className="clan-tag">[{clan.tag}]</span></div>
                  <div className="text-xs text-muted mt-1">{(clan as any).member_count?.[0]?.count ?? 1} Members</div>
                </div>
                <ChevronRight size={18} className="text-muted" />
              </div>
            ) : (
              <div className="frag-card-static p-6 text-center">
                <Shield size={32} className="mx-auto mb-2 text-muted" />
                <p className="text-secondary text-sm mb-4">You are not in a clan yet.</p>
                <div className="flex gap-2 justify-center">
                  <Link href="/clans" className="btn-secondary text-xs py-1.5">Find Clan</Link>
                  <Link href="/clans/create" className="btn-accent text-xs py-1.5">Create Clan</Link>
                </div>
              </div>
            )}
          </section>

          {/* Suggested Tournaments */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-rajdhani font-bold text-lg uppercase tracking-widest text-primary">Suggested</h2>
              <Link href="/tournaments" className="text-accent text-xs font-semibold hover:underline">View All</Link>
            </div>
            <div className="space-y-4">
              {suggested.length === 0 ? (
                <p className="text-muted text-sm">No open tournaments right now.</p>
              ) : (
                suggested.map(t => (
                  <Link key={t.id} href={`/tournaments/${t.id}`} className="flex gap-3 group">
                    <div className="w-24 h-16 rounded-lg overflow-hidden relative flex-shrink-0 border border-border group-hover:border-accent">
                      <Image src={t.banner_url || `https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&q=80`} alt={t.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <h4 className="font-rajdhani font-bold text-primary truncate group-hover:text-accent transition-colors">{t.name}</h4>
                      <div className="text-xs text-muted mt-1 flex items-center gap-2">
                        <span className={`badge ${t.mode === 'mp' ? 'badge-mp' : 'badge-br'} px-1.5 py-0.5 text-[0.6rem]`}>{t.mode.toUpperCase()}</span>
                        {t.has_prize && <span className="text-gold font-bold">Prize</span>}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

