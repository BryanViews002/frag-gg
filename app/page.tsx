'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import type { Tournament, User, Clan } from '@/types';
import TournamentCard from '@/components/tournament/TournamentCard';
import ScrollReveal from '@/components/ScrollReveal';
import { useCountAnimation } from '@/lib/hooks/useCountAnimation';
import { getAvatarUrl, getRankRingClass, getCountryFlag, calculateWinRate } from '@/lib/utils';
import {
  ChevronDown, Zap, Trophy, Users, Globe, ArrowRight,
  Shield, Star, Target, Gamepad2, Crown
} from 'lucide-react';

const ParticleCanvas = dynamic(() => import('@/components/canvas/ParticleCanvas'), { ssr: false });

// ─── Animated Counter Card ─────────────────────────────
function CounterCard({ label, target, suffix = '' }: { label: string; target: number; suffix?: string }) {
  const { count, ref } = useCountAnimation(target);
  return (
    <div className="text-center" ref={ref as any}>
      <div className="font-orbitron font-bold text-3xl md:text-4xl" style={{ color: 'var(--accent)' }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div className="mt-1 text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
    </div>
  );
}

// ─── How It Works Card ──────────────────────────────────
function HowItWorksCard({ number, icon, title, desc }: { number: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="frag-card p-8 text-center group cursor-default">
      <div className="font-orbitron font-bold text-5xl mb-4" style={{ color: 'var(--accent-dim)', WebkitTextStroke: '1px var(--accent)' }}>
        {number}
      </div>
      <div className="flex justify-center mb-4"
        style={{ color: 'var(--accent)', filter: 'drop-shadow(0 0 8px rgba(255,69,0,0.5))' }}>
        {icon}
      </div>
      <h3 className="font-rajdhani font-bold text-xl mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>{desc}</p>
    </div>
  );
}

// ─── TOP PLAYER ROW ─────────────────────────────────────
function TopPlayerRow({ player, rank, wins }: { player: User; rank: number; wins: number }) {
  const rankColor = rank === 1 ? 'var(--gold)' : rank === 2 ? 'var(--silver)' : rank === 3 ? 'var(--bronze)' : 'var(--text-muted)';
  return (
    <div className="frag-card flex items-center gap-4 p-4">
      <span className="font-orbitron font-bold text-xl w-8 text-center flex-shrink-0" style={{ color: rankColor }}>{rank}</span>
      <div
        className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
        style={{ border: `2px solid ${rankColor}`, boxShadow: `0 0 10px ${rankColor}66` }}
      >
        <Image src={getAvatarUrl(player.avatar_url, player.username)} alt={player.username} width={40} height={40} className="object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-rajdhani font-bold" style={{ color: 'var(--text-primary)' }}>{player.username}</div>
        <div className="text-xs" style={{ color: 'var(--accent)' }}>{player.ingame_name}</div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="font-orbitron font-bold text-sm" style={{ color: 'var(--accent)' }}>{wins}</div>
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>WINS</div>
      </div>
      {player.country && (
        <span className="text-xl flex-shrink-0">{getCountryFlag(player.country)}</span>
      )}
    </div>
  );
}

// ─── EMPTY STATE ─────────────────────────────────────────
function EmptyState({ icon, title, desc, cta, ctaHref }: { icon: React.ReactNode; title: string; desc: string; cta?: string; ctaHref?: string }) {
  return (
    <div className="text-center py-12">
      <div className="flex justify-center mb-4 opacity-30">{icon}</div>
      <h3 className="font-rajdhani font-bold text-xl mb-2" style={{ color: 'var(--text-secondary)' }}>{title}</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{desc}</p>
      {cta && ctaHref && (
        <Link href={ctaHref} className="btn-accent mt-4 inline-flex">{cta}</Link>
      )}
    </div>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────
export default function HomePage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [topPlayers, setTopPlayers] = useState<Array<User & { wins: number }>>([]);
  const [stats, setStats] = useState({ players: 0, tournaments: 0, clans: 0, countries: 0 });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      // Fetch featured/open tournaments (max 6)
      const { data: tourData } = await supabase
        .from('tournaments')
        .select('*, creator:users!creator_id(username, avatar_url)')
        .in('status', ['open', 'live'])
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(6);

      // Fetch platform stats
      const [{ count: playerCount }, { count: tournamentCount }, { count: clanCount }] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('tournaments').select('*', { count: 'exact', head: true }),
        supabase.from('clans').select('*', { count: 'exact', head: true }),
      ]);

      if (tourData) setTournaments(tourData as Tournament[]);
      setStats({
        players: playerCount ?? 0,
        tournaments: tournamentCount ?? 0,
        clans: clanCount ?? 0,
        countries: 0,
      });
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div style={{ background: 'var(--bg-primary)' }}>
      {/* ═══════════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════════ */}
      <section
        className="relative flex flex-col items-center justify-center text-center overflow-hidden"
        style={{ minHeight: '100vh', paddingTop: '4rem' }}
      >
        <ParticleCanvas />
        <div className="scanline-overlay" />
        {/* Vignette overlay */}
        <div className="absolute inset-0 pointer-events-none z-[1]" style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(6,6,14,0.6) 100%)',
        }} />

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <ScrollReveal delay={100} direction="up" distance={20}>
            <div
              className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full"
              style={{
                background: 'rgba(255,69,0,0.08)',
                border: '1px solid rgba(255,69,0,0.2)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <Zap size={14} style={{ color: 'var(--accent)' }} />
              <span className="font-rajdhani font-bold text-sm uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
                THE PREMIER CODM PLATFORM
              </span>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200} direction="up" distance={24}>
            <h1
              className="font-rajdhani font-bold hero-title-glow"
              style={{ fontSize: 'clamp(4rem, 12vw, 9rem)', lineHeight: 1, marginBottom: '1rem', letterSpacing: '-0.02em' }}
            >
              FRAG.GG
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={350} direction="up" distance={18}>
            <p
              className="font-rajdhani font-semibold"
              style={{ fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', color: 'var(--text-secondary)', marginBottom: '2.5rem', letterSpacing: '0.05em' }}
            >
              Compete. Dominate. Get Recognized.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={500} direction="up" distance={16}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/tournaments/create" className="btn-accent" style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}>
                <Trophy size={18} />
                Create Tournament
              </Link>
              <Link href="/register" className="btn-ghost" style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}>
                Join For Free
                <ArrowRight size={16} />
              </Link>
            </div>
          </ScrollReveal>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce-subtle flex flex-col items-center gap-2"
          style={{ color: 'var(--text-muted)' }}
        >
          <span style={{ fontSize: '0.7rem', letterSpacing: '0.15em', fontFamily: 'Inter' }}>SCROLL</span>
          <ChevronDown size={20} />
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          LIVE STATS BAR
          ═══════════════════════════════════════════ */}
      <section style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '2.5rem 1rem' }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <ScrollReveal delay={0}><CounterCard label="Players Registered" target={stats.players} /></ScrollReveal>
          <ScrollReveal delay={100}><CounterCard label="Tournaments Hosted" target={stats.tournaments} /></ScrollReveal>
          <ScrollReveal delay={200}><CounterCard label="Active Clans" target={stats.clans} /></ScrollReveal>
          <ScrollReveal delay={300}><CounterCard label="Countries" target={24} suffix="+" /></ScrollReveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FEATURED TOURNAMENTS
          ═══════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <ScrollReveal>
          <div className="flex items-center justify-between mb-10">
            <h2 className="section-heading">Active Tournaments</h2>
            <Link href="/tournaments" className="btn-ghost" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              View All <ArrowRight size={14} />
            </Link>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton skeleton-stagger" style={{ height: '320px' }} />
            ))}
          </div>
        ) : tournaments.length === 0 ? (
          <ScrollReveal>
            <EmptyState
              icon={<Trophy size={64} />}
              title="No Active Tournaments"
              desc="Be the first to create a tournament on FRAG.GG!"
              cta="Create Tournament"
              ctaHref="/tournaments/create"
            />
          </ScrollReveal>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((t, i) => (
              <ScrollReveal key={t.id} delay={i * 80}>
                <TournamentCard tournament={t} />
              </ScrollReveal>
            ))}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════
          HOW IT WORKS
          ═══════════════════════════════════════════ */}
      <section style={{ background: 'var(--bg-secondary)', padding: '5rem 1rem' }}>
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="section-heading">How It Works</h2>
              <p className="mt-4" style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                Get into the action in three simple steps
              </p>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ScrollReveal delay={0}>
              <HowItWorksCard
                number="01"
                icon={<Gamepad2 size={36} />}
                title="Create Your Profile"
                desc="Sign up with your CODM in-game name & UID. Your identity is verified through your actual credentials."
              />
            </ScrollReveal>
            <ScrollReveal delay={120}>
              <HowItWorksCard
                number="02"
                icon={<Trophy size={36} />}
                title="Join or Host a Tournament"
                desc="Register for open tournaments or create your own for any mode — MP or Battle Royale."
              />
            </ScrollReveal>
            <ScrollReveal delay={240}>
              <HowItWorksCard
                number="03"
                icon={<Crown size={36} />}
                title="Compete & Get Recognized"
                desc="Climb leaderboards, earn badges, build your reputation, and find your crew."
              />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          TOP PLAYERS PREVIEW
          ═══════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <ScrollReveal>
          <div className="flex items-center justify-between mb-10">
            <h2 className="section-heading">Top Fraggers</h2>
            <Link href="/leaderboards" className="btn-ghost" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              Full Leaderboard <ArrowRight size={14} />
            </Link>
          </div>
        </ScrollReveal>
        <div className="max-w-2xl">
          {topPlayers.length === 0 ? (
            <ScrollReveal>
              <EmptyState
                icon={<Star size={48} />}
                title="Leaderboard Empty"
                desc="Complete tournaments to appear on the leaderboard."
              />
            </ScrollReveal>
          ) : (
            <div className="space-y-3">
              {topPlayers.slice(0, 5).map((player, i) => (
                <ScrollReveal key={player.id} delay={i * 80}>
                  <TopPlayerRow player={player} rank={i + 1} wins={player.wins} />
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          JOIN CTA SECTION
          ═══════════════════════════════════════════ */}
      <section
        className="relative py-24 text-center overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(255,69,0,0.06) 0%, var(--bg-secondary) 40%, rgba(255,107,0,0.04) 100%)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <ScrollReveal>
          <div className="relative z-10 max-w-2xl mx-auto px-4">
            <div className="flex justify-center mb-4" style={{ color: 'var(--accent)' }}>
              <Shield size={48} />
            </div>
            <h2
              className="font-rajdhani font-bold mb-4"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '0.05em' }}
            >
              READY TO PROVE YOURSELF?
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.1rem' }}>
              Join hundreds of CODM players competing for glory. 100% free. No pay-to-win. Just skill.
            </p>
            <Link href="/register" className="btn-accent" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
              <Zap size={20} />
              Create Free Account
            </Link>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
