'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Tournament } from '@/types';
import {
  getTournamentFormatLabel, getTournamentSlotLabel,
  getRegistrationProgress, formatDate, getCountdown
} from '@/lib/utils';
import { Calendar, Users, Trophy, Clock } from 'lucide-react';

interface TournamentCardProps {
  tournament: Tournament;
  variant?: 'grid' | 'featured';
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'live') {
    return (
      <span className="badge badge-live">
        <span className="live-dot" />
        LIVE
      </span>
    );
  }
  if (status === 'open') return <span className="badge badge-open">OPEN</span>;
  if (status === 'completed') return <span className="badge badge-ended">ENDED</span>;
  return <span className="badge badge-full">UPCOMING</span>;
}

export default function TournamentCard({ tournament, variant = 'grid' }: TournamentCardProps) {
  const progress = getRegistrationProgress(tournament.current_entries, tournament.max_entries);
  const slotLabel = getTournamentSlotLabel(tournament);
  const formatLabel = getTournamentFormatLabel(tournament.mode, tournament.mp_format, tournament.br_format);
  const isFeatured = variant === 'featured';

  const bannerFallback = `https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80`;

  return (
    <Link href={`/tournaments/${tournament.id}`} className="block">
      <article
        className="tournament-card group"
        style={{ height: isFeatured ? '360px' : 'auto', minHeight: isFeatured ? '360px' : '280px' }}
      >
        {/* Banner */}
        <div className="relative h-40 bg-secondary group overflow-hidden">
          <Image
            src={tournament.banner_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80'}
            alt={tournament.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMxMDEwMUUiLz48L3N2Zz4="
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#10101E] to-transparent opacity-90" />
          
          {/* Top badges */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className={`badge ${tournament.mode === 'mp' ? 'badge-mp' : 'badge-br'}`}>
              {tournament.mode.toUpperCase()}
            </span>
            <span className="badge badge-format">{formatLabel}</span>
          </div>

          {/* Status */}
          <div className="absolute top-3 right-3">
            <StatusBadge status={tournament.status} />
          </div>

          {/* Prize */}
          {tournament.has_prize && tournament.prize_1st && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1"
              style={{ background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 6, padding: '3px 8px' }}>
              <Trophy size={10} style={{ color: 'var(--gold)' }} />
              <span style={{ color: 'var(--gold)', fontSize: '0.7rem', fontWeight: 700 }}>{tournament.prize_1st}</span>
            </div>
          )}
          {!tournament.has_prize && (
            <div className="absolute bottom-3 right-3">
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>FOR GLORY</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3
            className="font-rajdhani font-bold mb-1 truncate"
            style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}
          >
            {tournament.name}
          </h3>

          <div className="flex items-center gap-1 mb-3">
            <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {formatDate(tournament.start_date)}
            </span>
            <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>·</span>
            <Clock size={12} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {getCountdown(tournament.start_date)}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <Users size={10} className="inline mr-1" />{slotLabel}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{Math.round(progress)}%</span>
            </div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {tournament.status === 'open' && (
            <div
              className="mt-3 w-full text-center py-2 rounded-lg font-rajdhani font-bold text-sm transition-all"
              style={{
                background: 'var(--accent-dim)',
                border: '1px solid var(--border-accent)',
                color: 'var(--accent)',
                letterSpacing: '0.05em',
              }}
            >
              REGISTER NOW →
            </div>
          )}
          {tournament.status !== 'open' && (
            <div
              className="mt-3 w-full text-center py-2 rounded-lg font-rajdhani font-bold text-sm"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                letterSpacing: '0.05em',
              }}
            >
              VIEW DETAILS
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
