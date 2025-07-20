-- Oil Hints System
-- This migration adds the hints functionality for teams to purchase excavation guidance

-- Create oil_hints table
CREATE TABLE IF NOT EXISTS oil_hints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES game_sessions(id) ON DELETE CASCADE,
  hint_text text NOT NULL,
  quality_hint_for text, -- e.g., "center", "corner", "edge", "mythic", "legendary", etc.
  cost integer NOT NULL DEFAULT 50,
  created_by text NOT NULL, -- shop_owner who created the hint
  created_at timestamptz DEFAULT now()
);

-- Create hint_purchases table
CREATE TABLE IF NOT EXISTS hint_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id text NOT NULL CHECK (team_id IN ('red', 'blue', 'green', 'yellow')),
  hint_id uuid REFERENCES oil_hints(id) ON DELETE CASCADE,
  session_id uuid REFERENCES game_sessions(id) ON DELETE CASCADE,
  purchased_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_oil_hints_session_id ON oil_hints(session_id);
CREATE INDEX IF NOT EXISTS idx_oil_hints_created_by ON oil_hints(created_by);
CREATE INDEX IF NOT EXISTS idx_hint_purchases_team_id ON hint_purchases(team_id);
CREATE INDEX IF NOT EXISTS idx_hint_purchases_hint_id ON hint_purchases(hint_id);
CREATE INDEX IF NOT EXISTS idx_hint_purchases_session_id ON hint_purchases(session_id);

-- Enable RLS
ALTER TABLE oil_hints ENABLE ROW LEVEL SECURITY;
ALTER TABLE hint_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for oil_hints
CREATE POLICY "All authenticated users can view oil hints"
  ON oil_hints
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Shop owners can create hints"
  ON oil_hints
  FOR INSERT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'shop_owner'
    )
  );

CREATE POLICY "Shop owners can update their hints"
  ON oil_hints
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'shop_owner'
    )
  );

CREATE POLICY "Admins can manage all hints"
  ON oil_hints
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')
    )
  );

-- RLS Policies for hint_purchases
CREATE POLICY "All authenticated users can view hint purchases"
  ON hint_purchases
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Team leaders can purchase hints"
  ON hint_purchases
  FOR INSERT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'team_leader'
    )
  );

CREATE POLICY "Admins can manage all hint purchases"
  ON hint_purchases
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')
    )
  );

-- Function to purchase a hint
CREATE OR REPLACE FUNCTION purchase_hint(
  hint_id_param uuid,
  session_id_param uuid
)
RETURNS json AS $$
DECLARE
  current_team text;
  current_coins integer;
  hint_cost integer;
  hint_text_val text;
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
    RAISE EXCEPTION 'Only team leaders can purchase hints';
  END IF;
  
  -- Check if hint already purchased by this team
  IF EXISTS (
    SELECT 1 FROM hint_purchases
    WHERE team_id = current_team AND hint_id = hint_id_param
  ) THEN
    RAISE EXCEPTION 'Hint already purchased by this team';
  END IF;
  
  -- Get hint details
  SELECT cost, hint_text INTO hint_cost, hint_text_val
  FROM oil_hints
  WHERE id = hint_id_param AND session_id = session_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Hint not found';
  END IF;
  
  -- Get current team coins
  SELECT coins INTO current_coins
  FROM team_wallets
  WHERE team_id = current_team;
  
  IF current_coins < hint_cost THEN
    RAISE EXCEPTION 'Insufficient coins. Need at least % coins to purchase this hint.', hint_cost;
  END IF;
  
  -- Deduct coins from team wallet (does not affect net worth)
  UPDATE team_wallets
  SET 
    coins = coins - hint_cost,
    updated_at = now()
  WHERE team_id = current_team;
  
  -- Record the purchase
  INSERT INTO hint_purchases (team_id, hint_id, session_id)
  VALUES (current_team, hint_id_param, session_id_param);
  
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
    'purchase',
    -hint_cost,
    'Purchased hint: ' || hint_text_val,
    auth.uid()
  );
  
  -- Return result
  result := json_build_object(
    'success', true,
    'hint_text', hint_text_val,
    'cost', hint_cost,
    'remaining_coins', current_coins - hint_cost
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get available hints for a team
CREATE OR REPLACE FUNCTION get_available_hints_for_team(
  team_id_param text,
  session_id_param uuid
)
RETURNS TABLE (
  id uuid,
  hint_text text,
  quality_hint_for text,
  cost integer,
  created_at timestamptz,
  is_purchased boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    oh.id,
    oh.hint_text,
    oh.quality_hint_for,
    oh.cost,
    oh.created_at,
    CASE 
      WHEN hp.id IS NOT NULL THEN true
      ELSE false
    END as is_purchased
  FROM oil_hints oh
  LEFT JOIN hint_purchases hp ON oh.id = hp.hint_id AND hp.team_id = team_id_param
  WHERE oh.session_id = session_id_param
  ORDER BY oh.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get hint analytics for shop owners
CREATE OR REPLACE FUNCTION get_hint_analytics(session_id_param uuid)
RETURNS TABLE (
  hint_id uuid,
  hint_text text,
  cost integer,
  total_purchases bigint,
  total_revenue integer,
  teams_purchased text[],
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    oh.id as hint_id,
    oh.hint_text,
    oh.cost,
    COUNT(hp.id) as total_purchases,
    COUNT(hp.id) * oh.cost as total_revenue,
    ARRAY_AGG(DISTINCT hp.team_id) FILTER (WHERE hp.team_id IS NOT NULL) as teams_purchased,
    oh.created_at
  FROM oil_hints oh
  LEFT JOIN hint_purchases hp ON oh.id = hp.hint_id
  WHERE oh.session_id = session_id_param
  GROUP BY oh.id, oh.hint_text, oh.cost, oh.created_at
  ORDER BY oh.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a new hint (for shop owners)
CREATE OR REPLACE FUNCTION create_hint(
  hint_text_param text,
  quality_hint_for_param text,
  cost_param integer,
  session_id_param uuid
)
RETURNS json AS $$
DECLARE
  current_user_id uuid;
  new_hint_id uuid;
  result json;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  -- Check if user is shop owner
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = current_user_id AND role = 'shop_owner'
  ) THEN
    RAISE EXCEPTION 'Only shop owners can create hints';
  END IF;
  
  -- Create the hint
  INSERT INTO oil_hints (
    session_id,
    hint_text,
    quality_hint_for,
    cost,
    created_by
  ) VALUES (
    session_id_param,
    hint_text_param,
    quality_hint_for_param,
    cost_param,
    current_user_id
  ) RETURNING id INTO new_hint_id;
  
  -- Return result
  result := json_build_object(
    'success', true,
    'hint_id', new_hint_id,
    'message', 'Hint created successfully'
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 