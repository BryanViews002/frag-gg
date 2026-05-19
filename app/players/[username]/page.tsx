'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/types';
import { getAvatarUrl, getRankRingClass, getRankColor, getCountryFlag, getReputationLabel, getReputationColor } from '@/lib/utils';
import { BADGE_META } from '@/types';
import { Shield, Target, Trophy, Crosshair, Users, Activity, PlaySquare, ArrowUpRight, UserX, Music, Twitter, Award } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="frag-card p-4 text-center">
      <div className="flex justify-center mb-2 text-accent opacity-80">{icon}</div>
      <div className="font-orbitron font-bold text-2xl text-primary">{value}</div>
      <div className="text-xs text-muted uppercase tracking-widest mt-1">{label}</div>
    </div>
  );
}

export default function PlayerProfilePage() {
  const { username } = useParams();
  const supabase = createClient();
  const { profile: currentUser, loading: authLoading } = useAuth();
  const [player, setPlayer] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState<any[]>([]);
  const [stats, setStats] = useState({ entered: 0, won: 0 });

  const rawUsername = Array.isArray(username) ? username[0] : (username as string);
  const usernameStr = decodeURIComponent(rawUsername);
  const isOwnProfile = currentUser?.username?.toLowerCase() === usernameStr?.toLowerCase();

  useEffect(() => {
    if (authLoading) return;
    const fetchPlayer = async () => {
      setLoading(true);
      try {
        // Load the public user row first. If this is the signed-in user's own page
        // and the public lookup fails, fall back to the already-loaded auth profile.
        const { data: userByUsername, error: userByUsernameError } = await supabase
          .from('users')
          .select('*')
          .ilike('username', usernameStr)
          .maybeSingle();

        if (userByUsernameError) {
          console.error('Profile lookup error:', userByUsernameError);
        }

        const data = (userByUsername as User | null) || (isOwnProfile ? currentUser : null);

        if (data) {
          let clan: { id: string; name: string; tag: string } | null = null;

          if (data.clan_id) {
            const { data: clanData, error: clanError } = await supabase
              .from('clans')
              .select('id, name, tag')
              .eq('id', data.clan_id)
              .maybeSingle();

            if (clanError) {
              console.error('Clan lookup error:', clanError);
            } else if (clanData) {
              clan = clanData;
            }
          }

          setPlayer({ ...data, ...(clan ? { clan } : {}) } as User);

          // Stats — wrapped separately so they don't block profile rendering
          try {
            const [{ count: mpCount }, { count: brCount }] = await Promise.all([
              supabase
                .from('mp_registrations')
                .select('*', { count: 'exact', head: true })
                .or(`captain_id.eq.${data.id},player2_id.eq.${data.id},player3_id.eq.${data.id},player4_id.eq.${data.id},player5_id.eq.${data.id}`),
              supabase
                .from('br_registrations')
                .select('*', { count: 'exact', head: true })
                .or(`captain_id.eq.${data.id},player2_id.eq.${data.id},player3_id.eq.${data.id},player4_id.eq.${data.id}`),
            ]);
            setStats({ entered: (mpCount ?? 0) + (brCount ?? 0), won: 0 });
          } catch {
            setStats({ entered: 0, won: 0 });
          }

          // Badges — wrapped separately
          try {
            const { data: badgeData } = await supabase
              .from('badges')
              .select('*')
              .eq('user_id', data.id);
            setBadges(badgeData || []);
          } catch {
            setBadges([]);
          }
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
      } finally {
        setLoading(false); // ALWAYS stop loading, no matter what
      }
    };
    fetchPlayer();
  }, [usernameStr, authLoading, currentUser, isOwnProfile]);

  if (loading || authLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin border-accent" />
    </div>
  );

  if (!player) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center max-w-sm px-6 animate-scale-in">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--accent-dim)', border: '1px solid var(--border-accent)' }}>
            <UserX size={28} style={{ color: 'var(--accent)' }} />
          </div>
          <h2 className="font-rajdhani font-bold text-2xl mb-2" style={{ color: 'var(--text-primary)' }}>
            {isOwnProfile ? 'Profile Not Set Up' : 'Player Not Found'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            {isOwnProfile
              ? 'Your profile is not fully set up yet. Complete onboarding to create your player profile.'
              : `No player with the username "${username}" was found.`}
          </p>
          {isOwnProfile ? (
            <Link href="/onboarding" className="btn-accent">
              Complete Profile Setup
            </Link>
          ) : (
            <Link href="/leaderboards" className="btn-secondary">
              View Leaderboards
            </Link>
          )}
        </div>
      </div>
    );
  }

  const repColor = getReputationColor(player.reputation_score);

  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--bg-primary)' }}>
      {/* ─── PROFILE HEADER ─── */}
      <div className="relative">
        <div className="h-48 md:h-64 w-full relative">
          <Image src={player.banner_url || `https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1920&q=80`} alt="Banner" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-primary to-transparent" />
        </div>
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-20 md:-mt-24">
          <div className="flex flex-col md:flex-row md:items-end gap-6">
            <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden bg-bg-secondary flex-shrink-0 ${getRankRingClass(player.rank)}`} style={{ borderWidth: '4px' }}>
              <Image src={getAvatarUrl(player.avatar_url, player.username)} alt={player.username} width={160} height={160} className="object-cover w-full h-full" />
            </div>
            
            <div className="flex-1 pb-4">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <span className="badge" style={{ background: `${repColor}22`, color: repColor, border: `1px solid ${repColor}44` }}>
                  <Shield size={12} className="inline mr-1" />
                  {getReputationLabel(player.reputation_score)}
                </span>
                {player.country && <span className="text-xl">{getCountryFlag(player.country)}</span>}
              </div>
              
              <h1 className="font-rajdhani font-bold text-4xl md:text-5xl text-primary leading-none mb-1">
                {player.username}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted uppercase tracking-widest font-bold">IGN:</span>
                  <span className="font-bold text-accent text-lg">{player.ingame_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted uppercase tracking-widest font-bold">UID:</span>
                  <span className="text-secondary font-mono">{player.ingame_uid}</span>
                </div>
              </div>
            </div>

            <div className="pb-4 flex gap-3">
              {(player as any).clan && (
                <Link href={`/clans/${(player as any).clan.id}`} className="frag-card px-4 py-2 flex flex-col items-center justify-center group hover:border-accent">
                  <span className="text-xs text-muted uppercase tracking-widest mb-1">Clan</span>
                  <span className="font-rajdhani font-bold text-primary group-hover:text-accent transition-colors">
                    [{(player as any).clan.tag}] {(player as any).clan.name}
                  </span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* ─── LEFT COLUMN ─── */}
        <div className="space-y-6">
          <div className="frag-card p-6">
            <h3 className="font-rajdhani font-bold text-xl text-primary mb-4 border-b border-border pb-2">About</h3>
            <p className="text-secondary text-sm leading-relaxed mb-6">
              {player.bio || 'This player is a mystery.'}
            </p>
            
            <div className="space-y-4">
              <div>
                <span className="text-xs text-muted uppercase tracking-widest block mb-1">Current Rank</span>
                <span className="badge badge-format" style={{ color: getRankColor(player.rank) }}>{player.rank || 'Unranked'}</span>
              </div>
              <div>
                <span className="text-xs text-muted uppercase tracking-widest block mb-1">Role</span>
                <span className="text-primary font-medium">{player.role || 'Any'}</span>
              </div>
              <div>
                <span className="text-xs text-muted uppercase tracking-widest block mb-1">Preferred Mode</span>
                <span className={`badge ${player.preferred_mode === 'mp' ? 'badge-mp' : player.preferred_mode === 'br' ? 'badge-br' : 'badge-format'}`}>
                  {player.preferred_mode ? player.preferred_mode.toUpperCase() : 'ANY'}
                </span>
              </div>
            </div>
          </div>

          <div className="frag-card p-6">
            <h3 className="font-rajdhani font-bold text-xl text-primary mb-4 border-b border-border pb-2">Socials</h3>
            <div className="space-y-3">
              {player.youtube_url && (
                <a href={player.youtube_url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-2 rounded hover:bg-white/5 transition-colors text-secondary hover:text-primary">
                  <div className="flex items-center gap-2"><PlaySquare size={16} /> YouTube</div>
                  <ArrowUpRight size={14} />
                </a>
              )}
              {player.twitter_url && (
                <a href={player.twitter_url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-2 rounded hover:bg-white/5 transition-colors text-secondary hover:text-primary">
                  <div className="flex items-center gap-2"><Twitter size={16} /> Twitter / X</div>
                  <ArrowUpRight size={14} />
                </a>
              )}
              {player.tiktok_url && (
                <a href={player.tiktok_url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-2 rounded hover:bg-white/5 transition-colors text-secondary hover:text-primary">
                  <div className="flex items-center gap-2"><Music size={16} /> TikTok</div>
                  <ArrowUpRight size={14} />
                </a>
              )}
              {!player.youtube_url && !player.twitter_url && !player.tiktok_url && (
                <p className="text-muted text-sm text-center italic py-2">No socials linked.</p>
              )}
            </div>
          </div>
        </div>

        {/* ─── MAIN COLUMN ─── */}
        <div className="md:col-span-2 space-y-8">
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Tournaments" value={stats.entered} icon={<Crosshair size={20} />} />
            <StatCard label="Wins" value={stats.won} icon={<Trophy size={20} />} />
            <StatCard label="Win Rate" value={stats.entered > 0 ? `${Math.round((stats.won / stats.entered) * 100)}%` : '—'} icon={<Activity size={20} />} />
            <StatCard label="Best Finish" value={stats.won > 0 ? '1st' : '—'} icon={<Target size={20} />} />
          </div>

          <section>
            <h2 className="font-rajdhani font-bold text-2xl text-primary mb-4">Badges</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {Object.keys(BADGE_META).map((key) => {
                const b = BADGE_META[key as keyof typeof BADGE_META];
                const earned = badges.find(eb => eb.badge_type === key);
                return (
                  <div key={key} className={`frag-card p-4 text-center transition-all ${earned ? '' : 'opacity-40 grayscale border-dashed'}`}
                    style={earned ? { borderColor: `${b.color}44`, boxShadow: `0 0 15px ${b.color}22` } : {}}>
                    <div className="flex justify-center mb-2" style={{ color: earned ? b.color : 'var(--text-muted)' }}>
                      <Award size={22} />
                    </div>
                    <div className="text-xs font-bold mb-1" style={{ color: earned ? b.color : 'var(--text-muted)' }}>{b.label}</div>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="font-rajdhani font-bold text-2xl text-primary mb-4">Recent History</h2>
            <div className="frag-card-static p-8 text-center text-muted">
              Tournament history not populated yet.
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
