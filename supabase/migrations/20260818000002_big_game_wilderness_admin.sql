-- The Wilderness: Big Game — admin / game-director RPCs
--
-- Every function here calls bg_require_admin() as its first statement. The
-- EXECUTE grant to `authenticated` is not the authorization — the runtime check
-- is. A camper with a valid JWT can call these all day and get nothing but
-- 'Not authorized'.
--
-- The director drives the whole event from these: start, advance, pause,
-- override, skip, reset, plus the two printed outputs (moderator cards and the
-- code sheet) that the moderators actually run the game from.
--
-- Stations can never be deactivated once the game leaves SETUP: the rotation
-- needs all twelve, and dropping one mid-game would put two tribes at the same
-- station. Enforced structurally rather than by a guard trigger —
-- bg_admin_update_station below has no p_active parameter at all, so no code
-- path through this file can ever flip the flag once setup is done.

-- ---------------------------------------------------------------------------
-- 2. Readiness checklist
-- ---------------------------------------------------------------------------
--
-- Shared by the setup screen and by bg_admin_start(), so the list the organizer
-- reads and the list the server enforces cannot drift apart. `detail` names the
-- specific offenders — a director reading this under pressure needs "S4, S7",
-- not "some stations are incomplete".

CREATE OR REPLACE FUNCTION public.bg_checklist()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_items      jsonb := '[]'::jsonb;
  v_tribes     int;
  v_teams      int;
  v_join_codes int;
  v_join_uniq  int;
  v_blank      text;
  v_codes      int;
  v_code_uniq  int;
  v_inactive   text;
BEGIN
  SELECT count(*) INTO v_tribes FROM bg_tribes;
  v_items := v_items || jsonb_build_object(
    'key', 'tribes', 'label', 'Twelve tribes exist',
    'ok', v_tribes = 12,
    'detail', CASE WHEN v_tribes = 12 THEN NULL ELSE format('Found %s', v_tribes) END
  );

  SELECT count(*) INTO v_teams FROM bg_tribes
  WHERE parent_team IS NULL OR btrim(parent_team) = '';
  v_items := v_items || jsonb_build_object(
    'key', 'parentTeams', 'label', 'Every tribe has a parent team',
    'ok', v_teams = 0,
    'detail', CASE WHEN v_teams = 0 THEN NULL
              ELSE format('%s tribe(s) without a team', v_teams) END
  );

  SELECT count(*), count(DISTINCT join_code) INTO v_join_codes, v_join_uniq
  FROM bg_tribes WHERE join_code IS NOT NULL AND btrim(join_code) <> '';
  v_items := v_items || jsonb_build_object(
    'key', 'joinCodes', 'label', 'Twelve unique join codes',
    'ok', v_join_codes = 12 AND v_join_uniq = 12,
    'detail', CASE WHEN v_join_codes = 12 AND v_join_uniq = 12 THEN NULL
              ELSE format('%s present, %s unique', v_join_codes, v_join_uniq) END
  );

  SELECT string_agg(id, ', ' ORDER BY "index") INTO v_blank
  FROM bg_stations WHERE btrim(location) = '';
  v_items := v_items || jsonb_build_object(
    'key', 'locations', 'label', 'Every station has a location',
    'ok', v_blank IS NULL,
    'detail', CASE WHEN v_blank IS NULL THEN NULL
              ELSE format('Missing a location: %s', v_blank) END
  );

  SELECT count(*), count(DISTINCT code) INTO v_codes, v_code_uniq FROM bg_station_codes;
  v_items := v_items || jsonb_build_object(
    'key', 'stationCodes', 'label', 'Seventy-two unique station codes',
    'ok', v_codes = 72 AND v_code_uniq = 72,
    'detail', CASE WHEN v_codes = 72 AND v_code_uniq = 72 THEN NULL
              ELSE format('%s present, %s unique', v_codes, v_code_uniq) END
  );

  SELECT string_agg(id, ', ' ORDER BY "index") INTO v_inactive
  FROM bg_stations WHERE active = false;
  v_items := v_items || jsonb_build_object(
    'key', 'stationsActive', 'label', 'All twelve stations active',
    'ok', v_inactive IS NULL,
    'detail', CASE WHEN v_inactive IS NULL THEN NULL
              ELSE format('Inactive: %s', v_inactive) END
  );

  RETURN v_items;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Setup state
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.bg_admin_setup_state()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_game      bg_game%ROWTYPE;
  v_tribes    jsonb;
  v_stations  jsonb;
  v_checklist jsonb;
  v_codes     int;
  v_all_ok    boolean;
