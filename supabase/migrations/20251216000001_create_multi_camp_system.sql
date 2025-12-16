-- Migration: Multi-Camp System
-- Date: 2025-12-16
-- Description: Create tables and schema for supporting multiple camps

-- Create camps table
CREATE TABLE IF NOT EXISTS camps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  season TEXT NOT NULL CHECK (season IN ('winter', 'summer')),
  year INTEGER NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  registration_open BOOLEAN DEFAULT true,
  max_participants INTEGER DEFAULT 96, -- 4 teams × 24 players
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(season, year)
);

-- Create camp_registrations table (links users to camps)
CREATE TABLE IF NOT EXISTS camp_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  camp_id UUID NOT NULL REFERENCES camps(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  grade INTEGER NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  current_team TEXT CHECK (current_team IN ('red', 'blue', 'green', 'yellow')),
  preferred_team TEXT CHECK (preferred_team IN ('red', 'blue', 'green', 'yellow')),
  switches_remaining INTEGER DEFAULT 3,
  participate_in_teams BOOLEAN DEFAULT true,
  role TEXT DEFAULT 'camper' CHECK (role IN ('camper', 'team_leader', 'shop_owner')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, camp_id)
);

-- Create camp_team_switches table (camp-specific team switches)
CREATE TABLE IF NOT EXISTS camp_team_switches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES camp_registrations(id) ON DELETE CASCADE,
  from_team TEXT NOT NULL,
  to_team TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create camp_schedules table (camp-specific schedules)
CREATE TABLE IF NOT EXISTS camp_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camp_id UUID NOT NULL REFERENCES camps(id) ON DELETE CASCADE,
  day INTEGER NOT NULL CHECK (day >= 1 AND day <= 30),
  time_slot TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create camp_gallery table (camp-specific photos)
CREATE TABLE IF NOT EXISTS camp_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camp_id UUID NOT NULL REFERENCES camps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  team TEXT CHECK (team IN ('red', 'blue', 'green', 'yellow')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create camp_scoreboard table (camp-specific scores)
CREATE TABLE IF NOT EXISTS camp_scoreboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camp_id UUID NOT NULL REFERENCES camps(id) ON DELETE CASCADE,
  team TEXT NOT NULL CHECK (team IN ('red', 'blue', 'green', 'yellow')),
  score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(camp_id, team)
);

-- Insert default camps
INSERT INTO camps (name, season, year, start_date, end_date, is_active, registration_open, description)
VALUES
  ('Winter Camp 2026', 'winter', 2026, '2026-01-22T00:00:00Z', '2026-01-26T00:00:00Z', true, true, 'Winter Camp 2026 - A faith-filled winter adventure'),
  ('Summer Camp 2026', 'summer', 2026, '2026-08-20T00:00:00Z', '2026-08-24T00:00:00Z', false, true, 'Summer Camp 2026 - Coming soon!'),
  ('Winter Camp 2027', 'winter', 2027, '2027-01-21T00:00:00Z', '2027-01-25T00:00:00Z', false, false, 'Winter Camp 2027 - Registration opens soon'),
  ('Summer Camp 2027', 'summer', 2027, '2027-08-19T00:00:00Z', '2027-08-23T00:00:00Z', false, false, 'Summer Camp 2027 - Registration opens soon')
ON CONFLICT (season, year) DO NOTHING;

-- Enable RLS
ALTER TABLE camps ENABLE ROW LEVEL SECURITY;
ALTER TABLE camp_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE camp_team_switches ENABLE ROW LEVEL SECURITY;
ALTER TABLE camp_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE camp_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE camp_scoreboard ENABLE ROW LEVEL SECURITY;

-- RLS Policies for camps (everyone can read)
CREATE POLICY "Anyone can view camps"
  ON camps FOR SELECT
  USING (true);

-- RLS Policies for camp_registrations
CREATE POLICY "Users can view their own registrations"
  ON camp_registrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own registrations"
  ON camp_registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own registrations"
  ON camp_registrations FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for camp_schedules (everyone can read)
CREATE POLICY "Anyone can view camp schedules"
  ON camp_schedules FOR SELECT
  USING (true);

-- RLS Policies for camp_gallery
CREATE POLICY "Users can view approved gallery photos"
  ON camp_gallery FOR SELECT
  USING (status = 'approved' OR auth.uid() = user_id);

CREATE POLICY "Users can upload their own photos"
  ON camp_gallery FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own photos"
  ON camp_gallery FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for camp_scoreboard (everyone can read)
CREATE POLICY "Anyone can view camp scoreboard"
  ON camp_scoreboard FOR SELECT
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_camp_registrations_user_id ON camp_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_camp_registrations_camp_id ON camp_registrations(camp_id);
CREATE INDEX IF NOT EXISTS idx_camp_schedules_camp_id ON camp_schedules(camp_id);
CREATE INDEX IF NOT EXISTS idx_camp_gallery_camp_id ON camp_gallery(camp_id);
CREATE INDEX IF NOT EXISTS idx_camp_scoreboard_camp_id ON camp_scoreboard(camp_id);

-- Function to get camps with registration count
CREATE OR REPLACE FUNCTION get_camps_with_stats()
RETURNS TABLE (
  id UUID,
  name TEXT,
  season TEXT,
  year INTEGER,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN,
  registration_open BOOLEAN,
  max_participants INTEGER,
  description TEXT,
  registered_count BIGINT,
  spots_available INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.season,
    c.year,
    c.start_date,
    c.end_date,
    c.is_active,
    c.registration_open,
    c.max_participants,
    c.description,
    COUNT(cr.id) as registered_count,
    (c.max_participants - COUNT(cr.id)::INTEGER) as spots_available
  FROM camps c
  LEFT JOIN camp_registrations cr ON c.id = cr.camp_id
  GROUP BY c.id, c.name, c.season, c.year, c.start_date, c.end_date,
           c.is_active, c.registration_open, c.max_participants, c.description
  ORDER BY c.start_date ASC;
END;
$$ LANGUAGE plpgsql;
