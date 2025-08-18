-- Enhanced Team Balancing Logic
-- This migration implements strict team balancing rules to ensure even distribution

-- Create a function to get team balance statistics for validation
CREATE OR REPLACE FUNCTION get_team_balance_for_validation()
RETURNS TABLE (
  team text,
  total_count bigint,
  male_count bigint,
  female_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.team_name as team,
    COALESCE(COUNT(p.id), 0) as total_count,
    COALESCE(COUNT(p.id) FILTER (WHERE p.gender = 'male'), 0) as male_count,
    COALESCE(COUNT(p.id) FILTER (WHERE p.gender = 'female'), 0) as female_count
  FROM 
    (VALUES ('red'), ('blue'), ('green'), ('yellow')) as t(team_name)
  LEFT JOIN profiles p ON p.current_team = t.team_name AND p.participate_in_teams = true
  GROUP BY t.team_name
  ORDER BY t.team_name;
END;
$$ LANGUAGE plpgsql;

-- Enhanced team switching function with strict balancing rules
CREATE OR REPLACE FUNCTION can_switch_team(user_id uuid, new_team text)
RETURNS TABLE (
  can_switch boolean,
  reason text
) AS $$
DECLARE
  user_profile profiles%ROWTYPE;
  current_team_size integer;
  max_size integer;
  settings_locked boolean;
  players_in_same_grade integer;
  max_players_per_grade integer := 4;
  current_male_count integer;
  current_female_count integer;
  new_male_count integer;
  new_female_count integer;
  max_gender_difference integer := 2;
  
  -- Team balance variables
  team_balances RECORD;
  min_team_size integer;
  max_team_size integer;
  min_male_count integer;
  max_male_count integer;
  min_female_count integer;
  max_female_count integer;
  new_team_size integer;
  other_teams_avg_size numeric;
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
  
  -- Get current team size (exclude admins)
  SELECT COUNT(*) INTO current_team_size 
  FROM profiles 
  WHERE current_team = new_team AND participate_in_teams = true;
  
  -- Get max team size from settings
  SELECT max_team_size INTO max_size FROM camp_settings LIMIT 1;
  
  -- Check absolute team size limit
  IF current_team_size >= max_size THEN
    RETURN QUERY SELECT false, 'Team is at maximum capacity'::text;
    RETURN;
  END IF;
  
  -- Check grade limit (max 4 players per grade per team, exclude admins)
  SELECT COUNT(*) INTO players_in_same_grade
  FROM profiles 
  WHERE current_team = new_team AND grade = user_profile.grade AND participate_in_teams = true;
  
  IF players_in_same_grade >= max_players_per_grade THEN
    RETURN QUERY SELECT false, 'Maximum players per grade reached'::text;
    RETURN;
  END IF;
  
  -- Get team balance statistics
  SELECT 
    MIN(total_count) as min_size,
    MAX(total_count) as max_size,
    MIN(male_count) as min_male,
    MAX(male_count) as max_male,
    MIN(female_count) as min_female,
    MAX(female_count) as max_female,
    AVG(total_count) as avg_size
  INTO team_balances
  FROM get_team_balance_for_validation();
  
  min_team_size := team_balances.min_size;
  max_team_size := team_balances.max_size;
  min_male_count := team_balances.min_male;
  max_male_count := team_balances.max_male;
  min_female_count := team_balances.min_female;
  max_female_count := team_balances.max_female;
  other_teams_avg_size := team_balances.avg_size;
  
  -- Calculate what the new team size would be
  new_team_size := current_team_size + 1;
  
  -- Check team size balance (teams should stay within 1 player difference)
  IF new_team_size > min_team_size + 1 THEN
    RETURN QUERY SELECT false, 'Team size balance would be disrupted'::text;
    RETURN;
  END IF;
  
  -- Get current gender counts for the target team
  SELECT 
    COALESCE(COUNT(*) FILTER (WHERE gender = 'male'), 0),
    COALESCE(COUNT(*) FILTER (WHERE gender = 'female'), 0)
  INTO current_male_count, current_female_count
  FROM profiles 
  WHERE current_team = new_team AND participate_in_teams = true;
  
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
  
  -- Check gender balance across all teams
  IF user_profile.gender = 'male' THEN
    -- If adding a male, check if this team already has more males than others
    IF new_male_count > min_male_count + 1 THEN
      RETURN QUERY SELECT false, 'Gender balance across teams would be disrupted'::text;
      RETURN;
    END IF;
  ELSE
    -- If adding a female, check if this team already has more females than others
    IF new_female_count > min_female_count + 1 THEN
      RETURN QUERY SELECT false, 'Gender balance across teams would be disrupted'::text;
      RETURN;
    END IF;
  END IF;
  
  -- All checks passed
  RETURN QUERY SELECT true, 'Switch allowed'::text;
END;
$$ LANGUAGE plpgsql;

-- Function to get recommended team for a user
CREATE OR REPLACE FUNCTION get_recommended_team(user_id uuid)
RETURNS TABLE (
  recommended_team text,
  reason text
) AS $$
DECLARE
  user_profile profiles%ROWTYPE;
  team_balances RECORD;
  min_team_size integer;
  min_male_count integer;
  min_female_count integer;
  user_gender text;
BEGIN
  -- Get user profile
  SELECT * INTO user_profile FROM profiles WHERE id = user_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::text, 'User not found'::text;
    RETURN;
  END IF;
  
  user_gender := user_profile.gender;
  
  -- Get team balance statistics
  SELECT 
    MIN(total_count) as min_size,
    MIN(male_count) as min_male,
    MIN(female_count) as min_female
  INTO team_balances
  FROM get_team_balance_for_validation();
  
  min_team_size := team_balances.min_size;
  min_male_count := team_balances.min_male;
  min_female_count := team_balances.min_female;
  
  -- Find teams with minimum size and appropriate gender balance
  IF user_gender = 'male' THEN
    -- Recommend team with fewest males and smallest size
    RETURN QUERY
    SELECT 
      t.team_name as recommended_team,
      'Balanced team size and gender distribution'::text as reason
    FROM get_team_balance_for_validation() t
    WHERE t.total_count = min_team_size 
      AND t.male_count = min_male_count
    ORDER BY t.male_count ASC, t.total_count ASC
    LIMIT 1;
  ELSE
    -- Recommend team with fewest females and smallest size
    RETURN QUERY
    SELECT 
      t.team_name as recommended_team,
      'Balanced team size and gender distribution'::text as reason
    FROM get_team_balance_for_validation() t
    WHERE t.total_count = min_team_size 
      AND t.female_count = min_female_count
    ORDER BY t.female_count ASC, t.total_count ASC
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a team can accept more players
CREATE OR REPLACE FUNCTION can_team_accept_player(team_name text, user_gender text)
RETURNS TABLE (
  can_accept boolean,
  reason text
) AS $$
DECLARE
  current_team_size integer;
  current_male_count integer;
  current_female_count integer;
  max_size integer;
  team_balances RECORD;
  min_team_size integer;
  min_gender_count integer;
  max_gender_count integer;
BEGIN
  -- Get current team stats
  SELECT 
    COALESCE(COUNT(*), 0) as total_count,
    COALESCE(COUNT(*) FILTER (WHERE gender = 'male'), 0) as male_count,
    COALESCE(COUNT(*) FILTER (WHERE gender = 'female'), 0) as female_count
  INTO current_team_size, current_male_count, current_female_count
  FROM profiles 
  WHERE current_team = team_name AND participate_in_teams = true;
  
  -- Get max team size
  SELECT max_team_size INTO max_size FROM camp_settings LIMIT 1;
  
  -- Check absolute size limit
  IF current_team_size >= max_size THEN
    RETURN QUERY SELECT false, 'Team is at maximum capacity'::text;
    RETURN;
  END IF;
  
  -- Get overall team balance
  SELECT 
    MIN(total_count) as min_size,
    MIN(CASE WHEN user_gender = 'male' THEN male_count ELSE female_count END) as min_gender,
    MAX(CASE WHEN user_gender = 'male' THEN male_count ELSE female_count END) as max_gender
  INTO team_balances
  FROM get_team_balance_for_validation();
  
  min_team_size := team_balances.min_size;
  min_gender_count := team_balances.min_gender;
  max_gender_count := team_balances.max_gender;
  
  -- Check team size balance
  IF current_team_size > min_team_size + 1 THEN
    RETURN QUERY SELECT false, 'Team size balance would be disrupted'::text;
    RETURN;
  END IF;
  
  -- Check gender balance
  IF user_gender = 'male' THEN
    IF current_male_count > min_gender_count + 1 THEN
      RETURN QUERY SELECT false, 'Gender balance would be disrupted'::text;
      RETURN;
    END IF;
  ELSE
    IF current_female_count > min_gender_count + 1 THEN
      RETURN QUERY SELECT false, 'Gender balance would be disrupted'::text;
      RETURN;
    END IF;
  END IF;
  
  -- All checks passed
  RETURN QUERY SELECT true, 'Team can accept player'::text;
END;
$$ LANGUAGE plpgsql;