BEGIN
  PERFORM public.bg_require_admin();

  SELECT * INTO v_game FROM bg_game LIMIT 1;
  v_checklist := public.bg_checklist();

  SELECT bool_and((item->>'ok')::boolean) INTO v_all_ok
  FROM jsonb_array_elements(v_checklist) AS item;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'id', t.id, 'index', t."index", 'displayName', t.display_name,
           'parentTeam', t.parent_team, 'joinCode', t.join_code
         ) ORDER BY t."index"), '[]'::jsonb)
  INTO v_tribes FROM bg_tribes t;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'id', s.id, 'index', s."index", 'name', s.name, 'location', s.location,
           'shortDescription', s.short_description, 'instructions', s.instructions,
           'active', s.active
         ) ORDER BY s."index"), '[]'::jsonb)
  INTO v_stations FROM bg_stations s;

  SELECT count(*) INTO v_codes FROM bg_station_codes;

  RETURN jsonb_build_object(
    'serverTime', now(),
    'game', jsonb_build_object(
      'status', v_game.status, 'currentRound', v_game.current_round,
      'roundCount', v_game.round_count, 'revealNextEarly', v_game.reveal_next_early,
      'startedAt', v_game.started_at, 'finishedAt', v_game.finished_at,
      'roundStartedAt', v_game.round_started_at
    ),
    'tribes', v_tribes,
    'stations', v_stations,
    'codeCount', v_codes,
    'checklist', v_checklist,
    'canStart', COALESCE(v_all_ok, false) AND v_game.status = 'SETUP'
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. Live overview
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.bg_admin_overview()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_game     bg_game%ROWTYPE;
  v_live     boolean;
  v_round    int;
  v_tribes   jsonb;
  v_stations jsonb;
  v_done     int;
  v_count    int;
BEGIN
  PERFORM public.bg_require_admin();

  SELECT * INTO v_game FROM bg_game LIMIT 1;
  v_round := v_game.current_round;
  v_live := v_game.status IN ('ACTIVE', 'PAUSED') AND v_round BETWEEN 1 AND 6;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'id', t.id,
           'index', t."index",
           'displayName', t.display_name,
           'parentTeam', t.parent_team,
           'joinCode', t.join_code,
           'currentStation', CASE WHEN v_live THEN (
             SELECT jsonb_build_object('id', s.id, 'index', s."index",
                                       'name', s.name, 'location', s.location)
             FROM bg_stations s
             WHERE s."index" = public.bg_station_index(t."index", v_round)
           ) ELSE NULL END,
           'currentRoundStatus', (
             SELECT r.status FROM bg_round_results r
             WHERE r.tribe_id = t.id AND r.round = v_round
           ),
           'completedCount', (
             SELECT count(*) FROM bg_round_results r
             WHERE r.tribe_id = t.id AND r.status IN ('COMPLETED', 'OVERRIDDEN')
           ),
           'lastActivityAt', GREATEST(
             (SELECT max(COALESCE(r.completed_at, r.created_at))
              FROM bg_round_results r WHERE r.tribe_id = t.id),
             (SELECT max(a.created_at) FROM bg_attempts a WHERE a.tribe_id = t.id)
           ),
           'attemptsThisRound', (
             SELECT count(*) FROM bg_attempts a
             WHERE a.tribe_id = t.id AND a.round = v_round
           )
         ) ORDER BY t."index"), '[]'::jsonb)
  INTO v_tribes FROM bg_tribes t;

  -- The inverse shape. This is what a moderator's question sounds like: not
  -- "where is T7?" but "who is coming to me next?".
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'id', s.id,
           'index', s."index",
           'name', s.name,
           'location', s.location,
           'active', s.active,
           'currentTribe', CASE WHEN v_live THEN (
             SELECT jsonb_build_object('id', t.id, 'displayName', t.display_name)
             FROM bg_tribes t WHERE t."index" = public.bg_tribe_index(s."index", v_round)
           ) ELSE NULL END,
           'nextTribe', CASE WHEN v_live AND v_round < v_game.round_count THEN (
             SELECT jsonb_build_object('id', t.id, 'displayName', t.display_name)
             FROM bg_tribes t WHERE t."index" = public.bg_tribe_index(s."index", v_round + 1)
           ) ELSE NULL END,
           'currentRoundStatus', CASE WHEN v_live THEN (
             SELECT r.status FROM bg_round_results r
             JOIN bg_tribes t ON t.id = r.tribe_id
             WHERE r.round = v_round
               AND t."index" = public.bg_tribe_index(s."index", v_round)
           ) ELSE NULL END
         ) ORDER BY s."index"), '[]'::jsonb)
  INTO v_stations FROM bg_stations s;

  SELECT count(*) INTO v_done FROM bg_round_results
  WHERE round = v_round AND status IN ('COMPLETED', 'OVERRIDDEN', 'SKIPPED');

  SELECT count(*) INTO v_count FROM bg_tribes;

  RETURN jsonb_build_object(
    'serverTime', now(),
    'game', jsonb_build_object(
      'status', v_game.status, 'currentRound', v_game.current_round,
      'roundCount', v_game.round_count, 'revealNextEarly', v_game.reveal_next_early,
      'startedAt', v_game.started_at, 'finishedAt', v_game.finished_at,
      'roundStartedAt', v_game.round_started_at
    ),
    'tribes', v_tribes,
    'stations', v_stations,
    'doneThisRound', v_done,
    'tribeCount', v_count
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 5. State machine
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.bg_admin_start()
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_status   text;
  v_problems text;
BEGIN
  PERFORM public.bg_require_admin();

  SELECT status INTO v_status FROM bg_game LIMIT 1;
  IF v_status <> 'SETUP' THEN
    RAISE EXCEPTION 'The game has already started (status is %). Reset it first.', v_status;
  END IF;

  -- Each fragment is prefixed with its own label: concatenating bare `detail`
  -- strings from multiple failing checks reads as noise ("5 present, 3 unique;
  -- S4, S7") with no indication of which check each fragment belongs to.
  SELECT string_agg(
    item->>'label' || ' — ' || COALESCE(item->>'detail', 'not satisfied'),
    '; '
  )
  INTO v_problems
  FROM jsonb_array_elements(public.bg_checklist()) AS item
  WHERE (item->>'ok')::boolean = false;

  IF v_problems IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot start: %', v_problems;
  END IF;

  UPDATE bg_game SET
    status = 'ACTIVE', current_round = 1,
    started_at = now(), round_started_at = now(), updated_at = now();

  PERFORM public.bg_audit_log('start', jsonb_build_object('round', 1));
  RETURN public.bg_admin_overview();
END;
$$;

-- Writes nothing. The director sees exactly who is about to be marked missed
-- before committing to it.
CREATE OR REPLACE FUNCTION public.bg_admin_advance_preview()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_game    bg_game%ROWTYPE;
  v_pending jsonb;
BEGIN
  PERFORM public.bg_require_admin();
  SELECT * INTO v_game FROM bg_game LIMIT 1;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('id', t.id, 'displayName', t.display_name)
                            ORDER BY t."index"), '[]'::jsonb)
  INTO v_pending
  FROM bg_tribes t
  WHERE NOT EXISTS (
    SELECT 1 FROM bg_round_results r
    WHERE r.tribe_id = t.id AND r.round = v_game.current_round
  );

  RETURN jsonb_build_object(
    'currentRound', v_game.current_round,
    'nextRound', CASE WHEN v_game.current_round >= v_game.round_count
                      THEN NULL ELSE v_game.current_round + 1 END,
    'willFinish', v_game.current_round >= v_game.round_count,
    'pendingTribes', v_pending
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.bg_admin_advance_round()
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_game   bg_game%ROWTYPE;
  v_missed int;
  v_finish boolean;
BEGIN
  PERFORM public.bg_require_admin();
  SELECT * INTO v_game FROM bg_game LIMIT 1;

  IF v_game.status NOT IN ('ACTIVE', 'PAUSED') THEN
    RAISE EXCEPTION 'Cannot advance a game that is %', v_game.status;
  END IF;

  -- The MISSED sweep, and it happens FIRST. The physical game is on a timer and
  -- some tribe will not finish. They move with everyone else so the
  -- one-tribe-per-station invariant holds, they score one fewer station, and
  -- the miss is recorded rather than silently discarded. A stuck tribe must
  -- never hold up the other eleven.
  INSERT INTO bg_round_results (tribe_id, round, station_id, status)
  SELECT t.id, v_game.current_round, s.id, 'MISSED'
  FROM bg_tribes t
  JOIN bg_stations s
    ON s."index" = public.bg_station_index(t."index", v_game.current_round)
  WHERE NOT EXISTS (
    SELECT 1 FROM bg_round_results r
    WHERE r.tribe_id = t.id AND r.round = v_game.current_round
  )
  ON CONFLICT (tribe_id, round) DO NOTHING;

  GET DIAGNOSTICS v_missed = ROW_COUNT;
  v_finish := v_game.current_round >= v_game.round_count;

  IF v_finish THEN
    UPDATE bg_game SET status = 'FINISHED', finished_at = now(), updated_at = now();
  ELSE
    UPDATE bg_game SET
      status = 'ACTIVE',
      current_round = current_round + 1,
      round_started_at = now(),
      updated_at = now();
  END IF;

  PERFORM public.bg_audit_log('advance_round', jsonb_build_object(
    'fromRound', v_game.current_round, 'missedSwept', v_missed, 'finished', v_finish
  ));

  RETURN public.bg_admin_overview();
END;
$$;

CREATE OR REPLACE FUNCTION public.bg_admin_set_paused(p_paused boolean)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_status text;
BEGIN
  PERFORM public.bg_require_admin();
  SELECT status INTO v_status FROM bg_game LIMIT 1;

  IF p_paused AND v_status <> 'ACTIVE' THEN
    RAISE EXCEPTION 'Only an active game can be paused (status is %)', v_status;
  END IF;
  IF NOT p_paused AND v_status <> 'PAUSED' THEN
    RAISE EXCEPTION 'Only a paused game can be resumed (status is %)', v_status;
  END IF;

  UPDATE bg_game SET
    status = CASE WHEN p_paused THEN 'PAUSED' ELSE 'ACTIVE' END,
    updated_at = now();

  PERFORM public.bg_audit_log(CASE WHEN p_paused THEN 'pause' ELSE 'resume' END, '{}'::jsonb);
  RETURN public.bg_admin_overview();
END;
$$;

CREATE OR REPLACE FUNCTION public.bg_admin_set_reveal_next_early(p_reveal boolean)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  PERFORM public.bg_require_admin();
  UPDATE bg_game SET reveal_next_early = p_reveal, updated_at = now();
  PERFORM public.bg_audit_log('set_reveal_next_early', jsonb_build_object('reveal', p_reveal));
  RETURN public.bg_admin_overview();
END;
$$;

-- Shared by override and skip: both write a result for the current round on the
-- director's authority rather than the tribe's.
CREATE OR REPLACE FUNCTION public.bg_admin_force_result(p_tribe_id text, p_status text)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_game    bg_game%ROWTYPE;
  v_station text;
BEGIN
  SELECT * INTO v_game FROM bg_game LIMIT 1;

  IF v_game.status NOT IN ('ACTIVE', 'PAUSED') THEN
    RAISE EXCEPTION 'The game is not running (status is %)', v_game.status;
  END IF;

  SELECT s.id INTO v_station
  FROM bg_stations s
  JOIN bg_tribes t ON t.id = p_tribe_id
  WHERE s."index" = public.bg_station_index(t."index", v_game.current_round);

  IF v_station IS NULL THEN
    RAISE EXCEPTION 'Unknown tribe %', p_tribe_id;
  END IF;

  -- overridden_by is only meaningful for a genuine override: tagging a SKIPPED
  -- row with the acting admin's id would misrepresent it in the results export
  -- as a disputed completion rather than a broken challenge.
  INSERT INTO bg_round_results (
    tribe_id, round, station_id, status, completed_at, overridden_by
  )
  VALUES (
    p_tribe_id, v_game.current_round, v_station, p_status,
    CASE WHEN p_status = 'OVERRIDDEN' THEN now() ELSE NULL END,
    CASE WHEN p_status = 'OVERRIDDEN' THEN auth.uid() ELSE NULL END
  )
  ON CONFLICT (tribe_id, round) DO UPDATE SET
    status = EXCLUDED.status,
    completed_at = EXCLUDED.completed_at,
    overridden_by = EXCLUDED.overridden_by;
END;
$$;

CREATE OR REPLACE FUNCTION public.bg_admin_override_complete(p_tribe_id text)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  PERFORM public.bg_require_admin();
  PERFORM public.bg_admin_force_result(p_tribe_id, 'OVERRIDDEN');
  PERFORM public.bg_audit_log('override_complete', jsonb_build_object('tribeId', p_tribe_id));
  RETURN public.bg_admin_overview();
END;
$$;

CREATE OR REPLACE FUNCTION public.bg_admin_skip(p_tribe_id text)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  PERFORM public.bg_require_admin();
  -- SKIPPED, not OVERRIDDEN: the tribe moves on, but this does not count toward
  -- their completed stations.
  PERFORM public.bg_admin_force_result(p_tribe_id, 'SKIPPED');
  PERFORM public.bg_audit_log('skip', jsonb_build_object('tribeId', p_tribe_id));
  RETURN public.bg_admin_overview();
END;
$$;

CREATE OR REPLACE FUNCTION public.bg_admin_reset_tribe(p_tribe_id text)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  PERFORM public.bg_require_admin();
  DELETE FROM bg_round_results WHERE tribe_id = p_tribe_id;
  PERFORM public.bg_audit_log('reset_tribe', jsonb_build_object('tribeId', p_tribe_id));
  RETURN public.bg_admin_overview();
END;
$$;

-- Two locks, not one. The typed confirmation stops a misclick; the force flag
-- stops someone clearing a live game they had not realised was running. Tribes,
-- stations and codes survive, so the event can be re-run after a dry run.
CREATE OR REPLACE FUNCTION public.bg_admin_reset_all(p_confirmation text, p_force boolean)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_status text;
BEGIN
  PERFORM public.bg_require_admin();

  IF p_confirmation IS DISTINCT FROM 'RESET' THEN
    RAISE EXCEPTION 'Reset requires the confirmation word RESET';
  END IF;

  SELECT status INTO v_status FROM bg_game LIMIT 1;
  IF v_status IN ('ACTIVE', 'PAUSED') AND NOT COALESCE(p_force, false) THEN
    RAISE EXCEPTION 'A game is currently % — resetting requires the force option', v_status;
  END IF;

  DELETE FROM bg_round_results;
  DELETE FROM bg_attempts;
  DELETE FROM bg_join_attempts;
  DELETE FROM bg_sessions;

  UPDATE bg_game SET
    status = 'SETUP', current_round = 0,
    started_at = NULL, finished_at = NULL, round_started_at = NULL,
    updated_at = now();

  PERFORM public.bg_audit_log('reset_all', jsonb_build_object(
    'forced', COALESCE(p_force, false), 'previousStatus', v_status
  ));
  RETURN public.bg_admin_overview();
END;
$$;

-- ---------------------------------------------------------------------------
-- 6. Setup mutations
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.bg_admin_update_tribe(
  p_tribe_id     text,
  p_display_name text,
  p_parent_team  text,
  p_join_code    text
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_code text;
BEGIN
  PERFORM public.bg_require_admin();

  IF p_join_code IS NOT NULL THEN
    v_code := upper(btrim(p_join_code));
    IF EXISTS (SELECT 1 FROM bg_tribes WHERE join_code = v_code AND id <> p_tribe_id) THEN
      RAISE EXCEPTION 'That join code is already used by another tribe: %.', v_code;
    END IF;
  END IF;

  -- NULL means "leave unchanged" for every parameter here. The tribe id is
  -- never updatable: the printed moderator cards name tribes by id, so an id
  -- that moved would send the wrong tribe to the wrong card.
  UPDATE bg_tribes SET
    display_name = COALESCE(p_display_name, display_name),
    parent_team  = COALESCE(p_parent_team, parent_team),
    join_code    = COALESCE(v_code, join_code)
  WHERE id = p_tribe_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown tribe %', p_tribe_id;
  END IF;

  PERFORM public.bg_audit_log('update_tribe', jsonb_build_object('tribeId', p_tribe_id));
  RETURN public.bg_admin_setup_state();
END;
$$;

CREATE OR REPLACE FUNCTION public.bg_admin_update_station(
  p_station_id        text,
  p_location          text,
  p_short_description text,
  p_instructions      text
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  PERFORM public.bg_require_admin();

  -- The name and index are fixed; only the organizer-supplied fields move.
  -- There is deliberately no p_active parameter: the rotation requires all
  -- twelve stations live for every round, and deactivating one mid-game would
  -- put two tribes at the same station. Passing an empty string for location
  -- is meaningful, though — it is how an organizer re-opens the readiness
  -- check on a station they are no longer sure about.
  UPDATE bg_stations SET
    location          = COALESCE(p_location, location),
    short_description = COALESCE(p_short_description, short_description),
    instructions      = COALESCE(p_instructions, instructions)
  WHERE id = p_station_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown station %', p_station_id;
  END IF;

  PERFORM public.bg_audit_log('update_station', jsonb_build_object('stationId', p_station_id));
  RETURN public.bg_admin_setup_state();
END;
$$;

CREATE OR REPLACE FUNCTION public.bg_admin_regenerate_join_codes()
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_status text;
  v_tribe  record;
BEGIN
  PERFORM public.bg_require_admin();

  SELECT status INTO v_status FROM bg_game LIMIT 1;
  IF v_status <> 'SETUP' THEN
    RAISE EXCEPTION 'Join codes cannot be regenerated once the game is % — the printed slips are already in the leaders'' hands', v_status;
  END IF;

  FOR v_tribe IN SELECT id FROM bg_tribes ORDER BY "index" LOOP
    UPDATE bg_tribes SET join_code = public.bg_new_join_code() WHERE id = v_tribe.id;
  END LOOP;

  PERFORM public.bg_audit_log('regenerate_join_codes', '{}'::jsonb);
  RETURN public.bg_admin_setup_state();
END;
$$;

-- ---------------------------------------------------------------------------
-- 7. The 72 codes
-- ---------------------------------------------------------------------------
--
-- One code per (station, round). Per-round rather than per-station because the
-- route is a rotation: the tribe at S3 now is the tribe that was at S2 last
-- round. A single fixed word per station would let every tribe shout its answer
-- forward and skip the physical challenge entirely. Rotating the digits each
-- round makes a leaked code worthless twelve minutes later.
--
-- Deterministic from the seed, so the same seed regenerates byte-identical
-- codes: an organizer reprinting one card must get the card that matches the
-- database, not a fresh set.

CREATE OR REPLACE FUNCTION public.bg_admin_generate_codes(p_seed text)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  -- No 0 and no 1. Five theme words contain the letter O (CROSS, ORDER, CLOUD,
  -- ROCK, LOOKUP) and a tired 13-year-old on a phone in daylight will not tell
  -- O from 0, or I/l from 1.
  v_digits constant text := '23456789';
  v_status  text;
  v_station record;
  v_state   bigint;
  v_pair    int;
  v_used    int[];
  v_round   int;
BEGIN
  PERFORM public.bg_require_admin();

  SELECT status INTO v_status FROM bg_game LIMIT 1;
  IF v_status <> 'SETUP' THEN
    RAISE EXCEPTION 'Codes cannot be regenerated once the game is % — the moderator cards are already printed', v_status;
  END IF;

  DELETE FROM bg_station_codes;

  FOR v_station IN SELECT id, theme_word FROM bg_stations ORDER BY "index" LOOP
    -- Seeded per station, kept non-negative without abs(): abs of the minimum
    -- 32-bit integer overflows, and hashtext can return exactly that.
    v_state := ((hashtext(p_seed || v_station.id)::bigint % 2147483647) + 2147483647) % 2147483647;
    v_used := ARRAY[]::int[];

    FOR v_round IN 1..6 LOOP
      LOOP
        v_state := (v_state * 1103515245 + 12345) % 2147483648;
        v_pair := (v_state % 64)::int;
        EXIT WHEN NOT (v_pair = ANY(v_used));
      END LOOP;
      v_used := array_append(v_used, v_pair);

      INSERT INTO bg_station_codes (station_id, round, code)
      VALUES (
        v_station.id,
        v_round,
        upper(v_station.theme_word)
          || substr(v_digits, (v_pair / 8) + 1, 1)
          || substr(v_digits, (v_pair % 8) + 1, 1)
      );
    END LOOP;
  END LOOP;

  UPDATE bg_game SET code_seed = p_seed, updated_at = now();
  PERFORM public.bg_audit_log('generate_codes', jsonb_build_object('seed', p_seed));
  RETURN public.bg_admin_setup_state();
END;
$$;

CREATE OR REPLACE FUNCTION public.bg_admin_codes()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_rows jsonb;
BEGIN
  PERFORM public.bg_require_admin();

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'stationId', c.station_id, 'round', c.round, 'code', c.code
         ) ORDER BY s."index", c.round), '[]'::jsonb)
  INTO v_rows
  FROM bg_station_codes c JOIN bg_stations s ON s.id = c.station_id;

  RETURN v_rows;
