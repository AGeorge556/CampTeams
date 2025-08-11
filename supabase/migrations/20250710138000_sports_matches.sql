-- Migration: Create sports_matches table for tournament scheduling and scoring
CREATE TABLE IF NOT EXISTS public.sports_matches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sport_id text NOT NULL,
    team_a text NOT NULL,
    team_b text NOT NULL,
    scheduled_time timestamptz,
    score_a integer,
    score_b integer,
    status text NOT NULL DEFAULT 'scheduled',
    final boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for quick lookup by sport
CREATE INDEX IF NOT EXISTS idx_sports_matches_sport_id ON public.sports_matches (sport_id);

-- Index for quick lookup by status
CREATE INDEX IF NOT EXISTS idx_sports_matches_status ON public.sports_matches (status);

-- Trigger to update updated_at on row update
CREATE OR REPLACE FUNCTION update_sports_matches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_sports_matches_updated_at ON public.sports_matches;
CREATE TRIGGER set_sports_matches_updated_at
BEFORE UPDATE ON public.sports_matches
FOR EACH ROW EXECUTE FUNCTION update_sports_matches_updated_at();
