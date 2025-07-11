-- Update the can_switch_team function to include grade limit checking
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
  
  -- Check if user has switches remaining
  IF user_profile.switches_remaining <= 0 THEN
    RETURN false;
  END IF;
  
  -- Check if teams are locked
  SELECT teams_locked INTO settings_locked FROM camp_settings LIMIT 1;
  IF settings_locked THEN
    RETURN false;
  END IF;
  
  -- Check current team size
  SELECT COUNT(*) INTO current_team_size 
  FROM profiles 
  WHERE current_team = new_team;
  
  -- Get max team size
  SELECT max_team_size INTO max_size FROM camp_settings LIMIT 1;
  
  -- Check if team is full
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