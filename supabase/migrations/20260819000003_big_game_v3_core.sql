-- The Wilderness: Big Game v3 — v2 functions brought forward
--
-- The v3 schema migration dropped bg_tribes.parent_team in favour of a real
-- bg_teams table. Every v2 function that read that column would now fail at
-- runtime, so each is rewritten here to join bg_teams instead. They all still
-- emit the identical `parentTeam` JSON key, so no client change is required.
--
-- Also here: advancing past the last round now enters FINALE rather than
-- ending the game, and the readiness checklist gains the team-coverage check.

-- ---------------------------------------------------------------------------
-- 1. Readiness checklist
-- ---------------------------------------------------------------------------
--
-- Shared by the setup screen and by bg_admin_start(), so the list the organiser
-- reads and the list the server enforces cannot drift apart.

CREATE OR REPLACE FUNCTION public.bg_checklist()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth
AS $fn$
DECLARE
  v_items      jsonb := '[]'::jsonb;
  v_tribes     int;
  v_join_codes int;
  v_join_uniq  int;
  v_blank      text;
  v_codes      int;
  v_code_uniq  int;
  v_inactive   text;
  v_bad_teams  text;
BEGIN
  SELECT count(*) INTO v_tribes FROM bg_tribes;
  v_items := v_items || jsonb_build_object(
    'key','tribes','label','Twelve tribes exist','ok', v_tribes = 12,
    'detail', CASE WHEN v_tribes = 12 THEN NULL ELSE format('Found %s', v_tribes) END);

  SELECT count(*), count(DISTINCT join_code) INTO v_join_codes, v_join_uniq
  FROM bg_tribes WHERE join_code IS NOT NULL AND btrim(join_code) <> '';
  v_items := v_items || jsonb_build_object(
    'key','joinCodes','label','Twelve unique join codes',
    'ok', v_join_codes = 12 AND v_join_uniq = 12,
    'detail', CASE WHEN v_join_codes = 12 AND v_join_uniq = 12 THEN NULL
              ELSE format('%s present, %s unique', v_join_codes, v_join_uniq) END);

  SELECT string_agg(id, ', ' ORDER BY "index") INTO v_blank
  FROM bg_stations WHERE btrim(location) = '';
  v_items := v_items || jsonb_build_object(
    'key','locations','label','Every station has a location','ok', v_blank IS NULL,
    'detail', CASE WHEN v_blank IS NULL THEN NULL
              ELSE format('Missing a location: %s', v_blank) END);

  SELECT count(*), count(DISTINCT code) INTO v_codes, v_code_uniq FROM bg_station_codes;
  v_items := v_items || jsonb_build_object(
    'key','stationCodes','label','Seventy-two unique station codes',
    'ok', v_codes = 72 AND v_code_uniq = 72,
    'detail', CASE WHEN v_codes = 72 AND v_code_uniq = 72 THEN NULL
              ELSE format('%s present, %s unique', v_codes, v_code_uniq) END);

  SELECT string_agg(id, ', ' ORDER BY "index") INTO v_inactive
  FROM bg_stations WHERE active = false;
  v_items := v_items || jsonb_build_object(
    'key','stationsActive','label','All twelve stations active','ok', v_inactive IS NULL,
    'detail', CASE WHEN v_inactive IS NULL THEN NULL ELSE format('Inactive: %s', v_inactive) END);

  -- Team grouping is editable, and hand-editing it is the single easiest way
  -- to break the event: a team whose three tribes do not cover all twelve
  -- stations can never assemble its Stone Card phrase, and its padlock is
  -- unopenable. Name the offending team — the director reads this under
  -- pressure and needs to know which one to fix.
  SELECT string_agg(
    format('%s (missing %s, duplicate %s)',
           v->>'displayName',
           COALESCE(NULLIF(v->>'missing','[]'),'none'),
           COALESCE(NULLIF(v->>'duplicates','[]'),'none')),
    '; ')
  INTO v_bad_teams
  FROM (SELECT public.bg_validate_team(id) AS v FROM bg_teams ORDER BY id) t
  WHERE (v->>'ok')::boolean IS NOT TRUE;

  v_items := v_items || jsonb_build_object(
    'key','teams','label','Each team covers all twelve stations',
    'ok', v_bad_teams IS NULL,
    'detail', v_bad_teams);

  RETURN v_items;
