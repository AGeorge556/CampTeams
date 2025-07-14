-- Add gender balance enforcement to team switching
-- This migration updates the can_switch_team function to prevent switches that would create significant gender imbalances

CREATE OR REPLACE FUNCTION can_switch_team(user_id uuid, new_team text)
RETURNS boolean AS $$
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
  SELECT COUNT(*) INTO current_team_size FROM profiles WHERE current_team = new_team AND participate_in_teams = true;
  
  IF current_team_size >= max_size THEN
    RETURN false;
  END IF;
  
  -- Check grade limit (max 4 players per grade per team)
  SELECT COUNT(*) INTO players_in_same_grade
  FROM profiles 
  WHERE current_team = new_team AND grade = user_profile.grade AND participate_in_teams = true;
  
  IF players_in_same_grade >= max_players_per_grade THEN
    RETURN false;
  END IF;
  
  -- Check gender balance
  SELECT 
    COALESCE(COUNT(*) FILTER (WHERE gender = 'male'), 0),
    COALESCE(COUNT(*) FILTER (WHERE gender = 'female'), 0)
  INTO current_male_count, current_female_count
  FROM profiles 
  WHERE current_team = new_team AND participate_in_teams = true;
  
  -- Calculate what the new counts would be
  IF user_profile.gender = 'male' THEN
    new_male_count := current_male_count + 1;
    new_female_count := current_female_count;
  ELSE
    new_male_count := current_male_count;
    new_female_count := current_female_count + 1;
  END IF;
  
  -- Check if the switch would create an unacceptable gender imbalance
  IF ABS(new_male_count - new_female_count) > max_gender_difference THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql; 