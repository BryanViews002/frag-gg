'use client';

import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import type { Tournament, User } from '@/types';
import TournamentCard from '@/components/tournament/TournamentCard';
import ScrollReveal from '@/components/ScrollReveal';
import TacticalBackdrop from '@/components/visuals/TacticalBackdrop';
import { useCountAnimation } from '@/lib/hooks/useCountAnimation';
import { getAvatarUrl, getCountryFlag } from '@/lib/utils';
import { useEffect, useState } from 'react';
import {
  ChevronDown, Zap, Trophy, Users, Globe, ArrowRight,
  Shield, Star, Target, Gamepad2, Crown, Swords, Activity, ShieldCheck
} from 'lucide-react';

// ─── Animated Counter ───────────────────────────────────────
function CounterCard({ label, target, suffix = '', icon }: {
  label: string; target: number; suffix?: string; icon?: React.ReactNode;
}) {
  const { count, ref } = useCountAnimation(target);
  return (
    <div className="stat-card-premium" ref={ref as any}>
      {icon && <div style={{ color: 'var(--accent)', opacity: 0.65, marginBottom: '0.25rem' }}>{icon}</div>}
      <div
        className="font-orbitron font-bold"
        style={{ fontSize: 'clamp(1.6rem,3.5vw,2.4rem)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
      >
        {count.toLocaleString()}{suffix}
      </div>
      <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.14em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
        {label}
      </div>
    </div>
  );
}

// ─── How It Works Card ──────────────────────────────────────
function HowItWorksCard({ number, icon, title, desc }: {
  number: string; icon: React.ReactNode; title: string; desc: string;
}) {
  return (
    <div className="frag-card card-accent-orange p-7 text-center group cursor-default h-full">
      {/* Step circle */}
      <div
        style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'rgba(255,69,0,0.07)',
          border: '1px solid rgba(255,69,0,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.25rem',
          fontFamily: 'Orbitron, sans-serif', fontWeight: 700, fontSize: '1.1rem',
          color: 'var(--accent)',
          transition: 'background 0.3s ease, box-shadow 0.3s ease',
        }}
        className="group-hover:bg-[rgba(255,69,0,0.14)] group-hover:shadow-[0_0_18px_rgba(255,69,0,0.18)]"
      >
        {number}
      </div>
      <div style={{ color: 'var(--accent)', opacity: 0.8, display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
        {icon}
      </div>
      <h3 className="font-rajdhani font-bold text-xl mb-2" style={{ color: 'var(--text-primary)', letterSpacing: '0.03em' }}>{title}</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.7 }}>{desc}</p>
    </div>
  );
}

