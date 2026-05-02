'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Tournament } from '@/types';
import TournamentCard from '@/components/tournament/TournamentCard';
import ScrollReveal from '@/components/ScrollReveal';
import { Search, Filter, Trophy, Ghost } from 'lucide-react';
import { REGIONS } from '@/types';

export default function TournamentsPage() {
  const supabase = createClient();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [region, setRegion] = useState<string>('all');

  useEffect(() => {
    const fetchTournaments = async () => {
      setLoading(true);
      let query = supabase
        .from('tournaments')
        .select('*, creator:users!creator_id(username, avatar_url)')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (mode !== 'all') query = query.eq('mode', mode);
      if (status !== 'all') query = query.eq('status', status);
      if (region !== 'all') query = query.eq('region', region);
      if (search) query = query.ilike('name', `%${search}%`);

      const { data } = await query;
      if (data) setTournaments(data as Tournament[]);
      setLoading(false);
    };

    const debounce = setTimeout(() => {
      fetchTournaments();
    }, 300);

    return () => clearTimeout(debounce);
  }, [search, mode, status, region]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* ─── HEADER ─── */}
      <div className="relative overflow-hidden py-16 text-center border-b border-border"
        style={{ background: 'linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)' }}>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1920&q=20')] bg-cover bg-center opacity-10 mix-blend-screen" />
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <ScrollReveal delay={100}>
            <h1 className="font-rajdhani font-bold text-5xl md:text-6xl mb-4 hero-title-glow">TOURNAMENTS</h1>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <p className="text-secondary text-lg mb-8 max-w-2xl mx-auto">Find and register for upcoming MP and Battle Royale events. Glory awaits.</p>
          </ScrollReveal>
          <ScrollReveal delay={300}>
            <Link href="/tournaments/create" className="btn-accent px-8 py-3 text-lg">
              <Trophy size={20} /> Create Tournament
            </Link>
          </ScrollReveal>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8 items-start">
        {/* ─── FILTERS ─── */}
        <aside className={`w-full md:w-64 flex-shrink-0 space-y-6 ${showFilters ? 'block' : 'hidden md:block'}`}>
          <div className="frag-card p-5 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-rajdhani font-bold text-lg text-primary uppercase tracking-widest">Filters</h3>
              <Filter size={18} className="text-accent" />
            </div>

            <div className="space-y-5">
              <div>
                <label className="frag-input-label">Search</label>
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input type="text" className="frag-input pl-9" placeholder="Tournament name..."
                    value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="frag-input-label">Mode</label>
                <select className="frag-input" value={mode} onChange={e => setMode(e.target.value)}>
                  <option value="all">All Modes</option>
                  <option value="mp">Multiplayer (MP)</option>
                  <option value="br">Battle Royale (BR)</option>
                </select>
              </div>

              <div>
                <label className="frag-input-label">Status</label>
                <select className="frag-input" value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="all">All Statuses</option>
                  <option value="open">Registration Open</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="live">Live Now</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="frag-input-label">Region</label>
                <select className="frag-input" value={region} onChange={e => setRegion(e.target.value)}>
                  <option value="all">Global / All Regions</option>
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <button className="btn-secondary w-full justify-center" onClick={() => { setSearch(''); setMode('all'); setStatus('all'); setRegion('all'); }}>
                Reset Filters
              </button>
            </div>
          </div>
        </aside>

        {/* ─── MAIN GRID ─── */}
        <main className="flex-1 w-full">
          {/* Mobile filter toggle */}
          <button className="md:hidden w-full btn-secondary mb-6 justify-center" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={16} /> {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <div key={i} className="skeleton skeleton-stagger" style={{ height: '300px' }} />)}
            </div>
          ) : tournaments.length === 0 ? (
            <ScrollReveal>
              <div className="text-center py-20 px-4 rounded-2xl border border-dashed border-border">
                <Ghost size={64} className="mx-auto mb-4 empty-state-icon text-accent" />
                <h3 className="font-rajdhani font-bold text-2xl text-secondary mb-2">No Tournaments Found</h3>
                <p className="text-muted mb-6">Try adjusting your filters or be the first to create one.</p>
                <button className="btn-secondary" onClick={() => { setSearch(''); setMode('all'); setStatus('all'); setRegion('all'); }}>Clear Filters</button>
              </div>
            </ScrollReveal>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {tournaments.map((t, i) => (
                <ScrollReveal key={t.id} delay={i * 60}>
                  <TournamentCard tournament={t} />
                </ScrollReveal>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
