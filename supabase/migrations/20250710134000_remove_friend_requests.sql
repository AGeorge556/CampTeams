-- Remove friend_requests column from profiles table
-- This migration removes the friend_requests functionality from the system

-- Drop the friend_requests column from profiles table
ALTER TABLE profiles DROP COLUMN IF EXISTS friend_requests;

-- Update the profiles table comment to remove friend_requests reference
COMMENT ON TABLE profiles IS 'User profiles with team assignments and preferences'; 