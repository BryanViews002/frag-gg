'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import Image from 'next/image';
import { getAvatarUrl, formatRelative, getReputationColor, getReputationLabel } from '@/lib/utils';
import {
  Shield, Users, Trophy, AlertTriangle, CheckCircle, XCircle,
  Megaphone, Ban, BarChart3, Flag, RefreshCw, Search
} from 'lucide-react';
import toast from 'react-hot-toast';

const TABS = ['Overview', 'Users', 'Tournaments', 'Disputes', 'Announcements'];

function StatCard({ label, value, icon, accent = false }: { label: string; value: number; icon: React.ReactNode; accent?: boolean }) {
  return (
    <div className="frag-card p-5 flex items-center gap-4">
      <div className="p-3 rounded-xl flex-shrink-0" style={{ background: accent ? 'var(--accent-dim)' : 'rgba(255,255,255,0.05)', color: accent ? 'var(--accent)' : 'var(--text-muted)' }}>
        {icon}
      </div>
      <div>
        <div className="font-orbitron font-bold text-3xl" style={{ color: accent ? 'var(--accent)' : 'var(--text-primary)' }}>{value.toLocaleString()}</div>
        <div className="text-xs uppercase tracking-widest font-bold mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();
  const { profile, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState('Overview');
  const [stats, setStats] = useState({ users: 0, tournaments: 0, disputes: 0, clans: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Announcement form
  const [announcement, setAnnouncement] = useState({ title: '', content: '' });
  const [posting, setPosting] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [tourneyStatusFilter, setTourneyStatusFilter] = useState('all');

  useEffect(() => {
    if (authLoading) return;
    if (!profile) { router.push('/login'); return; }
    if (!profile.is_admin) { router.push('/dashboard'); toast.error('Admin access required'); return; }
    fetchData();
  }, [profile, authLoading]);

  const fetchData = async () => {
    setLoading(true);
    const [
      { count: userCount },
      { count: tourneyCount },
      { count: disputeCount },
      { count: clanCount },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('tournaments').select('*', { count: 'exact', head: true }),
      supabase.from('tournaments').select('*', { count: 'exact', head: true }).eq('status', 'live'),
      supabase.from('clans').select('*', { count: 'exact', head: true }),
    ]);
    setStats({ users: userCount ?? 0, tournaments: tourneyCount ?? 0, disputes: disputeCount ?? 0, clans: clanCount ?? 0 });

    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (userData) setUsers(userData);

    const { data: tourneyData } = await supabase
      .from('tournaments')
      .select('*, creator:users!creator_id(username)')
      .order('created_at', { ascending: false })
      .limit(50);
    if (tourneyData) setTournaments(tourneyData);

    setLoading(false);
  };

  const toggleAdmin = async (userId: string, isAdmin: boolean) => {
    const { error } = await supabase.from('users').update({ is_admin: !isAdmin }).eq('id', userId);
    if (error) { toast.error(error.message); return; }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_admin: !isAdmin } : u));
    toast.success(`Admin ${!isAdmin ? 'granted' : 'revoked'}`);
  };

  const adjustReputation = async (userId: string, delta: number) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const newScore = Math.max(0, Math.min(200, user.reputation_score + delta));
    const { error } = await supabase.from('users').update({ reputation_score: newScore }).eq('id', userId);
    if (error) { toast.error(error.message); return; }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, reputation_score: newScore } : u));
    toast.success(`Reputation ${delta > 0 ? '+' : ''}${delta}`);
  };

  const setTournamentStatus = async (tourneyId: string, status: string) => {
    const { error } = await supabase.from('tournaments').update({ status }).eq('id', tourneyId);
    if (error) { toast.error(error.message); return; }
    setTournaments(prev => prev.map(t => t.id === tourneyId ? { ...t, status } : t));
    toast.success(`Tournament set to ${status}`);
  };

  const featureTournament = async (tourneyId: string, featured: boolean) => {
    await supabase.from('tournaments').update({ is_featured: !featured }).eq('id', tourneyId);
    setTournaments(prev => prev.map(t => t.id === tourneyId ? { ...t, is_featured: !featured } : t));
    toast.success(!featured ? 'Tournament featured' : 'Feature removed');
  };

  const postAnnouncement = async () => {
    if (!profile || !announcement.title || !announcement.content) return;
    setPosting(true);
    const { error } = await supabase.from('community_posts').insert({
      author_id: profile.id,
      content: announcement.content,
      category: 'Announcements',
      is_announcement: true,
      is_pinned: true,
    });
    if (error) { toast.error(error.message); setPosting(false); return; }
    toast.success('Announcement posted to Community!');
    setAnnouncement({ title: '', content: '' });
    setPosting(false);
  };

  const filteredUsers = users.filter(u =>
    !userSearch || u.username?.toLowerCase().includes(userSearch.toLowerCase()) || u.ingame_name?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredTourneys = tournaments.filter(t =>
    tourneyStatusFilter === 'all' || t.status === tourneyStatusFilter
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="py-8 px-4 border-b border-border" style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield size={32} style={{ color: 'var(--accent)' }} />
            <div>
              <h1 className="font-rajdhani font-bold text-3xl" style={{ color: 'var(--text-primary)' }}>Admin Panel</h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Logged in as {profile?.username}</p>
            </div>
          </div>
          <button onClick={fetchData} className="btn-secondary">
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Users" value={stats.users} icon={<Users size={24} />} accent />
          <StatCard label="Tournaments" value={stats.tournaments} icon={<Trophy size={24} />} />
          <StatCard label="Live Now" value={stats.disputes} icon={<BarChart3 size={24} />} />
          <StatCard label="Clans" value={stats.clans} icon={<Shield size={24} />} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-border mb-8 scrollbar-hide">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`tab-btn whitespace-nowrap ${activeTab === tab ? 'active' : ''}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* ─── OVERVIEW ─── */}
        {activeTab === 'Overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slide-up">
            <div className="frag-card-static p-6">
              <h3 className="font-rajdhani font-bold text-xl text-primary mb-4 border-b border-border pb-2">Recent Users</h3>
              <div className="space-y-3">
                {users.slice(0, 5).map(u => (
                  <div key={u.id} className="flex items-center gap-3">
                    <Image src={getAvatarUrl(u.avatar_url, u.username)} alt="" width={36} height={36} className="rounded-full" />
                    <div className="flex-1">
                      <div className="font-bold text-sm text-primary">{u.username}</div>
                      <div className="text-xs text-muted">{formatRelative(u.created_at)}</div>
                    </div>
                    {u.is_admin && <span className="badge" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>Admin</span>}
                  </div>
                ))}
              </div>
            </div>
            <div className="frag-card-static p-6">
              <h3 className="font-rajdhani font-bold text-xl text-primary mb-4 border-b border-border pb-2">Recent Tournaments</h3>
              <div className="space-y-3">
                {tournaments.slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-primary truncate max-w-[200px]">{t.name}</div>
                      <div className="text-xs text-muted">by {t.creator?.username} · {formatRelative(t.created_at)}</div>
                    </div>
                    <span className={`badge ${t.status === 'live' ? 'badge-live' : t.status === 'open' ? 'badge-open' : 'badge-ended'}`}>{t.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── USERS ─── */}
        {activeTab === 'Users' && (
          <div className="animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input type="text" className="frag-input pl-9" placeholder="Search users by name or IGN..."
                  value={userSearch} onChange={e => setUserSearch(e.target.value)} />
              </div>
            </div>

            <div className="frag-card overflow-hidden">
              <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-border bg-secondary text-xs font-bold text-muted uppercase tracking-widest">
                <div className="col-span-4">User</div>
                <div className="col-span-2">Rep Score</div>
                <div className="col-span-2">Rank</div>
                <div className="col-span-4">Actions</div>
              </div>
              <div className="divide-y divide-border">
                {filteredUsers.map(u => {
                  const repColor = getReputationColor(u.reputation_score);
                  return (
                    <div key={u.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors">
                      <div className="col-span-4 flex items-center gap-3">
                        <Image src={getAvatarUrl(u.avatar_url, u.username)} alt="" width={40} height={40} className="rounded-full flex-shrink-0" />
                        <div>
                          <div className="font-bold text-primary flex items-center gap-2">
                            {u.username}
                            {u.is_admin && <Shield size={12} style={{ color: 'var(--accent)' }} />}
                          </div>
                          <div className="text-xs text-muted">{u.ingame_name} · UID: {u.ingame_uid}</div>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <span className="font-orbitron font-bold" style={{ color: repColor }}>{u.reputation_score}</span>
                        <div className="text-xs" style={{ color: repColor }}>{getReputationLabel(u.reputation_score)}</div>
                      </div>
                      <div className="col-span-2">
                        <span className="text-sm text-secondary">{u.rank || '—'}</span>
                      </div>
                      <div className="col-span-4 flex flex-wrap items-center gap-2">
                        <button onClick={() => adjustReputation(u.id, +10)} className="px-2 py-1 rounded text-xs font-bold transition-colors"
                          style={{ background: 'rgba(0,255,135,0.1)', color: 'var(--neon-green)', border: '1px solid rgba(0,255,135,0.2)' }}>
                          +10 Rep
                        </button>
                        <button onClick={() => adjustReputation(u.id, -10)} className="px-2 py-1 rounded text-xs font-bold transition-colors"
                          style={{ background: 'rgba(255,69,0,0.1)', color: 'var(--accent)', border: '1px solid rgba(255,69,0,0.2)' }}>
                          -10 Rep
                        </button>
                        <button onClick={() => toggleAdmin(u.id, u.is_admin)} className="px-2 py-1 rounded text-xs font-bold transition-colors"
                          style={{ background: u.is_admin ? 'rgba(255,69,0,0.15)' : 'rgba(255,255,255,0.05)', color: u.is_admin ? 'var(--accent)' : 'var(--text-muted)', border: '1px solid var(--border)' }}>
                          {u.is_admin ? 'Revoke Admin' : 'Make Admin'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── TOURNAMENTS ─── */}
        {activeTab === 'Tournaments' && (
          <div className="animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <select className="frag-input" style={{ width: 'auto' }} value={tourneyStatusFilter} onChange={e => setTourneyStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="upcoming">Upcoming</option>
                <option value="open">Open</option>
                <option value="live">Live</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="frag-card overflow-hidden">
              <div className="divide-y divide-border">
                {filteredTourneys.map(t => (
                  <div key={t.id} className="p-4 flex flex-col md:flex-row md:items-center gap-4 hover:bg-white/5">
                    <div className="flex-1 min-w-0">
                      <div className="font-rajdhani font-bold text-lg text-primary truncate">{t.name}</div>
                      <div className="text-xs text-muted">by {t.creator?.username} · {t.mode?.toUpperCase()} · {t.current_entries}/{t.max_entries} entries</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`badge ${t.status === 'live' ? 'badge-live' : t.status === 'open' ? 'badge-open' : t.status === 'upcoming' ? 'badge-format' : 'badge-ended'}`}>{t.status}</span>
                      {t.is_featured && <span className="badge" style={{ background: 'rgba(255,215,0,0.1)', color: 'var(--gold)', border: '1px solid rgba(255,215,0,0.2)' }}>Featured</span>}
                      {['upcoming','open','live','completed'].filter(s => s !== t.status).map(s => (
                        <button key={s} onClick={() => setTournamentStatus(t.id, s)} className="px-2 py-1 rounded text-xs font-bold" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                          → {s}
                        </button>
                      ))}
                      <button onClick={() => featureTournament(t.id, t.is_featured)} className="px-2 py-1 rounded text-xs font-bold" style={{ background: t.is_featured ? 'rgba(255,215,0,0.1)' : 'var(--bg-secondary)', color: t.is_featured ? 'var(--gold)' : 'var(--text-muted)', border: '1px solid var(--border)' }}>
                        {t.is_featured ? '★ Unfeature' : '☆ Feature'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── DISPUTES ─── */}
        {activeTab === 'Disputes' && (
          <div className="frag-card-static p-8 text-center animate-slide-up">
            <Flag size={48} className="mx-auto mb-4 opacity-20" />
            <h3 className="font-rajdhani font-bold text-2xl text-primary mb-2">Dispute Resolution</h3>
            <p className="text-muted">No active disputes. Match disputes will appear here for admin review.</p>
          </div>
        )}

        {/* ─── ANNOUNCEMENTS ─── */}
        {activeTab === 'Announcements' && (
          <div className="max-w-2xl animate-slide-up">
            <div className="frag-card-static p-6">
              <h3 className="font-rajdhani font-bold text-xl text-primary mb-1 flex items-center gap-2">
                <Megaphone size={20} className="text-accent" /> Post Announcement
              </h3>
              <p className="text-sm text-muted mb-6">This will appear as a pinned post in the Community feed.</p>

              <div className="space-y-4">
                <div>
                  <label className="frag-input-label">Title (for reference only)</label>
                  <input type="text" className="frag-input" placeholder="e.g. Season 1 Launch!" value={announcement.title} onChange={e => setAnnouncement(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div>
                  <label className="frag-input-label">Content</label>
                  <textarea className="frag-input min-h-[150px]" placeholder="Write the announcement..." value={announcement.content} onChange={e => setAnnouncement(p => ({ ...p, content: e.target.value }))} />
                </div>
                <button onClick={postAnnouncement} disabled={posting || !announcement.content} className="btn-accent">
                  {posting ? 'Posting...' : <><Megaphone size={16} /> Post Announcement</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
