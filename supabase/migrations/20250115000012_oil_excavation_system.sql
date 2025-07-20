-- Oil Excavation System
-- This migration adds the shared excavation grid and inventory system

-- Create oil_grid table
CREATE TABLE IF NOT EXISTS oil_grid (
  square_id integer PRIMARY KEY CHECK (square_id >= 1 AND square_id <= 30),
  quality text NOT NULL CHECK (quality IN ('common', 'rare', 'epic', 'legendary', 'mythic')),
  is_excavated boolean DEFAULT false,
  excavated_by_team text CHECK (excavated_by_team IN ('red', 'blue', 'green', 'yellow')),
  timestamp timestamptz,
  session_id uuid REFERENCES game_sessions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create oil_inventory table
CREATE TABLE IF NOT EXISTS oil_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id text NOT NULL CHECK (team_id IN ('red', 'blue', 'green', 'yellow')),
  quality text NOT NULL CHECK (quality IN ('common', 'rare', 'epic', 'legendary', 'mythic')),
  quantity integer DEFAULT 1,
  timestamp timestamptz DEFAULT now(),
  session_id uuid REFERENCES game_sessions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_oil_grid_session_id ON oil_grid(session_id);
CREATE INDEX IF NOT EXISTS idx_oil_grid_excavated_by_team ON oil_grid(excavated_by_team);
CREATE INDEX IF NOT EXISTS idx_oil_grid_is_excavated ON oil_grid(is_excavated);
CREATE INDEX IF NOT EXISTS idx_oil_inventory_team_id ON oil_inventory(team_id);
CREATE INDEX IF NOT EXISTS idx_oil_inventory_session_id ON oil_inventory(session_id);

-- Enable RLS
ALTER TABLE oil_grid ENABLE ROW LEVEL SECURITY;
ALTER TABLE oil_inventory ENABLE ROW LEVEL SECURITY;

-- RLS Policies for oil_grid
CREATE POLICY "All authenticated users can view oil grid"
  ON oil_grid
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Team leaders can excavate squares"
  ON oil_grid
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role = 'team_leader'
      AND current_team = oil_grid.excavated_by_team
    )
  );

-- RLS Policies for oil_inventory
CREATE POLICY "All authenticated users can view oil inventory"
  ON oil_inventory
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Team leaders can manage their own inventory"
  ON oil_inventory
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role = 'team_leader'
      AND current_team = oil_inventory.team_id
    )
  );

CREATE POLICY "Admins can manage all inventory"
  ON oil_inventory
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')
    )
  );

-- Function to initialize oil grid for a session
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
  
  -- Insert 30 squares with shuffled qualities
  FOR square_id IN 1..30 LOOP
    INSERT INTO oil_grid (square_id, quality, session_id)
    VALUES (square_id, qualities[square_id], session_id_param);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to excavate a square
CREATE OR REPLACE FUNCTION excavate_square(
  square_id_param integer,
  session_id_param uuid
)
RETURNS json AS $$
DECLARE
  current_team text;
  current_coins integer;
  square_quality text;
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
    RAISE EXCEPTION 'Only team leaders can excavate';
  END IF;
  
  -- Get current team coins
  SELECT coins INTO current_coins
  FROM team_wallets
  WHERE team_id = current_team;
  
  IF current_coins < 100 THEN
    RAISE EXCEPTION 'Insufficient coins. Need at least 100 coins to excavate.';
  END IF;
  
  -- Check if square exists and is not excavated
  SELECT quality INTO square_quality
  FROM oil_grid
  WHERE square_id = square_id_param AND session_id = session_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Square not found';
  END IF;
  
  -- Check if square is already excavated (with row lock to prevent race conditions)
  IF EXISTS (
    SELECT 1 FROM oil_grid
    WHERE square_id = square_id_param 
    AND session_id = session_id_param 
    AND is_excavated = true
    FOR UPDATE
  ) THEN
    RAISE EXCEPTION 'Square already excavated';
  END IF;
  
  -- Update the square as excavated
  UPDATE oil_grid
  SET 
    is_excavated = true,
    excavated_by_team = current_team,
    timestamp = now()
  WHERE square_id = square_id_param AND session_id = session_id_param;
  
  -- Deduct 100 coins from team wallet
  UPDATE team_wallets
  SET 
    coins = coins - 100,
    net_worth = net_worth - 100,
    updated_at = now()
  WHERE team_id = current_team;
  
  -- Add oil to team inventory
  INSERT INTO oil_inventory (team_id, quality, session_id)
  VALUES (current_team, square_quality, session_id_param);
  
  -- Log transaction
  INSERT INTO oil_transactions (
    session_id,
    team_id,
    transaction_type,
    amount,
    description,
    created_by
  ) VALUES (
    session_id_param,
    current_team,
    'collect',
    -100,
    'Excavation cost for ' || square_quality || ' oil',
    auth.uid()
  );
  
  -- Return result
  result := json_build_object(
    'success', true,
    'quality', square_quality,
    'coins_deducted', 100,
    'remaining_coins', current_coins - 100
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get oil grid with excavation status
CREATE OR REPLACE FUNCTION get_oil_grid_with_status(session_id_param uuid)
RETURNS TABLE (
  square_id integer,
  quality text,
  is_excavated boolean,
  excavated_by_team text,
  timestamp timestamptz
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
    og.timestamp
  FROM oil_grid og
  WHERE og.session_id = session_id_param
  ORDER BY og.square_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get team inventory
CREATE OR REPLACE FUNCTION get_team_inventory(team_id_param text, session_id_param uuid)
RETURNS TABLE (
  quality text,
  quantity bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    oi.quality,
    COUNT(*) as quantity
  FROM oil_inventory oi
  WHERE oi.team_id = team_id_param AND oi.session_id = session_id_param
  GROUP BY oi.quality
  ORDER BY 
    CASE oi.quality
      WHEN 'mythic' THEN 1
      WHEN 'legendary' THEN 2
      WHEN 'epic' THEN 3
      WHEN 'rare' THEN 4
      WHEN 'common' THEN 5
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all teams inventory summary
CREATE OR REPLACE FUNCTION get_all_teams_inventory(session_id_param uuid)
RETURNS TABLE (
  team_id text,
  common_count bigint,
  rare_count bigint,
  epic_count bigint,
  legendary_count bigint,
  mythic_count bigint,
  total_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    oi.team_id,
    COUNT(*) FILTER (WHERE oi.quality = 'common') as common_count,
    COUNT(*) FILTER (WHERE oi.quality = 'rare') as rare_count,
    COUNT(*) FILTER (WHERE oi.quality = 'epic') as epic_count,
    COUNT(*) FILTER (WHERE oi.quality = 'legendary') as legendary_count,
    COUNT(*) FILTER (WHERE oi.quality = 'mythic') as mythic_count,
    COUNT(*) as total_count
  FROM oil_inventory oi
  WHERE oi.session_id = session_id_param
  GROUP BY oi.team_id
  ORDER BY oi.team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 