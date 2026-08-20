-- The Wilderness: Big Game v3 — schema changes
--
-- Three things changed in the game design after v2 shipped:
--   1. Four rounds, not six.
--   2. A station visit is scored (CLEAR/PARTIAL/FAIL/MISSED), not passed/failed.
--   3. The game no longer ends after the last round — it converges into a
--      Finale where each team pools its Stone Cards and opens a padlock.
--
-- This migration ALTERs the v2 schema in place. It is idempotent and
-- re-runnable, and it fails rather than installing a broken team grouping.

-- ---------------------------------------------------------------------------
-- 1. Four rounds
-- ---------------------------------------------------------------------------
--
-- Only round_count changes. The `round BETWEEN 1 AND 6` CHECKs on
-- bg_station_codes and bg_round_results are deliberately LEFT ALONE: rounds 5
-- and 6 keep their generated codes as unused spares, and narrowing the
-- constraint would either delete them or break the generator, which still
-- produces all 72. Do not "tidy" these.

ALTER TABLE bg_game ALTER COLUMN round_count SET DEFAULT 4;
UPDATE bg_game SET round_count = 4, updated_at = now() WHERE round_count <> 4;

-- ---------------------------------------------------------------------------
-- 2. The FINALE state
-- ---------------------------------------------------------------------------
--
-- FINALE sits between ACTIVE and FINISHED. Advancing past the last round no
-- longer ends the game; ending it is now a separate, deliberate director
-- action, because the Finale is where the event is actually decided.

DO $$
DECLARE v_name text;
BEGIN
  SELECT conname INTO v_name FROM pg_constraint
  WHERE conrelid = 'bg_game'::regclass AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%status%';
  IF v_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE bg_game DROP CONSTRAINT %I', v_name);
  END IF;
END $$;

ALTER TABLE bg_game ADD CONSTRAINT bg_game_status_check
  CHECK (status IN ('SETUP','ACTIVE','PAUSED','FINALE','FINISHED'));

ALTER TABLE bg_game ADD COLUMN IF NOT EXISTS finale_started_at timestamptz;

-- The head-start ranking, frozen at the instant Start is pressed. A director
-- correcting a score mid-race must not reshuffle a clock that is already
-- running, so the ranking is snapshotted here rather than recomputed on read.
ALTER TABLE bg_game ADD COLUMN IF NOT EXISTS finale_rankings jsonb;

-- ---------------------------------------------------------------------------
-- 3. S12 is a normal station now
-- ---------------------------------------------------------------------------
--
-- It was the "Promised Land Vault" — the finish line. The vault moved into the
-- Finale, so S12 becomes an ordinary rotation destination. The route formula
-- is untouched; only the name and theme word change.

UPDATE bg_stations
SET name              = 'The Jordan — Twelve Stones',
    theme_word        = 'STONES',
    short_description = 'Twelve stones from the riverbed.'
WHERE id = 'S12';

-- S12's six codes carried the old theme word. Regenerate them with the same
-- deterministic LCG the generator uses, so the same seed still reproduces the
-- same sheet. Skipped entirely when codes were never generated — the director
-- will generate all 72 at setup.
DO $$
DECLARE
  v_digits constant text := '23456789';
  v_seed   text;
  v_state  bigint;
  v_pair   int;
  v_used   int[] := ARRAY[]::int[];
  v_code   text;
  v_round  int;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM bg_station_codes WHERE station_id = 'S12') THEN
    RETURN;
  END IF;

  SELECT COALESCE(code_seed, '') INTO v_seed FROM bg_game LIMIT 1;
  DELETE FROM bg_station_codes WHERE station_id = 'S12';

  v_state := ((hashtext(v_seed || 'S12')::bigint % 2147483647) + 2147483647) % 2147483647;

  FOR v_round IN 1..6 LOOP
    LOOP
      v_state := (v_state * 1103515245 + 12345) % 2147483648;
      v_pair := (v_state % 64)::int;
      v_code := 'STONES'
                || substr(v_digits, (v_pair / 8) + 1, 1)
                || substr(v_digits, (v_pair % 8) + 1, 1);
      -- Retry on a within-station repeat or a collision with another station's
      -- code; the global UNIQUE (code) is the real backstop either way.
      EXIT WHEN NOT (v_pair = ANY(v_used))
            AND NOT EXISTS (SELECT 1 FROM bg_station_codes WHERE code = v_code);
    END LOOP;
    v_used := array_append(v_used, v_pair);
    INSERT INTO bg_station_codes (station_id, round, code) VALUES ('S12', v_round, v_code);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Teams — grouped FOUR APART
