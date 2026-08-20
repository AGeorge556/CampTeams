-- The Wilderness: Big Game v3 — the Finale
--
-- After the last round all twelve tribes converge. Each team pools the Stone
-- Cards its three tribes collected, arranges the letters by position to spell
-- a phrase, reads four digits off it and opens a physical padlock.
--
-- Two rules shape this file:
--
--   The site never validates the vault code. The padlock is the check. There
--   is deliberately no code-entry endpoint here — a team that types the right
--   code into a phone and still cannot open the lock will argue with a
--   moderator instead of trying the lock again.
--
--   The head-start ranking is frozen the instant Start is pressed. A director
--   correcting a score mid-race must never reshuffle a clock already running.

-- ---------------------------------------------------------------------------
-- 1. Finale state
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.bg_admin_finale_state()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth
AS $fn$
DECLARE
  v_game   bg_game%ROWTYPE;
  v_teams  jsonb;
  v_frozen boolean;
BEGIN
  PERFORM public.bg_require_admin();
  SELECT * INTO v_game FROM bg_game LIMIT 1;
  v_frozen := v_game.finale_rankings IS NOT NULL;

  SELECT COALESCE(jsonb_agg(q.row ORDER BY (q.row->>'rank')::int), '[]'::jsonb)
  INTO v_teams
  FROM (
    SELECT jsonb_build_object(
      'id', tm.id,
      'displayName', tm.display_name,
      'tribeIds', (SELECT COALESCE(jsonb_agg(x.id ORDER BY x."index"), '[]'::jsonb)
                   FROM bg_tribes x WHERE x.team_id = tm.id),
      'tribeNames', (SELECT COALESCE(jsonb_agg(x.display_name ORDER BY x."index"), '[]'::jsonb)
                     FROM bg_tribes x WHERE x.team_id = tm.id),
      -- Frozen values win once the race has started; before that the ranking
      -- is computed live so the director can watch it move as scores land.
      'rank', COALESCE((v_game.finale_rankings -> tm.id ->> 'rank')::int, rk.rank),
      'total', COALESCE((v_game.finale_rankings -> tm.id ->> 'total')::int, rk.total),
      'clears', COALESCE((v_game.finale_rankings -> tm.id ->> 'clears')::int, rk.clears),
      'headStartSeconds', COALESCE(
        (v_game.finale_rankings -> tm.id ->> 'headStartSeconds')::int, rk.head_start),
      'startsAt', CASE WHEN v_game.finale_started_at IS NULL THEN NULL
        ELSE v_game.finale_started_at + (COALESCE(
          (v_game.finale_rankings -> tm.id ->> 'headStartSeconds')::int,
          rk.head_start) || ' seconds')::interval END,
      'openedAt', tm.opened_at,
      'shortHanded', tm.short_handed,
      -- Admin-only RPC, so the answer key may appear here. It must never reach
      -- bg_leader_state_json.
      'phrase', tm.phrase,
      'padlockCode', tm.padlock_code
    ) AS row
    FROM bg_teams tm
    JOIN public.bg_team_ranking() rk ON rk.team_id = tm.id
  ) q;

  RETURN jsonb_build_object(
    'serverTime', now(),
    'game', public.bg_game_summary_json(),
    'teams', v_teams,
    'rankingsFrozen', v_frozen
  );
END;
$fn$;

-- ---------------------------------------------------------------------------
-- 2. Starting the shared clock
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.bg_admin_start_finale()
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, auth
AS $fn$
DECLARE v_game bg_game%ROWTYPE; v_rankings jsonb;
BEGIN
  PERFORM public.bg_require_admin();
  SELECT * INTO v_game FROM bg_game LIMIT 1;

  IF v_game.status <> 'FINALE' THEN
    RAISE EXCEPTION 'The game is %, not in the Finale.', v_game.status;
  END IF;
  IF v_game.finale_started_at IS NOT NULL THEN
    RAISE EXCEPTION 'The Finale clock has already started.';
  END IF;

  -- Snapshot the ranking. From here the head starts are fixed, whatever the
  -- director later does to the score grid.
  SELECT COALESCE(jsonb_object_agg(team_id, jsonb_build_object(
    'rank', rank, 'total', total, 'clears', clears, 'headStartSeconds', head_start
  )), '{}'::jsonb)
  INTO v_rankings FROM public.bg_team_ranking();

  UPDATE bg_game SET finale_started_at = now(), finale_rankings = v_rankings, updated_at = now();

  PERFORM public.bg_audit_log('start_finale', v_rankings);
  RETURN public.bg_admin_finale_state();
END;
$fn$;

-- ---------------------------------------------------------------------------
-- 3. Recording an open, and a short-handed team
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.bg_admin_team_opened(p_team_id text)
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, auth
AS $fn$
DECLARE v_current timestamptz; v_found boolean;
BEGIN
  PERFORM public.bg_require_admin();
  SELECT opened_at, true INTO v_current, v_found FROM bg_teams WHERE id = p_team_id;
  IF NOT COALESCE(v_found, false) THEN
    RAISE EXCEPTION 'No such team %', p_team_id;
  END IF;

  -- Toggles, because the director will mis-click under pressure and needs to
  -- be able to take it back without a reset.
  UPDATE bg_teams
  SET opened_at = CASE WHEN v_current IS NULL THEN now() ELSE NULL END
  WHERE id = p_team_id;

  PERFORM public.bg_audit_log('team_opened', jsonb_build_object(
    'teamId', p_team_id, 'cleared', v_current IS NOT NULL));
  RETURN public.bg_admin_finale_state();
END;
$fn$;

