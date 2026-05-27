-- Security hardening migration
-- Fixes:
-- 1. camp_registrations SELECT was restricted to own row only, breaking team rosters
-- 2. No admin override for writes on camp_registrations / profiles
-- 3. No admin policy for camps table mutations

-- ── camp_registrations ────────────────────────────────────────────────────────

-- Allow all authenticated users to read team roster data.
-- Column-level filtering (dropping sensitive PII) is enforced on the frontend
-- by explicit select() calls — this policy covers the row-level gate.
DROP POLICY IF EXISTS "Users can view their own registrations" ON camp_registrations;
DROP POLICY IF EXISTS "Authenticated users can view camp registrations" ON camp_registrations;

CREATE POLICY "Authenticated users can view camp registrations"
  ON camp_registrations FOR SELECT
  TO authenticated
  USING (true);

-- Admins can update ANY registration (team reassignment, role changes).
-- Regular users are still covered by the existing "Users can update own" policy.
DROP POLICY IF EXISTS "Admins can update any registration" ON camp_registrations;
CREATE POLICY "Admins can update any registration"
  ON camp_registrations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Admins can delete registrations (e.g. remove a participant).
DROP POLICY IF EXISTS "Admins can delete any registration" ON camp_registrations;
CREATE POLICY "Admins can delete any registration"
  ON camp_registrations FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ── profiles ──────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ── camps ─────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can update camps" ON camps;
CREATE POLICY "Admins can update camps"
  ON camps FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ── team_switches ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can insert own team switches" ON team_switches;
CREATE POLICY "Users can insert own team switches"
  ON team_switches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users or admins can view team switches" ON team_switches;
CREATE POLICY "Users or admins can view team switches"
  ON team_switches FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
