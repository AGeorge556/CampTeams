-- The Wilderness: Big Game v3 — RPC layer
--
-- Scoring, teams, hint cards and the Finale. Also rewrites every v2 function
-- that read bg_tribes.parent_team, which no longer exists: the same
-- `parentTeam` JSON key is now produced by joining bg_teams.display_name, so
-- the wire contract the clients depend on is unchanged.
--
-- Every admin function calls bg_require_admin() first. The EXECUTE grant to
-- `authenticated` is not the authorization — the runtime check is.

-- ---------------------------------------------------------------------------
-- 1. Shared builders
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.bg_game_summary_json()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT jsonb_build_object(
    'status', g.status,
    'currentRound', g.current_round,
    'roundCount', g.round_count,
    'revealNextEarly', g.reveal_next_early,
    'startedAt', g.started_at,
    'finishedAt', g.finished_at,
    'roundStartedAt', g.round_started_at,
    'finaleStartedAt', g.finale_started_at
  ) FROM bg_game g LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.bg_game_summary_json() FROM PUBLIC;

-- Team standings used for the Finale head starts and the awards screen.
-- Ranking: station points, then more CLEARs, then the lower tribe number.
-- Returned in rank order with the head start already applied.
CREATE OR REPLACE FUNCTION public.bg_team_ranking()
RETURNS TABLE (
  team_id text, display_name text, total int, clears int,
  min_tribe int, rank int, head_start int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  WITH scored AS (
    SELECT
      t.id,
      t.display_name,
      COALESCE(SUM(public.bg_result_points(r.status)), 0)::int AS total,
      COALESCE(SUM(CASE WHEN r.status = 'CLEAR' THEN 1 ELSE 0 END), 0)::int AS clears,
      COALESCE(MIN(tr."index"), 99)::int AS min_tribe
    FROM bg_teams t
    LEFT JOIN bg_tribes tr ON tr.team_id = t.id
    LEFT JOIN bg_round_results r ON r.tribe_id = tr.id
    GROUP BY t.id, t.display_name
  ), ranked AS (
    SELECT *, ROW_NUMBER() OVER (
      ORDER BY total DESC, clears DESC, min_tribe ASC
    )::int AS rank
    FROM scored
  )
  -- 1st 0:00, 2nd 0:45, 3rd 1:30, 4th 2:15. Station work buys a stagger
  -- rather than points, so the afternoon counts without deciding the result.
  SELECT id, display_name, total, clears, min_tribe, rank, (rank - 1) * 45
  FROM ranked ORDER BY rank;
$$;

REVOKE ALL ON FUNCTION public.bg_team_ranking() FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- 2. Leader state — extended, not replaced
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.bg_leader_state_json(p_tribe_id text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_game    bg_game%ROWTYPE;
  v_tribe   bg_tribes%ROWTYPE;
  v_team    bg_teams%ROWTYPE;
  v_live    boolean;
  v_station jsonb := NULL;
  v_next    jsonb := NULL;
  v_result  bg_round_results%ROWTYPE;
  v_done    boolean := false;
  v_history jsonb;
  v_count   int;
  v_cards   int;
  v_finale  jsonb := NULL;
  v_head    int;
BEGIN
  SELECT * INTO v_game FROM bg_game LIMIT 1;
  SELECT * INTO v_tribe FROM bg_tribes WHERE id = p_tribe_id;
  SELECT * INTO v_team FROM bg_teams WHERE id = v_tribe.team_id;

  v_live := v_game.status IN ('ACTIVE','PAUSED')
        AND v_game.current_round BETWEEN 1 AND v_game.round_count;

  IF v_live THEN
    SELECT jsonb_build_object(
      'id', s.id, 'index', s."index", 'name', s.name, 'location', s.location,
      'shortDescription', s.short_description, 'instructions', s.instructions
    ) INTO v_station
    FROM bg_stations s
    WHERE s."index" = public.bg_station_index(v_tribe."index", v_game.current_round);

    SELECT * INTO v_result FROM bg_round_results
    WHERE tribe_id = p_tribe_id AND round = v_game.current_round;

    v_done := v_result.status IS NOT NULL AND v_result.status <> 'MISSED';

    -- Only ever revealed when the director has explicitly turned it on. The
    -- default is off because an early reveal sends tribes drifting toward a
    -- station another tribe is still standing in.
    IF v_game.reveal_next_early AND v_done
       AND v_game.current_round < v_game.round_count THEN
      SELECT jsonb_build_object(
        'id', s.id, 'index', s."index", 'name', s.name, 'location', s.location,
        'shortDescription', s.short_description, 'instructions', s.instructions
      ) INTO v_next
      FROM bg_stations s
      WHERE s."index" = public.bg_station_index(v_tribe."index", v_game.current_round + 1);
    END IF;
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'round', r.round, 'stationId', r.station_id, 'stationName', s.name,
           'status', r.status, 'completedAt', r.completed_at
         ) ORDER BY r.round), '[]'::jsonb)
  INTO v_history
  FROM bg_round_results r
  LEFT JOIN bg_stations s ON s.id = r.station_id
  WHERE r.tribe_id = p_tribe_id;

  SELECT count(*) INTO v_count FROM bg_round_results
  WHERE tribe_id = p_tribe_id AND status IN ('CLEAR','PARTIAL','FAIL');

  -- A Stone Card is handed over whenever the tribe reaches the station, so the
  -- count is "rounds they turned up for", not "rounds they scored on". A tribe
  -- marked MISSED never arrived and got no card.
  SELECT count(*) INTO v_cards FROM bg_round_results
  WHERE tribe_id = p_tribe_id AND status <> 'MISSED';

  IF v_game.status = 'FINALE' THEN
    SELECT COALESCE((v_game.finale_rankings -> v_tribe.team_id ->> 'headStartSeconds')::int,
                    (SELECT head_start FROM public.bg_team_ranking() WHERE team_id = v_tribe.team_id))
    INTO v_head;

    v_finale := jsonb_build_object(
      'id', v_team.id,
      'displayName', v_team.display_name,
      'tribeNames', (
        SELECT COALESCE(jsonb_agg(x.display_name ORDER BY x."index"), '[]'::jsonb)
        FROM bg_tribes x WHERE x.team_id = v_tribe.team_id
      ),
      'headStartSeconds', COALESCE(v_head, 0),
      'startsAt', CASE WHEN v_game.finale_started_at IS NULL THEN NULL
                       ELSE v_game.finale_started_at + (COALESCE(v_head,0) || ' seconds')::interval END
    );
  END IF;

  RETURN jsonb_build_object(
    'serverTime', now(),
    'game', public.bg_game_summary_json(),
    'tribe', jsonb_build_object(
      'id', v_tribe.id, 'index', v_tribe."index",
      'displayName', v_tribe.display_name,
      'parentTeam', COALESCE(v_team.display_name, '')
    ),
    'currentStation', v_station,
    'nextStation', v_next,
    'currentRoundCompleted', v_done,
    'currentRoundStatus', v_result.status,
    'completedCount', v_count,
    'history', v_history,
    'hintsRemaining', COALESCE(v_tribe.hints_remaining, 0),
    'stoneCardsCollected', v_cards,
    'finaleTeam', v_finale
  );
END;
$$;

REVOKE ALL ON FUNCTION public.bg_leader_state_json(text) FROM PUBLIC;
