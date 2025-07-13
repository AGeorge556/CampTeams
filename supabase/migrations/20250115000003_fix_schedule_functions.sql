-- Fix missing functions and schema issues

-- Ensure schedule_id column exists in camp_sessions
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'camp_sessions' AND column_name = 'schedule_id') THEN
    ALTER TABLE camp_sessions ADD COLUMN schedule_id text REFERENCES camp_schedule(id);
  END IF;
END $$;

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_camp_sessions_schedule_id ON camp_sessions(schedule_id);

-- Function to get sessions with schedule information
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
    cs.session_type,
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

-- Note: Functions with return type conflicts are handled in migration 20250115000004_fix_function_return_types.sql 