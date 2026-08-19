-- The Wilderness: Big Game — tribe-leader RPCs
--
-- Everything a tribe leader's phone can reach. Three functions are granted to
-- `anon` because leaders are handed a paper join code and may be standing there
-- on a co-leader's phone with no camp account at all — routing them through
-- login, onboarding, rules and team selection first would lose the game the
-- moment a battery dies.
--
-- The join code is the credential, and it is checked here, on the server. The
-- bg_ tables have RLS with no policies, so these SECURITY DEFINER functions are
-- the only way in. No function in this file emits a station code for any
-- station, in any branch, ever.

-- ---------------------------------------------------------------------------
-- 1. The one state builder
-- ---------------------------------------------------------------------------
--
-- Join, poll and submit all return through this, so there is exactly one place
-- where the question "what is this tribe allowed to see right now?" is answered.
-- Granted to nobody: it takes a tribe id directly, so exposing it would let any
-- caller read any tribe's state.

CREATE OR REPLACE FUNCTION public.bg_leader_state_json(p_tribe_id text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_game            bg_game%ROWTYPE;
  v_tribe           bg_tribes%ROWTYPE;
  v_result          bg_round_results%ROWTYPE;
  v_station_index   int;
  v_current         jsonb := NULL;
  v_next            jsonb := NULL;
  v_history         jsonb;
  v_completed_count int;
  v_round_done      boolean := false;
  v_round_status    text := NULL;
BEGIN
  SELECT * INTO v_game FROM bg_game LIMIT 1;
  SELECT * INTO v_tribe FROM bg_tribes WHERE id = p_tribe_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown tribe %', p_tribe_id;
  END IF;

  IF v_game.current_round BETWEEN 1 AND 6 THEN
    SELECT * INTO v_result
    FROM bg_round_results
    WHERE tribe_id = p_tribe_id AND round = v_game.current_round;

    IF FOUND THEN
      v_round_status := v_result.status;
      -- SKIPPED counts as "done with this round" for screen purposes even
      -- though it does not count toward completed stations.
      v_round_done := v_result.status IN ('COMPLETED', 'OVERRIDDEN', 'SKIPPED');
    END IF;
  END IF;

  -- A destination exists only while the game is live. In SETUP the leader must
  -- see nothing at all — handing out the first station early lets tribes drift
  -- toward it before the director has everyone assembled. In FINISHED there is
  -- nowhere left to go.
  IF v_game.status IN ('ACTIVE', 'PAUSED') AND v_game.current_round BETWEEN 1 AND 6 THEN
    v_station_index := public.bg_station_index(v_tribe."index", v_game.current_round);

    SELECT jsonb_build_object(
             'id', s.id,
             'index', s."index",
             'name', s.name,
             'location', s.location,
             'shortDescription', s.short_description,
             'instructions', s.instructions
           )
    INTO v_current
    FROM bg_stations s
    WHERE s."index" = v_station_index;

    -- The next destination stays hidden unless the director explicitly opens
    -- it. Default off: revealing it early sends a finished tribe walking toward
    -- a station another tribe is still standing in, which breaks the
    -- one-tribe-per-station guarantee the entire route exists to provide. The
    -- director opens the movement window by advancing the round, which reveals
    -- the next destination to all twelve tribes at the same instant.
    IF v_game.reveal_next_early
       AND v_round_done
       AND v_game.current_round < v_game.round_count THEN
      SELECT jsonb_build_object(
               'id', s.id,
               'index', s."index",
               'name', s.name,
               'location', s.location,
               'shortDescription', s.short_description,
               'instructions', s.instructions
             )
      INTO v_next
      FROM bg_stations s
      WHERE s."index" = public.bg_station_index(v_tribe."index", v_game.current_round + 1);
    END IF;
  END IF;

  -- MISSED and SKIPPED deliberately do not count. A tribe that ran out of time
  -- simply ends with one fewer station.
  SELECT count(*) INTO v_completed_count
  FROM bg_round_results
  WHERE tribe_id = p_tribe_id AND status IN ('COMPLETED', 'OVERRIDDEN');

  SELECT COALESCE(
           jsonb_agg(
             jsonb_build_object(
               'round', r.round,
               'stationId', r.station_id,
               'stationName', COALESCE(s.name, r.station_id),
               'status', r.status,
               'completedAt', r.completed_at
             )
             ORDER BY r.round
           ),
           '[]'::jsonb
         )
  INTO v_history
  FROM bg_round_results r
  LEFT JOIN bg_stations s ON s.id = r.station_id
  WHERE r.tribe_id = p_tribe_id;

  RETURN jsonb_build_object(
    'serverTime', now(),
    'game', jsonb_build_object(
      'status', v_game.status,
      'currentRound', v_game.current_round,
      'roundCount', v_game.round_count,
      'revealNextEarly', v_game.reveal_next_early,
      'startedAt', v_game.started_at,
      'finishedAt', v_game.finished_at,
      'roundStartedAt', v_game.round_started_at
    ),
    'tribe', jsonb_build_object(
      'id', v_tribe.id,
      'index', v_tribe."index",
      'displayName', v_tribe.display_name,
      'parentTeam', v_tribe.parent_team
    ),
    'currentStation', v_current,
    'nextStation', v_next,
    'currentRoundCompleted', v_round_done,
    'currentRoundStatus', v_round_status,
    'completedCount', v_completed_count,
    'history', v_history
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. Join
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.bg_join(p_join_code text, p_device_id text)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_code   text;
  v_tribe  bg_tribes%ROWTYPE;
  v_recent int;
  v_token  text;
BEGIN
  -- Strip every space, not just the ends: a leader reading a paper slip will
  -- type "K4M 9PT" as often as not.
  v_code := upper(regexp_replace(COALESCE(p_join_code, ''), '\s', '', 'g'));

  SELECT count(*) INTO v_recent
  FROM bg_join_attempts
  WHERE device_id = p_device_id
    AND succeeded = false
    AND created_at > now() - interval '1 minute';

  IF v_recent >= 10 THEN
    -- Deliberately does not log this attempt: otherwise a throttled device
    -- keeps extending its own throttle window forever.
    RETURN jsonb_build_object('ok', false, 'reason', 'THROTTLED');
  END IF;

  SELECT * INTO v_tribe FROM bg_tribes WHERE join_code = v_code;

  IF NOT FOUND THEN
    INSERT INTO bg_join_attempts (device_id, succeeded) VALUES (p_device_id, false);
    -- One undifferentiated failure. Never hint that a prefix was close.
    RETURN jsonb_build_object('ok', false, 'reason', 'INVALID');
  END IF;

  INSERT INTO bg_join_attempts (device_id, succeeded) VALUES (p_device_id, true);

  -- A fresh session, and crucially NOT an invalidation of the tribe's existing
  -- ones. The leader's phone dying mid-game is the expected case, not an
  -- attack: a co-leader joins with the same paper code and both phones work.
  v_token := replace(gen_random_uuid()::text, '-', '')
          || replace(gen_random_uuid()::text, '-', '');

  INSERT INTO bg_sessions (token, tribe_id, device_id)
  VALUES (v_token, v_tribe.id, p_device_id);

  RETURN jsonb_build_object(
    'ok', true,
    'token', v_token,
    'state', public.bg_leader_state_json(v_tribe.id)
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Poll
-- ---------------------------------------------------------------------------
--
-- Every leader phone calls this every seven seconds for the length of the
-- event. It is how a round advance reaches twelve screens without anyone
-- refreshing anything, so it stays cheap and writes no more than a heartbeat.

CREATE OR REPLACE FUNCTION public.bg_leader_state(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_tribe_id text;
BEGIN
  SELECT tribe_id INTO v_tribe_id
  FROM bg_sessions
  WHERE token = p_token AND expires_at > now();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'INVALID_SESSION');
  END IF;

  UPDATE bg_sessions SET last_seen_at = now() WHERE token = p_token;

  RETURN jsonb_build_object('ok', true, 'state', public.bg_leader_state_json(v_tribe_id));
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. Submit
-- ---------------------------------------------------------------------------
--
-- The tribe is resolved from the session token and never from anything the
-- client sends. A client-supplied tribe id is not trusted, not validated, not
-- accepted — it is simply not a parameter.

CREATE OR REPLACE FUNCTION public.bg_submit_code(
  p_token           text,
  p_code            text,
  p_expected_round  int,
  p_idempotency_key text
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_tribe    bg_tribes%ROWTYPE;
  v_game     bg_game%ROWTYPE;
  v_tribe_id text;
  v_result   bg_round_results%ROWTYPE;
  v_code     text;
  v_expected text;
  v_station  text;
  v_recent   int;
  v_inserted int;
  v_outcome  text;
BEGIN
  SELECT tribe_id INTO v_tribe_id
  FROM bg_sessions
  WHERE token = p_token AND expires_at > now();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'INVALID_SESSION');
  END IF;

  SELECT * INTO v_tribe FROM bg_tribes WHERE id = v_tribe_id;
  SELECT * INTO v_game FROM bg_game LIMIT 1;

  -- Nothing is recorded outside a live round. These are not errors; they are
  -- ordinary states a leader can be sitting in.
  IF v_game.status = 'SETUP' THEN
    RETURN jsonb_build_object('ok', true, 'outcome', 'NOT_STARTED',
      'round', v_game.current_round, 'state', public.bg_leader_state_json(v_tribe_id));
  END IF;

  IF v_game.status = 'PAUSED' THEN
    RETURN jsonb_build_object('ok', true, 'outcome', 'PAUSED',
      'round', v_game.current_round, 'state', public.bg_leader_state_json(v_tribe_id));
  END IF;

  IF v_game.status = 'FINISHED' THEN
    RETURN jsonb_build_object('ok', true, 'outcome', 'FINISHED',
      'round', v_game.current_round, 'state', public.bg_leader_state_json(v_tribe_id));
  END IF;

  -- The round moved while this submission was in the air — typed just before
  -- the horn, or queued on a phone that was offline behind the dining hall.
  -- Grade nothing: the code was typed for a station this tribe has already
  -- left, and evaluating it against the new round is meaningless either way.
  IF p_expected_round IS NOT NULL AND p_expected_round <> v_game.current_round THEN
    RETURN jsonb_build_object('ok', true, 'outcome', 'ROUND_CHANGED',
      'round', v_game.current_round, 'state', public.bg_leader_state_json(v_tribe_id));
  END IF;

  -- A back-off to protect the server, never a lockout. There is no attempt
  -- limit and no punitive state anywhere in this function: a camper mistyping
  -- under pressure must never be able to end their team's game.
  SELECT count(*) INTO v_recent
  FROM bg_attempts
  WHERE tribe_id = v_tribe_id AND created_at > now() - interval '1 minute';

  IF v_recent > 10 THEN
    RETURN jsonb_build_object('ok', true, 'outcome', 'THROTTLED',
      'round', v_game.current_round, 'state', public.bg_leader_state_json(v_tribe_id));
  END IF;

  -- Already done. Covers both the honest "they tapped submit twice" and the
  -- retry of a request whose success reply never made it back over the Wi-Fi.
  SELECT * INTO v_result
  FROM bg_round_results
  WHERE tribe_id = v_tribe_id AND round = v_game.current_round;

  IF FOUND THEN
    RETURN jsonb_build_object('ok', true, 'outcome', 'ALREADY_COMPLETE',
      'round', v_game.current_round, 'state', public.bg_leader_state_json(v_tribe_id));
  END IF;

  -- Compare against exactly one code: this tribe's assigned station for the
  -- current global round. Last round's code, and the code of the station next
  -- door, are simply not in the comparison.
  v_code := upper(btrim(regexp_replace(COALESCE(p_code, ''), '\s+', ' ', 'g')));

  SELECT s.id INTO v_station
  FROM bg_stations s
  WHERE s."index" = public.bg_station_index(v_tribe."index", v_game.current_round);

  SELECT c.code INTO v_expected
  FROM bg_station_codes c
  WHERE c.station_id = v_station AND c.round = v_game.current_round;

  INSERT INTO bg_attempts (tribe_id, round, submitted_code, correct)
  VALUES (v_tribe_id, v_game.current_round, v_code,
          v_expected IS NOT NULL AND v_code = v_expected);

  -- Wrong. Nothing else changes, and the reply is identical whether the code
  -- was gibberish, last round's code, or the correct code for the station next
  -- door. Anything that distinguishes those lets a tribe binary-search the
  -- answer instead of doing the challenge.
  IF v_expected IS NULL OR v_code <> v_expected THEN
    RETURN jsonb_build_object('ok', true, 'outcome', 'INCORRECT',
      'round', v_game.current_round, 'state', public.bg_leader_state_json(v_tribe_id));
  END IF;

  -- Correct. ON CONFLICT is the whole concurrency story: two co-leaders
  -- submitting the same code at the same instant produce one record, and both
  -- phones are told they succeeded. completed_at is server time — a phone with
  -- a wrong clock must not be able to rewrite the result order.
  INSERT INTO bg_round_results (
    tribe_id, round, station_id, status, submitted_code, completed_at, idempotency_key
  )
  VALUES (
    v_tribe_id, v_game.current_round, v_station, 'COMPLETED', v_code, now(), p_idempotency_key
  )
  ON CONFLICT (tribe_id, round) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_inserted = 1 THEN
    v_outcome := 'CORRECT';
  ELSE
    v_outcome := 'ALREADY_COMPLETE';
  END IF;

  RETURN jsonb_build_object('ok', true, 'outcome', v_outcome,
    'round', v_game.current_round, 'state', public.bg_leader_state_json(v_tribe_id));
END;
$$;

-- ---------------------------------------------------------------------------
-- 5. Grants
-- ---------------------------------------------------------------------------
--
-- anon is required, and is safe here precisely because the join code is checked
-- server-side and every reply is scoped to the session's own tribe.

REVOKE ALL ON FUNCTION public.bg_leader_state_json(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_join(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_leader_state(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bg_submit_code(text, text, int, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.bg_join(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bg_leader_state(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bg_submit_code(text, text, int, text) TO anon, authenticated;

-- bg_leader_state_json is granted to nobody on purpose. It takes a tribe id, so
-- a grant would hand any caller every other tribe's state.
