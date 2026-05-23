-- Add schedule visibility control to camp_settings
ALTER TABLE camp_settings ADD COLUMN schedule_visible boolean DEFAULT true;

-- Function to toggle schedule visibility
CREATE OR REPLACE FUNCTION toggle_schedule_visibility()
RETURNS void AS $$
BEGIN
  UPDATE camp_settings 
  SET schedule_visible = NOT schedule_visible
  WHERE id = (SELECT id FROM camp_settings LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get schedule visibility status
CREATE OR REPLACE FUNCTION get_schedule_visibility()
RETURNS boolean AS $$
DECLARE
  is_visible boolean;
BEGIN
  SELECT schedule_visible INTO is_visible 
  FROM camp_settings 
  LIMIT 1;
  
  RETURN COALESCE(is_visible, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 