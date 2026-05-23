-- Fix QR Code URLs to use query parameters instead of path parameters
-- This migration updates all existing QR codes to use the new format for better Vercel compatibility

-- Update existing QR codes from path format to query parameter format
UPDATE camp_sessions 
SET qr_code = REPLACE(qr_code, '/attendance/', '/?attendance=')
WHERE qr_code LIKE '%/attendance/%';

-- Also update any QR codes that might have the old format without the full domain
UPDATE camp_sessions 
SET qr_code = CONCAT(REPLACE(qr_code, '/attendance/', '/?attendance='))
WHERE qr_code LIKE '%/attendance/%' AND qr_code NOT LIKE 'http%';

-- Add a comment to track this migration
COMMENT ON TABLE camp_sessions IS 'QR codes updated to use query parameters for better Vercel compatibility';
