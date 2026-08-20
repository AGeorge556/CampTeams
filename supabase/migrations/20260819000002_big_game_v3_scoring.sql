-- The Wilderness: Big Game v3 — scoring, hint cards and teams
--
-- Split from the RPC migration purely for size. Runs after
-- 20260819000001_big_game_v3_rpcs.sql and depends on its shared builders.
--
-- The idea that shapes this file: a correct code no longer means success. The
-- moderator hands the code over at the ten-minute bell whatever happened, so
-- the rotation never jams. The code proves the tribe was there; the score is
-- the director's separate judgement, entered here.

-- ---------------------------------------------------------------------------
-- 1. The score board
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.bg_admin_scores()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth
AS $fn$
DECLARE
  v_rounds int;
  v_tribes jsonb;
  v_teams  jsonb;
BEGIN
  PERFORM public.bg_require_admin();
  SELECT round_count INTO v_rounds FROM bg_game LIMIT 1;

  -- One cell per round even where no result exists yet, so the grid always
  -- carries station context and an unscored cell stays distinguishable from
  -- FAIL. Conflating those two would quietly lose real scores.
  SELECT COALESCE(jsonb_agg(q.row ORDER BY (q.row->>'index')::int), '[]'::jsonb)
  INTO v_tribes
  FROM (
    SELECT jsonb_build_object(
      'id', t.id, 'index', t."index", 'displayName', t.display_name,
      'teamId', t.team_id,
      'cells', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
          'tribeId', t.id, 'round', gs.r,
          'stationId', s.id, 'stationName', s.name,
          'status', res.status, 'adjustment', res.adjustment,
          'hintUsed', COALESCE(res.hint_used, false),
          'points', public.bg_result_points(res.status)
        ) ORDER BY gs.r), '[]'::jsonb)
        FROM generate_series(1, v_rounds) AS gs(r)
        JOIN bg_stations s ON s."index" = public.bg_station_index(t."index", gs.r)
        LEFT JOIN bg_round_results res ON res.tribe_id = t.id AND res.round = gs.r
      ),
      'total', (SELECT COALESCE(SUM(public.bg_result_points(x.status)),0)::int
                FROM bg_round_results x WHERE x.tribe_id = t.id),
      'clears', (SELECT count(*)::int FROM bg_round_results x
                 WHERE x.tribe_id = t.id AND x.status = 'CLEAR'),
      'stoneCards', (SELECT count(*)::int FROM bg_round_results x
                     WHERE x.tribe_id = t.id AND x.status <> 'MISSED'),
      'hintsRemaining', t.hints_remaining
    ) AS row
    FROM bg_tribes t
  ) q;

  SELECT COALESCE(jsonb_agg(q.row ORDER BY q.row->>'id'), '[]'::jsonb)
  INTO v_teams
  FROM (
    SELECT jsonb_build_object(
      'id', tm.id, 'displayName', tm.display_name,
      'tribeIds', (SELECT COALESCE(jsonb_agg(x.id ORDER BY x."index"), '[]'::jsonb)
                   FROM bg_tribes x WHERE x.team_id = tm.id),
      'total', (SELECT COALESCE(SUM(public.bg_result_points(r.status)),0)::int
                FROM bg_round_results r JOIN bg_tribes x ON x.id = r.tribe_id
                WHERE x.team_id = tm.id),
      'clears', (SELECT count(*)::int FROM bg_round_results r
                 JOIN bg_tribes x ON x.id = r.tribe_id
                 WHERE x.team_id = tm.id AND r.status = 'CLEAR'),
      'stoneCards', (SELECT count(*)::int FROM bg_round_results r
                     JOIN bg_tribes x ON x.id = r.tribe_id
                     WHERE x.team_id = tm.id AND r.status <> 'MISSED'),
      -- Which of the twelve stations this team has actually reached. A gap has
      -- to be visible before the teams converge, not discovered mid-race when
      -- a team finds it cannot spell its phrase.
      'coverage', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
          'stationId', s.id, 'stationIndex', s."index", 'stationName', s.name,
          'covered', cov.tribe_id IS NOT NULL,
          'byTribeId', cov.tribe_id
        ) ORDER BY s."index"), '[]'::jsonb)
        FROM bg_stations s
        LEFT JOIN LATERAL (
          SELECT r.tribe_id FROM bg_round_results r
          JOIN bg_tribes x ON x.id = r.tribe_id
          WHERE x.team_id = tm.id AND r.station_id = s.id AND r.status <> 'MISSED'
          LIMIT 1
        ) cov ON true
      ),
      'coverageComplete', (
        SELECT count(DISTINCT r.station_id) = 12
        FROM bg_round_results r JOIN bg_tribes x ON x.id = r.tribe_id
        WHERE x.team_id = tm.id AND r.status <> 'MISSED'
      )
    ) AS row
    FROM bg_teams tm
  ) q;

  RETURN jsonb_build_object(
    'serverTime', now(),
    'rounds', (SELECT COALESCE(jsonb_agg(g ORDER BY g), '[]'::jsonb)
               FROM generate_series(1, v_rounds) AS g),
    'tribes', v_tribes,
    'teams', v_teams
  );
