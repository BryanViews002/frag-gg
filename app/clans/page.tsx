'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Clan } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Shield, Users, Target, ArrowRight } from 'lucide-react';

export default function ClansPage() {
  const supabase = createClient();
  const [clans, setClans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchClans = async () => {
      setLoading(true);
      let query = supabase
        .from('clans')
        .select('*, member_count:clan_members(count), leader:users!leader_id(username)')
        .order('created_at', { ascending: false });

      if (search) query = query.ilike('name', `%${search}%`);

      const { data } = await query;
      if (data) setClans(data);
      setLoading(false);
    };

    const timer = setTimeout(fetchClans, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* ─── HEADER ─── */}
      <div className="relative overflow-hidden py-16 text-center border-b border-border"
        style={{ background: 'linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)' }}>
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <Shield size={400} />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <h1 className="font-rajdhani font-bold text-5xl md:text-6xl mb-4" style={{ textShadow: '0 0 40px rgba(255,69,0,0.4)' }}>
            CLANS
          </h1>
          <p className="text-secondary text-lg mb-8 max-w-2xl mx-auto">Join forces. Build a legacy. Dominate the leaderboards.</p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto">
            <div className="relative w-full">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input type="text" className="frag-input pl-10 bg-bg-primary" placeholder="Search clans by name or tag..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Link href="/clans/create" className="btn-accent whitespace-nowrap">
              <Shield size={16} /> Create Clan
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton" style={{ height: '200px', borderRadius: '16px' }} />)}
          </div>
        ) : clans.length === 0 ? (
          <div className="p-12 text-center text-muted border border-dashed border-border rounded-2xl">
            <Shield size={48} className="mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-bold text-primary mb-2">No Clans Found</h3>
            <p>Try a different search or start your own clan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clans.map(clan => (
              <Link key={clan.id} href={`/clans/${clan.id}`} className="block h-full">
                <div className="frag-card h-full p-6 flex flex-col group hover:border-accent">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-xl bg-secondary border border-border flex items-center justify-center flex-shrink-0 overflow-hidden group-hover:border-accent transition-colors">
                      {clan.logo_url ? <Image src={clan.logo_url} alt={clan.name} width={64} height={64} className="object-cover" /> : <Shield size={32} className="text-muted" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-rajdhani font-bold text-xl text-primary truncate group-hover:text-accent transition-colors">
                        {clan.name}
                      </h3>
                      <div className="text-accent text-sm font-bold tracking-wider">[{clan.tag}]</div>
                    </div>
                  </div>
                  
                  <p className="text-secondary text-sm mb-6 flex-1 line-clamp-2">
                    {clan.description || 'No description provided.'}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-muted text-sm">
                        <Users size={14} />
                        <span>{clan.member_count?.[0]?.count || 1} Mbrs</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted text-sm">
                        <Target size={14} />
                        <span>Leader: {clan.leader?.username}</span>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-muted group-hover:text-accent transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
