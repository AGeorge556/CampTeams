-- Fix Max Team Size Enforcement
-- This migration standardizes max team size to 24 and ensures proper enforcement

-- Update camp_settings to use consistent max_team_size of 24
UPDATE camp_settings 
SET max_team_size = 24 
WHERE max_team_size != 24 OR max_team_size IS NULL;

-- Ensure there's a default record if none exists
INSERT INTO camp_settings (max_team_size, teams_locked) 
VALUES (24, false)
ON CONFLICT DO NOTHING;

-- Create a unified team switching function with proper max team size enforcement
CREATE OR REPLACE FUNCTION can_switch_team(user_id uuid, new_team text)
RETURNS TABLE (
  can_switch boolean,
  reason text
) AS $$
DECLARE
  user_profile profiles%ROWTYPE;
  current_team_size integer;
  max_size integer := 24; -- Fixed max team size
  settings_locked boolean;
  players_in_same_grade integer;
  max_players_per_grade integer := 4;
  current_male_count integer;
  current_female_count integer;
  new_male_count integer;
  new_female_count integer;
  max_gender_difference integer := 2;
BEGIN
  -- Get user profile
  SELECT * INTO user_profile FROM profiles WHERE id = user_id;
  
  -- Check if user exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'User not found'::text;
    RETURN;
  END IF;
  
  -- Check if admin is participating in teams
  IF user_profile.is_admin AND NOT user_profile.participate_in_teams THEN
    RETURN QUERY SELECT false, 'Admin not participating in teams'::text;
    RETURN;
  END IF;
  
  -- Check if user has switches remaining
  IF user_profile.switches_remaining <= 0 THEN
    RETURN QUERY SELECT false, 'No switches remaining'::text;
    RETURN;
  END IF;
  
  -- Check if teams are locked
  SELECT teams_locked INTO settings_locked FROM camp_settings LIMIT 1;
  IF settings_locked THEN
    RETURN QUERY SELECT false, 'Teams are locked'::text;
    RETURN;
  END IF;
  
  -- Check if already on the requested team
  IF user_profile.current_team = new_team THEN
    RETURN QUERY SELECT false, 'Already on this team'::text;
    RETURN;
  END IF;
  
  -- Get current team size (exclude admins who don't participate)
  SELECT COUNT(*) INTO current_team_size 
  FROM profiles 
  WHERE current_team = new_team 
    AND participate_in_teams = true;
  
  -- Check absolute team size limit (24 players max)
  IF current_team_size >= max_size THEN
    RETURN QUERY SELECT false, 'Team is at maximum capacity (24 players)'::text;
    RETURN;
  END IF;
  
  -- Check grade limit (max 4 players per grade per team, exclude non-participating admins)
  SELECT COUNT(*) INTO players_in_same_grade
  FROM profiles 
  WHERE current_team = new_team 
    AND grade = user_profile.grade 
    AND participate_in_teams = true;
  
  IF players_in_same_grade >= max_players_per_grade THEN
    RETURN QUERY SELECT false, 'Maximum players per grade reached (4 per grade)'::text;
    RETURN;
  END IF;
  
  -- Get current gender counts for the target team (exclude non-participating admins)
  SELECT 
    COALESCE(COUNT(*) FILTER (WHERE gender = 'male'), 0),
    COALESCE(COUNT(*) FILTER (WHERE gender = 'female'), 0)
  INTO current_male_count, current_female_count
  FROM profiles 
  WHERE current_team = new_team 
    AND participate_in_teams = true;
  
  -- Calculate what the new gender counts would be
  IF user_profile.gender = 'male' THEN
    new_male_count := current_male_count + 1;
    new_female_count := current_female_count;
  ELSE
    new_male_count := current_male_count;
    new_female_count := current_female_count + 1;
  END IF;
  
  -- Check gender balance within the team (max 2 difference)
  IF ABS(new_male_count - new_female_count) > max_gender_difference THEN
    RETURN QUERY SELECT false, 'Gender balance within team would be disrupted'::text;
    RETURN;
  END IF;
  
  -- All checks passed
  RETURN QUERY SELECT true, 'Switch allowed'::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get current team sizes for validation
CREATE OR REPLACE FUNCTION get_team_sizes()
RETURNS TABLE (
  team text,
  size integer,
  male_count integer,
  female_count integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.team_name as team,
    COALESCE(COUNT(p.id), 0) as size,
    COALESCE(COUNT(p.id) FILTER (WHERE p.gender = 'male'), 0) as male_count,
    COALESCE(COUNT(p.id) FILTER (WHERE p.gender = 'female'), 0) as female_count
  FROM 
    (VALUES ('red'), ('blue'), ('green'), ('yellow')) as t(team_name)
  LEFT JOIN profiles p ON p.current_team = t.team_name AND p.participate_in_teams = true
  GROUP BY t.team_name
  ORDER BY t.team_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to validate team assignments during onboarding
CREATE OR REPLACE FUNCTION validate_team_assignment(new_team text, user_gender text)
RETURNS TABLE (
  can_assign boolean,
  reason text
) AS $$
DECLARE
  current_team_size integer;
  max_size integer := 24; -- Fixed max team size
  current_male_count integer;
  current_female_count integer;
  new_male_count integer;
  new_female_count integer;
  max_gender_difference integer := 2;
BEGIN
  -- Get current team stats (exclude non-participating admins)
  SELECT 
    COALESCE(COUNT(*), 0) as total_count,
    COALESCE(COUNT(*) FILTER (WHERE gender = 'male'), 0) as male_count,
    COALESCE(COUNT(*) FILTER (WHERE gender = 'female'), 0) as female_count
  INTO current_team_size, current_male_count, current_female_count
  FROM profiles 
  WHERE current_team = new_team 
    AND participate_in_teams = true;
  
  -- Check absolute size limit
  IF current_team_size >= max_size THEN
    RETURN QUERY SELECT false, 'Team is at maximum capacity (24 players)'::text;
    RETURN;
  END IF;
  
  -- Calculate what the new gender counts would be
  IF user_gender = 'male' THEN
    new_male_count := current_male_count + 1;
    new_female_count := current_female_count;
  ELSE
    new_male_count := current_male_count;
    new_female_count := current_female_count + 1;
  END IF;
  
  -- Check gender balance within the team (max 2 difference)
  IF ABS(new_male_count - new_female_count) > max_gender_difference THEN
    RETURN QUERY SELECT false, 'Gender balance within team would be disrupted'::text;
    RETURN;
  END IF;
  
  -- All checks passed
  RETURN QUERY SELECT true, 'Team can accept player'::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get team balance statistics
CREATE OR REPLACE FUNCTION get_team_balance_stats()
RETURNS TABLE (
  team text,
  total_players integer,
  male_players integer,
  female_players integer,
  at_capacity boolean,
  can_accept_male boolean,
  can_accept_female boolean
) AS $$
DECLARE
  max_size integer := 24; -- Fixed max team size
  max_gender_difference integer := 2;
BEGIN
  RETURN QUERY
  SELECT 
    t.team_name as team,
    COALESCE(COUNT(p.id), 0) as total_players,
    COALESCE(COUNT(p.id) FILTER (WHERE p.gender = 'male'), 0) as male_players,
    COALESCE(COUNT(p.id) FILTER (WHERE p.gender = 'female'), 0) as female_players,
    COALESCE(COUNT(p.id), 0) >= max_size as at_capacity,
    COALESCE(COUNT(p.id), 0) < max_size AND 
    ABS(COALESCE(COUNT(p.id) FILTER (WHERE p.gender = 'male'), 0) + 1 - 
        COALESCE(COUNT(p.id) FILTER (WHERE p.gender = 'female'), 0)) <= max_gender_difference as can_accept_male,
    COALESCE(COUNT(p.id), 0) < max_size AND 
    ABS(COALESCE(COUNT(p.id) FILTER (WHERE p.gender = 'male'), 0) - 
        (COALESCE(COUNT(p.id) FILTER (WHERE p.gender = 'female'), 0) + 1)) <= max_gender_difference as can_accept_female
  FROM 
    (VALUES ('red'), ('blue'), ('green'), ('yellow')) as t(team_name)
  LEFT JOIN profiles p ON p.current_team = t.team_name AND p.participate_in_teams = true
  GROUP BY t.team_name
  ORDER BY t.team_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