END;
$fn$;

-- ---------------------------------------------------------------------------
-- 2. Entering a score
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.bg_admin_set_result(
  p_tribe_id text, p_round int, p_status text
)
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, auth
AS $fn$
DECLARE
  v_station text;
  v_idx     int;
  v_hint    boolean;
  v_warning text := NULL;
BEGIN
  PERFORM public.bg_require_admin();

  IF p_status NOT IN ('CLEAR','PARTIAL','FAIL','MISSED') THEN
    RAISE EXCEPTION 'Unknown result %', p_status;
  END IF;

  SELECT "index" INTO v_idx FROM bg_tribes WHERE id = p_tribe_id;
  IF v_idx IS NULL THEN RAISE EXCEPTION 'No such tribe %', p_tribe_id; END IF;

  SELECT id INTO v_station FROM bg_stations
  WHERE "index" = public.bg_station_index(v_idx, p_round);

  INSERT INTO bg_round_results (tribe_id, round, station_id, status, scored_by, scored_at)
  VALUES (p_tribe_id, p_round, v_station, p_status, auth.uid(), now())
  ON CONFLICT (tribe_id, round) DO UPDATE
    SET status     = EXCLUDED.status,
        station_id = EXCLUDED.station_id,
        scored_by  = EXCLUDED.scored_by,
        scored_at  = EXCLUDED.scored_at;

  SELECT hint_used INTO v_hint FROM bg_round_results
  WHERE tribe_id = p_tribe_id AND round = p_round;

  -- Spending a hint caps that station at PARTIAL. This warns and does not
  -- block: moderators make mistakes, and the director has to be able to
  -- overrule one without arguing with the software in front of a crowd.
  IF p_status = 'CLEAR' AND COALESCE(v_hint, false) THEN
    v_warning := format(
      '%s used a hint card in round %s, which normally caps the result at PARTIAL.',
      p_tribe_id, p_round);
  END IF;

  PERFORM public.bg_audit_log('set_result', jsonb_build_object(
    'tribeId', p_tribe_id, 'round', p_round, 'status', p_status, 'hintUsed', v_hint
  ));

  RETURN jsonb_build_object('board', public.bg_admin_scores(), 'warning', v_warning);
END;
$fn$;

-- ---------------------------------------------------------------------------
-- 3. Hint cards
-- ---------------------------------------------------------------------------
--
-- Two physical cards per tribe for the whole game. The site only counts them.

CREATE OR REPLACE FUNCTION public.bg_admin_set_hints(
  p_tribe_id text, p_hints_remaining int
)
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, auth
AS $fn$
DECLARE v_value int;
BEGIN
  PERFORM public.bg_require_admin();
  v_value := LEAST(2, GREATEST(0, p_hints_remaining));
  UPDATE bg_tribes SET hints_remaining = v_value WHERE id = p_tribe_id;
  PERFORM public.bg_audit_log('set_hints', jsonb_build_object(
    'tribeId', p_tribe_id, 'hintsRemaining', v_value));
  RETURN public.bg_admin_scores();
END;
$fn$;

