-- Fix add_coins_to_team function to only affect coins, not net worth
-- When admins add coins via mini-games, it should only increase coins, not net worth

-- Drop the existing function first
DROP FUNCTION IF EXISTS add_coins_to_team(text, integer, text);

-- Recreate with correct behavior
CREATE OR REPLACE FUNCTION add_coins_to_team(
  team_id_param text,
  amount_param integer,
  description_param text DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  current_session_id uuid;
BEGIN
  -- Get current active session
  SELECT id INTO current_session_id 
  FROM game_sessions 
  WHERE is_active = true 
  ORDER BY created_at DESC 
  LIMIT 1;

  -- Update team wallet - ONLY coins, NOT net_worth
  UPDATE team_wallets 
  SET 
    coins = coins + amount_param,
    updated_at = now()
  WHERE team_id = team_id_param;

  -- Log coin transaction
  INSERT INTO coin_transactions (
    admin_id,
    team_id,
    amount,
    transaction_type,
    description
  ) VALUES (
    auth.uid(),
    team_id_param,
    amount_param,
    'admin_adjustment',
    description_param
  );

  -- Also log in oil_transactions if session is active
  IF current_session_id IS NOT NULL THEN
    INSERT INTO oil_transactions (
      session_id,
      team_id,
      transaction_type,
      amount,
      description,
      created_by
    ) VALUES (
      current_session_id,
      team_id_param,
      CASE 
        WHEN amount_param > 0 THEN 'bonus'
        ELSE 'penalty'
      END,
      amount_param,
      COALESCE(description_param, 'Admin coin adjustment'),
      auth.uid()
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 