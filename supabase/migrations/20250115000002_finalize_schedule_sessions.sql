-- Add schedule finalization tracking
ALTER TABLE camp_settings ADD COLUMN schedule_finalized boolean DEFAULT false;
ALTER TABLE camp_settings ADD COLUMN schedule_finalized_at timestamptz;
ALTER TABLE camp_settings ADD COLUMN camp_start_date date;

-- Function to finalize schedule and create all sessions
CREATE OR REPLACE FUNCTION finalize_schedule(camp_start_date_param date)
RETURNS void AS $$
DECLARE
  schedule_item camp_schedule%ROWTYPE;
  session_type text;
  session_start timestamptz;
  session_end timestamptz;
BEGIN
  -- Update camp settings
  UPDATE camp_settings 
  SET 
    schedule_finalized = true,
    schedule_finalized_at = now(),
    camp_start_date = camp_start_date_param
  WHERE id = (SELECT id FROM camp_settings LIMIT 1);
  
  -- Create sessions for all schedule items
  FOR schedule_item IN 
    SELECT * FROM camp_schedule ORDER BY day, time
  LOOP
    -- Determine session type based on activity
    session_type := CASE 
      WHEN schedule_item.activity ILIKE '%devotion%' OR schedule_item.activity ILIKE '%prayer%' THEN 'sermon'
      WHEN schedule_item.activity ILIKE '%breakfast%' OR schedule_item.activity ILIKE '%lunch%' OR schedule_item.activity ILIKE '%dinner%' THEN 'meal'
      WHEN schedule_item.activity ILIKE '%sports%' OR schedule_item.activity ILIKE '%game%' OR schedule_item.activity ILIKE '%tournament%' THEN 'activity'
      WHEN schedule_item.activity ILIKE '%free time%' OR schedule_item.activity ILIKE '%pack%' THEN 'other'
      ELSE 'activity'
    END;
    
    -- Calculate session times based on camp start date
    session_start := (
      camp_start_date_param + (schedule_item.day - 1) * interval '1 day' +
      (split_part(schedule_item.time, ':', 1) || ' hours')::interval +
      (split_part(schedule_item.time, ':', 2) || ' minutes')::interval
    );
    
    -- Default session duration based on type
    session_end := session_start + CASE session_type
      WHEN 'meal' THEN interval '45 minutes'
      WHEN 'sermon' THEN interval '1 hour'
      WHEN 'activity' THEN interval '1 hour 30 minutes'
      ELSE interval '1 hour'
    END;
    
    -- Create session if it doesn't already exist
    IF NOT EXISTS (SELECT 1 FROM camp_sessions WHERE schedule_id = schedule_item.id) THEN
      INSERT INTO camp_sessions (
        name,
        description,
        session_type,
        start_time,
        end_time,
        schedule_id,
        qr_code,
        created_by
      ) VALUES (
        schedule_item.activity,
        schedule_item.description,
        session_type,
        session_start,
        session_end,
        schedule_item.id,
        encode(hmac(gen_random_uuid()::text || schedule_item.id, 'camp_attendance_secret', 'sha256'), 'base64'),
        auth.uid()
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update session times (for delays)
CREATE OR REPLACE FUNCTION update_session_times(
  session_id uuid,
  new_start_time timestamptz,
  new_end_time timestamptz,
  delay_reason text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE camp_sessions 
  SET 
    start_time = new_start_time,
    end_time = new_end_time
  WHERE id = session_id;
  
  -- Log the change (you could add a session_changes table if needed)
  -- For now, we'll just update the description if a reason is provided
  IF delay_reason IS NOT NULL THEN
    UPDATE camp_sessions 
    SET description = COALESCE(description, '') || ' [DELAY: ' || delay_reason || ']'
    WHERE id = session_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get schedule status
CREATE OR REPLACE FUNCTION get_schedule_status()
RETURNS TABLE (
  finalized boolean,
  finalized_at timestamptz,
  camp_start_date date,
  total_sessions bigint,
  active_sessions bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cs.schedule_finalized,
    cs.schedule_finalized_at,
    cs.camp_start_date,
    COUNT(camp_sessions.id) as total_sessions,
    COUNT(camp_sessions.id) FILTER (WHERE camp_sessions.is_active = true) as active_sessions
  FROM camp_settings cs
  LEFT JOIN camp_sessions ON true
  GROUP BY cs.schedule_finalized, cs.schedule_finalized_at, cs.camp_start_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get sessions with delay information
CREATE OR REPLACE FUNCTION get_sessions_with_delays()
RETURNS TABLE (
  session_id uuid,
  session_name text,
  session_type text,
  original_start_time timestamptz,
  current_start_time timestamptz,
  current_end_time timestamptz,
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
    cs.id as session_id,
    cs.name as session_name,
    cs.session_type,
    -- Calculate original time based on schedule
    (camp_settings.camp_start_date + (sch.day - 1) * interval '1 day' +
     (split_part(sch.time, ':', 1) || ' hours')::interval +
     (split_part(sch.time, ':', 2) || ' minutes')::interval) as original_start_time,
    cs.start_time as current_start_time,
    cs.end_time as current_end_time,
    sch.day as schedule_day,
    sch.time as schedule_time,
    sch.activity as schedule_activity,
    sch.location as schedule_location,
    cs.is_active,
    cs.start_time != (camp_settings.camp_start_date + (sch.day - 1) * interval '1 day' +
                      (split_part(sch.time, ':', 1) || ' hours')::interval +
                      (split_part(sch.time, ':', 2) || ' minutes')::interval) as has_delay,
    EXTRACT(EPOCH FROM (cs.start_time - (camp_settings.camp_start_date + (sch.day - 1) * interval '1 day' +
                                         (split_part(sch.time, ':', 1) || ' hours')::interval +
                                         (split_part(sch.time, ':', 2) || ' minutes')::interval))) / 60 as delay_minutes
  FROM camp_sessions cs
  LEFT JOIN camp_schedule sch ON cs.schedule_id = sch.id
  CROSS JOIN camp_settings
  ORDER BY cs.start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 