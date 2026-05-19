'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Tournament } from '@/types';
import {
  getTournamentFormatLabel, getTournamentSlotLabel,
  getRegistrationProgress, formatDate, getCountdown
} from '@/lib/utils';
import { Calendar, Users, Trophy, Clock, Flame } from 'lucide-react';

interface TournamentCardProps {
  tournament: Tournament;
  variant?: 'grid' | 'featured';
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'live') return (
    <span className="badge badge-live" style={{ gap: '0.35rem' }}>
      <span className="live-dot" />LIVE
    </span>
  );
  if (status === 'open')      return <span className="badge badge-open">OPEN</span>;
  if (status === 'completed') return <span className="badge badge-ended">ENDED</span>;
  return <span className="badge badge-full">UPCOMING</span>;
}

// ── Segmented slot indicator ──────────────────────────────
function SlotTrack({ current, max }: { current: number; max: number }) {
  const SEGS    = Math.min(max, 12);          // cap at 12 visual segments
  const filled  = Math.round((current / max) * SEGS);
  const nearFull = filled / SEGS > 0.75;

  return (
    <div className="slot-track" aria-label={`${current} of ${max} slots filled`}>
      {Array.from({ length: SEGS }).map((_, i) => (
        <div
          key={i}
          className={`slot-seg ${i < filled ? 'filled' : ''} ${i < filled && nearFull ? 'near-full' : ''}`}
        />
      ))}
    </div>
  );
}

export default function TournamentCard({ tournament, variant = 'grid' }: TournamentCardProps) {
  const progress    = getRegistrationProgress(tournament.current_entries, tournament.max_entries);
  const slotLabel   = getTournamentSlotLabel(tournament);
  const formatLabel = getTournamentFormatLabel(tournament.mode, tournament.mp_format, tournament.br_format);
  const isFeatured  = variant === 'featured';

  // Mode accent color
  const modeColor   = tournament.mode === 'mp' ? 'var(--neon-blue)' : 'var(--accent)';

  return (
    <Link href={`/tournaments/${tournament.id}`} className="block h-full">
      <article
        className="tournament-card group h-full flex flex-col"
        style={{
          minHeight: isFeatured ? '360px' : '280px',
          borderTop: `2px solid ${modeColor}`,
          position: 'relative',
        }}
      >
        {/* LIVE pulse ring */}
        {tournament.status === 'live' && (
          <div
            className="absolute inset-0 rounded-xl pointer-events-none z-10"
            style={{
              boxShadow: '0 0 0 1px rgba(255,69,0,0.2)',
              animation: 'pulseGlow 2s ease-in-out infinite',
            }}
          />
        )}

        {/* Banner */}
        <div className="relative overflow-hidden" style={{ height: isFeatured ? '180px' : '148px' }}>
          <Image
            src={tournament.banner_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80'}
            alt={tournament.name}
            fill
            className="object-cover transition-transform duration-600 group-hover:scale-[1.07]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMxMTExMjAiLz48L3N2Zz4="
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(180deg, rgba(17,17,32,0.1) 0%, rgba(17,17,32,0.85) 100%)',
          }} />

          {/* Top-left badges */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <span className={`badge ${tournament.mode === 'mp' ? 'badge-mp' : 'badge-br'}`}>
              {tournament.mode.toUpperCase()}
            </span>
            <span className="badge badge-format">{formatLabel}</span>
          </div>

          {/* Top-right status */}
          <div className="absolute top-3 right-3">
            <StatusBadge status={tournament.status} />
          </div>

          {/* Bottom-right prize */}
          {tournament.has_prize && tournament.prize_1st ? (
            <div
              className="absolute bottom-3 right-3 flex items-center gap-1"
              style={{
                background: 'linear-gradient(135deg, rgba(255,215,0,0.18), rgba(255,215,0,0.08))',
                border: '1px solid rgba(255,215,0,0.35)',
                borderRadius: 6, padding: '3px 8px',
              }}
            >
              <Trophy size={10} style={{ color: 'var(--gold)' }} />
              <span style={{ color: 'var(--gold)', fontSize: '0.68rem', fontWeight: 700, fontFamily: 'Orbitron, sans-serif' }}>
                {tournament.prize_1st}
              </span>
            </div>
          ) : (
            <div className="absolute bottom-3 right-3 flex items-center gap-1">
              <Flame size={10} style={{ color: 'var(--accent)', opacity: 0.7 }} />
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.06em' }}>FOR GLORY</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <h3
            className="font-rajdhani font-bold mb-1.5 truncate"
            style={{ fontSize: '1.05rem', color: 'var(--text-primary)', letterSpacing: '0.02em' }}
          >
            {tournament.name}
          </h3>

          <div className="flex items-center gap-3 mb-3">
            <span className="flex items-center gap-1" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <Calendar size={11} /> {formatDate(tournament.start_date)}
            </span>
            <span style={{ color: 'var(--border-2)' }}>·</span>
            <span className="flex items-center gap-1" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <Clock size={11} /> {getCountdown(tournament.start_date)}
            </span>
          </div>

          {/* Segmented slot bar */}
          <div className="mb-1.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <Users size={10} /> {slotLabel}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'Orbitron, sans-serif', fontWeight: 600 }}>
                {Math.round(progress)}%
              </span>
            </div>
            <SlotTrack current={tournament.current_entries ?? 0} max={tournament.max_entries ?? 8} />
          </div>

          {/* CTA pill */}
          <div className="mt-auto pt-3">
            {tournament.status === 'open' ? (
              <div
                className="w-full text-center py-2 rounded-lg font-rajdhani font-bold text-sm transition-all"
                style={{
                  background: 'rgba(255,69,0,0.1)',
                  border: '1px solid rgba(255,69,0,0.25)',
                  color: 'var(--accent)',
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                }}
              >
                Register Now →
              </div>
            ) : (
              <div
                className="w-full text-center py-2 rounded-lg font-rajdhani font-bold text-sm"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                View Details
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
