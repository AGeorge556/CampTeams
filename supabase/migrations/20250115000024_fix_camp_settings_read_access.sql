-- Fix camp_settings RLS policies to allow all authenticated users to read visibility settings
-- This is needed because non-admin users need to know if features are visible

-- Drop existing policies
DROP POLICY IF EXISTS "All users can view camp settings" ON camp_settings;
DROP POLICY IF EXISTS "Only admins can update camp settings" ON camp_settings;
DROP POLICY IF EXISTS "Only admins can insert camp settings" ON camp_settings;

-- Create new policies
-- Allow all authenticated users to read camp_settings (needed for visibility checks)
CREATE POLICY "All authenticated users can view camp settings"
  ON camp_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert camp_settings
CREATE POLICY "Only admins can insert camp settings"
  ON camp_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Only admins can update camp_settings
CREATE POLICY "Only admins can update camp settings"
  ON camp_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Only admins can delete camp_settings
CREATE POLICY "Only admins can delete camp settings"
  ON camp_settings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