END;
$$;

CREATE OR REPLACE FUNCTION public.bg_admin_update_code(
  p_station_id text,
  p_round      int,
  p_code       text
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_status           text;
  v_code             text;
  v_conflict_station text;
  v_conflict_round   int;
BEGIN
  PERFORM public.bg_require_admin();

  SELECT status INTO v_status FROM bg_game LIMIT 1;
  IF v_status <> 'SETUP' THEN
    RAISE EXCEPTION 'Codes cannot be edited once the game is %', v_status;
  END IF;

  v_code := upper(btrim(p_code));
  IF v_code IS NULL OR v_code = '' THEN
    RAISE EXCEPTION 'A code cannot be blank';
  END IF;

  SELECT s.name, c.round INTO v_conflict_station, v_conflict_round
  FROM bg_station_codes c
  JOIN bg_stations s ON s.id = c.station_id
  WHERE c.code = v_code AND NOT (c.station_id = p_station_id AND c.round = p_round);

  IF v_conflict_station IS NOT NULL THEN
    RAISE EXCEPTION 'That code is already used at % (round %).', v_conflict_station, v_conflict_round;
  END IF;

  INSERT INTO bg_station_codes (station_id, round, code)
  VALUES (p_station_id, p_round, v_code)
  ON CONFLICT (station_id, round) DO UPDATE SET code = EXCLUDED.code;

  PERFORM public.bg_audit_log('update_code', jsonb_build_object(
    'stationId', p_station_id, 'round', p_round
  ));
  RETURN public.bg_admin_codes();
END;
$$;

-- ---------------------------------------------------------------------------
-- 8. Moderator cards
-- ---------------------------------------------------------------------------
--
-- The single most valuable operational output of the whole build. Station
-- moderators never log in and never touch the site; they run the event off
-- twelve printed pages. Each card carries that station's six codes and the
-- tribe expected in each round, so a moderator can sanity-check who walked up.

CREATE OR REPLACE FUNCTION public.bg_admin_moderator_cards()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_cards jsonb;
BEGIN
  PERFORM public.bg_require_admin();

  SELECT COALESCE(jsonb_agg(card ORDER BY (card->>'stationIndex')::int), '[]'::jsonb)
  INTO v_cards
  FROM (
    SELECT jsonb_build_object(
             'stationId', s.id,
             'stationIndex', s."index",
             'stationName', s.name,
             'location', s.location,
             'shortDescription', s.short_description,
             'instructions', s.instructions,
             'rounds', (
               SELECT COALESCE(jsonb_agg(jsonb_build_object(
                        'round', g.round,
                        'code', c.code,
                        'tribeId', t.id,
                        'tribeDisplayName', t.display_name,
                        'tribeParentTeam', t.parent_team
                      ) ORDER BY g.round), '[]'::jsonb)
               FROM generate_series(1, 6) AS g(round)
               LEFT JOIN bg_station_codes c
                      ON c.station_id = s.id AND c.round = g.round
               LEFT JOIN bg_tribes t
                      ON t."index" = public.bg_tribe_index(s."index", g.round)
             )
           ) AS card
    FROM bg_stations s
  ) AS cards;

  RETURN v_cards;
END;
$$;

-- ---------------------------------------------------------------------------
-- 9. Audit, export, self test
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.bg_admin_audit(p_limit int DEFAULT 100)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_rows jsonb;
BEGIN
  PERFORM public.bg_require_admin();

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'id', a.id, 'actorLabel', a.actor_label, 'action', a.action,
           'detail', a.detail, 'createdAt', a.created_at
         ) ORDER BY a.created_at DESC), '[]'::jsonb)
  INTO v_rows
  FROM (
    SELECT * FROM bg_audit ORDER BY created_at DESC LIMIT GREATEST(COALESCE(p_limit, 100), 0)
  ) AS a;

  RETURN v_rows;