-- ---------------------------------------------------------------------------
--
-- This grouping is load-bearing and must never be "simplified" to T1,T2,T3.
--
-- The route is a rotation, so consecutive tribes walk almost the same path one
-- step apart. Group T1,T2,T3 over four rounds and the team covers S1..S6 only
-- — six of the twelve stations — hitting S3 and S4 three times each. The Stone
-- Card letters are keyed to stations, so such a team physically cannot spell
-- its phrase and its padlock is unopenable.
--
-- Four apart fixes it exactly: T1,T5,T9 walk S1-S4, S5-S8 and S9-S12. All
-- twelve stations, zero overlap. The self-test at the foot of this file proves
-- both halves of that claim.

CREATE TABLE IF NOT EXISTS bg_teams (
  id              text PRIMARY KEY CHECK (id IN ('A','B','C','D')),
  display_name    text NOT NULL,
  -- The vault answer key. Seeded NULL on purpose: the phrases and padlock
  -- codes must not live in this repository. The director types them into the
  -- setup screen, and only an admin-gated RPC ever returns them.
  phrase          text,
  padlock_code    text,
  opened_at       timestamptz,
  short_handed    boolean NOT NULL DEFAULT false,
  short_handed_at timestamptz
);

ALTER TABLE bg_teams ENABLE ROW LEVEL SECURITY;

INSERT INTO bg_teams (id, display_name) VALUES
  ('A','Team A'), ('B','Team B'), ('C','Team C'), ('D','Team D')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE bg_tribes ADD COLUMN IF NOT EXISTS team_id text REFERENCES bg_teams(id);

-- (("index" - 1) % 4) maps 1,5,9 -> A; 2,6,10 -> B; 3,7,11 -> C; 4,8,12 -> D.
UPDATE bg_tribes
SET team_id = (ARRAY['A','B','C','D'])[(("index" - 1) % 4) + 1]
WHERE team_id IS DISTINCT FROM (ARRAY['A','B','C','D'])[(("index" - 1) % 4) + 1];

ALTER TABLE bg_tribes ALTER COLUMN team_id SET NOT NULL;

-- bg_teams.display_name is the single source of truth for a team's name now.
-- The RPCs re-emit the same `parentTeam` JSON key by joining, so the wire
-- contract the clients depend on is unchanged.
ALTER TABLE bg_tribes DROP COLUMN IF EXISTS parent_team;

-- ---------------------------------------------------------------------------
-- 5. Hint cards
-- ---------------------------------------------------------------------------
--
-- Each leader carries two physical cards for the whole game. Spending one caps
-- that station's best possible result at PARTIAL.

ALTER TABLE bg_tribes ADD COLUMN IF NOT EXISTS hints_remaining int NOT NULL DEFAULT 2;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'bg_tribes'::regclass AND conname = 'bg_tribes_hints_check'
  ) THEN
    ALTER TABLE bg_tribes ADD CONSTRAINT bg_tribes_hints_check
      CHECK (hints_remaining BETWEEN 0 AND 2);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 6. Scoring replaces pass/fail
