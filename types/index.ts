// ============================================
// FRAG.GG — Full TypeScript Type Definitions
// ============================================

export type Rank =
  | 'Rookie'
  | 'Veteran'
  | 'Elite'
  | 'Pro'
  | 'Master'
  | 'Grandmaster'
  | 'Legendary';

export type GameMode = 'mp' | 'br';
export type MPFormat = '1v1' | '2v2' | '3v3' | '4v4' | '5v5';
export type BRFormat = 'solo' | 'duo' | 'squad';
export type TournamentStatus = 'upcoming' | 'open' | 'live' | 'completed';
export type MatchMode = 'hardpoint' | 'snd' | 'control' | 'battle_royale';
export type MatchFormat = 'single' | 'bo3' | 'bo5';
export type PlayerRole = 'Fragger' | 'Sniper' | 'Support' | 'Rusher' | 'All-rounder';
export type PreferredMode = 'mp' | 'br' | 'both';
export type ReputationLevel = 'trusted' | 'good' | 'neutral' | 'flagged';
export type TournamentStructure = 'head_to_head' | 'bracket';
export type BracketType = 'single_elim' | 'double_elim';
export type DrawType = 'random' | 'seeded';
export type DrawStatus = 'pending' | 'in_progress' | 'completed';
export type MPMatchType = 'standard' | 'pure_1v1' | 'representative' | 'battle';
export type RegistrationType = 'self' | 'auto';
export type MatchStatus = 'pending' | 'confirmed' | 'disputed';
export type NotificationType =
  | 'tournament_registered'
  | 'match_starting'
  | 'result_submitted'
  | 'result_confirmed'
  | 'result_disputed'
  | 'dispute_resolved'
  | 'clan_invite'
  | 'clan_accepted'
  | 'clan_rejected'
  | 'announcement'
  | 'badge_earned'
  | 'eliminated'
  | 'platform_announcement';

// ============================================
// DATABASE ROW TYPES
// ============================================

export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  banner_url: string | null;
  country: string | null;
  ingame_name: string;
  ingame_uid: string;
  rank: Rank | null;
  role: PlayerRole | null;
  preferred_mode: PreferredMode | null;
  bio: string | null;
  reputation_score: number;
  clan_id: string | null;
  is_admin: boolean;
  onboarding_complete: boolean;
  youtube_url: string | null;
  tiktok_url: string | null;
  twitter_url: string | null;
  discord_username: string | null;
  created_at: string;
}

export interface Tournament {
  id: string;
  name: string;
  banner_url: string | null;
  description: string | null;
  creator_id: string;
  mode: GameMode;
  mp_format: MPFormat | null;
  br_format: BRFormat | null;
  match_mode: MatchMode;
  match_format: MatchFormat;
  tournament_structure: TournamentStructure | null;
  bracket_type: BracketType | null;
  draw_type: DrawType | null;
  draw_status: DrawStatus;
  draw_completed_at: string | null;
  mp_match_type: MPMatchType | null;
  registration_type: RegistrationType;
  max_teams: number | null;
  verification_window: number;
  max_entries: number;
  entry_size: number;
  max_players: number;
  current_entries: number;
  registration_opens: string;
  registration_closes: string;
  start_date: string;
  match_time_limit: number;
  prize_1st: string | null;
  prize_2nd: string | null;
  prize_3rd: string | null;
  prize_notes: string | null;
  has_prize: boolean;
  rules: string | null;
  status: TournamentStatus;
  organizer_contact: string | null;
  region: string;
  is_featured: boolean;
  created_at: string;
  // Joins
  creator?: User;
}