END;
$$;

CREATE OR REPLACE FUNCTION public.bg_admin_export()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_rows jsonb;
BEGIN
  PERFORM public.bg_require_admin();

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'tribeId', t.id,
           'tribeDisplayName', t.display_name,
           'parentTeam', t.parent_team,
           'round', r.round,
           'stationId', r.station_id,
           'stationName', COALESCE(s.name, r.station_id),
           'status', r.status,
           'submittedCode', r.submitted_code,
           'completedAt', r.completed_at,
           'overriddenBy', (SELECT p.full_name FROM profiles p WHERE p.id = r.overridden_by)
         ) ORDER BY t."index", r.round), '[]'::jsonb)
  INTO v_rows
  FROM bg_round_results r
  JOIN bg_tribes t ON t.id = r.tribe_id
  LEFT JOIN bg_stations s ON s.id = r.station_id;

  RETURN v_rows;
END;
$$;

-- Returns rows rather than raising: the director runs this from a button before
-- the event and needs to see which check failed, not a stack trace.
CREATE OR REPLACE FUNCTION public.bg_selftest()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_out   jsonb := '[]'::jsonb;
  v_t     int;
  v_r     int;
  v_ok    boolean;
  v_bad   text := NULL;
  v_count int;
  v_uniq  int;
  v_wrap1 int;
  v_wrap2 int;