// ─── Top Player Row ──────────────────────────────────────────
function TopPlayerRow({ player, rank, wins }: { player: User; rank: number; wins: number }) {
  const rankColor = rank === 1 ? 'var(--gold)' : rank === 2 ? 'var(--silver)' : rank === 3 ? 'var(--bronze)' : 'var(--text-muted)';
  return (
    <div
      className="flex items-center gap-4 p-4 rounded-xl transition-all group cursor-default"
      style={{
        background: 'var(--card-gradient)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${rankColor}`,
      }}
    >
      <span className="font-orbitron font-bold text-lg w-7 text-center flex-shrink-0" style={{ color: rankColor }}>{rank}</span>
      <div
        className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0"
        style={{ border: `2px solid ${rankColor}`, boxShadow: `0 0 8px ${rankColor}55` }}
      >
        <Image src={getAvatarUrl(player.avatar_url, player.username)} alt={player.username} width={36} height={36} className="object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-rajdhani font-bold truncate" style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{player.username}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--accent)' }}>{player.ingame_name}</div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="font-orbitron font-bold text-sm" style={{ color: 'var(--accent)' }}>{wins}</div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>WINS</div>
      </div>
      {player.country && <span className="text-lg flex-shrink-0">{getCountryFlag(player.country)}</span>}
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────
function EmptyState({ icon, title, desc, cta, ctaHref }: {
  icon: React.ReactNode; title: string; desc: string; cta?: string; ctaHref?: string;
}) {
  return (
    <div className="text-center py-14">
      <div className="flex justify-center mb-5" style={{ opacity: 0.2, animation: 'breathe 4s ease-in-out infinite' }}>{icon}</div>
      <h3 className="font-rajdhani font-bold text-xl mb-2" style={{ color: 'var(--text-secondary)' }}>{title}</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{desc}</p>
      {cta && ctaHref && (
        <Link href={ctaHref} className="btn-accent mt-5 inline-flex">{cta}</Link>
      )}
    </div>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────────
function HeroOpsRow({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="signal-row">
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl"
          style={{
            background: 'rgba(255,69,0,0.08)',
            border: '1px solid rgba(255,69,0,0.14)',
            color: 'var(--accent)',
          }}
        >
          {icon}
        </div>
        <div>
          <p className="font-space-grotesk text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {label}
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {detail}
          </p>
        </div>
      </div>
      <div className="font-orbitron text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
        {value}
      </div>
    </div>
  );
}

function HeroMiniPanel({
  label,
  value,
  detail,
  progress,
}: {
  label: string;
  value: string;
  detail: string;
  progress?: string;
}) {
  return (
    <div className="slant-panel p-5">
      <div className="relative z-10">
        <p className="signal-kicker">{label}</p>
        <div className="mt-3 font-orbitron text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {value}
        </div>
        <p className="mt-2 text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
          {detail}
        </p>
        {progress ? (
          <div
            className="mt-4 rounded-full p-1"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="signal-bar" style={{ width: progress }} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [topPlayers,  setTopPlayers]  = useState<Array<User & { wins: number }>>([]);
  const [stats,       setStats]       = useState({ players: 0, tournaments: 0, clans: 0, countries: 0 });
  const [loading,     setLoading]     = useState(true);
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: tourData } = await supabase
        .from('tournaments')
        .select('*, creator:users!creator_id(username, avatar_url)')
        .in('status', ['open', 'live'])
        .order('is_featured', { ascending: false })
        .order('created_at',  { ascending: false })
        .limit(6);

      const [{ count: playerCount }, { count: tournamentCount }, { count: clanCount }] = await Promise.all([
        supabase.from('users').select('*',       { count: 'exact', head: true }),
        supabase.from('tournaments').select('*', { count: 'exact', head: true }),
        supabase.from('clans').select('*',       { count: 'exact', head: true }),
      ]);

      if (tourData) setTournaments(tourData as Tournament[]);
      setStats({ players: playerCount ?? 0, tournaments: tournamentCount ?? 0, clans: clanCount ?? 0, countries: 0 });
      setLoading(false);
    })();
  }, []);

  return (
    <div style={{ background: 'var(--bg-primary)' }}>

      {/* ════════════════════════════════════════
          HERO
          ════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ minHeight: 'calc(100vh - 4rem)' }}>
        <TacticalBackdrop variant="hero" />
        <div className="noise-overlay" />
        <div className="hero-scanline" />

        <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1.06fr)_minmax(320px,440px)] lg:px-8 lg:py-20 xl:gap-16">
          <div className="flex flex-col justify-center">
            <ScrollReveal delay={80} direction="up" distance={16}>
              <div className="section-label mb-6">
                <Zap size={11} /> Tournament ops, not template fluff
              </div>
            </ScrollReveal>

            <ScrollReveal delay={180} direction="up" distance={24}>
              <h1
                className="font-rajdhani font-bold"
                style={{
                  fontSize: 'clamp(3.8rem, 10vw, 7.6rem)',
                  lineHeight: 0.9,
                  letterSpacing: '-0.045em',
                }}
              >
                Build your CODM circuit
                <br />
                <span className="hero-title-glow">like an ops room.</span>
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={280} direction="up" distance={18}>
              <p
                className="mt-6 max-w-2xl font-space-grotesk"
                style={{
                  fontSize: 'clamp(1rem, 2vw, 1.18rem)',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.85,
                }}
              >
                Brackets, team finding, proof-first results, and player reputation in one sharper platform for Call of Duty: Mobile.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={360} direction="up" distance={14}>
              <div className="mt-8 flex flex-wrap gap-3">
                <span className="signal-chip signal-chip-live">Live brackets</span>
                <span className="signal-chip">Verified players</span>
                <span className="signal-chip">Team finder built in</span>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={440} direction="up" distance={14}>
              <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row">
                <Link href="/tournaments/create" className="btn-accent" style={{ padding: '0.8rem 2rem', fontSize: '1rem' }}>
                  <Trophy size={17} /> Create Tournament
                </Link>
                <Link href="/register" className="btn-ghost" style={{ padding: '0.8rem 2rem', fontSize: '1rem' }}>
                  Join Free <ArrowRight size={15} />
                </Link>
              </div>
            </ScrollReveal>
          </div>

          <div className="relative flex items-center justify-end">
            <div className="w-full max-w-[28rem]">
              <ScrollReveal delay={260} direction="left" distance={18}>
                <div className="slant-panel p-6 sm:p-7">
                  <div className="relative z-10">
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div>
                        <p className="signal-kicker">Ops room</p>
                        <h2 className="mt-2 font-rajdhani text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                          Match flow at a glance
                        </h2>
                      </div>
                      <span className="signal-chip signal-chip-live">Season 6</span>
                    </div>

                    <HeroOpsRow
                      icon={<Trophy size={16} />}
                      label="Open brackets"
                      value="18"
                      detail="Featured cups, scrims, and ranked community events."
                    />
                    <HeroOpsRow
                      icon={<Target size={16} />}
                      label="Peak queue window"
                      value="9PM"
                      detail="Prime time for finding opponents and locking in squads."
                    />
                    <HeroOpsRow
                      icon={<ShieldCheck size={16} />}
                      label="Result proof rate"
                      value="96%"
                      detail="Screenshots and match evidence stay front and center."
                    />
                  </div>
                </div>
              </ScrollReveal>

              <div className="signal-micro-grid mt-4">
                <ScrollReveal delay={340} direction="up" distance={14}>
                  <HeroMiniPanel
                    label="Clan stack"
                    value="247"
                    detail="Active squads ready for brackets, tryouts, and late-night runs."
                  />
                </ScrollReveal>

                <ScrollReveal delay={420} direction="up" distance={14}>
                  <div className="sm:translate-y-8">
                    <HeroMiniPanel
                      label="Readiness"
                      value="86%"
                      detail="Players with completed profiles, tags, and queue details."
                      progress="86%"
                    />
                  </div>
                </ScrollReveal>
              </div>

              <ScrollReveal delay={500} direction="up" distance={14}>
                <div className="slant-panel mt-4 p-5">
                  <div className="relative z-10 flex items-center justify-between gap-4">
                    <div>
                      <p className="signal-kicker">Live modes</p>
                      <p className="mt-2 font-space-grotesk text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
                        MP cups, BR lobbies, clan wars, and private scrim rooms under one roof.
                      </p>
                    </div>
                    <div className="flex items-center gap-2" style={{ color: 'var(--accent)' }}>
                      <Activity size={18} />
                      <Swords size={18} />
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>

        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          style={{ color: 'var(--text-faint)', animation: 'float 2.5s ease-in-out infinite' }}
        >
          <span style={{ fontSize: '0.62rem', letterSpacing: '0.18em', fontFamily: 'Inter' }}>SCROLL</span>
          <ChevronDown size={18} />
        </div>
      </section>

      {/* ════════════════════════════════════════
          STATS BAR
          ════════════════════════════════════════ */}
      <section style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4">
          <ScrollReveal delay={0}>  <CounterCard label="Players"     target={stats.players}     icon={<Users  size={17} />} /></ScrollReveal>
          <ScrollReveal delay={80}> <CounterCard label="Tournaments" target={stats.tournaments} icon={<Trophy size={17} />} /></ScrollReveal>
          <ScrollReveal delay={160}><CounterCard label="Clans"       target={stats.clans}       icon={<Shield size={17} />} /></ScrollReveal>
          <ScrollReveal delay={240}><CounterCard label="Countries"   target={24} suffix="+"     icon={<Globe  size={17} />} /></ScrollReveal>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FEATURED TOURNAMENTS
          ════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <ScrollReveal>
          <div className="flex items-center justify-between mb-10">
            <h2 className="section-heading">Active Tournaments</h2>
            <Link href="/tournaments" className="btn-ghost" style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}>
              View All <ArrowRight size={13} />
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
              <ScrollReveal key={t.id} delay={i * 70}>
                <TournamentCard tournament={t} />
              </ScrollReveal>
            ))}
          </div>
        )}
      </section>

      {/* ════════════════════════════════════════
          HOW IT WORKS
          ════════════════════════════════════════ */}
      <section style={{ background: 'var(--bg-secondary)', padding: '5rem 1rem', position: 'relative', overflow: 'hidden' }}>
        {/* subtle bg blob */}
        <div className="absolute pointer-events-none" style={{
          top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '60vw', height: '60vw', maxWidth: 700, maxHeight: 700,
          background: 'radial-gradient(circle, rgba(255,69,0,0.03) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />

        <div className="max-w-6xl mx-auto relative z-10">
          <ScrollReveal>
            <div className="text-center mb-14">
              <h2 className="section-heading">How It Works</h2>
              <p className="mt-4" style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                Get into the action in three steps
              </p>
            </div>
          </ScrollReveal>

          {/* Timeline grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            <ScrollReveal delay={0}>
              <HowItWorksCard
                number="01"
                icon={<Gamepad2 size={28} />}
                title="Create Your Profile"
                desc="Sign up with your CODM in-game name & UID. Your identity is verified through your actual credentials."
              />
            </ScrollReveal>

            {/* Connector — desktop only */}
            <div className="hidden md:flex items-center justify-center" style={{ marginTop: '-2rem', opacity: 0.4 }}>
              <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, rgba(255,69,0,0.6), rgba(255,69,0,0.1))' }} />
              <Swords size={16} style={{ color: 'var(--accent)', flexShrink: 0, margin: '0 8px' }} />
              <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, rgba(255,69,0,0.1), rgba(255,69,0,0.6))' }} />
            </div>

            <ScrollReveal delay={120}>
              <HowItWorksCard
                number="02"
                icon={<Trophy size={28} />}
                title="Join or Host a Tournament"
                desc="Register for open tournaments or create your own for any mode — MP or Battle Royale."
              />
            </ScrollReveal>

            <div className="hidden md:flex items-center justify-center" style={{ marginTop: '-2rem', opacity: 0.4 }}>
              <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, rgba(255,69,0,0.6), rgba(255,69,0,0.1))' }} />
              <Swords size={16} style={{ color: 'var(--accent)', flexShrink: 0, margin: '0 8px' }} />
              <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, rgba(255,69,0,0.1), rgba(255,69,0,0.6))' }} />
            </div>

            <ScrollReveal delay={240}>
              <HowItWorksCard
                number="03"
                icon={<Crown size={28} />}
                title="Compete & Get Recognized"
                desc="Climb leaderboards, earn badges, build your reputation, and find your crew."
              />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          TOP PLAYERS
          ════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <ScrollReveal>
          <div className="flex items-center justify-between mb-10">
            <h2 className="section-heading">Top Fraggers</h2>
            <Link href="/leaderboards" className="btn-ghost" style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}>
              Full Leaderboard <ArrowRight size={13} />
            </Link>
          </div>
        </ScrollReveal>

        <div className="max-w-xl">
          {topPlayers.length === 0 ? (
            <ScrollReveal>
              <EmptyState
                icon={<Star size={48} />}
                title="Leaderboard Empty"
                desc="Complete tournaments to appear on the leaderboard."
              />
            </ScrollReveal>
          ) : (
            <div className="space-y-2.5">
              {topPlayers.slice(0, 5).map((player, i) => (
                <ScrollReveal key={player.id} delay={i * 70}>
                  <TopPlayerRow player={player} rank={i + 1} wins={player.wins} />
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════
          CTA
          ════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{
          background: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border)',
          padding: 'clamp(4rem,8vw,7rem) 1rem',
        }}
      >
        {/* Layered background blobs */}
        <div className="absolute pointer-events-none" style={{
          top: '-15%', left: '-5%',
          width: '50vw', height: '50vw',
          background: 'radial-gradient(circle, rgba(255,69,0,0.055) 0%, transparent 65%)',
          borderRadius: '50%',
        }} />
        <div className="absolute pointer-events-none" style={{
          bottom: '-15%', right: '-5%',
          width: '40vw', height: '40vw',
          background: 'radial-gradient(circle, rgba(255,107,0,0.04) 0%, transparent 65%)',
          borderRadius: '50%',
        }} />

        {/* Diagonal accent line */}
        <div className="absolute pointer-events-none" style={{
          top: 0, left: 0, right: 0, height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,69,0,0.4) 40%, rgba(255,107,0,0.3) 60%, transparent 100%)',
        }} />

        <ScrollReveal>
          <div className="relative z-10 max-w-2xl mx-auto text-center px-4">
            <div className="section-label mb-6" style={{ margin: '0 auto 1.5rem', display: 'inline-flex' }}>
              <Shield size={11} /> Free to Play
            </div>
            <h2
              className="font-rajdhani font-bold mb-5"
              style={{ fontSize: 'clamp(2.2rem, 6vw, 3.8rem)', letterSpacing: '0.04em', lineHeight: 1.05 }}
            >
              READY TO PROVE<br />YOURSELF?
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', fontSize: '1rem', lineHeight: 1.75, maxWidth: '38ch', margin: '0 auto 2.5rem' }}>
              Join hundreds of CODM players competing for glory. 100% free. No pay-to-win. Just skill.
            </p>
            <Link href="/register" className="btn-accent" style={{ padding: '0.95rem 2.8rem', fontSize: '1.05rem' }}>
              <Zap size={17} /> Create Free Account
            </Link>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
