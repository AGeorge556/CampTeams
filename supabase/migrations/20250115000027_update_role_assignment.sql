-- Update role assignment logic to make 'camper' the default role
-- and ensure 'team_leader' can only be assigned manually

-- First, update existing users who have 'team_leader' role but shouldn't
-- Only keep 'team_leader' for users who are actually team leaders (to be determined manually)
-- For now, we'll set them to 'camper' and they can be manually promoted later

-- Update the role constraint to include 'camper' and change the default
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'shop_owner', 'team_leader', 'camper'));

-- Change the default role from 'team_leader' to 'camper'
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'camper';

-- Update existing users who have 'team_leader' role to 'camper'
-- This ensures no one automatically gets team_leader role
-- Team leaders will need to be manually assigned by the owner
UPDATE profiles 
SET role = 'camper' 
WHERE role = 'team_leader' AND is_admin = false;

-- Keep admin users as 'admin' role
UPDATE profiles 
SET role = 'admin' 
WHERE is_admin = true AND role = 'camper';