BEGIN
  PERFORM public.bg_require_admin();

  v_ok := true;
  FOR v_r IN 1..6 LOOP
    SELECT count(DISTINCT public.bg_station_index(g, v_r)) INTO v_count
    FROM generate_series(1, 12) AS g;
    IF v_count <> 12 THEN
      v_ok := false;
      v_bad := COALESCE(v_bad || ', ', '') || format('round %s covers %s stations', v_r, v_count);
    END IF;
  END LOOP;
  v_out := v_out || jsonb_build_object(
    'name', 'One tribe per station per round', 'passed', v_ok, 'detail', v_bad);

  v_ok := true; v_bad := NULL;
  FOR v_t IN 1..12 LOOP
    SELECT count(DISTINCT public.bg_station_index(v_t, g)) INTO v_count
    FROM generate_series(1, 6) AS g;
    IF v_count <> 6 THEN
      v_ok := false;
      v_bad := COALESCE(v_bad || ', ', '') || format('T%s repeats a station', v_t);
    END IF;
  END LOOP;
  v_out := v_out || jsonb_build_object(
    'name', 'No tribe visits the same station twice', 'passed', v_ok, 'detail', v_bad);

  v_ok := true; v_bad := NULL;
  FOR v_t IN 1..12 LOOP
    FOR v_r IN 1..6 LOOP
      IF public.bg_tribe_index(public.bg_station_index(v_t, v_r), v_r) <> v_t THEN
        v_ok := false;
        v_bad := COALESCE(v_bad || ', ', '') || format('T%s/R%s', v_t, v_r);
      END IF;
    END LOOP;
  END LOOP;
  v_out := v_out || jsonb_build_object(
    'name', 'Route inverse is exact for all 72 pairs', 'passed', v_ok, 'detail', v_bad);

  v_wrap1 := public.bg_station_index(12, 2);
  v_wrap2 := public.bg_station_index(8, 6);
  v_ok := (v_wrap1 = 1 AND v_wrap2 = 1);
  v_out := v_out || jsonb_build_object(
    'name', 'Wrap boundaries: T12/R2 and T8/R6 both land on S1', 'passed', v_ok,
    'detail', CASE WHEN v_ok THEN NULL
              ELSE format('Got S%s for T12/R2, S%s for T8/R6 (expected S1 for both)', v_wrap1, v_wrap2) END);

  SELECT count(*), count(DISTINCT code) INTO v_count, v_uniq FROM bg_station_codes;
  v_out := v_out || jsonb_build_object(
    'name', 'Seventy-two distinct station codes',
    'passed', v_count = 72 AND v_uniq = 72,
    'detail', format('%s present, %s distinct', v_count, v_uniq));

  SELECT count(*), count(DISTINCT join_code) INTO v_count, v_uniq FROM bg_tribes;
  v_out := v_out || jsonb_build_object(
    'name', 'Twelve distinct join codes',
    'passed', v_count = 12 AND v_uniq = 12,
    'detail', format('%s tribes, %s distinct codes', v_count, v_uniq));

  -- Asserted here rather than in the TypeScript verifier because the theme
  -- words deliberately never reach a browser: a client that knows the word has
  -- only the two digits left to guess. Distinctness is what makes the word
  -- prefix alone enough to keep all 72 codes unique.
  SELECT count(*), count(DISTINCT theme_word) INTO v_count, v_uniq FROM bg_stations;
  v_out := v_out || jsonb_build_object(
    'name', 'Twelve distinct station theme words',
    'passed', v_count = 12 AND v_uniq = 12,
    'detail', format('%s stations, %s distinct words', v_count, v_uniq));

  RETURN v_out;
