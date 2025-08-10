-- Secure schedule visibility toggle
CREATE OR REPLACE FUNCTION toggle_schedule_visibility()
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE camp_settings 
  SET schedule_visible = NOT schedule_visible
  WHERE id = (SELECT id FROM camp_settings LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Secure oil extraction visibility toggle
CREATE OR REPLACE FUNCTION toggle_oil_extraction_visibility()
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE camp_settings 
  SET oil_extraction_visible = NOT oil_extraction_visible
  WHERE id = (SELECT id FROM camp_settings LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Secure gallery visibility toggle
CREATE OR REPLACE FUNCTION toggle_gallery_visibility()
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE camp_settings 
  SET gallery_visible = NOT gallery_visible
  WHERE id = (SELECT id FROM camp_settings LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
