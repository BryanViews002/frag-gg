'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Tournament } from '@/types';
import TournamentCard from '@/components/tournament/TournamentCard';
import ScrollReveal from '@/components/ScrollReveal';
import { Search, X, Trophy, Ghost, Layers, Zap, Globe, SlidersHorizontal } from 'lucide-react';
import { REGIONS } from '@/types';

// ── Chip toggle button ───────────────────────────────────
function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="font-rajdhani font-semibold transition-all"
      style={{
        padding: '0.3rem 0.85rem',
        borderRadius: 20,
        fontSize: '0.8rem',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        border: active ? '1px solid rgba(255,69,0,0.4)' : '1px solid var(--border)',
        background: active ? 'rgba(255,69,0,0.12)' : 'rgba(255,255,255,0.03)',
        color: active ? 'var(--accent)' : 'var(--text-muted)',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

export default function TournamentsPage() {
  const supabase = createClient();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [search, setSearch] = useState('');
  const [mode,   setMode]   = useState('all');
  const [status, setStatus] = useState('all');
  const [region, setRegion] = useState('all');

  const hasActiveFilter = search || mode !== 'all' || status !== 'all' || region !== 'all';
  const clearAll = () => { setSearch(''); setMode('all'); setStatus('all'); setRegion('all'); };

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(async () => {
      let q = supabase
        .from('tournaments')
        .select('*, creator:users!creator_id(username, avatar_url)')
        .order('is_featured', { ascending: false })
        .order('created_at',  { ascending: false });

      if (mode   !== 'all') q = q.eq('mode',   mode);
      if (status !== 'all') q = q.eq('status', status);
      if (region !== 'all') q = q.eq('region', region);
      if (search)           q = q.ilike('name', `%${search}%`);

      const { data } = await q;
      if (data) setTournaments(data as Tournament[]);
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [search, mode, status, region]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>

      {/* ─── Page Header ─── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
          borderBottom: '1px solid var(--border)',
          padding: 'clamp(3rem,7vw,5.5rem) 1rem 3rem',
        }}
      >
        {/* background image tint */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1920&q=20')",
            opacity: 0.06,
            mixBlendMode: 'screen',
          }}
        />
        {/* diagonal accent */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{
          height: 2,
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,69,0,0.45) 40%, rgba(255,107,0,0.3) 60%, transparent 100%)',
        }} />

        <div className="relative z-10 max-w-7xl mx-auto">
          <ScrollReveal delay={80}>
            <div className="section-label mb-5">
              <Trophy size={11} /> All Events
            </div>
            <h1
              className="font-rajdhani font-bold hero-title-glow"
              style={{ fontSize: 'clamp(3rem, 8vw, 5.5rem)', letterSpacing: '-0.02em', lineHeight: 0.95, marginBottom: '1rem' }}
            >
              TOURNAMENTS
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={160}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '44ch', lineHeight: 1.7, marginBottom: '2rem' }}>
              Find and register for upcoming MP and Battle Royale events. Glory awaits.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={240}>
            <Link href="/tournaments/create" className="btn-accent">
              <Trophy size={17} /> Create Tournament
            </Link>
          </ScrollReveal>
        </div>
      </div>

      {/* ─── Filters + Grid ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Quick-filter bar */}
        <div
          className="frag-card-static p-4 mb-8 flex flex-wrap items-center gap-3"
          style={{ borderRadius: 14 }}
        >
          {/* Search */}
          <div className="relative flex-1" style={{ minWidth: '180px', maxWidth: '280px' }}>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="frag-input pl-9"
              placeholder="Search tournaments..."
              style={{ height: 38, fontSize: '0.88rem' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 28, background: 'var(--border)', flexShrink: 0 }} />

          {/* Mode chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Chip label="All Modes"   active={mode === 'all'} onClick={() => setMode('all')} />
            <Chip label="MP"          active={mode === 'mp'}  onClick={() => setMode('mp')} />
            <Chip label="Battle Royale" active={mode === 'br'} onClick={() => setMode('br')} />
          </div>

          <div style={{ width: 1, height: 28, background: 'var(--border)', flexShrink: 0 }} className="hidden sm:block" />

          {/* Status chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Chip label="All"      active={status === 'all'}       onClick={() => setStatus('all')} />
            <Chip label="Open"     active={status === 'open'}      onClick={() => setStatus('open')} />
            <Chip label="Live"     active={status === 'live'}      onClick={() => setStatus('live')} />
            <Chip label="Upcoming" active={status === 'upcoming'}  onClick={() => setStatus('upcoming')} />
          </div>

          {/* Region dropdown */}
          <select
            className="frag-input"
            value={region}
            onChange={e => setRegion(e.target.value)}
            style={{ height: 38, fontSize: '0.83rem', minWidth: 140, maxWidth: 180 }}
          >
            <option value="all">All Regions</option>
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          {/* Clear */}
          {hasActiveFilter && (
            <button
              onClick={clearAll}
              className="btn-secondary flex items-center gap-1.5"
              style={{ height: 38, fontSize: '0.8rem', padding: '0 0.9rem', flexShrink: 0 }}
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>

        {/* Result count */}
        {!loading && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
            {tournaments.length} tournament{tournaments.length !== 1 ? 's' : ''} found
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton skeleton-stagger" style={{ height: '300px' }} />
            ))}
          </div>
        ) : tournaments.length === 0 ? (
          <ScrollReveal>
            <div
              className="text-center py-20 px-4 rounded-2xl"
              style={{ border: '1px dashed rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.015)' }}
            >
              <Ghost size={56} className="mx-auto mb-4" style={{ color: 'var(--accent)', opacity: 0.2, animation: 'breathe 4s ease-in-out infinite' }} />
              <h3 className="font-rajdhani font-bold text-2xl mb-2" style={{ color: 'var(--text-secondary)' }}>No Tournaments Found</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Try adjusting your filters or create the first one.</p>
              <button className="btn-secondary" onClick={clearAll}>Clear Filters</button>
            </div>
          </ScrollReveal>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {tournaments.map((t, i) => (
              <ScrollReveal key={t.id} delay={i * 50}>
                <TournamentCard tournament={t} />
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
