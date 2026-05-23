-- Add schedule_id column to camp_sessions to link with camp_schedule
ALTER TABLE camp_sessions ADD COLUMN schedule_id text REFERENCES camp_schedule(id);

-- Add index for better performance
CREATE INDEX idx_camp_sessions_schedule_id ON camp_sessions(schedule_id);

-- Function to create sessions from schedule items
CREATE OR REPLACE FUNCTION create_session_from_schedule(
  schedule_item_id text,
  session_name text,
  session_type text DEFAULT 'activity',
  start_time_offset interval DEFAULT '0 minutes',
  end_time_offset interval DEFAULT '1 hour'
)
RETURNS uuid AS $$
DECLARE
  schedule_item camp_schedule%ROWTYPE;
  session_start timestamptz;
  session_end timestamptz;
  new_session_id uuid;
BEGIN
  -- Get the schedule item
  SELECT * INTO schedule_item FROM camp_schedule WHERE id = schedule_item_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Schedule item not found: %', schedule_item_id;
  END IF;
  
  -- Calculate session times based on schedule day and time
  -- Assuming camp starts on a specific date, we'll use a base date
  -- You can adjust this based on your actual camp start date
  session_start := (
    -- Base date for camp (adjust as needed)
    '2025-08-25'::date + (schedule_item.day - 1) * interval '1 day' +
    -- Parse time from schedule (assuming HH:MM format)
    (split_part(schedule_item.time, ':', 1) || ' hours')::interval +
    (split_part(schedule_item.time, ':', 2) || ' minutes')::interval +
    start_time_offset
  );
  
  session_end := session_start + end_time_offset;
  
  -- Create the session
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
    session_name,
    schedule_item.description,
    session_type::text,
    session_start,
    session_end,
    schedule_item_id,
    encode(hmac(gen_random_uuid()::text || schedule_item_id, 'camp_attendance_secret', 'sha256'), 'base64'),
    auth.uid()
  ) RETURNING id INTO new_session_id;
  
  RETURN new_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get sessions with schedule information
CREATE OR REPLACE FUNCTION get_sessions_with_schedule()
RETURNS TABLE (
  session_id uuid,
  session_name text,
  session_type text,
  session_start timestamptz,
  session_end timestamptz,
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
    cs.id as session_id,
    cs.name as session_name,
    cs.session_type,
    cs.start_time as session_start,
    cs.end_time as session_end,
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

-- Function to auto-create sessions for a specific day
CREATE OR REPLACE FUNCTION create_sessions_for_day(day_number integer)
RETURNS void AS $$
DECLARE
  schedule_item camp_schedule%ROWTYPE;
  session_type text;
BEGIN
  -- Loop through all schedule items for the specified day
  FOR schedule_item IN 
    SELECT * FROM camp_schedule WHERE day = day_number ORDER BY time
  LOOP
    -- Determine session type based on activity
    session_type := CASE 
      WHEN schedule_item.activity ILIKE '%devotion%' OR schedule_item.activity ILIKE '%prayer%' THEN 'sermon'
      WHEN schedule_item.activity ILIKE '%breakfast%' OR schedule_item.activity ILIKE '%lunch%' OR schedule_item.activity ILIKE '%dinner%' THEN 'meal'
      WHEN schedule_item.activity ILIKE '%sports%' OR schedule_item.activity ILIKE '%game%' OR schedule_item.activity ILIKE '%tournament%' THEN 'activity'
      WHEN schedule_item.activity ILIKE '%free time%' OR schedule_item.activity ILIKE '%pack%' THEN 'other'
      ELSE 'activity'
    END;
    
    -- Create session if it doesn't already exist
    IF NOT EXISTS (SELECT 1 FROM camp_sessions WHERE schedule_id = schedule_item.id) THEN
      PERFORM create_session_from_schedule(
        schedule_item.id,
        schedule_item.activity,
        session_type,
        '0 minutes'::interval,
        '1 hour'::interval
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 