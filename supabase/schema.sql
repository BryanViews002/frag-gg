-- ==========================================
-- FRAG.GG SUPABASE SCHEMA
-- ==========================================

-- Enable the "pgcrypto" extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- ENUMS
-- ==========================================
CREATE TYPE rank_enum AS ENUM ('Rookie', 'Veteran', 'Elite', 'Pro', 'Master', 'Grandmaster', 'Legendary');
CREATE TYPE game_mode_enum AS ENUM ('mp', 'br');
CREATE TYPE mp_format_enum AS ENUM ('1v1', '2v2', '3v3', '4v4', '5v5');
CREATE TYPE br_format_enum AS ENUM ('solo', 'duo', 'squad');
CREATE TYPE tournament_status_enum AS ENUM ('upcoming', 'open', 'live', 'completed');
CREATE TYPE match_mode_enum AS ENUM ('hardpoint', 'snd', 'control', 'battle_royale');
CREATE TYPE match_format_enum AS ENUM ('single', 'bo3', 'bo5');
CREATE TYPE player_role_enum AS ENUM ('Fragger', 'Sniper', 'Support', 'Rusher', 'All-rounder');
CREATE TYPE preferred_mode_enum AS ENUM ('mp', 'br', 'both');
CREATE TYPE dispute_status_enum AS ENUM ('pending', 'reviewing', 'resolved');
CREATE TYPE tournament_structure_enum AS ENUM ('head_to_head', 'bracket');
CREATE TYPE bracket_type_enum AS ENUM ('single_elim', 'double_elim');
CREATE TYPE draw_type_enum AS ENUM ('random', 'seeded');
CREATE TYPE draw_status_enum AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE mp_match_type_enum AS ENUM ('standard', 'pure_1v1', 'representative', 'battle');
CREATE TYPE registration_type_enum AS ENUM ('self', 'auto');
CREATE TYPE notification_type_enum AS ENUM (
  'tournament_registered', 'match_starting', 'result_submitted', 
  'result_confirmed', 'result_disputed', 'dispute_resolved', 
  'clan_invite', 'clan_accepted', 'clan_rejected', 
  'announcement', 'badge_earned', 'eliminated', 'platform_announcement'
);
CREATE TYPE badge_type_enum AS ENUM (
  'first_blood', 'on_a_streak', 'unstoppable', 'legend', 
  'veteran', 'clan_leader', 'tournament_host', 'big_stage', 'trusted_warrior'
);

-- ==========================================
-- TABLES
-- ==========================================

-- USERS TABLE
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  banner_url TEXT,
  country TEXT,
  ingame_name TEXT NOT NULL,
  ingame_uid TEXT NOT NULL,
  rank rank_enum,
  role player_role_enum,
  preferred_mode preferred_mode_enum,
  bio TEXT,
  reputation_score INTEGER DEFAULT 100,
  clan_id UUID, -- FK added later
  is_admin BOOLEAN DEFAULT FALSE,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  youtube_url TEXT,
  tiktok_url TEXT,
  twitter_url TEXT,
  discord_username TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CLANS TABLE
CREATE TABLE clans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tag TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  banner_url TEXT,
  country TEXT,
  description TEXT,
  leader_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  preferred_mode preferred_mode_enum,
  req_rank rank_enum,
  recruitment_open BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ADD FK TO USERS
ALTER TABLE users ADD CONSTRAINT fk_clan FOREIGN KEY (clan_id) REFERENCES clans(id) ON DELETE SET NULL;

-- CLAN MEMBERS TABLE
CREATE TABLE clan_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- 'leader', 'co-leader', 'member'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clan_id, user_id)
);

-- TOURNAMENTS TABLE
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  banner_url TEXT,
  description TEXT,
  creator_id UUID NOT NULL REFERENCES users(id),
  mode game_mode_enum NOT NULL,
  mp_format mp_format_enum,
  br_format br_format_enum,
  match_mode match_mode_enum NOT NULL,
  match_format match_format_enum NOT NULL,
  tournament_structure tournament_structure_enum,
  bracket_type bracket_type_enum,
  draw_type draw_type_enum,
  draw_status draw_status_enum DEFAULT 'pending',
  draw_completed_at TIMESTAMPTZ,
  mp_match_type mp_match_type_enum,
  registration_type registration_type_enum DEFAULT 'self',
  max_teams INTEGER,
  verification_window INTEGER DEFAULT 60,
  max_entries INTEGER NOT NULL,
  entry_size INTEGER NOT NULL,
  max_players INTEGER NOT NULL,
  current_entries INTEGER DEFAULT 0,
  registration_opens TIMESTAMPTZ NOT NULL,
  registration_closes TIMESTAMPTZ NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  match_time_limit INTEGER DEFAULT 30,
  prize_1st TEXT,
  prize_2nd TEXT,
  prize_3rd TEXT,
  prize_notes TEXT,
  has_prize BOOLEAN DEFAULT FALSE,
  rules TEXT,
  status tournament_status_enum DEFAULT 'upcoming',
  organizer_contact TEXT,
  region TEXT DEFAULT 'Global',
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MP REGISTRATIONS
CREATE TABLE mp_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  side CHAR(1) CHECK (side IN ('a', 'b')),
  team_name TEXT,
  captain_id UUID NOT NULL REFERENCES users(id),
  player2_id UUID REFERENCES users(id),
  player3_id UUID REFERENCES users(id),
  player4_id UUID REFERENCES users(id),
  player5_id UUID REFERENCES users(id),
  registered_at TIMESTAMPTZ DEFAULT NOW()
);

