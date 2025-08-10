-- Ensure camp_settings row exists and make gallery visibility persistent

-- Robust getter: ensures a row exists and returns stored value
CREATE OR REPLACE FUNCTION get_gallery_visibility()
RETURNS boolean AS $$
DECLARE
  vis boolean;
BEGIN
  -- Ensure at least one row exists
  PERFORM 1 FROM camp_settings;
  IF NOT FOUND THEN
    INSERT INTO camp_settings (id, gallery_visible)
    VALUES (gen_random_uuid(), true);
  END IF;

  SELECT COALESCE(gallery_visible, true) INTO vis
  FROM camp_settings
  LIMIT 1;

  RETURN vis;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Robust toggle: admin-guarded, creates row if missing, flips stored value
CREATE OR REPLACE FUNCTION toggle_gallery_visibility()
RETURNS void AS $$
DECLARE
  current_vis boolean;
BEGIN
  -- Admin guard
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Ensure row exists
  PERFORM 1 FROM camp_settings;
  IF NOT FOUND THEN
    -- If none existed, initialize as hidden (toggle from default true)
    INSERT INTO camp_settings (id, gallery_visible)
    VALUES (gen_random_uuid(), false);
    RETURN;
  END IF;

  -- Flip persisted value
  UPDATE camp_settings
  SET gallery_visible = NOT COALESCE(gallery_visible, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
