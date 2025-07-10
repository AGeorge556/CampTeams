/*
# Summer Camp Team Selection Database Schema

1. New Tables
   - `profiles` - User profiles with camp-specific information
     - `id` (uuid, primary key, references auth.users)
     - `full_name` (text)
     - `grade` (integer, 7-12)
     - `gender` (text, male/female)
     - `preferred_team` (text, red/blue/green/yellow)
     - `current_team` (text, red/blue/green/yellow)
     - `friend_requests` (text array, up to 3 usernames)
     - `switches_remaining` (integer, default 3)
     - `created_at` (timestamp)
     - `updated_at` (timestamp)

   - `team_switches` - Track all team switch history
     - `id` (uuid, primary key)
     - `user_id` (uuid, references profiles)
     - `from_team` (text)
     - `to_team` (text)
     - `created_at` (timestamp)

   - `camp_settings` - Global camp configuration
     - `id` (uuid, primary key)
     - `teams_locked` (boolean, default false)
     - `lock_date` (timestamp)
     - `max_team_size` (integer, default 50)
     - `created_at` (timestamp)
     - `updated_at` (timestamp)

2. Security
   - Enable RLS on all tables
   - Add policies for authenticated users to manage their own data
   - Add admin-only policies for camp_settings and team management

3. Functions
   - Function to calculate team balance statistics
   - Function to validate team switches
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  grade integer NOT NULL CHECK (grade >= 7 AND grade <= 12),
  gender text NOT NULL CHECK (gender IN ('male', 'female')),
  preferred_team text NOT NULL CHECK (preferred_team IN ('red', 'blue', 'green', 'yellow')),
  current_team text CHECK (current_team IN ('red', 'blue', 'green', 'yellow')),
  friend_requests text[] DEFAULT '{}',
  switches_remaining integer DEFAULT 3,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create team_switches table
CREATE TABLE IF NOT EXISTS team_switches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  from_team text,
  to_team text NOT NULL CHECK (to_team IN ('red', 'blue', 'green', 'yellow')),
  created_at timestamptz DEFAULT now()
);

-- Create camp_settings table
CREATE TABLE IF NOT EXISTS camp_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teams_locked boolean DEFAULT false,
  lock_date timestamptz,
  max_team_size integer DEFAULT 50,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default camp settings
INSERT INTO camp_settings (teams_locked, max_team_size) VALUES (false, 50)
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_switches ENABLE ROW LEVEL SECURITY;
ALTER TABLE camp_settings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Team switches policies
CREATE POLICY "Users can view all team switches"
  ON team_switches
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own team switches"
  ON team_switches
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Camp settings policies
CREATE POLICY "All users can view camp settings"
  ON camp_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can update camp settings"
  ON camp_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Function to get team balance statistics
CREATE OR REPLACE FUNCTION get_team_balance()
RETURNS TABLE (
  team text,
  total_count bigint,
  male_count bigint,
  female_count bigint,
  grade_7_count bigint,
  grade_8_count bigint,
  grade_9_count bigint,
  grade_10_count bigint,
  grade_11_count bigint,
  grade_12_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.team_name as team,
    COALESCE(COUNT(p.id), 0) as total_count,
    COALESCE(COUNT(p.id) FILTER (WHERE p.gender = 'male'), 0) as male_count,
    COALESCE(COUNT(p.id) FILTER (WHERE p.gender = 'female'), 0) as female_count,
    COALESCE(COUNT(p.id) FILTER (WHERE p.grade = 7), 0) as grade_7_count,
    COALESCE(COUNT(p.id) FILTER (WHERE p.grade = 8), 0) as grade_8_count,
    COALESCE(COUNT(p.id) FILTER (WHERE p.grade = 9), 0) as grade_9_count,
    COALESCE(COUNT(p.id) FILTER (WHERE p.grade = 10), 0) as grade_10_count,
    COALESCE(COUNT(p.id) FILTER (WHERE p.grade = 11), 0) as grade_11_count,
    COALESCE(COUNT(p.id) FILTER (WHERE p.grade = 12), 0) as grade_12_count
  FROM 
    (VALUES ('red'), ('blue'), ('green'), ('yellow')) as t(team_name)
  LEFT JOIN profiles p ON p.current_team = t.team_name
  GROUP BY t.team_name
  ORDER BY t.team_name;
END;
$$ LANGUAGE plpgsql;

-- Function to validate team switch
CREATE OR REPLACE FUNCTION can_switch_team(user_id uuid, new_team text)
RETURNS boolean AS $$
DECLARE
  user_profile profiles%ROWTYPE;
  current_team_size integer;
  max_size integer;
  settings_locked boolean;
BEGIN
  -- Get user profile
  SELECT * INTO user_profile FROM profiles WHERE id = user_id;
  
  -- Check if user exists
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if user has switches remaining
  IF user_profile.switches_remaining <= 0 THEN
    RETURN false;
  END IF;
  
  -- Check if teams are locked
  SELECT teams_locked INTO settings_locked FROM camp_settings LIMIT 1;
  IF settings_locked THEN
    RETURN false;
  END IF;
  
  -- Check if already on the requested team
  IF user_profile.current_team = new_team THEN
    RETURN false;
  END IF;
  
  -- Check team size limit
  SELECT max_team_size INTO max_size FROM camp_settings LIMIT 1;
  SELECT COUNT(*) INTO current_team_size FROM profiles WHERE current_team = new_team;
  
  IF current_team_size >= max_size THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_camp_settings_updated_at
  BEFORE UPDATE ON camp_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();