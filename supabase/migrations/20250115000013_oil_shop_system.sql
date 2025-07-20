-- Oil Shop System
-- This migration adds the shop functionality for buying oil from teams

-- Create oil_sales table for tracking all sales transactions
CREATE TABLE IF NOT EXISTS oil_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES game_sessions(id) ON DELETE CASCADE,
  team_id text NOT NULL CHECK (team_id IN ('red', 'blue', 'green', 'yellow')),
  quality text NOT NULL CHECK (quality IN ('common', 'rare', 'epic', 'legendary', 'mythic')),
  quantity integer NOT NULL DEFAULT 1,
  price_per_barrel integer NOT NULL,
  total_amount integer NOT NULL,
  sold_by text NOT NULL, -- shop_owner who made the sale
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_oil_sales_session_id ON oil_sales(session_id);
CREATE INDEX IF NOT EXISTS idx_oil_sales_team_id ON oil_sales(team_id);
CREATE INDEX IF NOT EXISTS idx_oil_sales_created_at ON oil_sales(created_at);

-- Enable RLS
ALTER TABLE oil_sales ENABLE ROW LEVEL SECURITY;

-- RLS Policies for oil_sales
CREATE POLICY "All authenticated users can view oil sales"
  ON oil_sales
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Shop owners can create sales records"
  ON oil_sales
  FOR INSERT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'shop_owner'
    )
  );

CREATE POLICY "Admins can manage all sales records"
  ON oil_sales
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')
    )
  );

-- Function to buy oil from a team
CREATE OR REPLACE FUNCTION buy_oil_from_team(
  team_id_param text,
  quality_param text,
  quantity_param integer,
  session_id_param uuid
)
RETURNS json AS $$
DECLARE
  current_user_id uuid;
  price_per_barrel integer;
  total_amount integer;
  available_quantity integer;
  result json;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  -- Check if user is shop owner
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = current_user_id AND role = 'shop_owner'
  ) THEN
    RAISE EXCEPTION 'Only shop owners can buy oil';
  END IF;
  
  -- Set prices based on quality
  price_per_barrel := CASE quality_param
    WHEN 'common' THEN 50
    WHEN 'rare' THEN 100
    WHEN 'epic' THEN 175
    WHEN 'legendary' THEN 250
    WHEN 'mythic' THEN 750
    ELSE 0
  END;
  
  total_amount := price_per_barrel * quantity_param;
  
  -- Check if team has enough oil of this quality
  SELECT COUNT(*) INTO available_quantity
  FROM oil_inventory
  WHERE team_id = team_id_param 
    AND quality = quality_param 
    AND session_id = session_id_param;
  
  IF available_quantity < quantity_param THEN
    RAISE EXCEPTION 'Team does not have enough % oil. Available: %, Requested: %', 
      quality_param, available_quantity, quantity_param;
  END IF;
  
  -- Remove oil from team inventory (remove oldest first)
  DELETE FROM oil_inventory
  WHERE id IN (
    SELECT id FROM oil_inventory
    WHERE team_id = team_id_param 
      AND quality = quality_param 
      AND session_id = session_id_param
    ORDER BY created_at ASC
    LIMIT quantity_param
  );
  
  -- Add coins to team wallet
  UPDATE team_wallets
  SET 
    coins = coins + total_amount,
    net_worth = net_worth + total_amount,
    updated_at = now()
  WHERE team_id = team_id_param;
  
  -- Log the sale transaction
  INSERT INTO oil_sales (
    session_id,
    team_id,
    quality,
    quantity,
    price_per_barrel,
    total_amount,
    sold_by
  ) VALUES (
    session_id_param,
    team_id_param,
    quality_param,
    quantity_param,
    price_per_barrel,
    total_amount,
    current_user_id
  );
  
  -- Log transaction in oil_transactions table
  INSERT INTO oil_transactions (
    session_id,
    team_id,
    transaction_type,
    amount,
    description,
    created_by
  ) VALUES (
    session_id_param,
    team_id_param,
    'sell',
    total_amount,
    'Sold ' || quantity_param || ' ' || quality_param || ' oil barrel(s)',
    current_user_id
  );
  
  -- Return result
  result := json_build_object(
    'success', true,
    'quantity_sold', quantity_param,
    'quality', quality_param,
    'price_per_barrel', price_per_barrel,
    'total_amount', total_amount,
    'remaining_inventory', available_quantity - quantity_param
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get oil sales history
CREATE OR REPLACE FUNCTION get_oil_sales_history(session_id_param uuid)
RETURNS TABLE (
  id uuid,
  team_id text,
  quality text,
  quantity integer,
  price_per_barrel integer,
  total_amount integer,
  sold_by text,
  created_at timestamptz,
  shop_owner_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    os.id,
    os.team_id,
    os.quality,
    os.quantity,
    os.price_per_barrel,
    os.total_amount,
    os.sold_by,
    os.created_at,
    p.full_name as shop_owner_name
  FROM oil_sales os
  LEFT JOIN profiles p ON os.sold_by = p.id
  WHERE os.session_id = session_id_param
  ORDER BY os.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get shop statistics
CREATE OR REPLACE FUNCTION get_shop_statistics(session_id_param uuid)
RETURNS TABLE (
  total_sales integer,
  total_revenue integer,
  sales_by_quality json,
  top_selling_team text,
  top_selling_team_amount integer
) AS $$
DECLARE
  sales_by_quality_json json;
BEGIN
  -- Get sales by quality
  SELECT json_object_agg(quality, total_quantity) INTO sales_by_quality_json
  FROM (
    SELECT 
      quality,
      SUM(quantity) as total_quantity
    FROM oil_sales
    WHERE session_id = session_id_param
    GROUP BY quality
  ) quality_stats;
  
  RETURN QUERY
  SELECT 
    COALESCE(SUM(os.quantity), 0) as total_sales,
    COALESCE(SUM(os.total_amount), 0) as total_revenue,
    COALESCE(sales_by_quality_json, '{}'::json) as sales_by_quality,
    (
      SELECT team_id
      FROM (
        SELECT team_id, SUM(total_amount) as team_total
        FROM oil_sales
        WHERE session_id = session_id_param
        GROUP BY team_id
        ORDER BY team_total DESC
        LIMIT 1
      ) top_team
    ) as top_selling_team,
    (
      SELECT COALESCE(SUM(total_amount), 0)
      FROM oil_sales
      WHERE session_id = session_id_param
      AND team_id = (
        SELECT team_id
        FROM (
          SELECT team_id, SUM(total_amount) as team_total
          FROM oil_sales
          WHERE session_id = session_id_param
          GROUP BY team_id
          ORDER BY team_total DESC
          LIMIT 1
        ) top_team
      )
    ) as top_selling_team_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 