END;
$$;

-- ---------------------------------------------------------------------------
-- 10. Grants — authenticated only, never anon
-- ---------------------------------------------------------------------------
--
-- The grant is not the authorization. bg_require_admin() inside each function
-- is; this merely keeps anonymous callers from reaching the check at all.

REVOKE ALL ON FUNCTION public.bg_checklist() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_admin_force_result(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_admin_setup_state() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_admin_overview() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_admin_start() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_admin_advance_preview() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_admin_advance_round() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_admin_set_paused(boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_admin_set_reveal_next_early(boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_admin_override_complete(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_admin_skip(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_admin_reset_tribe(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_admin_reset_all(text, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_admin_update_tribe(text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_admin_update_station(text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_admin_regenerate_join_codes() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_admin_generate_codes(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_admin_codes() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_admin_update_code(text, int, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_admin_moderator_cards() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_admin_audit(int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_admin_export() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_selftest() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.bg_admin_setup_state() TO authenticated;
GRANT EXECUTE ON FUNCTION public.bg_admin_overview() TO authenticated;
GRANT EXECUTE ON FUNCTION public.bg_admin_start() TO authenticated;
GRANT EXECUTE ON FUNCTION public.bg_admin_advance_preview() TO authenticated;
GRANT EXECUTE ON FUNCTION public.bg_admin_advance_round() TO authenticated;
GRANT EXECUTE ON FUNCTION public.bg_admin_set_paused(boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bg_admin_set_reveal_next_early(boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bg_admin_override_complete(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bg_admin_skip(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bg_admin_reset_tribe(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bg_admin_reset_all(text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bg_admin_update_tribe(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bg_admin_update_station(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bg_admin_regenerate_join_codes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.bg_admin_generate_codes(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bg_admin_codes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.bg_admin_update_code(text, int, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bg_admin_moderator_cards() TO authenticated;
GRANT EXECUTE ON FUNCTION public.bg_admin_audit(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bg_admin_export() TO authenticated;
GRANT EXECUTE ON FUNCTION public.bg_selftest() TO authenticated;
