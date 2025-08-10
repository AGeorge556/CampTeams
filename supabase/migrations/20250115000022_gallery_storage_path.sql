-- Add storage_path to gallery_photos
ALTER TABLE gallery_photos ADD COLUMN IF NOT EXISTS storage_path text;

-- Backfill storage_path for existing rows (if any)
UPDATE gallery_photos
SET storage_path = regexp_replace(image_url, '^.*/gallery-photos/([^?]+).*$', '\1')
WHERE storage_path IS NULL AND image_url IS NOT NULL;

-- (Manual step: update app logic to use storage_path for upload, display, and delete)
-- (Manual step: ensure gallery-photos bucket is private and RLS is set)
