-- Fix initial team wallet values
-- Teams should start with 0 coins and 0 net_worth, not 1000 each

-- Drop the existing function first
DROP FUNCTION IF EXISTS initialize_team_wallets();

-- Recreate with correct initial values
CREATE OR REPLACE FUNCTION initialize_team_wallets()
RETURNS void AS $$
BEGIN
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

-- Reset all existing team wallets to 0
UPDATE team_wallets SET coins = 0, net_worth = 0, updated_at = now(); 