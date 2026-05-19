'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import Image from 'next/image';
import Link from 'next/link';
import { getAvatarUrl, getRankColor, getRankRingClass, getCountryFlag } from '@/lib/utils';
import ScrollReveal from '@/components/ScrollReveal';
import { Search, Filter, MessageSquare, PlusCircle, Gamepad2, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { ROLES, RANKS } from '@/types';

export default function FindTeammatesPage() {
  const supabase = createClient();
  const { profile } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [filterMode, setFilterMode] = useState('all');
  const [filterRank, setFilterRank] = useState('all');
  const [filterRole, setFilterRole] = useState('all');

  // Form
  const [form, setForm] = useState({ content: '', game_mode: 'mp', req_rank: 'Any', req_role: 'Any' });

  const fetchPosts = async () => {
    setLoading(true);
    let query = supabase
      .from('lfg_posts')
      .select('*, author:users(id, username, avatar_url, rank, reputation_score, country)')
      .order('created_at', { ascending: false });

    if (filterMode !== 'all') query = query.eq('game_mode', filterMode);
    if (filterRank !== 'all') query = query.eq('req_rank', filterRank);
    if (filterRole !== 'all') query = query.eq('req_role', filterRole);

    const { data } = await query;
    if (data) setPosts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [filterMode, filterRank, filterRole]);

  const handleSubmit = async () => {
    if (!profile) return toast.error('Must be logged in');
    if (!form.content.trim()) return toast.error('Content required');
    
    setSubmitting(true);
    const { error } = await supabase.from('lfg_posts').insert({
      author_id: profile.id,
      content: form.content,
      game_mode: form.game_mode,
      req_rank: form.req_rank,
      req_role: form.req_role,
      status: 'active'
    });

    setSubmitting(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Post created');
      setShowModal(false);
      setForm({ content: '', game_mode: 'mp', req_rank: 'Any', req_role: 'Any' });
      fetchPosts();
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* ─── HEADER ─── */}
      <div className="relative overflow-hidden py-16 text-center border-b border-border"
        style={{ background: 'linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)' }}>
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <Users size={400} />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <ScrollReveal delay={100}>
            <h1 className="font-rajdhani font-bold text-5xl md:text-6xl mb-4 hero-title-glow">
              LFG / TEAMMATES
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <p className="text-secondary text-lg mb-8 max-w-2xl mx-auto">Find players for your tournament squad or ranked grind.</p>
          </ScrollReveal>
          <ScrollReveal delay={300}>
            <button onClick={() => profile ? setShowModal(true) : toast.error('Please log in first')} className="btn-accent px-8 py-3 text-lg">
              <PlusCircle size={20} /> Create LFG Post
            </button>
          </ScrollReveal>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
        
        {/* ─── FILTERS ─── */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="premium-glass p-5 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-rajdhani font-bold text-lg text-primary uppercase tracking-widest">Filters</h3>
              <Filter size={18} className="text-accent" />
            </div>

            <div className="space-y-4">
              <div>
                <label className="frag-input-label">Mode</label>
                <select className="frag-input" value={filterMode} onChange={e => setFilterMode(e.target.value)}>
                  <option value="all">All Modes</option>
                  <option value="mp">Multiplayer</option>
                  <option value="br">Battle Royale</option>
                </select>
              </div>
              <div>
                <label className="frag-input-label">Required Rank</label>
                <select className="frag-input" value={filterRank} onChange={e => setFilterRank(e.target.value)}>
                  <option value="all">Any Rank</option>
                  {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="frag-input-label">Required Role</label>
                <select className="frag-input" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                  <option value="all">Any Role</option>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          </div>
        </aside>

        {/* ─── FEED ─── */}
        <main className="flex-1">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '160px', borderRadius: '16px' }} />)}
            </div>
          ) : posts.length === 0 ? (
            <div className="frag-card-static p-12 text-center text-muted">
              <Users size={48} className="mx-auto mb-4 empty-state-icon" />
              <h3 className="text-xl font-bold text-primary mb-2">No LFG Posts</h3>
              <p>Be the first to create a post looking for teammates.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post, i) => (
                <ScrollReveal key={post.id} delay={i * 60}>
                  <div className={`frag-card p-5 transition-colors ${
                      post.game_mode === 'mp' ? 'lfg-card-mp' : 'lfg-card-br'
                    }`}>
                  <div className="flex items-start gap-4">
                    <Link href={`/players/${post.author.username}`} className="flex-shrink-0">
                      <Image src={getAvatarUrl(post.author.avatar_url, post.author.username)} alt="" width={48} height={48} 
                        className={`rounded-full border-2 ${getRankRingClass(post.author.rank)}`} />
                    </Link>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <Link href={`/players/${post.author.username}`} className="font-rajdhani font-bold text-lg text-primary hover:text-accent truncate">
                          {post.author.username}
                        </Link>
                        <span className="text-xs text-muted whitespace-nowrap">{formatDistanceToNow(new Date(post.created_at))} ago</span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
                        {post.author.country && <span>{getCountryFlag(post.author.country)}</span>}
                        <span className="badge badge-format" style={{ color: getRankColor(post.author.rank) }}>{post.author.rank || 'Unranked'}</span>
                        <span className="text-muted">•</span>
                        <span className="text-secondary font-medium">LFG FOR:</span>
                        <span className={`badge ${post.game_mode === 'mp' ? 'badge-mp' : 'badge-br'} px-1.5 py-0.5`}>{post.game_mode.toUpperCase()}</span>
                      </div>

                      <p className="text-secondary text-sm leading-relaxed mb-4">{post.content}</p>

                      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-border">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                          <span className="font-bold">Requirements:</span>
                          <span className="px-2 py-1 rounded bg-secondary border border-border">Rank: {post.req_rank}</span>
                          <span className="px-2 py-1 rounded bg-secondary border border-border">Role: {post.req_role}</span>
                        </div>
                        
                        {profile?.id !== post.author_id && (
                          <button className="btn-secondary py-1.5 px-3 text-xs">
                            <MessageSquare size={12} /> Message
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="glass-modal w-full max-w-lg p-6 animate-scale-in relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-muted hover:text-primary"><Users size={20} /></button>
            <h2 className="font-rajdhani font-bold text-2xl text-primary mb-6">Create LFG Post</h2>
            
            <div className="space-y-4">
              <div>
                <label className="frag-input-label">I'm looking to play...</label>
                <div className="flex gap-2 mt-1">
                  <button onClick={() => setForm(p => ({ ...p, game_mode: 'mp' }))} className={`flex-1 p-3 rounded-lg border-2 font-bold ${form.game_mode === 'mp' ? 'border-accent text-accent bg-accent/10' : 'border-border text-muted bg-secondary'}`}>MP</button>
                  <button onClick={() => setForm(p => ({ ...p, game_mode: 'br' }))} className={`flex-1 p-3 rounded-lg border-2 font-bold ${form.game_mode === 'br' ? 'border-accent text-accent bg-accent/10' : 'border-border text-muted bg-secondary'}`}>BR</button>
                </div>
              </div>

              <div>
                <label className="frag-input-label">Message</label>
                <textarea className="frag-input resize-none h-24" placeholder="e.g. Looking for an objective player for the upcoming $500 tournament..." 
                  value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="frag-input-label">Required Rank</label>
                  <select className="frag-input" value={form.req_rank} onChange={e => setForm(p => ({ ...p, req_rank: e.target.value }))}>
                    <option value="Any">Any</option>
                    {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="frag-input-label">Required Role</label>
                  <select className="frag-input" value={form.req_role} onChange={e => setForm(p => ({ ...p, req_role: e.target.value }))}>
                    <option value="Any">Any</option>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border mt-6">
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button onClick={handleSubmit} disabled={submitting} className="btn-accent flex-1 justify-center">{submitting ? 'Posting...' : 'Post'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
