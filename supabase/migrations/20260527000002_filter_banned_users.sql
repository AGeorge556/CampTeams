-- RPC function to return camp registrations excluding banned auth users.
-- SECURITY DEFINER runs as postgres (service role), allowing access to auth.users.
CREATE OR REPLACE FUNCTION get_active_camp_registrations(p_camp_id uuid)
RETURNS TABLE (
  id uuid,
  camp_id uuid,
  user_id uuid,
  full_name text,
  age integer,
  grade integer,
  gender text,
  current_team text,
  preferred_team text,
  switches_remaining integer,
  participate_in_teams boolean,
  role text,
  mobile_number text,
  parent_name text,
  parent_number text,
  created_at timestamptz,
  updated_at timestamptz,
  is_admin boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    cr.id,
    cr.camp_id,
    cr.user_id,
    cr.full_name,
    cr.age,
    cr.grade,
    cr.gender,
    cr.current_team,
    cr.preferred_team,
    cr.switches_remaining,
    cr.participate_in_teams,
    cr.role,
    cr.mobile_number,
    cr.parent_name,
    cr.parent_number,
    cr.created_at,
    cr.updated_at,
    COALESCE(p.is_admin, false) AS is_admin
  FROM camp_registrations cr
  JOIN profiles p ON p.id = cr.user_id
  JOIN auth.users au ON au.id = cr.user_id
  WHERE cr.camp_id = p_camp_id
    AND (au.banned_until IS NULL OR au.banned_until < now())
  ORDER BY cr.full_name;
$$;

-- Only admins can call this function
REVOKE ALL ON FUNCTION get_active_camp_registrations(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_active_camp_registrations(uuid) TO authenticated;