END;
$fn$;

REVOKE ALL ON FUNCTION public.bg_checklist() FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- 2. Setup state
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.bg_admin_setup_state()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth
AS $fn$
DECLARE
  v_status text; v_tribes jsonb; v_stations jsonb;
  v_checklist jsonb; v_codes int; v_all_ok boolean;
BEGIN
  PERFORM public.bg_require_admin();
  SELECT status INTO v_status FROM bg_game LIMIT 1;
  v_checklist := public.bg_checklist();

  SELECT bool_and((item->>'ok')::boolean) INTO v_all_ok
  FROM jsonb_array_elements(v_checklist) AS item;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', t.id, 'index', t."index", 'displayName', t.display_name,
    'parentTeam', tm.display_name, 'joinCode', t.join_code
  ) ORDER BY t."index"), '[]'::jsonb)
  INTO v_tribes FROM bg_tribes t LEFT JOIN bg_teams tm ON tm.id = t.team_id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', s.id, 'index', s."index", 'name', s.name, 'location', s.location,
    'shortDescription', s.short_description, 'instructions', s.instructions,
    'active', s.active
  ) ORDER BY s."index"), '[]'::jsonb)
  INTO v_stations FROM bg_stations s;

  SELECT count(*) INTO v_codes FROM bg_station_codes;

  RETURN jsonb_build_object(
    'serverTime', now(),
    'game', public.bg_game_summary_json(),
    'tribes', v_tribes,
    'stations', v_stations,
    'codeCount', v_codes,
    'checklist', v_checklist,
    'canStart', COALESCE(v_all_ok, false) AND v_status = 'SETUP'
  );
END;
$fn$;

-- ---------------------------------------------------------------------------
-- 3. Live overview
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.bg_admin_overview()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth
AS $fn$
DECLARE
  v_game bg_game%ROWTYPE; v_live boolean; v_round int;
  v_tribes jsonb; v_stations jsonb; v_done int; v_count int;
BEGIN
  PERFORM public.bg_require_admin();
  SELECT * INTO v_game FROM bg_game LIMIT 1;
  v_round := v_game.current_round;
  v_live := v_game.status IN ('ACTIVE','PAUSED') AND v_round BETWEEN 1 AND v_game.round_count;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', t.id, 'index', t."index", 'displayName', t.display_name,
    'parentTeam', tm.display_name, 'teamId', t.team_id, 'joinCode', t.join_code,
    'currentStation', CASE WHEN v_live THEN (
      SELECT jsonb_build_object('id', s.id, 'index', s."index",
                                'name', s.name, 'location', s.location)
      FROM bg_stations s
      WHERE s."index" = public.bg_station_index(t."index", v_round)
    ) ELSE NULL END,
    'currentRoundStatus', (SELECT r.status FROM bg_round_results r
                           WHERE r.tribe_id = t.id AND r.round = v_round),
    'completedCount', (SELECT count(*) FROM bg_round_results r
                       WHERE r.tribe_id = t.id AND r.status IN ('CLEAR','PARTIAL','FAIL')),
    'points', (SELECT COALESCE(SUM(public.bg_result_points(r.status)),0)::int
               FROM bg_round_results r WHERE r.tribe_id = t.id),
    -- Cards are handed over on arrival, so this counts rounds the tribe turned
    -- up for. A tribe short of cards must be spotted before the Finale starts.
    'stoneCards', (SELECT count(*)::int FROM bg_round_results r
                   WHERE r.tribe_id = t.id AND r.status <> 'MISSED'),
    'hintsRemaining', t.hints_remaining,
    'lastActivityAt', GREATEST(
      (SELECT max(r.completed_at) FROM bg_round_results r WHERE r.tribe_id = t.id),
      (SELECT max(a.created_at) FROM bg_attempts a WHERE a.tribe_id = t.id)),
    'attemptsThisRound', (SELECT count(*) FROM bg_attempts a
                          WHERE a.tribe_id = t.id AND a.round = v_round)
  ) ORDER BY t."index"), '[]'::jsonb)
  INTO v_tribes FROM bg_tribes t LEFT JOIN bg_teams tm ON tm.id = t.team_id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', s.id, 'index', s."index", 'name', s.name,
    'location', s.location, 'active', s.active,
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
      WHERE t."index" = public.bg_tribe_index(s."index", v_round) AND r.round = v_round
    ) ELSE NULL END
  ) ORDER BY s."index"), '[]'::jsonb)
  INTO v_stations FROM bg_stations s;

  SELECT count(*) INTO v_done FROM bg_round_results
  WHERE round = v_round AND status IN ('CLEAR','PARTIAL','FAIL');

  SELECT count(*) INTO v_count FROM bg_tribes;

  RETURN jsonb_build_object(
    'serverTime', now(),
    'game', public.bg_game_summary_json(),
    'tribes', v_tribes,
    'stations', v_stations,
    'doneThisRound', COALESCE(v_done, 0),
    'tribeCount', v_count
  );
