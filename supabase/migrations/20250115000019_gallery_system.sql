-- Gallery System Database Schema
-- This migration adds the photo gallery functionality with moderation system

-- Create gallery_photos table
CREATE TABLE IF NOT EXISTS gallery_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_id text CHECK (team_id IN ('red', 'blue', 'green', 'yellow')),
  image_url text NOT NULL,
  caption text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at timestamptz DEFAULT now(),
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gallery_photos_user_id ON gallery_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_gallery_photos_status ON gallery_photos(status);
CREATE INDEX IF NOT EXISTS idx_gallery_photos_submitted_at ON gallery_photos(submitted_at);
CREATE INDEX IF NOT EXISTS idx_gallery_photos_team_id ON gallery_photos(team_id);
CREATE INDEX IF NOT EXISTS idx_gallery_photos_reviewed_by ON gallery_photos(reviewed_by);

-- Enable RLS
ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gallery_photos
-- Users can view all approved photos
CREATE POLICY "Users can view approved photos"
  ON gallery_photos
  FOR SELECT
  TO authenticated
  USING (status = 'approved');

-- Users can view their own photos (regardless of status)
CREATE POLICY "Users can view their own photos"
  ON gallery_photos
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own photos
CREATE POLICY "Users can insert their own photos"
  ON gallery_photos
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own pending photos
CREATE POLICY "Users can update their own pending photos"
  ON gallery_photos
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'pending');

-- Users can delete their own pending photos
CREATE POLICY "Users can delete their own pending photos"
  ON gallery_photos
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'pending');

-- Admins can view all photos
CREATE POLICY "Admins can view all photos"
  ON gallery_photos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')
    )
  );

-- Admins can manage all photos
CREATE POLICY "Admins can manage all photos"
  ON gallery_photos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')
    )
  );

-- Function to check daily upload limit
CREATE OR REPLACE FUNCTION check_daily_upload_limit(user_id_param uuid)
RETURNS boolean AS $$
DECLARE
  upload_count integer;
  max_uploads integer := 10;
BEGIN
  SELECT COUNT(*) INTO upload_count
  FROM gallery_photos
  WHERE user_id = user_id_param
    AND submitted_at >= CURRENT_DATE;
  
  RETURN upload_count < max_uploads;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to approve a photo
CREATE OR REPLACE FUNCTION approve_photo(photo_id_param uuid, admin_id_param uuid)
RETURNS boolean AS $$
BEGIN
  UPDATE gallery_photos
  SET status = 'approved',
      reviewed_by = admin_id_param,
      reviewed_at = now(),
      updated_at = now()
  WHERE id = photo_id_param;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject a photo
CREATE OR REPLACE FUNCTION reject_photo(photo_id_param uuid, admin_id_param uuid)
RETURNS boolean AS $$
BEGIN
  UPDATE gallery_photos
  SET status = 'rejected',
      reviewed_by = admin_id_param,
      reviewed_at = now(),
      updated_at = now()
  WHERE id = photo_id_param;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get gallery statistics
CREATE OR REPLACE FUNCTION get_gallery_stats()
RETURNS TABLE (
  total_photos bigint,
  pending_photos bigint,
  approved_photos bigint,
  rejected_photos bigint,
  total_users bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_photos,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_photos,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_photos,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_photos,
    COUNT(DISTINCT user_id) as total_users
  FROM gallery_photos;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get photos with user and team info
CREATE OR REPLACE FUNCTION get_gallery_photos_with_info(status_filter text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  team_id text,
  image_url text,
  caption text,
  status text,
  submitted_at timestamptz,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz,
  user_name text,
  team_name text,
  reviewer_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gp.id,
    gp.user_id,
    gp.team_id,
    gp.image_url,
    gp.caption,
    gp.status,
    gp.submitted_at,
    gp.reviewed_by,
    gp.reviewed_at,
    gp.created_at,
    p.full_name as user_name,
    CASE 
      WHEN gp.team_id = 'red' THEN 'Red Team'
      WHEN gp.team_id = 'blue' THEN 'Blue Team'
      WHEN gp.team_id = 'green' THEN 'Green Team'
      WHEN gp.team_id = 'yellow' THEN 'Yellow Team'
      ELSE 'No Team'
    END as team_name,
    r.full_name as reviewer_name
  FROM gallery_photos gp
  LEFT JOIN profiles p ON gp.user_id = p.id
  LEFT JOIN profiles r ON gp.reviewed_by = r.id
  WHERE (status_filter IS NULL OR gp.status = status_filter)
  ORDER BY gp.submitted_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_gallery_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_gallery_photos_updated_at
  BEFORE UPDATE ON gallery_photos
  FOR EACH ROW
  EXECUTE FUNCTION update_gallery_photos_updated_at(); 