CREATE OR REPLACE FUNCTION public.bg_admin_set_hint_used(
  p_tribe_id text, p_round int, p_used boolean
)
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, auth
AS $fn$
DECLARE v_station text; v_idx int;
BEGIN
  PERFORM public.bg_require_admin();
  SELECT "index" INTO v_idx FROM bg_tribes WHERE id = p_tribe_id;
  IF v_idx IS NULL THEN RAISE EXCEPTION 'No such tribe %', p_tribe_id; END IF;

  SELECT id INTO v_station FROM bg_stations
  WHERE "index" = public.bg_station_index(v_idx, p_round);

  -- A hint gets flagged before the station is scored, so seed the row as
  -- MISSED; the director's later score overwrites the status, not the flag.
  INSERT INTO bg_round_results (tribe_id, round, station_id, status, hint_used)
  VALUES (p_tribe_id, p_round, v_station, 'MISSED', p_used)
  ON CONFLICT (tribe_id, round) DO UPDATE SET hint_used = EXCLUDED.hint_used;

  PERFORM public.bg_audit_log('set_hint_used', jsonb_build_object(
    'tribeId', p_tribe_id, 'round', p_round, 'used', p_used));
  RETURN public.bg_admin_scores();
END;
$fn$;

-- ---------------------------------------------------------------------------
-- 4. Teams
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.bg_admin_teams()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth
AS $fn$
DECLARE v_rows jsonb;
BEGIN
  PERFORM public.bg_require_admin();
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', tm.id, 'displayName', tm.display_name,
    'tribeIds', (SELECT COALESCE(jsonb_agg(x.id ORDER BY x."index"), '[]'::jsonb)
                 FROM bg_tribes x WHERE x.team_id = tm.id),
    'tribeNames', (SELECT COALESCE(jsonb_agg(x.display_name ORDER BY x."index"), '[]'::jsonb)
                   FROM bg_tribes x WHERE x.team_id = tm.id)
  ) ORDER BY tm.id), '[]'::jsonb)
  INTO v_rows FROM bg_teams tm;
  RETURN v_rows;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.bg_admin_update_team(
  p_team_id text, p_display_name text, p_phrase text,
  p_padlock_code text, p_tribe_ids text[]
)
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, auth
AS $fn$
DECLARE v_count int;
BEGIN
  PERFORM public.bg_require_admin();

  UPDATE bg_teams SET
    display_name = COALESCE(NULLIF(btrim(p_display_name), ''), display_name),
    phrase       = COALESCE(p_phrase, phrase),
    padlock_code = COALESCE(p_padlock_code, padlock_code)
  WHERE id = p_team_id;

  IF p_tribe_ids IS NOT NULL THEN
    SELECT count(*) INTO v_count FROM bg_tribes WHERE id = ANY(p_tribe_ids);
    IF v_count <> 3 THEN
      RAISE EXCEPTION 'A team needs exactly 3 tribes, got %', v_count;
    END IF;
    UPDATE bg_tribes SET team_id = p_team_id WHERE id = ANY(p_tribe_ids);
  END IF;

  -- The answer key is deliberately kept out of the audit detail. The audit log
  -- is readable on the dashboard, and a phrase recorded there is a phrase
  -- leaked over the director's shoulder.
  PERFORM public.bg_audit_log('update_team', jsonb_build_object(
    'teamId', p_team_id, 'tribeIds', to_jsonb(p_tribe_ids),
    'phraseSet', p_phrase IS NOT NULL, 'padlockSet', p_padlock_code IS NOT NULL));

  RETURN public.bg_admin_teams();
END;
$fn$;

CREATE OR REPLACE FUNCTION public.bg_admin_validate_teams()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth
AS $fn$
DECLARE v_rows jsonb;
BEGIN
  PERFORM public.bg_require_admin();
  SELECT COALESCE(jsonb_agg(public.bg_validate_team(tm.id) ORDER BY tm.id), '[]'::jsonb)
  INTO v_rows FROM bg_teams tm;
  RETURN v_rows;
END;
$fn$;

-- ---------------------------------------------------------------------------
-- 5. Grants
-- ---------------------------------------------------------------------------
--
-- `authenticated` only, never `anon`. The grant is not the authorization —
-- every function above re-checks bg_require_admin() at runtime.

REVOKE ALL ON FUNCTION public.bg_admin_scores() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_admin_set_result(text, int, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_admin_set_hints(text, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_admin_set_hint_used(text, int, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_admin_teams() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_admin_update_team(text, text, text, text, text[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_admin_validate_teams() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.bg_admin_scores() TO authenticated;
GRANT EXECUTE ON FUNCTION public.bg_admin_set_result(text, int, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bg_admin_set_hints(text, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bg_admin_set_hint_used(text, int, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bg_admin_teams() TO authenticated;
GRANT EXECUTE ON FUNCTION public.bg_admin_update_team(text, text, text, text, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bg_admin_validate_teams() TO authenticated;
