-- Fix RLS policies for camp_settings table
-- Add missing INSERT policy to allow upsert operations

-- Add INSERT policy for admins
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

-- Update the existing UPDATE policy to also handle INSERT operations
DROP POLICY IF EXISTS "Only admins can update camp settings" ON camp_settings;

CREATE POLICY "Only admins can update camp settings"
  ON camp_settings
  FOR ALL
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