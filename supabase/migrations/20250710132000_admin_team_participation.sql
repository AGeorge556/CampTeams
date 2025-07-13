-- Add participate_in_teams field to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS participate_in_teams boolean DEFAULT true;

-- Update existing admin profiles to not participate in teams by default
UPDATE profiles SET participate_in_teams = false WHERE is_admin = true;

-- Update the can_switch_team function to check for admin participation
CREATE OR REPLACE FUNCTION can_switch_team(user_id uuid, new_team text)
RETURNS boolean AS $$
DECLARE
  user_profile profiles%ROWTYPE;
  current_team_size integer;
  max_size integer;
  settings_locked boolean;
  players_in_same_grade integer;
  max_players_per_grade integer := 4;
BEGIN
  -- Get user profile
  SELECT * INTO user_profile FROM profiles WHERE id = user_id;
  
  -- Check if user exists
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if admin is participating in teams
  IF user_profile.is_admin AND NOT user_profile.participate_in_teams THEN
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
  
  -- Check grade limit (max 4 players per grade per team)
  SELECT COUNT(*) INTO players_in_same_grade
  FROM profiles 
  WHERE current_team = new_team AND grade = user_profile.grade;
  
  IF players_in_same_grade >= max_players_per_grade THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Update the get_team_balance function to only count participating users
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
  LEFT JOIN profiles p ON p.current_team = t.team_name AND p.participate_in_teams = true
  GROUP BY t.team_name
  ORDER BY t.team_name;
END;
$$ LANGUAGE plpgsql; 