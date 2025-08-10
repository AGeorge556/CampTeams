-- Fix toggle_gallery_visibility to include WHERE clause
CREATE OR REPLACE FUNCTION toggle_gallery_visibility()
RETURNS void AS $$
DECLARE
  exists_row boolean;
BEGIN
  -- Admin guard
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Ensure a row exists
  SELECT EXISTS (SELECT 1 FROM camp_settings) INTO exists_row;
  IF NOT exists_row THEN
    -- Initialize as hidden on first toggle (flip from default true)
    INSERT INTO camp_settings (id, gallery_visible)
    VALUES (gen_random_uuid(), false);
    RETURN;
  END IF;

  -- Flip persisted value for the single settings row
  UPDATE camp_settings
  SET gallery_visible = NOT COALESCE(gallery_visible, true)
  WHERE id = (SELECT id FROM camp_settings LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
