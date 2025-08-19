-- Add locked_teams array to camp_settings
ALTER TABLE camp_settings
ADD COLUMN IF NOT EXISTS locked_teams text[] DEFAULT '{}';

-- Update can_switch_team_with_reason function to check for locked teams
CREATE OR REPLACE FUNCTION can_switch_team_with_reason(user_id uuid, new_team text)
RETURNS table(allowed boolean, reason text)
language plpgsql
security definer
as $$
DECLARE
  user_profile profiles%ROWTYPE;
  locked_teams text[];
BEGIN
  -- Get user profile
  SELECT * INTO user_profile FROM profiles WHERE id = user_id;
  if not found then
    return query select false as allowed, 'user_not_found'::text as reason; return;
  end if;

  -- Get locked teams
  SELECT cs.locked_teams INTO locked_teams FROM camp_settings cs LIMIT 1;

  -- Check if target team is locked (prevent joining but allow leaving)
  IF new_team = ANY(locked_teams) THEN
    return query select false as allowed, 'team_locked'::text as reason; return;
  END if;

  -- Continue with existing checks...
  RETURN QUERY
  SELECT * FROM can_switch_team_with_reason_internal(user_id, new_team);
END;
$$;
