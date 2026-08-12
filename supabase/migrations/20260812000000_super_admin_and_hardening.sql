-- Super admin role + registration hardening
--
-- Three things happen here:
--   1. A `super_admin` tier above `is_admin`, bootstrapped to a single known
--      account, allowed to change every camp setting.
--   2. Server-side protection of the sensitive settings columns, so the
--      restriction is real and not merely a hidden tab in the UI.
--   3. The registration self-escalation guards that were outstanding from the
--      team-locking rework, plus realtime on camp_settings.

-- ---------------------------------------------------------------------------
-- 1. Super admin column + bootstrap
-- ---------------------------------------------------------------------------

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_super_admin boolean NOT NULL DEFAULT false;

-- The bootstrap identity lives in exactly one place. Changing who the super
-- admin is means changing this function (or flipping profiles.is_super_admin
-- while already signed in as a super admin).
CREATE OR REPLACE FUNCTION public.super_admin_email()
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 'gn_farag02@outlook.com'::text;
$$;

-- Promote the bootstrap account if it already exists. Matching is
-- case-insensitive because auth.users stores whatever case the user typed.
UPDATE profiles p
SET is_super_admin = true,
    is_admin = true
FROM auth.users u
WHERE u.id = p.id
  AND lower(u.email) = lower(public.super_admin_email());

-- ---------------------------------------------------------------------------
-- 2. is_super_admin() helper
-- ---------------------------------------------------------------------------

-- SECURITY DEFINER so it can read auth.users. The email fallback means the
-- bootstrap account gets super-admin rights even if it signs up *after* this
-- migration runs — otherwise promoting it would need a super admin that does
-- not exist yet, a chicken-and-egg lockout.
CREATE OR REPLACE FUNCTION public.is_super_admin(p_uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_flag boolean;
  v_email text;
BEGIN
  IF p_uid IS NULL THEN
    RETURN false;
  END IF;

  SELECT is_super_admin INTO v_flag FROM profiles WHERE id = p_uid;
  IF COALESCE(v_flag, false) THEN
    RETURN true;
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = p_uid;
  RETURN v_email IS NOT NULL
     AND lower(v_email) = lower(public.super_admin_email());
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.super_admin_email() TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. Nobody grants themselves super admin
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.guard_super_admin_flag()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Server-side jobs and migrations (no JWT) are always allowed.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.is_super_admin IS DISTINCT FROM OLD.is_super_admin
     AND NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only a super admin can change super admin status'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_super_admin_flag_trigger ON profiles;
CREATE TRIGGER guard_super_admin_flag_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_super_admin_flag();

-- ---------------------------------------------------------------------------
-- 4. Protect the sensitive camp_settings columns
-- ---------------------------------------------------------------------------

-- The existing "Only admins can update camp settings" policy is FOR ALL on
-- is_admin, so every admin can currently write every column through the API.
-- Rather than tighten that policy (which would break the lock + visibility
-- toggles admins rely on), gate only the columns that define the shape of the
-- camp. Admins keep locks and visibility; super admins get everything.
CREATE OR REPLACE FUNCTION public.guard_camp_settings_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF public.is_super_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  IF NEW.max_team_size IS DISTINCT FROM OLD.max_team_size THEN
    RAISE EXCEPTION 'Only a super admin can change the maximum team size'
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.camp_start_date IS DISTINCT FROM OLD.camp_start_date THEN
    RAISE EXCEPTION 'Only a super admin can change the camp start date'
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.lock_date IS DISTINCT FROM OLD.lock_date THEN
    RAISE EXCEPTION 'Only a super admin can change the team lock date'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_camp_settings_columns_trigger ON camp_settings;
CREATE TRIGGER guard_camp_settings_columns_trigger
  BEFORE UPDATE ON camp_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_camp_settings_columns();

-- ---------------------------------------------------------------------------
-- 5. Registration self-escalation guards (outstanding from the locking rework)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.guard_registration_self_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_is_admin boolean;
BEGIN
  IF v_actor IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(is_admin, false) INTO v_is_admin
  FROM profiles WHERE id = v_actor;

  IF COALESCE(v_is_admin, false) OR public.is_super_admin(v_actor) THEN
    RETURN NEW;
  END IF;

  -- Only guard a camper editing their own registration. Admin-driven edits are
  -- already covered by the branch above.
  IF NEW.user_id IS DISTINCT FROM v_actor THEN
    RETURN NEW;
  END IF;

  -- Spending switches (decreasing) is normal. Granting yourself more is not.
  IF COALESCE(NEW.switches_remaining, 0) > COALESCE(OLD.switches_remaining, 0) THEN
    RAISE EXCEPTION 'You cannot increase your own remaining team switches'
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'You cannot change your own role'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_registration_self_escalation_trigger ON camp_registrations;
CREATE TRIGGER guard_registration_self_escalation_trigger
  BEFORE UPDATE ON camp_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_registration_self_escalation();

-- ---------------------------------------------------------------------------
-- 6. Realtime for camp_settings
-- ---------------------------------------------------------------------------

-- useCampSettings subscribes to postgres_changes on camp_settings so admin
-- lock toggles propagate live. Without the table in the publication the
-- subscription silently never fires.
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE camp_settings;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END;
$$;
