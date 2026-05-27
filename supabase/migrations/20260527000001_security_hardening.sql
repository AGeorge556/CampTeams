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

CREATE POLICY "Authenticated users can view camp registrations"
  ON camp_registrations FOR SELECT
  TO authenticated
  USING (true);

-- Admins can update ANY registration (team reassignment, role changes).
-- Regular users are still covered by the existing "Users can update own" policy.
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
CREATE POLICY "Admins can delete any registration"
  ON camp_registrations FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ── profiles ──────────────────────────────────────────────────────────────────

-- Admins can update any profile (role changes, is_admin toggles).
-- The existing "Users can update their own profile" policy already covers self-edits.
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

-- Only admins can mutate camp records (name, dates, announcements, etc.).
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

-- Users may only insert their own switch records.
CREATE POLICY "Users can insert own team switches"
  ON team_switches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own history; admins can read all.
CREATE POLICY "Users or admins can view team switches"
  ON team_switches FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
