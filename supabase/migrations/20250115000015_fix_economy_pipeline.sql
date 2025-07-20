-- Fix Economy Pipeline
-- This migration corrects the economy flow to ensure proper separation between coins and net_worth

-- Fix the buy_oil_from_team function to only affect net_worth, not coins
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
  
  -- Set prices based on quality (corrected values)
  price_per_barrel := CASE quality_param
    WHEN 'common' THEN 25
    WHEN 'rare' THEN 50
    WHEN 'epic' THEN 100
    WHEN 'legendary' THEN 150
    WHEN 'mythic' THEN 250
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
  
  -- Add value to net_worth only (not coins) - this is the key fix
  UPDATE team_wallets
  SET 
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

-- Fix the excavate_square function to ensure proper coin deduction
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
  
  -- Deduct 100 coins from team wallet (does not affect net_worth)
  UPDATE team_wallets
  SET 
    coins = coins - 100,
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

-- Fix the purchase_hint function to ensure proper coin deduction
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
  
  -- Deduct coins from team wallet (does not affect net_worth)
  UPDATE team_wallets
  SET 
    coins = coins - hint_cost,
    updated_at = now()
  WHERE team_id = current_team;
  
  -- Record the purchase
  INSERT INTO hint_purchases (team_id, hint_id, session_id)
  VALUES (current_team, hint_id_param, session_id_param);
  
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

-- Function to initialize team wallets with proper starting values
CREATE OR REPLACE FUNCTION initialize_team_wallets()
RETURNS void AS $$
BEGIN
  -- Insert or update team wallets with proper initial values
  INSERT INTO team_wallets (team_id, coins, net_worth, updated_at)
  VALUES 
    ('red', 0, 0, now()),
    ('blue', 0, 0, now()),
    ('green', 0, 0, now()),
    ('yellow', 0, 0, now())
  ON CONFLICT (team_id) DO UPDATE SET
    coins = EXCLUDED.coins,
    net_worth = EXCLUDED.net_worth,
    updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get comprehensive team economy status
CREATE OR REPLACE FUNCTION get_team_economy_status(session_id_param uuid)
RETURNS TABLE (
  team_id text,
  coins integer,
  net_worth integer,
  total_inventory bigint,
  total_spent_on_excavation bigint,
  total_spent_on_hints bigint,
  total_earned_from_sales bigint,
  last_updated timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tw.team_id,
    tw.coins,
    tw.net_worth,
    COALESCE(inv.total_inventory, 0) as total_inventory,
    COALESCE(ABS(SUM(CASE WHEN ot.transaction_type = 'collect' THEN ot.amount ELSE 0 END)), 0) as total_spent_on_excavation,
    COALESCE(ABS(SUM(CASE WHEN ot.transaction_type = 'purchase' THEN ot.amount ELSE 0 END)), 0) as total_spent_on_hints,
    COALESCE(SUM(CASE WHEN ot.transaction_type = 'sell' THEN ot.amount ELSE 0 END), 0) as total_earned_from_sales,
    tw.updated_at as last_updated
  FROM team_wallets tw
  LEFT JOIN oil_transactions ot ON tw.team_id = ot.team_id AND ot.session_id = session_id_param
  LEFT JOIN (
    SELECT team_id, COUNT(*) as total_inventory
    FROM oil_inventory
    WHERE session_id = session_id_param
    GROUP BY team_id
  ) inv ON tw.team_id = inv.team_id
  GROUP BY tw.team_id, tw.coins, tw.net_worth, inv.total_inventory, tw.updated_at
  ORDER BY tw.net_worth DESC, tw.coins DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 