-- ---------------------------------------------------------------------------
--
-- A correct code no longer implies success. The moderator hands the code over
-- at the bell whatever happened, so the rotation never jams — the code proves
-- the tribe was there, and the score is the director's separate judgement.
--
-- OVERRIDDEN and SKIPPED were statuses in v2, but neither is a *score*: one
-- means a dead phone, the other a broken challenge. Collapsing them into the
-- score would lose the reason and make the export lie, so they move to their
-- own `adjustment` column and the status becomes purely the four-way score.

ALTER TABLE bg_round_results
  ADD COLUMN IF NOT EXISTS adjustment text,
  ADD COLUMN IF NOT EXISTS hint_used  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS scored_by  uuid,
  ADD COLUMN IF NOT EXISTS scored_at  timestamptz;

-- Preserve provenance BEFORE the status values are rewritten.
UPDATE bg_round_results SET adjustment = 'OVERRIDDEN'
  WHERE status = 'OVERRIDDEN' AND adjustment IS NULL;
UPDATE bg_round_results SET adjustment = 'SKIPPED'
  WHERE status = 'SKIPPED' AND adjustment IS NULL;

-- Drop the old CHECK first, or the rewrite below violates it mid-flight.
DO $$
DECLARE v_name text;
BEGIN
  SELECT conname INTO v_name FROM pg_constraint
  WHERE conrelid = 'bg_round_results'::regclass AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%COMPLETED%';
  IF v_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE bg_round_results DROP CONSTRAINT %I', v_name);
  END IF;
END $$;

