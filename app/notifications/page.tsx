'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { formatRelative } from '@/lib/utils';
import ScrollReveal from '@/components/ScrollReveal';
import { Bell, Trophy, Users, Shield, CheckCheck, Megaphone, Zap, Target, Star, X } from 'lucide-react';
import Link from 'next/link';

const NOTIF_ICONS: Record<string, React.ReactNode> = {
  tournament_registered: <Trophy size={18} className="text-accent" />,
  match_starting:        <Zap size={18} className="text-gold" />,
  result_submitted:      <Target size={18} className="text-neon-blue" />,
  result_confirmed:      <CheckCheck size={18} className="text-neon-green" />,
  result_disputed:       <Shield size={18} className="text-accent" />,
  dispute_resolved:      <Shield size={18} className="text-neon-green" />,
  clan_invite:           <Users size={18} className="text-purple-400" />,
  clan_accepted:         <Users size={18} className="text-neon-green" />,
  clan_rejected:         <X size={18} className="text-accent" />,
  announcement:          <Megaphone size={18} className="text-gold" />,
  badge_earned:          <Star size={18} className="text-gold" />,
  eliminated:            <X size={18} className="text-accent" />,
  platform_announcement: <Megaphone size={18} className="text-neon-blue" />,
};

const NOTIF_BG: Record<string, string> = {
  tournament_registered: 'rgba(255,69,0,0.08)',
  match_starting:        'rgba(255,215,0,0.08)',
  result_confirmed:      'rgba(0,255,135,0.08)',
  result_disputed:       'rgba(255,69,0,0.08)',
  clan_invite:           'rgba(168,85,247,0.08)',
  badge_earned:          'rgba(255,215,0,0.08)',
  platform_announcement: 'rgba(0,212,255,0.08)',
};

export default function NotificationsPage() {
  const supabase = createClient();
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setNotifications(data);
    setLoading(false);
  };

  useEffect(() => { fetchNotifications(); }, [profile]);

  const markAllRead = async () => {
    if (!profile) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', profile.id)
      .eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="border-b border-border py-8" style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between">
          <ScrollReveal>
            <div className="flex items-center gap-3">
              <Bell size={28} style={{ color: 'var(--accent)' }} />
              <div>
                <h1 className="font-rajdhani font-bold text-3xl hero-title-glow">
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {unreadCount} unread
                  </p>
                )}
              </div>
            </div>
          </ScrollReveal>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="btn-secondary"
              style={{ fontSize: '0.85rem' }}
            >
              <CheckCheck size={15} /> Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <ScrollReveal>
            <div className="text-center py-20">
              <Bell
                size={64}
                className="mx-auto mb-4 empty-state-icon"
              />
              <h3 className="font-rajdhani font-bold text-2xl mb-2" style={{ color: 'var(--text-secondary)' }}>
                All Clear
              </h3>
              <p style={{ color: 'var(--text-muted)' }}>
                You have no notifications. Enter a tournament to get started!
              </p>
              <Link href="/tournaments" className="btn-accent mt-6 inline-flex">
                Browse Tournaments
              </Link>
            </div>
          </ScrollReveal>
        ) : (
          <div className="space-y-2">
            {notifications.map(notif => {
              const icon = NOTIF_ICONS[notif.type] ?? <Bell size={18} className="text-muted" />;
              const bg = !notif.is_read ? (NOTIF_BG[notif.type] ?? 'rgba(255,69,0,0.05)') : 'transparent';

              return (
                <ScrollReveal key={notif.id} delay={100}>
                  <div
                    className="frag-card-static p-4 flex items-start gap-4 cursor-pointer transition-all hover:bg-white/5"
                    style={{ background: bg, borderColor: !notif.is_read ? 'var(--border-accent)' : 'var(--border)' }}
                    onClick={() => {
                      markRead(notif.id);
                      if (notif.link) window.location.href = notif.link;
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                    >
                      {icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: notif.is_read ? 'var(--text-secondary)' : 'var(--text-primary)', fontWeight: notif.is_read ? 400 : 600 }}
                      >
                        {notif.message}
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        {formatRelative(notif.created_at)}
                      </p>
                    </div>

                    {!notif.is_read && (
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5"
                        style={{ background: 'var(--accent)', boxShadow: '0 0 6px rgba(255,69,0,0.6)' }}
                      />
                    )}
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
