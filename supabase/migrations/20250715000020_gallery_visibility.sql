-- Add gallery visibility control to camp_settings
-- This allows admins to hide the gallery tab from campers

-- Add the new column to camp_settings table
ALTER TABLE camp_settings 
ADD COLUMN IF NOT EXISTS gallery_visible boolean DEFAULT true;

-- Update existing records to have gallery visible by default
UPDATE camp_settings 
SET gallery_visible = true 
WHERE gallery_visible IS NULL;

-- Add comment to document the new field
COMMENT ON COLUMN camp_settings.gallery_visible IS 'Controls whether the gallery tab is visible to non-admin users';

-- Function to toggle gallery visibility
CREATE OR REPLACE FUNCTION toggle_gallery_visibility()
RETURNS void AS $$
BEGIN
  UPDATE camp_settings 
  SET gallery_visible = NOT gallery_visible
  WHERE id = (SELECT id FROM camp_settings LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get gallery visibility status
CREATE OR REPLACE FUNCTION get_gallery_visibility()
RETURNS boolean AS $$
DECLARE
  is_visible boolean;
BEGIN
  SELECT gallery_visible INTO is_visible 
  FROM camp_settings 
  LIMIT 1;
  
  RETURN COALESCE(is_visible, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 