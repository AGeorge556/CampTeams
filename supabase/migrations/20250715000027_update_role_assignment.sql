-- Update role assignment logic — only applies if profiles.role column exists
-- (The role column is added by a later migration; this is a no-op if it doesn't exist yet)

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    -- Drop and re-add constraint with all valid values
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('admin', 'shop_owner', 'team_leader', 'camper'));

    ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'camper';

    UPDATE profiles SET role = 'camper' WHERE role = 'team_leader' AND is_admin = false;
    UPDATE profiles SET role = 'admin'  WHERE is_admin = true AND role = 'camper';
  END IF;
END $$;
