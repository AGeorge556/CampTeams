-- Fix get_game_leaderboard function type mismatch
-- ROW_NUMBER() returns bigint, not integer

-- Drop the existing function first
DROP FUNCTION IF EXISTS get_game_leaderboard();

CREATE OR REPLACE FUNCTION get_game_leaderboard()
RETURNS TABLE (
  team_id text,
  coins integer,
  net_worth integer,
  rank bigint
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