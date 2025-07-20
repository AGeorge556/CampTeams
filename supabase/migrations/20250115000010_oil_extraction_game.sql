-- Oil Extraction Game Database Schema
-- This migration adds the game system with role-based access control

-- Add role-based columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'team_leader' CHECK (role IN ('admin', 'shop_owner', 'team_leader'));

-- Create game_sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  is_active boolean DEFAULT false,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create team_wallets table
CREATE TABLE IF NOT EXISTS team_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id text NOT NULL CHECK (team_id IN ('red', 'blue', 'green', 'yellow')),
  coins integer DEFAULT 0,
  net_worth integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(team_id)
);

-- Create oil_transactions table for audit trail
CREATE TABLE IF NOT EXISTS oil_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES game_sessions(id) ON DELETE CASCADE,
  team_id text NOT NULL CHECK (team_id IN ('red', 'blue', 'green', 'yellow')),
  transaction_type text NOT NULL CHECK (transaction_type IN ('collect', 'sell', 'purchase', 'bonus', 'penalty')),
  amount integer NOT NULL,
  description text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_game_sessions_active ON game_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_game_sessions_start_time ON game_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_team_wallets_team_id ON team_wallets(team_id);
CREATE INDEX IF NOT EXISTS idx_oil_transactions_session_id ON oil_transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_oil_transactions_team_id ON oil_transactions(team_id);

-- Enable RLS on new tables
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE oil_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for game_sessions
CREATE POLICY "Admins can manage all game sessions"
  ON game_sessions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')
    )
  );

CREATE POLICY "All authenticated users can view active game sessions"
  ON game_sessions
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for team_wallets
CREATE POLICY "Admins can manage all team wallets"
  ON team_wallets
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')
    )
  );

CREATE POLICY "Shop owners can view all team wallets"
  ON team_wallets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'shop_owner'
    )
  );

CREATE POLICY "Team leaders can view their own team wallet"
  ON team_wallets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role = 'team_leader' 
      AND current_team = team_wallets.team_id
    )
  );

-- RLS Policies for oil_transactions
CREATE POLICY "Admins can manage all transactions"
  ON oil_transactions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')
    )
  );

CREATE POLICY "Shop owners can view all transactions"
  ON oil_transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'shop_owner'
    )
  );

CREATE POLICY "Team leaders can view their own team transactions"
  ON oil_transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role = 'team_leader' 
      AND current_team = oil_transactions.team_id
    )
  );

-- Function to initialize team wallets
CREATE OR REPLACE FUNCTION initialize_team_wallets()
RETURNS void AS $$
BEGIN
  INSERT INTO team_wallets (team_id, coins, net_worth)
  VALUES 
    ('red', 1000, 1000),
    ('blue', 1000, 1000),
    ('green', 1000, 1000),
    ('yellow', 1000, 1000)
  ON CONFLICT (team_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update team wallet
CREATE OR REPLACE FUNCTION update_team_wallet(
  team_id_param text,
  coins_change integer,
  net_worth_change integer,
  transaction_type_param text,
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
    coins = coins + coins_change,
    net_worth = net_worth + net_worth_change,
    updated_at = now()
  WHERE team_id = team_id_param;

  -- Record transaction if session is active
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
      transaction_type_param,
      coins_change,
      description_param,
      auth.uid()
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get team wallet with transactions
CREATE OR REPLACE FUNCTION get_team_wallet_with_transactions(team_id_param text)
RETURNS TABLE (
  wallet_id uuid,
  team_id text,
  coins integer,
  net_worth integer,
  updated_at timestamptz,
  transactions json
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tw.id as wallet_id,
    tw.team_id,
    tw.coins,
    tw.net_worth,
    tw.updated_at,
    COALESCE(
      json_agg(
        json_build_object(
          'id', ot.id,
          'transaction_type', ot.transaction_type,
          'amount', ot.amount,
          'description', ot.description,
          'created_at', ot.created_at
        ) ORDER BY ot.created_at DESC
      ) FILTER (WHERE ot.id IS NOT NULL),
      '[]'::json
    ) as transactions
  FROM team_wallets tw
  LEFT JOIN oil_transactions ot ON tw.team_id = ot.team_id
  WHERE tw.team_id = team_id_param
  GROUP BY tw.id, tw.team_id, tw.coins, tw.net_worth, tw.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get game leaderboard
CREATE OR REPLACE FUNCTION get_game_leaderboard()
RETURNS TABLE (
  team_id text,
  coins integer,
  net_worth integer,
  rank integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tw.team_id,
    tw.coins,
    tw.net_worth,
    ROW_NUMBER() OVER (ORDER BY tw.net_worth DESC, tw.coins DESC) as rank
  FROM team_wallets tw
  ORDER BY tw.net_worth DESC, tw.coins DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Initialize team wallets
SELECT initialize_team_wallets();

-- Update existing admin users to have admin role
UPDATE profiles 
SET role = 'admin' 
WHERE is_admin = true AND role = 'team_leader'; 