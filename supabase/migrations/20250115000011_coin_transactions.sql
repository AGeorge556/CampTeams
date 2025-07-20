-- Coin Transactions Table for Admin Coin Management
-- This migration adds a dedicated table for tracking admin coin transactions

-- Create coin_transactions table
CREATE TABLE IF NOT EXISTS coin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES profiles(id),
  team_id text NOT NULL CHECK (team_id IN ('red', 'blue', 'green', 'yellow')),
  amount integer NOT NULL,
  transaction_type text NOT NULL DEFAULT 'admin_adjustment' CHECK (transaction_type IN ('admin_adjustment', 'bonus', 'penalty')),
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_coin_transactions_admin_id ON coin_transactions(admin_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_team_id ON coin_transactions(team_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_created_at ON coin_transactions(created_at);

-- Enable RLS
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for coin_transactions
CREATE POLICY "Admins can manage all coin transactions"
  ON coin_transactions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')
    )
  );

CREATE POLICY "All authenticated users can view coin transactions"
  ON coin_transactions
  FOR SELECT
  TO authenticated
  USING (true);

-- Function to add coins to team wallet with transaction logging
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

  -- Update team wallet
  UPDATE team_wallets 
  SET 
    coins = coins + amount_param,
    net_worth = net_worth + amount_param,
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

-- Function to get coin transactions with admin details
CREATE OR REPLACE FUNCTION get_coin_transactions_with_admin()
RETURNS TABLE (
  transaction_id uuid,
  admin_name text,
  team_id text,
  amount integer,
  transaction_type text,
  description text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ct.id as transaction_id,
    p.full_name as admin_name,
    ct.team_id,
    ct.amount,
    ct.transaction_type,
    ct.description,
    ct.created_at
  FROM coin_transactions ct
  JOIN profiles p ON ct.admin_id = p.id
  ORDER BY ct.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 