export interface Bracket {
  id: string;
  tournament_id: string;
  round_number: number;
  match_number: number;
  slot_a_id: string | null;
  slot_b_id: string | null;
  score_a: number | null;
  score_b: number | null;
  winner_id: string | null;
  is_bye: boolean;
  status: MatchStatus;
  submitted_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Seed {
  id: string;
  tournament_id: string;
  registration_id: string;
  seed_number: number;
  pot_number: number;
  assigned_at: string;
}

export interface TournamentMod {
  id: string;
  tournament_id: string;
  user_id: string;
  assigned_by: string;
  assigned_at: string;
  user?: User;
}

export interface MatchDispute {
  id: string;
  match_id: string;
  tournament_id: string;
  raised_by: string;
  reason: string;
  status: 'pending' | 'reviewing' | 'resolved';
  resolved_by: string | null;
  resolution: string | null;
  created_at: string;
}

export interface MPRegistration {
  id: string;
  tournament_id: string;
  side: 'a' | 'b';
  team_name: string | null;
  captain_id: string;
  player2_id: string | null;
  player3_id: string | null;
  player4_id: string | null;
  player5_id: string | null;
  registered_at: string;
  // Joins
  captain?: User;
  player2?: User;
  player3?: User;
  player4?: User;
  player5?: User;
}

export interface BRRegistration {
  id: string;
  tournament_id: string;
  entry_name: string;
  captain_id: string;
  player2_id: string | null;
  player3_id: string | null;
  player4_id: string | null;
  placement: number | null;
  is_eliminated: boolean;
  registered_at: string;
  // Joins
  captain?: User;
  player2?: User;
  player3?: User;
  player4?: User;
}

export interface MPMatch {
  id: string;
  tournament_id: string;
  registration_a_id: string;
  registration_b_id: string;
  score_a: number | null;
  score_b: number | null;
  winner_side: 'a' | 'b' | null;
  screenshot_url: string | null;
  submitted_by: string | null;
  confirmed_by: string | null;
  status: 'pending' | 'submitted' | 'confirmed' | 'disputed';
  created_at: string;
  // Joins
  registration_a?: MPRegistration;
  registration_b?: MPRegistration;
}

export interface BRResult {
  id: string;
  tournament_id: string;
  organizer_id: string;
  screenshot_url: string | null;
  submitted_at: string;
}

export interface Clan {
  id: string;
  name: string;
  tag: string;
  logo_url: string | null;
  banner_url: string | null;
  country: string | null;
  description: string | null;
  leader_id: string;
  preferred_mode: PreferredMode | null;
  min_rank: Rank | null;
  recruitment_open: boolean;
  created_at: string;
  // Joins
  leader?: User;
  member_count?: number;
}

export interface ClanMember {
  id: string;
  clan_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  user?: User;
}

export interface ClanApplication {
  id: string;
  clan_id: string;
  user_id: string;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  user?: User;
}

export interface LFTPost {
  id: string;
  user_id: string;
  preferred_mode: PreferredMode;
  preferred_format: string;
  message: string | null;
  availability: string | null;
  is_active: boolean;
  created_at: string;
  user?: User;
}

export interface LFPPost {
  id: string;
  poster_id: string;
  clan_id: string | null;
  preferred_mode: PreferredMode;
  preferred_format: string;
  role_needed: string | null;
  min_rank: Rank | null;
  region: string | null;
  message: string | null;
  is_active: boolean;
  created_at: string;
  poster?: User;
  clan?: Clan;
}

export interface CommunityPost {
  id: string;
  author_id: string;
  content: string;
  image_url: string | null;
  embed_url: string | null;
  category: string;
  is_pinned: boolean;
  is_announcement: boolean;
  created_at: string;
  author?: User;
  reactions?: PostReaction[];
  comments?: Comment[];
  reaction_counts?: { fire: number; skull: number; eyes: number };
  comment_count?: number;
}

export interface PostReaction {
  id: string;
  post_id: string;
  user_id: string;
  reaction_type: 'fire' | 'skull' | 'eyes';
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_id: string;
  content: string;
  created_at: string;
  author?: User;
  replies?: Comment[];
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Badge {
  id: string;
  user_id: string;
  badge_type: BadgeType;
  earned_at: string;
}

export type BadgeType =
  | 'first_blood'
  | 'on_a_streak'
  | 'unstoppable'
  | 'legend'
  | 'veteran'
  | 'clan_leader'
  | 'tournament_host'
  | 'big_stage'
  | 'trusted_warrior';

export interface Dispute {
  id: string;
  match_id: string;
  tournament_id: string;
  raised_by: string;
  reason: string;
  status: 'pending' | 'reviewing' | 'resolved';
  resolved_by: string | null;
  resolution: string | null;
  created_at: string;
}

export interface Announcement {
  id: string;
  created_by: string;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
}

export interface Highlight {
  id: string;
  user_id: string;
  url: string;
  title: string | null;
  created_at: string;
}

// ============================================
// COMPUTED / UI TYPES
// ============================================

export interface PlayerStats {
  tournaments_entered: number;
  tournaments_won: number;
  win_rate: number;
  best_placement: number | null;
}

export interface TournamentCardData extends Tournament {
  creator?: User;
  registration_percentage: number;
}

export interface LeaderboardEntry {
  rank: number;
  user: User;
  wins: number;
  tournaments_entered: number;
  win_rate: number;
}

export interface ClanLeaderboardEntry {
  rank: number;
  clan: Clan;
  tournaments_won: number;
  members: number;
}

// ============================================
// BADGE METADATA
// ============================================
export const BADGE_META: Record<BadgeType, { label: string; description: string; icon: string; color: string }> = {
  first_blood:       { label: 'First Blood',       description: 'Won your first tournament',         icon: 'first_blood',       color: '#FF4500' },
  on_a_streak:       { label: 'On A Streak',        description: 'Won 3 tournaments in a row',        icon: 'on_a_streak',       color: '#FF6B00' },
  unstoppable:       { label: 'Unstoppable',        description: 'Won 10 tournaments total',           icon: 'unstoppable',       color: '#FFD700' },
  legend:            { label: 'Legend',             description: 'Reached Legendary rank',            icon: 'legend',            color: '#FFD700' },
  veteran:           { label: 'Veteran',            description: 'Entered 25 tournaments',            icon: 'veteran',           color: '#00D4FF' },
  clan_leader:       { label: 'Clan Leader',        description: 'Lead a clan to victory',            icon: 'clan_leader',       color: '#A855F7' },
  tournament_host:   { label: 'Tournament Host',    description: 'Hosted 5 tournaments',              icon: 'tournament_host',   color: '#00FF87' },
  big_stage:         { label: 'Big Stage',          description: 'Competed in a 100-player BR',       icon: 'big_stage',         color: '#00D4FF' },
  trusted_warrior:   { label: 'Trusted Warrior',    description: 'Maintained 90+ reputation',         icon: 'trusted_warrior',   color: '#00FF87' },
};

// ============================================
// COUNTRY LIST
// ============================================
export const COUNTRIES = [
  { code: 'NG',    name: 'Nigeria',        flag: '' },
  { code: 'GH',    name: 'Ghana',          flag: '' },
  { code: 'KE',    name: 'Kenya',          flag: '' },
  { code: 'ZA',    name: 'South Africa',   flag: '' },
  { code: 'PH',    name: 'Philippines',    flag: '' },
  { code: 'US',    name: 'United States',  flag: '' },
  { code: 'GB',    name: 'United Kingdom', flag: '' },
  { code: 'IN',    name: 'India',          flag: '' },
  { code: 'BR',    name: 'Brazil',         flag: '' },
  { code: 'MX',    name: 'Mexico',         flag: '' },
  { code: 'ID',    name: 'Indonesia',      flag: '' },
  { code: 'TR',    name: 'Turkey',         flag: '' },
  { code: 'DE',    name: 'Germany',        flag: '' },
  { code: 'FR',    name: 'France',         flag: '' },
  { code: 'CA',    name: 'Canada',         flag: '' },
  { code: 'AU',    name: 'Australia',      flag: '' },
  { code: 'SG',    name: 'Singapore',      flag: '' },
  { code: 'AE',    name: 'UAE',            flag: '' },
  { code: 'OTHER', name: 'Other',          flag: '' },
];

export const REGIONS = ['Global', 'Africa', 'Asia', 'Europe', 'Americas', 'Middle East', 'Other'];

export const RANKS: Rank[] = ['Rookie', 'Veteran', 'Elite', 'Pro', 'Master', 'Grandmaster', 'Legendary'];
export const ROLES: PlayerRole[] = ['Fragger', 'Sniper', 'Support', 'Rusher', 'All-rounder'];
