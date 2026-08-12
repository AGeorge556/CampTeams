-- Rework team locking / capacity enforcement
-- Date: 2026-08-11
--
-- Why:
-- 1. `can_switch_team_with_reason(uuid, text)` (added in 20250819000000) calls
--    `can_switch_team_with_reason_internal(...)`, which does not exist anywhere
--    in this migration history. Any caller of `can_switch_team_with_reason`
--    errors. Nothing in src/ calls it, but it's broken and should not exist.
-- 2. `can_switch_team`, `can_team_accept_player`, `validate_team_assignment`,
--    `get_team_sizes`, `get_team_balance_stats`, `get_recommended_team`, and
--    `get_team_balance_for_validation` (added in 20250715000017 and
--    20250715000028) all read `profiles.current_team` / `profiles.grade` /
--    `profiles.gender`. Team membership moved to `camp_registrations` in
--    20251216000001, so these functions are stale: they read the wrong table
--    AND are blind to `camp_id` (they'd count players across every camp at
--    once). Nothing in src/ calls any of them. They are deprecated below, not
--    dropped — dropping is a separate decision left to the repo owner.
-- 3. There was never any server-side capacity enforcement for the current
--    `camp_registrations` table. The client (see src/lib/teamRules.ts) checks
--    capacity/locks and then writes `current_team` directly. That's a real
--    hole: two campers can both pass the client check and both land on a
--    team sitting at 23/24, and any authenticated user can PATCH their own
--    `camp_registrations` row straight to a locked or full team, bypassing
--    the client entirely.
--
-- What this migration does:
-- - Drops the broken `can_switch_team_with_reason`.
-- - Adds `get_camp_team_counts(camp_id)` — camp-scoped, admin-excluded team
--   counts, zero-filled for all four teams.
-- - Adds `can_join_team(camp_id, user_id, team)` — enforces only the HARD
--   rules (registration exists, valid team, not already on it, global lock,
--   per-team lock, capacity). Soft balance rules (gender cap, grade cap) are
--   deliberately NOT enforced server-side; they stay client-side guidance in
--   src/lib/teamRules.ts so a camper is never stranded by a preference when
--   every team happens to be at its soft cap. This matches teamRules.ts's
--   HARD/SOFT split exactly.
-- - Adds a BEFORE UPDATE trigger on camp_registrations that calls
--   can_join_team whenever current_team is being changed to a non-null
--   value, closing the race/bypass hole described above. Admin actions and
--   service-role/server-side writes (auth.uid() IS NULL) are exempt so
--   AdminPanel team reassignment and seed scripts keep working. Leaving a
--   team (setting current_team to NULL) is always allowed.
-- - Marks the seven stale functions DEPRECATED via COMMENT ON FUNCTION,
--   without dropping them.
--
-- Idempotent / re-runnable: every CREATE is preceded by DROP ... IF EXISTS.

-- ── 1. Drop the broken function ────────────────────────────────────────────
-- Referenced a `can_switch_team_with_reason_internal` that was never defined
-- in any migration; any call to this function raises "function does not
-- exist". Superseded by can_join_team() below.
DROP FUNCTION IF EXISTS can_switch_team_with_reason(uuid, text);

-- ── 2. get_camp_team_counts ─────────────────────────────────────────────────
DROP FUNCTION IF EXISTS get_camp_team_counts(uuid);