END;
$fn$;

-- ---------------------------------------------------------------------------
-- 4. Start, advance
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.bg_admin_start()
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, auth
AS $fn$
DECLARE v_status text; v_fail text;
BEGIN
  PERFORM public.bg_require_admin();
  SELECT status INTO v_status FROM bg_game LIMIT 1;
  IF v_status <> 'SETUP' THEN
    RAISE EXCEPTION 'The game has already started (status is %). Reset it first.', v_status;
  END IF;

  SELECT string_agg(format('%s: %s', item->>'label',
                           COALESCE(item->>'detail','not ready')), '; ')
  INTO v_fail
  FROM jsonb_array_elements(public.bg_checklist()) AS item
  WHERE (item->>'ok')::boolean IS NOT TRUE;

  IF v_fail IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot start: %', v_fail;
  END IF;

  UPDATE bg_game SET status = 'ACTIVE', current_round = 1,
    started_at = now(), round_started_at = now(), updated_at = now();

  PERFORM public.bg_audit_log('start', '{}'::jsonb);
  RETURN public.bg_admin_overview();
END;
$fn$;

CREATE OR REPLACE FUNCTION public.bg_admin_advance_preview()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth
AS $fn$
DECLARE v_game bg_game%ROWTYPE; v_pending jsonb;
BEGIN
  PERFORM public.bg_require_admin();
  SELECT * INTO v_game FROM bg_game LIMIT 1;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', t.id, 'displayName', t.display_name) ORDER BY t."index"), '[]'::jsonb)
  INTO v_pending
  FROM bg_tribes t
  WHERE NOT EXISTS (SELECT 1 FROM bg_round_results r
                    WHERE r.tribe_id = t.id AND r.round = v_game.current_round);

  RETURN jsonb_build_object(
    'currentRound', v_game.current_round,
    'nextRound', CASE WHEN v_game.current_round >= v_game.round_count
                      THEN NULL ELSE v_game.current_round + 1 END,
    'willFinish', false,
    'willEnterFinale', v_game.current_round >= v_game.round_count,
    'pendingTribes', v_pending
  );
END;
$fn$;

