-- Oil Marking System Migration
-- This migration transforms the oil extraction game from direct excavation to a marking system

-- Create team_marks table to track which teams have marked which squares
CREATE TABLE IF NOT EXISTS team_marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id text NOT NULL CHECK (team_id IN ('red', 'blue', 'green', 'yellow')),
  square_id integer NOT NULL CHECK (square_id >= 1 AND square_id <= 30),
  session_id uuid NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  marked_at timestamptz DEFAULT now(),
  UNIQUE(team_id, square_id, session_id)
);

-- Create indexes for team_marks
CREATE INDEX IF NOT EXISTS idx_team_marks_session_id ON team_marks(session_id);
CREATE INDEX IF NOT EXISTS idx_team_marks_team_id ON team_marks(team_id);
CREATE INDEX IF NOT EXISTS idx_team_marks_square_id ON team_marks(square_id);

-- Enable RLS for team_marks
ALTER TABLE team_marks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_marks
CREATE POLICY "All authenticated users can view team marks"
  ON team_marks
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Team leaders can manage their own marks"
  ON team_marks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role = 'team_leader'
      AND current_team = team_marks.team_id
    )
  );

CREATE POLICY "Admins can manage all marks"
  ON team_marks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')
    )
  );

-- Function to mark a square
CREATE OR REPLACE FUNCTION mark_square(
  square_id_param integer,
  session_id_param uuid
)
RETURNS json AS $$
DECLARE
  current_team text;
  result json;
BEGIN
  -- Get current user's team
  SELECT current_team INTO current_team
  FROM profiles
  WHERE id = auth.uid();
  
  IF current_team IS NULL THEN
    RAISE EXCEPTION 'User not assigned to a team';
  END IF;
  
  -- Check if user is team leader
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'team_leader'
  ) THEN
    RAISE EXCEPTION 'Only team leaders can mark squares';
  END IF;
  
  -- Check if square exists
  IF NOT EXISTS (
    SELECT 1 FROM oil_grid
    WHERE square_id = square_id_param AND session_id = session_id_param
  ) THEN
    RAISE EXCEPTION 'Square not found';
  END IF;
  
  -- Check if square is already marked by this team
  IF EXISTS (
    SELECT 1 FROM team_marks
    WHERE team_id = current_team 
    AND square_id = square_id_param 
    AND session_id = session_id_param
  ) THEN
    RAISE EXCEPTION 'Square already marked by your team';
  END IF;
  
  -- Check if square is already marked by another team
  IF EXISTS (
    SELECT 1 FROM team_marks
    WHERE square_id = square_id_param 
    AND session_id = session_id_param
  ) THEN
    RAISE EXCEPTION 'Square already marked by another team';
  END IF;
  
  -- Insert the mark
  INSERT INTO team_marks (team_id, square_id, session_id)
  VALUES (current_team, square_id_param, session_id_param);
  
  -- Return success
  result := json_build_object(
    'success', true,
    'message', 'Square marked successfully'
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unmark a square
CREATE OR REPLACE FUNCTION unmark_square(
  square_id_param integer,
  session_id_param uuid
)
RETURNS json AS $$
DECLARE
  current_team text;
  result json;
BEGIN
  -- Get current user's team
  SELECT current_team INTO current_team
  FROM profiles
  WHERE id = auth.uid();
  
  IF current_team IS NULL THEN
    RAISE EXCEPTION 'User not assigned to a team';
  END IF;
  
  -- Check if user is team leader
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'team_leader'
  ) THEN
    RAISE EXCEPTION 'Only team leaders can unmark squares';
  END IF;
  
  -- Delete the mark
  DELETE FROM team_marks
  WHERE team_id = current_team 
  AND square_id = square_id_param 
  AND session_id = session_id_param;
  
  -- Return success
  result := json_build_object(
    'success', true,
    'message', 'Square unmarked successfully'
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get oil grid with marking status
CREATE OR REPLACE FUNCTION get_oil_grid_with_marks(session_id_param uuid)
RETURNS TABLE (
  square_id integer,
  quality text,
  is_excavated boolean,
  excavated_by_team text,
  timestamp timestamptz,
  marked_by_team text,
  marked_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    og.square_id,
    CASE 
      WHEN og.is_excavated THEN og.quality
      ELSE 'unknown'
    END as quality,
    og.is_excavated,
    og.excavated_by_team,
    og.timestamp,
    tm.team_id as marked_by_team,
    tm.marked_at
  FROM oil_grid og
  LEFT JOIN team_marks tm ON og.square_id = tm.square_id AND og.session_id = tm.session_id
  WHERE og.session_id = session_id_param
  ORDER BY og.square_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate team scores based on correct marks
CREATE OR REPLACE FUNCTION calculate_team_scores(session_id_param uuid)
RETURNS TABLE (
  team_id text,
  correct_marks integer,
  total_marks integer,
  score integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tm.team_id,
    COUNT(CASE WHEN og.quality IN ('rare', 'epic', 'legendary', 'mythic') THEN 1 END) as correct_marks,
    COUNT(*) as total_marks,
    COUNT(CASE WHEN og.quality IN ('rare', 'epic', 'legendary', 'mythic') THEN 1 END) * 10 as score
  FROM team_marks tm
  JOIN oil_grid og ON tm.square_id = og.square_id AND tm.session_id = og.session_id
  WHERE tm.session_id = session_id_param
  GROUP BY tm.team_id
  ORDER BY score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reveal all marks and calculate final scores
CREATE OR REPLACE FUNCTION reveal_all_marks(session_id_param uuid)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  -- This function can be called by admins to reveal all marks and calculate scores
  -- For now, it just returns the scoring data
  
  result := json_build_object(
    'success', true,
    'message', 'Marks revealed and scores calculated',
    'scores', (
      SELECT json_agg(
        json_build_object(
          'team_id', team_id,
          'correct_marks', correct_marks,
          'total_marks', total_marks,
          'score', score
        )
      )
      FROM calculate_team_scores(session_id_param)
    )
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the initialize_oil_grid function to not set is_excavated
CREATE OR REPLACE FUNCTION initialize_oil_grid(session_id_param uuid)
RETURNS void AS $$
DECLARE
  square_id integer;
  quality text;
  qualities text[] := ARRAY[
    'common', 'common', 'common', 'common', 'common', 'common', 'common', 'common', 'common', 'common', 'common', 'common', 'common',
    'rare', 'rare', 'rare', 'rare', 'rare', 'rare', 'rare',
    'epic', 'epic', 'epic', 'epic', 'epic',
    'legendary', 'legendary', 'legendary', 'legendary',
    'mythic'
  ];
BEGIN
  -- Shuffle the qualities array
  SELECT array_agg(quality ORDER BY random()) INTO qualities
  FROM unnest(qualities) AS quality;
  
  -- Insert 30 squares with shuffled qualities (not excavated)
  FOR square_id IN 1..30 LOOP
    INSERT INTO oil_grid (square_id, quality, session_id, is_excavated)
    VALUES (square_id, qualities[square_id], session_id_param, false);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