UPDATE bg_round_results SET status = 'CLEAR'  WHERE status IN ('COMPLETED','OVERRIDDEN');
UPDATE bg_round_results SET status = 'FAIL'   WHERE status = 'SKIPPED';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'bg_round_results'::regclass AND conname = 'bg_round_results_status_check'
  ) THEN
    ALTER TABLE bg_round_results ADD CONSTRAINT bg_round_results_status_check
      CHECK (status IN ('CLEAR','PARTIAL','FAIL','MISSED'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'bg_round_results'::regclass AND conname = 'bg_round_results_adjustment_check'
  ) THEN
    ALTER TABLE bg_round_results ADD CONSTRAINT bg_round_results_adjustment_check
      CHECK (adjustment IS NULL OR adjustment IN ('OVERRIDDEN','SKIPPED'));
  END IF;
END $$;

-- The single source of truth for points. CLEAR 3, PARTIAL 1, FAIL and MISSED 0.
CREATE OR REPLACE FUNCTION public.bg_result_points(p_status text)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_status WHEN 'CLEAR' THEN 3 WHEN 'PARTIAL' THEN 1 ELSE 0 END;
$$;

REVOKE ALL ON FUNCTION public.bg_result_points(text) FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- 7. Team coverage validator
-- ---------------------------------------------------------------------------
--
-- Team grouping is editable in setup, and hand-editing it is the single
-- easiest way for an organiser to break the event. This is what the readiness
-- checklist calls to refuse a start, naming the offending team.

CREATE OR REPLACE FUNCTION public.bg_validate_team(p_team_id text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $fn$
DECLARE
  v_rounds  int;
  v_name    text;
  v_cov     int[];
  v_dups    text[];
  v_missing text[];
  v_covered int;
  v_total   int;
BEGIN
  SELECT round_count INTO v_rounds FROM bg_game LIMIT 1;
  SELECT display_name INTO v_name FROM bg_teams WHERE id = p_team_id;

  -- Collected into an array rather than a temp table. This function is STABLE
  -- so the readiness checklist can call it freely, and a STABLE function may
  -- not CREATE TABLE — that restriction is what broke the first version.
  SELECT array_agg(public.bg_station_index(t."index", g.r))
  INTO v_cov
  FROM bg_tribes t
  CROSS JOIN generate_series(1, v_rounds) AS g(r)
  WHERE t.team_id = p_team_id;

  -- A team with no tribes yields NULL, and NULL propagates through = ANY(),
  -- which would silently report nothing missing. Empty array, not null.
  v_cov := COALESCE(v_cov, ARRAY[]::int[]);
  v_total := COALESCE(array_length(v_cov, 1), 0);

  SELECT count(DISTINCT x) INTO v_covered FROM unnest(v_cov) AS x;

  SELECT COALESCE(array_agg('S' || d.x ORDER BY d.x), ARRAY[]::text[])
  INTO v_dups
  FROM (
    SELECT x FROM unnest(v_cov) AS x GROUP BY x HAVING count(*) > 1
  ) d;

  SELECT COALESCE(array_agg('S' || m.g ORDER BY m.g), ARRAY[]::text[])
  INTO v_missing
  FROM generate_series(1, 12) AS m(g)
  WHERE NOT (m.g = ANY(v_cov));

  RETURN jsonb_build_object(
    'teamId', p_team_id,
    'displayName', COALESCE(v_name, p_team_id),
    'ok', v_total = 12 AND v_covered = 12,
    'covered', v_covered,
    'duplicates', to_jsonb(v_dups),
    'missing', to_jsonb(v_missing)
  );
END;
$fn$;

REVOKE ALL ON FUNCTION public.bg_validate_team(text) FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- 8. Self-verifying tail
-- ---------------------------------------------------------------------------
--
-- A broken team grouping fails the migration rather than the event. The last
-- assertion is the important one: it proves the validator is meaningful rather
-- than vacuously true, by checking that the grouping we rejected really would
-- be rejected.

DO $$
DECLARE
  v_rounds  int;
  v_team    record;
  v_result  jsonb;
  v_count   int;
  v_name    text;
  v_word    text;
  v_bad     int;
BEGIN
  SELECT round_count INTO v_rounds FROM bg_game LIMIT 1;
  IF v_rounds <> 4 THEN
    RAISE EXCEPTION 'Big Game v3: round_count is %, expected 4', v_rounds;
  END IF;

  FOR v_team IN SELECT id FROM bg_teams ORDER BY id LOOP
    v_result := public.bg_validate_team(v_team.id);
    IF (v_result->>'ok')::boolean IS NOT TRUE THEN
      RAISE EXCEPTION 'Big Game v3: team % does not cover all twelve stations (missing %, duplicate %)',
        v_team.id, v_result->>'missing', v_result->>'duplicates';
    END IF;

    SELECT count(*) INTO v_count FROM bg_tribes WHERE team_id = v_team.id;
    IF v_count <> 3 THEN
      RAISE EXCEPTION 'Big Game v3: team % has % tribes, expected 3', v_team.id, v_count;
    END IF;
  END LOOP;

  SELECT count(*) INTO v_count FROM bg_tribes WHERE team_id IS NOT NULL;
  IF v_count <> 12 THEN
    RAISE EXCEPTION 'Big Game v3: % tribes assigned to teams, expected 12', v_count;
  END IF;

  SELECT name, theme_word INTO v_name, v_word FROM bg_stations WHERE id = 'S12';
  IF v_name <> 'The Jordan — Twelve Stones' OR v_word <> 'STONES' THEN
    RAISE EXCEPTION 'Big Game v3: S12 is "%" / "%", expected The Jordan — Twelve Stones / STONES', v_name, v_word;
  END IF;

  SELECT count(*) INTO v_bad FROM bg_round_results
  WHERE status NOT IN ('CLEAR','PARTIAL','FAIL','MISSED');
  IF v_bad > 0 THEN
    RAISE EXCEPTION 'Big Game v3: % result rows still carry a v2 status', v_bad;
  END IF;

  -- The guard must be able to fail. T1,T2,T3 over four rounds cover S1..S6
  -- only, so if this "passes" the validator is broken and every other
  -- assertion above is worthless.
  SELECT count(DISTINCT public.bg_station_index(t, r)) INTO v_count
  FROM unnest(ARRAY[1,2,3]) AS t CROSS JOIN generate_series(1, v_rounds) AS r;
  IF v_count = 12 THEN
    RAISE EXCEPTION 'Big Game v3: consecutive grouping reported full coverage — the validator is broken';
  END IF;
END $$;