CREATE OR REPLACE FUNCTION public.bg_admin_advance_round()
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, auth
AS $fn$
DECLARE v_game bg_game%ROWTYPE; v_missed int; v_finale boolean;
BEGIN
  PERFORM public.bg_require_admin();
  SELECT * INTO v_game FROM bg_game LIMIT 1;
  IF v_game.status NOT IN ('ACTIVE','PAUSED') THEN
    RAISE EXCEPTION 'Cannot advance a game that is %', v_game.status;
  END IF;

  -- The MISSED sweep, and it happens FIRST. Some tribe will not finish; they
  -- move with everyone else so the one-tribe-per-station invariant holds, they
  -- score one fewer station, and the miss is recorded rather than discarded.
  INSERT INTO bg_round_results (tribe_id, round, station_id, status)
  SELECT t.id, v_game.current_round, s.id, 'MISSED'
  FROM bg_tribes t
  JOIN bg_stations s ON s."index" = public.bg_station_index(t."index", v_game.current_round)
  WHERE NOT EXISTS (SELECT 1 FROM bg_round_results r
                    WHERE r.tribe_id = t.id AND r.round = v_game.current_round)
  ON CONFLICT (tribe_id, round) DO NOTHING;
  GET DIAGNOSTICS v_missed = ROW_COUNT;

  v_finale := v_game.current_round >= v_game.round_count;

  IF v_finale THEN
    -- Not FINISHED. The Finale is where the event is decided, and ending the
    -- game is now a separate, deliberate director action.
    UPDATE bg_game SET status = 'FINALE', updated_at = now();
  ELSE
    UPDATE bg_game SET status = 'ACTIVE', current_round = current_round + 1,
      round_started_at = now(), updated_at = now();
  END IF;

  PERFORM public.bg_audit_log('advance_round', jsonb_build_object(
    'fromRound', v_game.current_round, 'missedSwept', v_missed, 'enteredFinale', v_finale));

  RETURN public.bg_admin_overview();
END;
$fn$;

-- ---------------------------------------------------------------------------
-- 5. Reset
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.bg_admin_reset_all(p_confirmation text, p_force boolean)
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, auth
AS $fn$
DECLARE v_status text;
BEGIN
  PERFORM public.bg_require_admin();

  IF p_confirmation <> 'RESET' THEN
    RAISE EXCEPTION 'Type RESET to confirm a full reset.';
  END IF;

  SELECT status INTO v_status FROM bg_game LIMIT 1;
  -- FINALE gets the same gate as a live round: the race is in progress and a
  -- reset would discard it.
  IF v_status IN ('ACTIVE','PAUSED','FINALE') AND NOT COALESCE(p_force, false) THEN
    RAISE EXCEPTION 'The game is live (%). Tick force to reset anyway.', v_status;
  END IF;

  DELETE FROM bg_round_results;
  DELETE FROM bg_attempts;
  DELETE FROM bg_join_attempts;
  DELETE FROM bg_sessions;

  UPDATE bg_teams SET opened_at = NULL, short_handed = false, short_handed_at = NULL;
  UPDATE bg_tribes SET hints_remaining = 2;
  UPDATE bg_game SET status = 'SETUP', current_round = 0,
    started_at = NULL, finished_at = NULL, round_started_at = NULL,
    finale_started_at = NULL, finale_rankings = NULL, updated_at = now();

  PERFORM public.bg_audit_log('reset_all', jsonb_build_object('force', p_force, 'wasStatus', v_status));
  RETURN public.bg_admin_overview();
END;
$fn$;

-- ---------------------------------------------------------------------------
-- 6. Export and self test
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.bg_admin_export()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth
AS $fn$
DECLARE v_rows jsonb;
BEGIN
  PERFORM public.bg_require_admin();
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'tribeId', t.id, 'tribeDisplayName', t.display_name,
    'parentTeam', tm.display_name,
    'round', r.round, 'stationId', r.station_id, 'stationName', s.name,
    'status', r.status, 'points', public.bg_result_points(r.status),
    -- Kept distinct from the score so the export cannot imply a director
    -- judged a station they actually overrode or skipped.
    'adjustment', r.adjustment, 'hintUsed', r.hint_used,
    'submittedCode', r.submitted_code, 'completedAt', r.completed_at,
    'overriddenBy', r.overridden_by
  ) ORDER BY t."index", r.round), '[]'::jsonb)
  INTO v_rows
  FROM bg_round_results r
  JOIN bg_tribes t ON t.id = r.tribe_id
  LEFT JOIN bg_teams tm ON tm.id = t.team_id
  LEFT JOIN bg_stations s ON s.id = r.station_id;
  RETURN v_rows;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.bg_selftest()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth
AS $fn$
DECLARE
  v_rows jsonb := '[]'::jsonb;
  v_rounds int; v_r int; v_count int; v_uniq int; v_bad text;