-- BR REGISTRATIONS
CREATE TABLE br_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  entry_name TEXT NOT NULL,
  captain_id UUID NOT NULL REFERENCES users(id),
  player2_id UUID REFERENCES users(id),
  player3_id UUID REFERENCES users(id),
  player4_id UUID REFERENCES users(id),
  placement INTEGER,
  is_eliminated BOOLEAN DEFAULT FALSE,
  registered_at TIMESTAMPTZ DEFAULT NOW()
);

-- LFG POSTS
CREATE TABLE lfg_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  game_mode game_mode_enum NOT NULL,
  req_rank TEXT,
  req_role TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- COMMUNITY POSTS
CREATE TABLE community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  embed_url TEXT,
  category TEXT DEFAULT 'General',
  is_pinned BOOLEAN DEFAULT FALSE,
  is_announcement BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- COMMENTS
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- POST REACTIONS
CREATE TABLE post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction_type TEXT CHECK (reaction_type IN ('fire', 'skull', 'eyes')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type_enum NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BADGES
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_type badge_type_enum NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

-- ==========================================
-- STORAGE BUCKETS
-- ==========================================

-- Note: You might need to create these manually in the Supabase UI if the script fails here,
-- but typically this syntax works if you have superuser rights or via the API.
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true) ON CONFLICT DO NOTHING;

-- Storage Policies
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id IN ('avatars', 'banners'));
CREATE POLICY "Auth Upload" ON storage.objects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth Update" ON storage.objects FOR UPDATE USING (auth.role() = 'authenticated');

-- ==========================================
-- FUNCTIONS & TRIGGERS
-- ==========================================

-- Function to handle timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_clans_updated_at BEFORE UPDATE ON clans FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON tournaments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- RPC for incrementing tournament entries safely
CREATE OR REPLACE FUNCTION increment_tournament_entries(t_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE tournaments
  SET current_entries = current_entries + 1
  WHERE id = t_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clans ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE br_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lfg_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

-- Users RLS
CREATE POLICY "Public profiles are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Clans RLS
CREATE POLICY "Clans are viewable by everyone" ON clans FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create clans" ON clans FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Clan leaders can update clan" ON clans FOR UPDATE USING (auth.uid() = leader_id);

-- Clan Members RLS
CREATE POLICY "Clan members are viewable by everyone" ON clan_members FOR SELECT USING (true);
CREATE POLICY "Authenticated users can join clans" ON clan_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Clan members can leave" ON clan_members FOR DELETE USING (auth.uid() = user_id);

-- Tournaments RLS
CREATE POLICY "Tournaments are viewable by everyone" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create tournaments" ON tournaments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Creators can update tournaments" ON tournaments FOR UPDATE USING (auth.uid() = creator_id);

-- Registrations RLS
CREATE POLICY "MP registrations are viewable by everyone" ON mp_registrations FOR SELECT USING (true);
CREATE POLICY "Authenticated users can register for MP" ON mp_registrations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "BR registrations are viewable by everyone" ON br_registrations FOR SELECT USING (true);
CREATE POLICY "Authenticated users can register for BR" ON br_registrations FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- LFG Posts RLS
CREATE POLICY "LFG posts are viewable by everyone" ON lfg_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create LFG posts" ON lfg_posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authors can update/delete LFG posts" ON lfg_posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete LFG posts" ON lfg_posts FOR DELETE USING (auth.uid() = author_id);

-- Notifications RLS
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true); -- Usually restricted to server-side only in production, leaving open for simplicity in demo
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Badges RLS
CREATE POLICY "Badges are viewable by everyone" ON badges FOR SELECT USING (true);
-- Badges are only awarded via Edge Functions / Service Role, so no insert/update policy needed for authenticated users.

-- Community Posts RLS
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Community posts are viewable by everyone" ON community_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create community posts" ON community_posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authors can update their own posts" ON community_posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete their own posts" ON community_posts FOR DELETE USING (auth.uid() = author_id);

-- Comments RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can comment" ON comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authors can delete their comments" ON comments FOR DELETE USING (auth.uid() = author_id);

-- Post Reactions RLS
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reactions are viewable by everyone" ON post_reactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can react" ON post_reactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can remove their own reactions" ON post_reactions FOR DELETE USING (auth.uid() = user_id);
