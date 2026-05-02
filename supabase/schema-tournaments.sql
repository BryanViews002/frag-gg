-- ==========================================
-- FRAG.GG BRACKET & TOURNAMENT EXTENSIONS
-- ==========================================

CREATE TYPE match_status_enum AS ENUM ('pending', 'confirmed', 'disputed');

-- BRACKETS TABLE
CREATE TABLE IF NOT EXISTS brackets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  slot_a_id UUID REFERENCES users(id), -- Or team ID depending on registration
  slot_b_id UUID REFERENCES users(id), -- Null = bye
  score_a INTEGER,
  score_b INTEGER,
  winner_id UUID REFERENCES users(id),
  is_bye BOOLEAN DEFAULT FALSE,
  status match_status_enum DEFAULT 'pending',
  submitted_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEEDS TABLE
CREATE TABLE IF NOT EXISTS seeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL, -- Generic registration ID to support MP/BR
  seed_number INTEGER NOT NULL,
  pot_number INTEGER NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW()
);

-- TOURNAMENT MODS TABLE
CREATE TABLE IF NOT EXISTS tournament_mods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW()
);

-- DISPUTES TABLE (Extended)
CREATE TABLE IF NOT EXISTS match_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES brackets(id) ON DELETE CASCADE,
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  raised_by UUID NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  status dispute_status_enum DEFAULT 'pending',
  resolved_by UUID REFERENCES users(id),
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE RLS
ALTER TABLE brackets ENABLE ROW LEVEL SECURITY;
ALTER TABLE seeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_mods ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_disputes ENABLE ROW LEVEL SECURITY;

-- BRACKETS RLS
CREATE POLICY "Brackets are viewable by everyone" ON brackets FOR SELECT USING (true);
CREATE POLICY "Only mods/creators can update brackets" ON brackets FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM tournaments t WHERE t.id = brackets.tournament_id AND t.creator_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM tournament_mods m WHERE m.tournament_id = brackets.tournament_id AND m.user_id = auth.uid()
  )
);

-- SEEDS RLS
CREATE POLICY "Seeds are viewable by everyone" ON seeds FOR SELECT USING (true);

-- TOURNAMENT MODS RLS
CREATE POLICY "Tournament mods are viewable by everyone" ON tournament_mods FOR SELECT USING (true);
CREATE POLICY "Creators can assign mods" ON tournament_mods FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM tournaments t WHERE t.id = tournament_id AND t.creator_id = auth.uid()
  )
);

-- DISPUTES RLS
CREATE POLICY "Disputes viewable by everyone" ON match_disputes FOR SELECT USING (true);
CREATE POLICY "Participants can create disputes" ON match_disputes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