BEGIN
  PERFORM public.bg_require_admin();
  SELECT round_count INTO v_rounds FROM bg_game LIMIT 1;

  v_rows := v_rows || jsonb_build_object(
    'name', format('Round count is %s', v_rounds), 'passed', v_rounds = 4, 'detail', NULL);

  v_bad := NULL;
  FOR v_r IN 1..v_rounds LOOP
    SELECT count(DISTINCT public.bg_station_index(t."index", v_r)) INTO v_count FROM bg_tribes t;
    IF v_count <> 12 THEN v_bad := COALESCE(v_bad,'') || format('round %s; ', v_r); END IF;
  END LOOP;
  v_rows := v_rows || jsonb_build_object(
    'name', 'Each round places the 12 tribes on 12 distinct stations',
    'passed', v_bad IS NULL, 'detail', v_bad);

  SELECT string_agg(x.id, ', ') INTO v_bad FROM (
    SELECT t.id FROM bg_tribes t
    WHERE (SELECT count(DISTINCT public.bg_station_index(t."index", g))
           FROM generate_series(1, v_rounds) AS g) <> v_rounds
  ) x;
  v_rows := v_rows || jsonb_build_object(
    'name', 'No tribe visits the same station twice',
    'passed', v_bad IS NULL, 'detail', v_bad);

  SELECT string_agg(v->>'displayName', ', ') INTO v_bad
  FROM (SELECT public.bg_validate_team(id) AS v FROM bg_teams ORDER BY id) t
  WHERE (v->>'ok')::boolean IS NOT TRUE;
  v_rows := v_rows || jsonb_build_object(
    'name', 'Each team covers all twelve stations exactly once',
    'passed', v_bad IS NULL, 'detail', v_bad);

  SELECT count(*), count(DISTINCT code) INTO v_count, v_uniq FROM bg_station_codes;
  v_rows := v_rows || jsonb_build_object(
    'name', 'Seventy-two unique station codes',
    'passed', v_count = 72 AND v_uniq = 72,
    'detail', format('%s present, %s unique', v_count, v_uniq));

  SELECT count(*), count(DISTINCT join_code) INTO v_count, v_uniq FROM bg_tribes;
  v_rows := v_rows || jsonb_build_object(
    'name', 'Twelve unique join codes',
    'passed', v_count = 12 AND v_uniq = 12,
    'detail', format('%s present, %s unique', v_count, v_uniq));

  SELECT count(*), count(DISTINCT theme_word) INTO v_count, v_uniq FROM bg_stations;
  v_rows := v_rows || jsonb_build_object(
    'name', 'Twelve stations with distinct theme words',
    'passed', v_count = 12 AND v_uniq = 12,
    'detail', format('%s stations, %s distinct words', v_count, v_uniq));

  -- The guard has to be able to fail, or every assertion above is worthless.
  SELECT count(DISTINCT public.bg_station_index(t, r)) INTO v_count
  FROM unnest(ARRAY[1,2,3]) AS t CROSS JOIN generate_series(1, v_rounds) AS r;
  v_rows := v_rows || jsonb_build_object(
    'name', 'Coverage check is meaningful (consecutive grouping fails it)',
    'passed', v_count <> 12,
    'detail', format('consecutive trio covers %s stations', v_count));

  RETURN v_rows;
END;
$fn$;

-- ---------------------------------------------------------------------------
-- 7. Grants
-- ---------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.bg_admin_setup_state() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_admin_overview() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_admin_start() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_admin_advance_preview() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_admin_advance_round() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_admin_reset_all(text, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_admin_export() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_selftest() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.bg_admin_setup_state() TO authenticated;
GRANT EXECUTE ON FUNCTION public.bg_admin_overview() TO authenticated;
GRANT EXECUTE ON FUNCTION public.bg_admin_start() TO authenticated;
GRANT EXECUTE ON FUNCTION public.bg_admin_advance_preview() TO authenticated;
GRANT EXECUTE ON FUNCTION public.bg_admin_advance_round() TO authenticated;
GRANT EXECUTE ON FUNCTION public.bg_admin_reset_all(text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bg_admin_export() TO authenticated;
GRANT EXECUTE ON FUNCTION public.bg_selftest() TO authenticated;
