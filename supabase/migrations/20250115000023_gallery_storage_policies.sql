-- Storage RLS policies for gallery-photos bucket
-- Requires the gallery-photos bucket to exist (create via Supabase Studio or CLI)

-- Re-create policies idempotently (DROP IF EXISTS → CREATE)

-- Users can SELECT their own objects in gallery-photos
DROP POLICY IF EXISTS "Users can read own gallery photos" ON storage.objects;
CREATE POLICY "Users can read own gallery photos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'gallery-photos'
  AND (owner = auth.uid() OR split_part(name,'/',1) = auth.uid()::text)
);

-- Users can INSERT to their own folder in gallery-photos
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'gallery-photos'
  AND split_part(name,'/',1) = auth.uid()::text
);

-- Users can DELETE their own objects
DROP POLICY IF EXISTS "Users can delete own gallery photos" ON storage.objects;
CREATE POLICY "Users can delete own gallery photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'gallery-photos'
  AND (owner = auth.uid() OR split_part(name,'/',1) = auth.uid()::text)
);

-- Admins can manage all objects in gallery-photos
DROP POLICY IF EXISTS "Admins manage all gallery storage" ON storage.objects;
CREATE POLICY "Admins manage all gallery storage"
ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'gallery-photos'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')
  )
)
WITH CHECK (
  bucket_id = 'gallery-photos'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')
  )
);
