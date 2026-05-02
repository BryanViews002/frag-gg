import { type Rank, type ReputationLevel, COUNTRIES } from '@/types';
import { formatDistanceToNow, format, isPast, isValid, parseISO } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';

// ============================================
// CLASS NAME UTILITY
// ============================================
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// ============================================
// DATE UTILITIES
// ============================================
export function formatDate(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    return isValid(d) ? format(d, 'MMM d, yyyy') : 'TBD';
  } catch { return 'TBD'; }
}

export function formatDateTime(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    return isValid(d) ? format(d, 'MMM d, yyyy h:mm a') : 'TBD';
  } catch { return 'TBD'; }
}

export function formatRelative(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : 'Unknown';
  } catch { return 'Unknown'; }
}

export function getCountdown(dateStr: string): string {
  try {
    const target = parseISO(dateStr);
    if (!isValid(target) || isPast(target)) return 'Started';
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  } catch { return 'Soon'; }
}

// ============================================
// RANK UTILITIES
// ============================================
export function getRankColor(rank: Rank | string | null): string {
  switch (rank) {
    case 'Rookie': return '#9CA3AF';
    case 'Veteran': return '#00FF87';
    case 'Elite': return '#00D4FF';
    case 'Pro': return '#A855F7';
    case 'Master': return '#F97316';
    case 'Grandmaster': return '#FF4500';
    case 'Legendary': return '#FFD700';
    default: return '#9CA3AF';
  }
}

export function getRankClass(rank: Rank | string | null): string {
  switch (rank) {
    case 'Rookie': return 'rank-rookie';
    case 'Veteran': return 'rank-veteran';
    case 'Elite': return 'rank-elite';
    case 'Pro': return 'rank-pro';
    case 'Master': return 'rank-master';
    case 'Grandmaster': return 'rank-grandmaster';
    case 'Legendary': return 'rank-legendary';
    default: return 'rank-rookie';
  }
}

export function getRankRingClass(rank: Rank | string | null): string {
  switch (rank) {
    case 'Rookie': return 'rank-ring-rookie';
    case 'Veteran': return 'rank-ring-veteran';
    case 'Elite': return 'rank-ring-elite';
    case 'Pro': return 'rank-ring-pro';
    case 'Master': return 'rank-ring-master';
    case 'Grandmaster': return 'rank-ring-grandmaster';
    case 'Legendary': return 'rank-ring-legendary';
    default: return 'rank-ring-rookie';
  }
}

// ============================================
// REPUTATION
// ============================================
export function getReputationLevel(score: number): ReputationLevel {
  if (score >= 90) return 'trusted';
  if (score >= 70) return 'good';
  if (score >= 50) return 'neutral';
  return 'flagged';
}

export function getReputationLabel(score: number): string {
  const level = getReputationLevel(score);
  switch (level) {
    case 'trusted': return 'TRUSTED';
    case 'good': return 'GOOD STANDING';
    case 'neutral': return 'NEUTRAL';
    case 'flagged': return 'FLAGGED';
  }
}

export function getReputationColor(score: number): string {
  const level = getReputationLevel(score);
  switch (level) {
    case 'trusted': return '#00FF87';
    case 'good': return '#00D4FF';
    case 'neutral': return '#8B8FA8';
    case 'flagged': return '#FF4500';
  }
}

// ============================================
// TOURNAMENT UTILITIES
// ============================================
export function getTournamentFormatLabel(mode: string, mpFormat?: string | null, brFormat?: string | null): string {
  if (mode === 'mp' && mpFormat) return mpFormat.toUpperCase();
  if (mode === 'br' && brFormat) {
    switch (brFormat) {
      case 'solo': return 'Solo BR';
      case 'duo': return 'Duo BR';
      case 'squad': return 'Squad BR';
    }
  }
  return 'Unknown';
}

export function getTournamentSlotLabel(tournament: {
  mode: string;
  mp_format?: string | null;
  br_format?: string | null;
  current_entries: number;
  max_entries: number;
}): string {
  const { mode, mp_format, br_format, current_entries, max_entries } = tournament;
  if (mode === 'mp') return `${current_entries}/2 Teams Registered`;
  if (mode === 'br') {
    switch (br_format) {
      case 'solo': return `${current_entries}/${max_entries} Players`;
      case 'duo': return `${current_entries}/${max_entries} Duos`;
      case 'squad': return `${current_entries}/${max_entries} Squads`;
    }
  }
  return `${current_entries}/${max_entries}`;
}

export function getRegistrationProgress(current: number, max: number): number {
  if (max === 0) return 0;
  return Math.min((current / max) * 100, 100);
}

export function canRegister(tournament: {
  status: string;
  current_entries: number;
  max_entries: number;
}): boolean {
  return tournament.status === 'open' && tournament.current_entries < tournament.max_entries;
}

// ============================================
// STRING UTILITIES
// ============================================
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ============================================
// COUNTRY UTILITIES
// ============================================
export function getCountryFlag(code: string): string {
  const country = COUNTRIES.find(c => c.code === code);
  return country?.name ?? code;
}

export function getCountryCode(code: string): string {
  return code.toUpperCase();
}

// ============================================
// WIN RATE
// ============================================
export function calculateWinRate(wins: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((wins / total) * 100);
}

// ============================================
// PLACEMENT FORMATTING
// ============================================
export function getPlacementSuffix(n: number): string {
  if (n === 1) return '1st';
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  return `${n}th`;
}

export function getPlacementColor(placement: number): string {
  if (placement === 1) return '#FFD700';
  if (placement === 2) return '#C0C0C0';
  if (placement === 3) return '#CD7F32';
  return '#8B8FA8';
}

// ============================================
// AVATAR URL
// ============================================
export function getAvatarUrl(url: string | null, username: string): string {
  if (url) return url;
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(username)}&backgroundColor=0c0c18`;
}