CREATE OR REPLACE FUNCTION public.bg_admin_mark_short_handed(
  p_team_id text, p_short_handed boolean
)
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, auth
AS $fn$
BEGIN
  PERFORM public.bg_require_admin();

  -- A team missing a tribe cannot hold all twelve cards, so the director
  -- reveals its missing digits. Recording that keeps the standings honest
  -- rather than letting a helped team look like it solved the vault outright.
  UPDATE bg_teams SET
    short_handed = COALESCE(p_short_handed, false),
    short_handed_at = CASE WHEN COALESCE(p_short_handed, false) THEN now() ELSE NULL END
  WHERE id = p_team_id;

  PERFORM public.bg_audit_log('mark_short_handed', jsonb_build_object(
    'teamId', p_team_id, 'shortHanded', p_short_handed));
  RETURN public.bg_admin_finale_state();
END;
$fn$;

-- ---------------------------------------------------------------------------
-- 4. Standings and the award
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.bg_admin_standings()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth
AS $fn$
DECLARE
  v_game     bg_game%ROWTYPE;
  v_any_open boolean;
  v_teams    jsonb;
  v_best     jsonb;
  v_tribes   jsonb;
BEGIN
  PERFORM public.bg_require_admin();
  SELECT * INTO v_game FROM bg_game LIMIT 1;
  SELECT EXISTS (SELECT 1 FROM bg_teams WHERE opened_at IS NOT NULL) INTO v_any_open;

  -- Ordered by the exact timestamp, never truncated to the second: two teams
  -- opening in the same second must still resolve to an order, and the screen
  -- shows both times so the call is checkable.
  SELECT COALESCE(jsonb_agg(q.row), '[]'::jsonb) INTO v_teams FROM (
    SELECT jsonb_build_object(
      'id', tm.id, 'displayName', tm.display_name,
      'tribeIds', (SELECT COALESCE(jsonb_agg(x.id ORDER BY x."index"), '[]'::jsonb)
                   FROM bg_tribes x WHERE x.team_id = tm.id),
      'tribeNames', (SELECT COALESCE(jsonb_agg(x.display_name ORDER BY x."index"), '[]'::jsonb)
                     FROM bg_tribes x WHERE x.team_id = tm.id),
      'rank', rk.rank, 'total', rk.total, 'clears', rk.clears,
      'headStartSeconds', rk.head_start,
      'startsAt', CASE WHEN v_game.finale_started_at IS NULL THEN NULL
        ELSE v_game.finale_started_at + (rk.head_start || ' seconds')::interval END,
      'openedAt', tm.opened_at,
      'shortHanded', tm.short_handed,
      'phrase', tm.phrase, 'padlockCode', tm.padlock_code
    ) AS row
    FROM bg_teams tm
    JOIN public.bg_team_ranking() rk ON rk.team_id = tm.id
    ORDER BY
      CASE WHEN v_any_open AND tm.opened_at IS NOT NULL THEN 0 ELSE 1 END,
      tm.opened_at ASC NULLS LAST,
      rk.total DESC, rk.clears DESC
  ) q;

  -- Twelve tribes competing only as thirds of a team makes individual effort
  -- invisible. This is the one screen where it should not be.
  SELECT jsonb_build_object(
    'tribeId', t.id, 'displayName', t.display_name, 'teamId', t.team_id,
    'points', COALESCE(SUM(public.bg_result_points(r.status)), 0)::int,
    'clears', COALESCE(SUM(CASE WHEN r.status = 'CLEAR' THEN 1 ELSE 0 END), 0)::int
  ) INTO v_best
  FROM bg_tribes t LEFT JOIN bg_round_results r ON r.tribe_id = t.id
  GROUP BY t.id, t.display_name, t.team_id, t."index"
  ORDER BY COALESCE(SUM(public.bg_result_points(r.status)), 0) DESC,
           COALESCE(SUM(CASE WHEN r.status = 'CLEAR' THEN 1 ELSE 0 END), 0) DESC,
           t."index" ASC
  LIMIT 1;

  SELECT (public.bg_admin_scores() -> 'tribes') INTO v_tribes;

  RETURN jsonb_build_object(
    'serverTime', now(),
    'game', public.bg_game_summary_json(),
    'teams', v_teams,
    'decidedBy', CASE WHEN v_any_open THEN 'OPEN_TIME' ELSE 'STATION_POINTS' END,
    'bestTribe', v_best,
    'tribes', COALESCE(v_tribes, '[]'::jsonb)
  );
END;
$fn$;

CREATE OR REPLACE FUNCTION public.bg_admin_finish_game()
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, auth
AS $fn$
DECLARE v_status text;
BEGIN
  PERFORM public.bg_require_admin();
  SELECT status INTO v_status FROM bg_game LIMIT 1;
  IF v_status NOT IN ('FINALE','FINISHED') THEN
    RAISE EXCEPTION 'The game is %, so there is no Finale to end.', v_status;
  END IF;

  UPDATE bg_game SET status = 'FINISHED', finished_at = now(), updated_at = now()
  WHERE status = 'FINALE';

  PERFORM public.bg_audit_log('finish_game', '{}'::jsonb);
  RETURN public.bg_admin_standings();
END;
$fn$;

-- ---------------------------------------------------------------------------
-- 5. Grants
-- ---------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.bg_admin_finale_state() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_admin_start_finale() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_admin_team_opened(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_admin_mark_short_handed(text, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_admin_standings() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_admin_finish_game() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.bg_admin_finale_state() TO authenticated;
GRANT EXECUTE ON FUNCTION public.bg_admin_start_finale() TO authenticated;
GRANT EXECUTE ON FUNCTION public.bg_admin_team_opened(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bg_admin_mark_short_handed(text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bg_admin_standings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.bg_admin_finish_game() TO authenticated;
