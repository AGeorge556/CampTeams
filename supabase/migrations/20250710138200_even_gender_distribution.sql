-- Enforce near-even gender distribution across teams and align team balance counts with participants only

-- Update get_team_balance to exclude non-participating users (e.g., admins)
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
    COALESCE(COUNT(p.id) FILTER (WHERE p.participate_in_teams = true), 0) as total_count,
    COALESCE(COUNT(p.id) FILTER (WHERE p.gender = 'male' AND p.participate_in_teams = true), 0) as male_count,
    COALESCE(COUNT(p.id) FILTER (WHERE p.gender = 'female' AND p.participate_in_teams = true), 0) as female_count,
    COALESCE(COUNT(p.id) FILTER (WHERE p.grade = 7 AND p.participate_in_teams = true), 0) as grade_7_count,
    COALESCE(COUNT(p.id) FILTER (WHERE p.grade = 8 AND p.participate_in_teams = true), 0) as grade_8_count,
    COALESCE(COUNT(p.id) FILTER (WHERE p.grade = 9 AND p.participate_in_teams = true), 0) as grade_9_count,
    COALESCE(COUNT(p.id) FILTER (WHERE p.grade = 10 AND p.participate_in_teams = true), 0) as grade_10_count,
    COALESCE(COUNT(p.id) FILTER (WHERE p.grade = 11 AND p.participate_in_teams = true), 0) as grade_11_count,
    COALESCE(COUNT(p.id) FILTER (WHERE p.grade = 12 AND p.participate_in_teams = true), 0) as grade_12_count
  FROM 
    (VALUES ('red'), ('blue'), ('green'), ('yellow')) as t(team_name)
  LEFT JOIN profiles p ON p.current_team = t.team_name
  GROUP BY t.team_name
  ORDER BY t.team_name;
END;
$$ LANGUAGE plpgsql;


-- Update can_switch_team to also enforce near-even distribution of each gender across teams
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
  min_male_count integer;
  min_female_count integer;
BEGIN
  -- Get user profile
  SELECT * INTO user_profile FROM profiles WHERE id = user_id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Exclude admins who are not participating
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

  -- Already on requested team
  IF user_profile.current_team = new_team THEN
    RETURN false;
  END IF;

  -- Team size limit
  SELECT max_team_size INTO max_size FROM camp_settings LIMIT 1;
  SELECT COUNT(*) INTO current_team_size FROM profiles WHERE current_team = new_team AND participate_in_teams = true;
  IF current_team_size >= max_size THEN
    RETURN false;
  END IF;

  -- Grade limit (max 4 per grade per team)
  SELECT COUNT(*) INTO players_in_same_grade
  FROM profiles 
  WHERE current_team = new_team AND grade = user_profile.grade AND participate_in_teams = true;
  IF players_in_same_grade >= max_players_per_grade THEN
    RETURN false;
  END IF;

  -- Gender balance within the target team (keep difference within 2)
  SELECT 
    COALESCE(COUNT(*) FILTER (WHERE gender = 'male'), 0),
    COALESCE(COUNT(*) FILTER (WHERE gender = 'female'), 0)
  INTO current_male_count, current_female_count
  FROM profiles 
  WHERE current_team = new_team AND participate_in_teams = true;

  new_male_count := current_male_count + (CASE WHEN user_profile.gender = 'male' THEN 1 ELSE 0 END);
  new_female_count := current_female_count + (CASE WHEN user_profile.gender = 'female' THEN 1 ELSE 0 END);

  IF ABS(new_male_count - new_female_count) > max_gender_difference THEN
    RETURN false;
  END IF;

  -- Global near-even distribution for each gender across teams.
  -- For the user's gender, ensure target team would be within +1 of the minimum count across teams.
  SELECT MIN(cnt) INTO min_male_count FROM (
    SELECT COUNT(*) AS cnt FROM profiles WHERE current_team = 'red' AND gender = 'male' AND participate_in_teams = true
    UNION ALL
    SELECT COUNT(*) FROM profiles WHERE current_team = 'blue' AND gender = 'male' AND participate_in_teams = true
    UNION ALL
    SELECT COUNT(*) FROM profiles WHERE current_team = 'green' AND gender = 'male' AND participate_in_teams = true
    UNION ALL
    SELECT COUNT(*) FROM profiles WHERE current_team = 'yellow' AND gender = 'male' AND participate_in_teams = true
  ) s;

  SELECT MIN(cnt) INTO min_female_count FROM (
    SELECT COUNT(*) AS cnt FROM profiles WHERE current_team = 'red' AND gender = 'female' AND participate_in_teams = true
    UNION ALL
    SELECT COUNT(*) FROM profiles WHERE current_team = 'blue' AND gender = 'female' AND participate_in_teams = true
    UNION ALL
    SELECT COUNT(*) FROM profiles WHERE current_team = 'green' AND gender = 'female' AND participate_in_teams = true
    UNION ALL
    SELECT COUNT(*) FROM profiles WHERE current_team = 'yellow' AND gender = 'female' AND participate_in_teams = true
  ) s2;

  IF user_profile.gender = 'male' THEN
    IF new_male_count > COALESCE(min_male_count, 0) + 1 THEN
      RETURN false;
    END IF;
  ELSE
    IF new_female_count > COALESCE(min_female_count, 0) + 1 THEN
      RETURN false;
    END IF;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;


