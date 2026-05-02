-- ==========================================
-- FRAG.GG SCHEMA ADDENDUM
-- Run this if you already executed schema.sql
-- Adds community tables that were missing
-- ==========================================

-- COMMUNITY POSTS
CREATE TABLE IF NOT EXISTS community_posts (
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
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- POST REACTIONS
CREATE TABLE IF NOT EXISTS post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction_type TEXT CHECK (reaction_type IN ('fire', 'skull', 'eyes')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;

-- Community Posts RLS
CREATE POLICY "Community posts are viewable by everyone"
  ON community_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create community posts"
  ON community_posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authors can update their own posts"
  ON community_posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete their own posts"
  ON community_posts FOR DELETE USING (auth.uid() = author_id);

-- Comments RLS
CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can comment"
  ON comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authors can delete their comments"
  ON comments FOR DELETE USING (auth.uid() = author_id);

-- Post Reactions RLS
CREATE POLICY "Reactions are viewable by everyone"
  ON post_reactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can react"
  ON post_reactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can remove their own reactions"
  ON post_reactions FOR DELETE USING (auth.uid() = user_id);
