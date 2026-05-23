-- Fix session_type return type issue by casting VARCHAR to text

-- Drop and recreate get_sessions_with_schedule function with proper type casting
DROP FUNCTION IF EXISTS get_sessions_with_schedule();

CREATE OR REPLACE FUNCTION get_sessions_with_schedule()
RETURNS TABLE (
  id uuid,
  name text,
  session_type text,
  start_time timestamptz,
  end_time timestamptz,
  schedule_id text,
  schedule_day integer,
  schedule_time text,
  schedule_activity text,
  schedule_location text,
  is_active boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cs.id,
    cs.name,
    cs.session_type::text,  -- Cast VARCHAR to text
    cs.start_time,
    cs.end_time,
    cs.schedule_id,
    sch.day as schedule_day,
    sch.time as schedule_time,
    sch.activity as schedule_activity,
    sch.location as schedule_location,
    cs.is_active
  FROM camp_sessions cs
  LEFT JOIN camp_schedule sch ON cs.schedule_id = sch.id
  ORDER BY cs.start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 