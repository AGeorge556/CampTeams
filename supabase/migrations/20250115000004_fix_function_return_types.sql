-- Fix function return type conflicts by dropping and recreating functions

-- Drop existing functions that have return type conflicts
DROP FUNCTION IF EXISTS get_sessions_with_delays();
DROP FUNCTION IF EXISTS get_sessions_with_attendance();
DROP FUNCTION IF EXISTS get_attendance_with_users();

-- Recreate get_sessions_with_delays function
CREATE OR REPLACE FUNCTION get_sessions_with_delays()
RETURNS TABLE (
  id uuid,
  name text,
  session_type text,
  original_start_time timestamptz,
  start_time timestamptz,
  end_time timestamptz,
  schedule_day integer,
  schedule_time text,
  schedule_activity text,
  schedule_location text,
  is_active boolean,
  has_delay boolean,
  delay_minutes integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cs.id,
    cs.name,
    cs.session_type,
    -- Calculate original time based on schedule
    CASE 
      WHEN sch.id IS NOT NULL AND camp_settings.camp_start_date IS NOT NULL THEN
        (camp_settings.camp_start_date + (sch.day - 1) * interval '1 day' +
         (split_part(sch.time, ':', 1) || ' hours')::interval +
         (split_part(sch.time, ':', 2) || ' minutes')::interval)
      ELSE cs.start_time
    END as original_start_time,
    cs.start_time,
    cs.end_time,
    sch.day as schedule_day,
    sch.time as schedule_time,
    sch.activity as schedule_activity,
    sch.location as schedule_location,
    cs.is_active,
    CASE 
      WHEN sch.id IS NOT NULL AND camp_settings.camp_start_date IS NOT NULL THEN
        cs.start_time != (camp_settings.camp_start_date + (sch.day - 1) * interval '1 day' +
                         (split_part(sch.time, ':', 1) || ' hours')::interval +
                         (split_part(sch.time, ':', 2) || ' minutes')::interval)
      ELSE false
    END as has_delay,
    CASE 
      WHEN sch.id IS NOT NULL AND camp_settings.camp_start_date IS NOT NULL THEN
        EXTRACT(EPOCH FROM (cs.start_time - (camp_settings.camp_start_date + (sch.day - 1) * interval '1 day' +
                                             (split_part(sch.time, ':', 1) || ' hours')::interval +
                                             (split_part(sch.time, ':', 2) || ' minutes')::interval))) / 60
      ELSE 0
    END as delay_minutes
  FROM camp_sessions cs
  LEFT JOIN camp_schedule sch ON cs.schedule_id = sch.id
  CROSS JOIN camp_settings
  ORDER BY cs.start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate get_sessions_with_attendance function
CREATE OR REPLACE FUNCTION get_sessions_with_attendance()
RETURNS TABLE (
  session_id uuid,
  session_name text,
  session_type text,
  start_time timestamptz,
  end_time timestamptz,
  total_participants bigint,
  present_count bigint,
  absent_count bigint,
  late_count bigint,
  excused_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cs.id as session_id,
    cs.name as session_name,
    cs.session_type,
    cs.start_time,
    cs.end_time,
    COUNT(ar.id) as total_participants,
    COUNT(ar.id) FILTER (WHERE ar.status = 'present') as present_count,
    COUNT(ar.id) FILTER (WHERE ar.status = 'absent') as absent_count,
    COUNT(ar.id) FILTER (WHERE ar.status = 'late') as late_count,
    COUNT(ar.id) FILTER (WHERE ar.status = 'excused') as excused_count
  FROM camp_sessions cs
  LEFT JOIN attendance_records ar ON cs.id = ar.session_id
  GROUP BY cs.id, cs.name, cs.session_type, cs.start_time, cs.end_time
  ORDER BY cs.start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate get_attendance_with_users function
CREATE OR REPLACE FUNCTION get_attendance_with_users()
RETURNS TABLE (
  record_id uuid,
  session_name text,
  user_name text,
  status text,
  checked_in_at timestamptz,
  checked_in_by_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ar.id as record_id,
    cs.name as session_name,
    p.full_name as user_name,
    ar.status,
    ar.checked_in_at,
    admin_p.full_name as checked_in_by_name
  FROM attendance_records ar
  JOIN camp_sessions cs ON ar.session_id = cs.id
  JOIN profiles p ON ar.user_id = p.id
  LEFT JOIN profiles admin_p ON ar.checked_in_by = admin_p.id
  ORDER BY ar.checked_in_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 