-- Scoreboard system
-- Tables: team_scores (current points), score_events (history)

CREATE TABLE IF NOT EXISTS team_scores (
  team_id text PRIMARY KEY CHECK (team_id IN ('red','blue','green','yellow')),
  points integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS score_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id text NOT NULL CHECK (team_id IN ('red','blue','green','yellow')),
  delta integer NOT NULL,
  reason text,
  admin_id uuid NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_score_events_team_id ON score_events(team_id);
CREATE INDEX IF NOT EXISTS idx_score_events_created_at ON score_events(created_at DESC);

-- Enable RLS
ALTER TABLE team_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_events ENABLE ROW LEVEL SECURITY;

-- Policies: all authenticated can read
DROP POLICY IF EXISTS "Users can read team scores" ON team_scores;
CREATE POLICY "Users can read team scores"
ON team_scores FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can read score events" ON score_events;
CREATE POLICY "Users can read score events"
ON score_events FOR SELECT TO authenticated USING (true);

-- Admins can manage
DROP POLICY IF EXISTS "Admins manage team scores" ON team_scores;
CREATE POLICY "Admins manage team scores"
ON team_scores FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
);

DROP POLICY IF EXISTS "Admins manage score events" ON score_events;
CREATE POLICY "Admins manage score events"
ON score_events FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
);

-- Function: adjust team score with admin check
CREATE OR REPLACE FUNCTION adjust_team_score(team_id_param text, delta_param integer, reason_param text DEFAULT NULL)
RETURNS integer AS $$
DECLARE
  new_points integer;
BEGIN
  -- Admin guard
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Upsert score
  INSERT INTO team_scores(team_id, points)
  VALUES (team_id_param, GREATEST(0, delta_param))
  ON CONFLICT (team_id)
  DO UPDATE SET points = GREATEST(0, team_scores.points + delta_param), updated_at = now()
  RETURNING points INTO new_points;

  -- Log event
  INSERT INTO score_events(team_id, delta, reason, admin_id)
  VALUES (team_id_param, delta_param, reason_param, auth.uid());

  RETURN new_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
