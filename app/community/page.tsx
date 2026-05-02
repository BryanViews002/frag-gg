'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import Image from 'next/image';
import { getAvatarUrl, formatRelative } from '@/lib/utils';
import ScrollReveal from '@/components/ScrollReveal';
import { Megaphone, MessageSquare, Flame, Skull, Eye, ImageIcon, Send, PlusCircle, X, Pin } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const CATEGORIES = ['All', 'General', 'Highlights', 'Announcements', 'Clips', 'Strategy'];

function ReactionBar({ post, userId }: { post: any; userId: string | null }) {
  const supabase = createClient();
  const [reactions, setReactions] = useState<{ fire: number; skull: number; eyes: number }>(
    post.reaction_counts ?? { fire: 0, skull: 0, eyes: 0 }
  );
  const [myReaction, setMyReaction] = useState<string | null>(null);

  const react = async (type: 'fire' | 'skull' | 'eyes') => {
    if (!userId) return toast.error('Log in to react');
    if (myReaction === type) {
      await supabase.from('post_reactions').delete().eq('post_id', post.id).eq('user_id', userId);
      setReactions(r => ({ ...r, [type]: Math.max(0, r[type] - 1) }));
      setMyReaction(null);
    } else {
      if (myReaction) {
        await supabase.from('post_reactions').delete().eq('post_id', post.id).eq('user_id', userId);
        setReactions(r => ({ ...r, [myReaction]: Math.max(0, (r as any)[myReaction] - 1) }));
      }
      await supabase.from('post_reactions').upsert({ post_id: post.id, user_id: userId, reaction_type: type });
      setReactions(r => ({ ...r, [type]: r[type] + 1 }));
      setMyReaction(type);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {([
        ['fire', <Flame size={14} />, reactions.fire],
        ['skull', <Skull size={14} />, reactions.skull],
        ['eyes', <Eye size={14} />, reactions.eyes],
      ] as const).map(([type, icon, count]) => (
        <button
          key={type}
          onClick={() => react(type as 'fire' | 'skull' | 'eyes')}
          className={`reaction-btn ${myReaction === type ? 'reacted' : ''}`}
        >
          <span className="flex items-center">{icon}</span>
          <span className="font-bold text-xs">{count as number}</span>
        </button>
      ))}
    </div>
  );
}

function PostCard({ post, userId, onDeleted }: { post: any; userId: string | null; onDeleted: (id: string) => void }) {
  const supabase = createClient();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [comment, setComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  const loadComments = async () => {
    if (comments.length > 0) { setShowComments(!showComments); return; }
    setLoadingComments(true);
    const { data } = await supabase
      .from('comments')
      .select('*, author:users(username, avatar_url)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });
    if (data) setComments(data);
    setLoadingComments(false);
    setShowComments(true);
  };

  const submitComment = async () => {
    if (!comment.trim() || !userId) return;
    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: post.id, author_id: userId, content: comment.trim() })
      .select('*, author:users(username, avatar_url)')
      .single();
    if (data) {
      setComments(prev => [...prev, data]);
      setComment('');
    }
  };

  const deletePost = async () => {
    if (!window.confirm('Delete this post?')) return;
    await supabase.from('community_posts').delete().eq('id', post.id);
    onDeleted(post.id);
    toast.success('Post deleted');
  };

  return (
    <div
      className={`frag-card-static animate-slide-up post-cat-${(post.category || 'general').toLowerCase()}`}
      style={{ border: post.is_pinned ? '1px solid rgba(255,215,0,0.3)' : undefined, background: post.is_announcement ? 'rgba(0,212,255,0.04)' : undefined }}
    >
      {/* Pinned / Announcement badge */}
      {(post.is_pinned || post.is_announcement) && (
        <div className="flex items-center gap-2 px-5 pt-4 pb-0">
          {post.is_pinned && <span className="badge" style={{ background: 'rgba(255,215,0,0.1)', color: 'var(--gold)', border: '1px solid rgba(255,215,0,0.2)' }}><Pin size={10} /> Pinned</span>}
          {post.is_announcement && <span className="badge" style={{ background: 'rgba(0,212,255,0.1)', color: 'var(--neon-blue)', border: '1px solid rgba(0,212,255,0.2)' }}><Megaphone size={10} /> Announcement</span>}
        </div>
      )}

      <div className="p-5">
        {/* Author Row */}
        <div className="flex items-start justify-between mb-4">
          <Link href={`/players/${post.author?.username}`} className="flex items-center gap-3 group">
            <Image
              src={getAvatarUrl(post.author?.avatar_url, post.author?.username || 'user')}
              alt=""
              width={40}
              height={40}
              className="rounded-full border border-border group-hover:border-accent transition-colors"
            />
            <div>
              <div className="font-rajdhani font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                {post.author?.username}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {formatRelative(post.created_at)}
              </div>
            </div>
          </Link>
          {userId === post.author_id && (
            <button onClick={deletePost} className="p-1.5 rounded hover:bg-white/5 transition-colors" style={{ color: 'var(--text-muted)' }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Content */}
        <p className="mb-4 leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          {post.content}
        </p>

        {/* Image */}
        {post.image_url && (
          <div className="relative rounded-xl overflow-hidden mb-4" style={{ height: 280, border: '1px solid var(--border)' }}>
            <Image src={post.image_url} alt="Post" fill className="object-cover" />
          </div>
        )}

        {/* Category Tag */}
        {post.category && post.category !== 'General' && (
          <span className="badge badge-format mb-3">{post.category}</span>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <ReactionBar post={post} userId={userId} />
          <button
            onClick={loadComments}
            className="flex items-center gap-1.5 text-sm transition-colors hover:text-primary"
            style={{ color: 'var(--text-muted)', fontFamily: 'Inter' }}
          >
            <MessageSquare size={15} />
            {post.comment_count > 0 ? `${post.comment_count} comments` : 'Comment'}
          </button>
        </div>

        {/* Comments */}
        {showComments && (
          <div className="mt-4 pt-4 space-y-3 animate-slide-up" style={{ borderTop: '1px solid var(--border)' }}>
            {loadingComments ? (
              <div className="text-center py-4 text-muted text-sm">Loading...</div>
            ) : (
              comments.map(c => (
                <div key={c.id} className="flex items-start gap-3">
                  <Image
                    src={getAvatarUrl(c.author?.avatar_url, c.author?.username || 'user')}
                    alt=""
                    width={28}
                    height={28}
                    className="rounded-full flex-shrink-0"
                  />
                  <div className="flex-1 rounded-xl px-3 py-2" style={{ background: 'var(--bg-secondary)' }}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-xs" style={{ color: 'var(--accent)' }}>{c.author?.username}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatRelative(c.created_at)}</span>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{c.content}</p>
                  </div>
                </div>
              ))
            )}
            {userId && (
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  className="frag-input flex-1"
                  placeholder="Write a comment..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submitComment()}
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                />
                <button onClick={submitComment} className="btn-accent" style={{ padding: '0.5rem 0.75rem' }}>
                  <Send size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommunityPage() {
  const supabase = createClient();
  const { profile } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [newPost, setNewPost] = useState({ content: '', category: 'General', image_url: '' });
  const [posting, setPosting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchPosts = async () => {
    setLoading(true);
    let query = supabase
      .from('community_posts')
      .select('*, author:users(username, avatar_url), comment_count:comments(count)')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(30);

    if (category !== 'All') query = query.eq('category', category);

    const { data } = await query;
    if (data) setPosts(data);
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, [category]);

  const handleImageUpload = async (file: File) => {
    if (!profile) return;
    const ext = file.name.split('.').pop();
    const path = `posts/${profile.id}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('banners').upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from('banners').getPublicUrl(path);
      setNewPost(p => ({ ...p, image_url: data.publicUrl }));
      toast.success('Image uploaded');
    }
  };

  const submitPost = async () => {
    if (!profile || !newPost.content.trim()) return;
    setPosting(true);
    const { error } = await supabase.from('community_posts').insert({
      author_id: profile.id,
      content: newPost.content.trim(),
      category: newPost.category,
      image_url: newPost.image_url || null,
    });
    setPosting(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Post published!');
    setShowModal(false);
    setNewPost({ content: '', category: 'General', image_url: '' });
    fetchPosts();
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="border-b border-border py-12 text-center" style={{ background: 'linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)' }}>
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <ScrollReveal delay={100}>
            <h1 className="font-rajdhani font-bold text-5xl mb-3 hero-title-glow">
              COMMUNITY
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <p className="text-secondary text-lg mb-6">Share clips, strats, and trash talk. Keep it respectful.</p>
          </ScrollReveal>
          <ScrollReveal delay={300}>
            {profile && (
              <button onClick={() => setShowModal(true)} className="btn-accent px-8 py-3 text-lg">
                <PlusCircle size={20} /> Create Post
              </button>
            )}
          </ScrollReveal>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full font-rajdhani font-bold text-sm whitespace-nowrap transition-all ${category === cat ? 'btn-accent' : 'btn-secondary'}`}
              style={category === cat ? { padding: '0.375rem 1rem', fontSize: '0.875rem' } : { padding: '0.375rem 1rem', fontSize: '0.875rem' }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Feed */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 12 }} />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare size={64} className="mx-auto mb-4 empty-state-icon" />
            <h3 className="font-rajdhani font-bold text-2xl mb-2 text-primary">No Posts Yet</h3>
            <p className="text-muted">Be the first to start a conversation.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                userId={profile?.id ?? null}
                onDeleted={id => setPosts(prev => prev.filter(p => p.id !== id))}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      {showModal && profile && (
        <div className="modal-backdrop">
          <div className="glass-modal w-full max-w-lg p-6 animate-scale-in relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-muted hover:text-primary">
              <X size={20} />
            </button>
            <h2 className="font-rajdhani font-bold text-2xl text-primary mb-5">Create Post</h2>

            <div className="flex items-start gap-3 mb-4">
              <Image src={getAvatarUrl(profile.avatar_url, profile.username)} alt="" width={40} height={40} className="rounded-full flex-shrink-0" />
              <textarea
                className="frag-input flex-1 resize-none"
                rows={4}
                placeholder="What's on your mind? Share clips, tips, call-outs..."
                value={newPost.content}
                onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))}
                maxLength={1000}
              />
            </div>

            {newPost.image_url && (
              <div className="relative mb-4 rounded-lg overflow-hidden" style={{ height: 160 }}>
                <Image src={newPost.image_url} alt="Preview" fill className="object-cover" />
                <button onClick={() => setNewPost(p => ({ ...p, image_url: '' }))} className="absolute top-2 right-2 bg-black/60 rounded-full p-1">
                  <X size={14} className="text-white" />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="flex items-center gap-3">
                <button onClick={() => fileRef.current?.click()} className="btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                  <ImageIcon size={14} /> Image
                </button>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
                <select
                  className="frag-input"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', width: 'auto' }}
                  value={newPost.category}
                  onChange={e => setNewPost(p => ({ ...p, category: e.target.value }))}
                >
                  {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button onClick={submitPost} disabled={posting || !newPost.content.trim()} className="btn-accent" style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>
                {posting ? 'Posting...' : <><Send size={14} /> Post</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
