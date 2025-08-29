-- Fix Gallery Upload Issues
-- This migration ensures the gallery_photos table has the correct structure for uploads

-- Make image_url nullable since we're using storage_path for new uploads
ALTER TABLE gallery_photos ALTER COLUMN image_url DROP NOT NULL;

-- Ensure storage_path column exists
ALTER TABLE gallery_photos ADD COLUMN IF NOT EXISTS storage_path text;

-- Add index on storage_path for better performance
CREATE INDEX IF NOT EXISTS idx_gallery_photos_storage_path ON gallery_photos(storage_path);

-- Update RLS policies to ensure proper insert permissions
DROP POLICY IF EXISTS "Users can insert their own photos" ON gallery_photos;

CREATE POLICY "Users can insert their own photos"
  ON gallery_photos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() 
    AND (image_url IS NOT NULL OR storage_path IS NOT NULL)
  );

-- Add function to validate upload limits
CREATE OR REPLACE FUNCTION validate_gallery_upload(user_id_param uuid)
RETURNS boolean AS $$
DECLARE
  upload_count integer;
  max_uploads integer := 20; -- Increased limit
BEGIN
  SELECT COUNT(*) INTO upload_count
  FROM gallery_photos
  WHERE user_id = user_id_param
    AND submitted_at >= CURRENT_DATE;
  
  RETURN upload_count < max_uploads;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to automatically set submitted_at if not provided
CREATE OR REPLACE FUNCTION set_gallery_photo_timestamps()
RETURNS trigger AS $$
BEGIN
  IF NEW.submitted_at IS NULL THEN
    NEW.submitted_at = now();
  END IF;
  IF NEW.created_at IS NULL THEN
    NEW.created_at = now();
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS gallery_photos_timestamps_trigger ON gallery_photos;
CREATE TRIGGER gallery_photos_timestamps_trigger
  BEFORE INSERT OR UPDATE ON gallery_photos
  FOR EACH ROW
  EXECUTE FUNCTION set_gallery_photo_timestamps();

-- Add comment to track this migration
COMMENT ON TABLE gallery_photos IS 'Gallery photos table with fixed upload structure - supports both image_url and storage_path';