CREATE OR REPLACE FUNCTION get_camp_team_counts(p_camp_id uuid)
RETURNS TABLE (
  team text,
  total_count bigint,
  male_count bigint,
  female_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.team_name AS team,
    COUNT(cr.id) AS total_count,
    COUNT(cr.id) FILTER (WHERE cr.gender = 'male') AS male_count,
    COUNT(cr.id) FILTER (WHERE cr.gender = 'female') AS female_count
  FROM (VALUES ('red'), ('blue'), ('green'), ('yellow')) AS t(team_name)
  -- Admins never count toward capacity (matches src/hooks/usePlayers.ts). The
  -- admin filter must live in the JOIN condition, not a post-join WHERE: a
  -- WHERE on p.is_admin would drop every row for a team whose registrations
  -- are ALL admins (all rows filtered before GROUP BY), making that team
  -- vanish from the result instead of zero-filling. Filtering inside this
  -- subquery keeps the outer LEFT JOIN's zero-fill row intact in every case
  -- (no registrations, all-admin registrations, or mixed).
  LEFT JOIN (
    SELECT cr_inner.*
    FROM camp_registrations cr_inner
    LEFT JOIN profiles p ON p.id = cr_inner.user_id
    WHERE p.is_admin IS NOT TRUE
  ) cr
    ON cr.current_team = t.team_name
    AND cr.camp_id = p_camp_id
    AND cr.participate_in_teams = true
  GROUP BY t.team_name
  ORDER BY t.team_name;
END;
$$;

GRANT EXECUTE ON FUNCTION get_camp_team_counts(uuid) TO authenticated;

-- ── 3. can_join_team ────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS can_join_team(uuid, uuid, text);

CREATE OR REPLACE FUNCTION can_join_team(p_camp_id uuid, p_user_id uuid, p_team text)
RETURNS TABLE (
  allowed boolean,
  reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_registration camp_registrations%ROWTYPE;
  v_teams_locked boolean;
  v_locked_teams text[];
  v_max_team_size integer;
  v_team_total bigint;
BEGIN
  -- Registration must exist for this (camp, user) pair.
  SELECT * INTO v_registration
  FROM camp_registrations
  WHERE camp_id = p_camp_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'not_registered'::text;
    RETURN;
  END IF;

  IF p_team IS NULL OR p_team NOT IN ('red', 'blue', 'green', 'yellow') THEN
    RETURN QUERY SELECT false, 'invalid_team'::text;
    RETURN;
  END IF;

  IF v_registration.current_team = p_team THEN
    RETURN QUERY SELECT false, 'already_on_team'::text;
    RETURN;
  END IF;

  -- camp_settings is a single global row. A MISSING row must not block
  -- joins — default to max_team_size = 24 and no locks in that case.
  SELECT cs.teams_locked, cs.locked_teams, cs.max_team_size
  INTO v_teams_locked, v_locked_teams, v_max_team_size
  FROM camp_settings cs
  LIMIT 1;

  v_teams_locked := COALESCE(v_teams_locked, false);
  v_locked_teams := COALESCE(v_locked_teams, '{}'::text[]);
  v_max_team_size := COALESCE(v_max_team_size, 24);

  IF v_teams_locked THEN
    RETURN QUERY SELECT false, 'teams_locked'::text;
    RETURN;
  END IF;

  IF p_team = ANY(v_locked_teams) THEN
    RETURN QUERY SELECT false, 'team_locked'::text;
    RETURN;
  END IF;

  -- HARD capacity check only. Soft balance rules (per-gender cap, per-grade
  -- cap) are deliberately NOT enforced here — they are preferences, applied
  -- client-side in src/lib/teamRules.ts, which relaxes them rather than
  -- stranding a camper when every team is at its soft cap simultaneously.
  SELECT gtc.total_count INTO v_team_total
  FROM get_camp_team_counts(p_camp_id) gtc
  WHERE gtc.team = p_team;

  IF COALESCE(v_team_total, 0) >= v_max_team_size THEN
    RETURN QUERY SELECT false, 'at_capacity'::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, 'ok'::text;
END;
$$;

GRANT EXECUTE ON FUNCTION can_join_team(uuid, uuid, text) TO authenticated;

-- ── 4. Enforcement trigger ──────────────────────────────────────────────────
-- Closes the hole where the client checks capacity/locks and then writes
-- current_team directly: two campers can both pass the client-side check and
-- both land on a team at 23/24, and any authenticated user can PATCH their
-- own camp_registrations row straight to a locked or full team. This trigger
-- re-validates server-side on every UPDATE that changes current_team.
DROP TRIGGER IF EXISTS enforce_team_join_rules_trigger ON camp_registrations;
DROP FUNCTION IF EXISTS enforce_team_join_rules();

CREATE OR REPLACE FUNCTION enforce_team_join_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_allowed boolean;
  v_reason text;
BEGIN
  -- Leaving a team, or an update that doesn't touch current_team at all, is
  -- always allowed — a locked team must still let members OUT.
  IF NEW.current_team IS NOT DISTINCT FROM OLD.current_team OR NEW.current_team IS NULL THEN
    RETURN NEW;
  END IF;

  -- Service-role / server-side jobs and seed scripts run with no JWT
  -- (auth.uid() IS NULL) and must not be blocked.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Admin actions (e.g. AdminPanel team reassignment) bypass enforcement.
  IF EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RETURN NEW;
  END IF;

  SELECT cjt.allowed, cjt.reason INTO v_allowed, v_reason
  FROM can_join_team(NEW.camp_id, NEW.user_id, NEW.current_team) cjt;

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Team join rejected: %', v_reason
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_team_join_rules_trigger
  BEFORE UPDATE ON camp_registrations
  FOR EACH ROW
  EXECUTE FUNCTION enforce_team_join_rules();

-- ── 5. Deprecate stale profiles-based functions ─────────────────────────────
-- Not dropped — dropping is a separate, riskier decision for the repo owner.
-- Each COMMENT is guarded so the migration doesn't fail if a function is
-- absent in some environment.
DO $$
BEGIN
  IF to_regprocedure('public.can_switch_team(uuid, text)') IS NOT NULL THEN
    COMMENT ON FUNCTION can_switch_team(uuid, text) IS
      'DEPRECATED: reads profiles.current_team/grade/gender instead of camp_registrations and is not camp-scoped. Superseded by can_join_team()/get_camp_team_counts(). Not used by src/.';
  END IF;
END;
$$;

DO $$
BEGIN
  IF to_regprocedure('public.can_team_accept_player(text, text)') IS NOT NULL THEN
    COMMENT ON FUNCTION can_team_accept_player(text, text) IS
      'DEPRECATED: reads profiles.current_team/grade/gender instead of camp_registrations and is not camp-scoped. Superseded by can_join_team()/get_camp_team_counts(). Not used by src/.';
  END IF;
END;
$$;

DO $$
BEGIN
  IF to_regprocedure('public.validate_team_assignment(text, text)') IS NOT NULL THEN
    COMMENT ON FUNCTION validate_team_assignment(text, text) IS
      'DEPRECATED: reads profiles.current_team/grade/gender instead of camp_registrations and is not camp-scoped. Superseded by can_join_team()/get_camp_team_counts(). Not used by src/.';
  END IF;
END;
$$;

DO $$
BEGIN
  IF to_regprocedure('public.get_team_sizes()') IS NOT NULL THEN
    COMMENT ON FUNCTION get_team_sizes() IS
      'DEPRECATED: reads profiles.current_team/gender instead of camp_registrations and is not camp-scoped. Superseded by get_camp_team_counts(uuid). Not used by src/.';
  END IF;
END;
$$;

DO $$
BEGIN
  IF to_regprocedure('public.get_team_balance_stats()') IS NOT NULL THEN
    COMMENT ON FUNCTION get_team_balance_stats() IS
      'DEPRECATED: reads profiles.current_team/gender instead of camp_registrations and is not camp-scoped. Superseded by get_camp_team_counts(uuid). Not used by src/.';
  END IF;
END;
$$;

DO $$
BEGIN
  IF to_regprocedure('public.get_recommended_team(uuid)') IS NOT NULL THEN
    COMMENT ON FUNCTION get_recommended_team(uuid) IS
      'DEPRECATED: reads profiles.current_team/grade/gender instead of camp_registrations and is not camp-scoped. Superseded by can_join_team()/get_camp_team_counts(). Not used by src/.';
  END IF;
END;
$$;

DO $$
BEGIN
  IF to_regprocedure('public.get_team_balance_for_validation()') IS NOT NULL THEN
    COMMENT ON FUNCTION get_team_balance_for_validation() IS
      'DEPRECATED: reads profiles.current_team/gender instead of camp_registrations and is not camp-scoped. Superseded by get_camp_team_counts(uuid). Not used by src/.';
  END IF;
END;
$$;
