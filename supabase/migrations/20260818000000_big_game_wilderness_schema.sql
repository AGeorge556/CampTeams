-- The Wilderness: Big Game — schema layer
--
-- A one-off live event. Twelve tribes rotate through twelve stations across six
-- rounds: in round r, tribe t stands at station ((t-1)+(r-1)) mod 12 + 1. That
-- rotation is the whole design. It guarantees exactly one tribe per station per
-- round, which is why the route is COMPUTED here and never stored as 72 rows —
-- a stored copy can disagree with the rule, and 150 campers already outdoors is
-- not a situation you can roll back.
--
-- Three rules govern every object across these three migrations:
--   1. Rounds are global and advanced only by the director. A correct answer
--      marks a tribe's round complete; it never moves the tribe.
--   2. Answer codes are unique per (station, round) — 72 of them, not 12. The
--      tribe at S3 now is the tribe that was at S2 last round, so one fixed
--      word per station would let tribes shout the answer forward.
--   3. The server is the only authority. Codes never reach a leader client.
--
-- This file: tables, RLS, seeds, the route engine, and the shared helpers that
-- the leader and admin migrations depend on.

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------

-- Singleton. The `singleton boolean UNIQUE CHECK (singleton)` idiom means a
-- second insert collides on the unique index rather than quietly creating a
-- second, divergent game state.
CREATE TABLE IF NOT EXISTS bg_game (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton         boolean NOT NULL DEFAULT true UNIQUE CHECK (singleton),
  status            text NOT NULL DEFAULT 'SETUP'
                      CHECK (status IN ('SETUP','ACTIVE','PAUSED','FINISHED')),
  current_round     int NOT NULL DEFAULT 0 CHECK (current_round BETWEEN 0 AND 6),
  round_count       int NOT NULL DEFAULT 6,
  reveal_next_early boolean NOT NULL DEFAULT false,
  code_seed         text,
  started_at        timestamptz,
  finished_at       timestamptz,
  round_started_at  timestamptz,
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- "index" is quoted everywhere below. It is not reserved in Postgres today, but
-- it reads as a keyword and an unquoted reference is exactly the kind of thing
-- that breaks on a version bump the week of the event.
CREATE TABLE IF NOT EXISTS bg_tribes (
  id           text PRIMARY KEY,
  "index"      int NOT NULL UNIQUE CHECK ("index" BETWEEN 1 AND 12),
  display_name text NOT NULL,
  parent_team  text NOT NULL,
  join_code    text NOT NULL UNIQUE,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- location defaults to the empty string and is NEVER seeded with filler. An
-- unset location is what blocks the game from starting; a placeholder such as
-- 'Main Hall' would satisfy the readiness check and send a tribe nowhere.
CREATE TABLE IF NOT EXISTS bg_stations (
  id                text PRIMARY KEY,
  "index"           int NOT NULL UNIQUE CHECK ("index" BETWEEN 1 AND 12),
  name              text NOT NULL,
  theme_word        text NOT NULL,
  location          text NOT NULL DEFAULT '',
  short_description text,
  instructions      text,
  active            boolean NOT NULL DEFAULT true
);

-- 72 rows: one code per (station, round). UNIQUE (code) is the real guarantee
-- that no two of the 72 collide, and it holds even after an organizer
-- hand-edits the grid to match cards they wrote themselves.
CREATE TABLE IF NOT EXISTS bg_station_codes (
  station_id text NOT NULL REFERENCES bg_stations(id) ON DELETE CASCADE,
  round      int NOT NULL CHECK (round BETWEEN 1 AND 6),
  code       text NOT NULL,
  PRIMARY KEY (station_id, round),
  UNIQUE (code)
);

-- UNIQUE (tribe_id, round) is the concurrency backstop, not bookkeeping. A
-- leader phone dies and a co-leader takes over; both may submit the same
-- correct code within milliseconds. This constraint is what makes "exactly one
-- record, and both clients see success" true without any locking.
CREATE TABLE IF NOT EXISTS bg_round_results (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tribe_id        text NOT NULL REFERENCES bg_tribes(id) ON DELETE CASCADE,
  round           int NOT NULL CHECK (round BETWEEN 1 AND 6),
  station_id      text NOT NULL,
  status          text NOT NULL
                    CHECK (status IN ('COMPLETED','MISSED','OVERRIDDEN','SKIPPED')),
  submitted_code  text,
  completed_at    timestamptz,
  overridden_by   uuid,
  idempotency_key text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tribe_id, round)
);

-- Multiple live sessions per tribe are a feature, not a leak. Joining never
-- invalidates the tribe's other sessions.
CREATE TABLE IF NOT EXISTS bg_sessions (
  token        text PRIMARY KEY,
  tribe_id     text NOT NULL REFERENCES bg_tribes(id) ON DELETE CASCADE,
  device_id    text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL DEFAULT now() + interval '30 days'
);

CREATE TABLE IF NOT EXISTS bg_attempts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tribe_id       text,
  round          int,
  submitted_code text,
  correct        boolean,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Deliberately does not store the attempted code. A failed-join log full of
-- near-miss join codes is a list of guesses at real credentials.
CREATE TABLE IF NOT EXISTS bg_join_attempts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id  text,
  succeeded  boolean,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bg_audit (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor       uuid,
  actor_label text,
  action      text NOT NULL,
  detail      jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bg_attempts_tribe ON bg_attempts(tribe_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bg_join_attempts_device ON bg_join_attempts(device_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bg_round_results_round ON bg_round_results(round);
CREATE INDEX IF NOT EXISTS idx_bg_sessions_tribe ON bg_sessions(tribe_id);
CREATE INDEX IF NOT EXISTS idx_bg_audit_created ON bg_audit(created_at DESC);

-- ---------------------------------------------------------------------------
-- 2. RLS: enabled everywhere, with ZERO policies. This is intentional.
-- ---------------------------------------------------------------------------
--
-- With RLS enabled and no policy present, PostgREST can neither read nor write
-- these tables — not for anon, not for a logged-in camper, not for an admin's
-- JWT. Every access path goes through a SECURITY DEFINER function that decides
-- what the caller is allowed to see.
--
-- DO NOT "fix" the missing policies. A SELECT policy on bg_station_codes would
-- put all 72 answer codes one API call away from any camper holding the anon
-- key — which is shipped in the JavaScript bundle. The absence of policies IS
-- the security boundary here.

ALTER TABLE bg_game          ENABLE ROW LEVEL SECURITY;
ALTER TABLE bg_tribes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE bg_stations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE bg_station_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bg_round_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE bg_sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE bg_attempts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE bg_join_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bg_audit         ENABLE ROW LEVEL SECURITY;

-- Note the absence of any ALTER PUBLICATION supabase_realtime here. The leader
-- client polls every 7 seconds; publishing bg_station_codes to realtime would
-- broadcast the answer key to every subscriber.

-- ---------------------------------------------------------------------------
-- 3. Route engine
-- ---------------------------------------------------------------------------
--
-- The doubled modulo is not defensive noise. The inverse genuinely goes
-- negative at the wrap boundaries — station 1 in round 6 must resolve to tribe
-- 8, and a plain % would return 0 or less, producing a station that does not
-- exist and a moderator card naming a tribe that never arrives.

CREATE OR REPLACE FUNCTION public.bg_station_index(p_tribe_index int, p_round int)
RETURNS int
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT (((((p_tribe_index - 1) + (p_round - 1)) % 12) + 12) % 12) + 1;
$$;

CREATE OR REPLACE FUNCTION public.bg_tribe_index(p_station_index int, p_round int)
RETURNS int
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT (((((p_station_index - 1) - (p_round - 1)) % 12) + 12) % 12) + 1;
$$;

-- ---------------------------------------------------------------------------
-- 4. Join codes
-- ---------------------------------------------------------------------------
--
-- Six characters from a 30-symbol alphabet with 0/O, 1/I/L and U removed: a
-- tired 13-year-old reading a paper slip in daylight will not distinguish them,
-- and U is dropped so no generated code can spell something the camp would
-- rather not print. 30^6 is roughly 729 million, so enumeration is not feasible
-- even before the per-device throttle in the leader migration.
--
-- Randomness comes from gen_random_uuid() rather than random(): random() is
-- seeded per session and predictable, and gen_random_uuid() avoids depending on
-- the pgcrypto extension being installed.

CREATE OR REPLACE FUNCTION public.bg_new_join_code()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alphabet constant text := '23456789ABCDEFGHJKMNPQRSTVWXYZ';
  v_len      constant int  := 30;
  v_code     text;
  v_hex      text;
  v_i        int;
  v_tries    int := 0;
BEGIN
  LOOP
    v_tries := v_tries + 1;
    v_code := '';
    v_hex := replace(gen_random_uuid()::text, '-', '');

    FOR v_i IN 0..5 LOOP
      v_code := v_code || substr(
        v_alphabet,
        ((('x' || substr(v_hex, v_i * 2 + 1, 2))::bit(8)::int) % v_len) + 1,
        1
      );
    END LOOP;

    EXIT WHEN NOT EXISTS (SELECT 1 FROM bg_tribes WHERE join_code = v_code);

    IF v_tries > 50 THEN
      RAISE EXCEPTION 'Could not generate a unique join code after 50 attempts';
    END IF;
  END LOOP;

  RETURN v_code;
END;
$$;

-- ---------------------------------------------------------------------------
-- 5. Admin gate and audit helpers
-- ---------------------------------------------------------------------------
--
-- Every bg_admin_* function in the admin migration calls bg_require_admin() as
-- its first statement. Hiding a nav link is not authorization, and the EXECUTE
-- grant is not authorization either — the runtime check is.

CREATE OR REPLACE FUNCTION public.bg_require_admin()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL OR NOT public.is_admin_user(v_uid) THEN
    RAISE EXCEPTION 'Not authorized'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN v_uid;
END;
$$;

CREATE OR REPLACE FUNCTION public.bg_actor_label()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid   uuid := auth.uid();
  v_label text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN 'system';
  END IF;

  SELECT full_name INTO v_label FROM profiles WHERE id = v_uid;
  IF v_label IS NOT NULL AND btrim(v_label) <> '' THEN
    RETURN v_label;
  END IF;

  SELECT email INTO v_label FROM auth.users WHERE id = v_uid;
  RETURN COALESCE(v_label, 'unknown');
END;
$$;

CREATE OR REPLACE FUNCTION public.bg_audit_log(p_action text, p_detail jsonb)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO bg_audit (actor, actor_label, action, detail)
  VALUES (auth.uid(), public.bg_actor_label(), p_action, p_detail);
END;
$$;

-- ---------------------------------------------------------------------------
-- 6. Seeds
-- ---------------------------------------------------------------------------
--
-- Station data mirrors src/lib/bigGame/route.ts. The theme words are globally
-- distinct, which is what lets the generated codes stay unique across stations
-- while only the digits vary per round.

INSERT INTO bg_game (singleton) VALUES (true)
ON CONFLICT (singleton) DO NOTHING;

INSERT INTO bg_stations (id, "index", name, theme_word, short_description) VALUES
  ('S1',  1,  'The Red Sea',         'CROSS',   'Cross together, or not at all.'),
  ('S2',  2,  'Marah',               'SWEET',   'Make the bitter water sweet.'),
  ('S3',  3,  'Manna',               'DAILY',   'Gather exactly what the day requires.'),
  ('S4',  4,  'Amalek',              'SUPPORT', 'Hold up the staff; nobody wins alone.'),
  ('S5',  5,  'The Tabernacle',      'ORDER',   'Rebuild the pattern, piece by piece.'),
  ('S6',  6,  'Pillar of Cloud',     'CLOUD',   'Follow a guide you cannot see.'),
  ('S7',  7,  'The Twelve Spies',    'CALEB',   'Weigh the evidence and decide.'),
  ('S8',  8,  'The Wilderness',      'RETURN',  'Find the way through the maze.'),
  ('S9',  9,  'Water from the Rock', 'ROCK',    'Strike together or nothing flows.'),
  ('S10', 10, 'The Bronze Serpent',  'LOOKUP',  'The answer is above eye level.'),
  ('S11', 11, 'The Twelve Tribes',   'TWELVE',  'Sort the tribes into their places.'),
  ('S12', 12, 'Promised Land Vault', 'AWE',     'Everything you learned, one last time.')
ON CONFLICT (id) DO NOTHING;

-- T1-T3 Team A, T4-T6 Team B, T7-T9 Team C, T10-T12 Team D. display_name starts
-- as the id; organizers rename them in setup, but the ids stay stable so the
-- printed cards never go out of date.
DO $$
DECLARE
  v_i     int;
  v_teams constant text[] := ARRAY['Team A','Team B','Team C','Team D'];
BEGIN
  FOR v_i IN 1..12 LOOP
    INSERT INTO bg_tribes (id, "index", display_name, parent_team, join_code)
    VALUES (
      'T' || v_i,
      v_i,
      'T' || v_i,
      v_teams[((v_i - 1) / 3) + 1],
      public.bg_new_join_code()
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- 7. Grants
-- ---------------------------------------------------------------------------
--
-- The route is public knowledge — it is printed on every moderator card — so
-- the two pure-math functions are safe to expose. The helpers are granted to
-- nobody: they are called from inside SECURITY DEFINER functions, which run as
-- the owner and therefore need no role grant.

REVOKE ALL ON FUNCTION public.bg_station_index(int, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_tribe_index(int, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_new_join_code() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_require_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_actor_label() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_audit_log(text, jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.bg_station_index(int, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bg_tribe_index(int, int) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 8. Self-verifying tail
-- ---------------------------------------------------------------------------
--
-- A broken route engine should fail the migration, not the event. If any of
-- these fail the transaction rolls back and nothing installs.

DO $$
DECLARE
  v_t     int;
  v_r     int;
  v_count int;
BEGIN
  -- Exactly one tribe per station per round, for every round.
  FOR v_r IN 1..6 LOOP
    SELECT count(DISTINCT public.bg_station_index(g, v_r)) INTO v_count
    FROM generate_series(1, 12) AS g;
    IF v_count <> 12 THEN
      RAISE EXCEPTION 'Route broken: round % does not cover 12 distinct stations (got %)', v_r, v_count;
    END IF;
  END LOOP;

  -- No tribe visits the same station twice.
  FOR v_t IN 1..12 LOOP
    SELECT count(DISTINCT public.bg_station_index(v_t, g)) INTO v_count
    FROM generate_series(1, 6) AS g;
    IF v_count <> 6 THEN
      RAISE EXCEPTION 'Route broken: tribe % repeats a station (got % distinct)', v_t, v_count;
    END IF;
  END LOOP;

  -- The inverse is exact for all 72 pairs.
  FOR v_t IN 1..12 LOOP
    FOR v_r IN 1..6 LOOP
      IF public.bg_tribe_index(public.bg_station_index(v_t, v_r), v_r) <> v_t THEN
        RAISE EXCEPTION 'Route broken: inverse failed at tribe % round %', v_t, v_r;
      END IF;
    END LOOP;
  END LOOP;

  -- The wrap boundaries, named explicitly because they are where a naive
  -- modulo silently produces a station index of 0 or below.
  IF public.bg_station_index(12, 2) <> 1 THEN
    RAISE EXCEPTION 'Route broken: T12 round 2 should be S1';
  END IF;
  IF public.bg_station_index(8, 6) <> 1 THEN
    RAISE EXCEPTION 'Route broken: T8 round 6 should be S1';
  END IF;
  IF public.bg_tribe_index(1, 6) <> 8 THEN
    RAISE EXCEPTION 'Route broken: S1 round 6 should host T8';
  END IF;
  IF public.bg_tribe_index(1, 2) <> 12 THEN
    RAISE EXCEPTION 'Route broken: S1 round 2 should host T12';
  END IF;

  -- Seeds landed.
  SELECT count(*) INTO v_count FROM bg_stations;
  IF v_count <> 12 THEN
    RAISE EXCEPTION 'Expected 12 stations, found %', v_count;
  END IF;

  SELECT count(*) INTO v_count FROM bg_tribes;
  IF v_count <> 12 THEN
    RAISE EXCEPTION 'Expected 12 tribes, found %', v_count;
  END IF;

  SELECT count(DISTINCT join_code) INTO v_count FROM bg_tribes;
  IF v_count <> 12 THEN
    RAISE EXCEPTION 'Join codes are not unique (% distinct)', v_count;
  END IF;
END;
$$;
