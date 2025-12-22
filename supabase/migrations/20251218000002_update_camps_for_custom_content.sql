-- Migration: Update camps table for unlimited participants and camp-specific content
-- Date: 2025-12-18
-- Description: Remove participant limit, add Bible verse and theme customization fields

-- Make max_participants nullable (remove the 96 default constraint)
ALTER TABLE camps
  ALTER COLUMN max_participants DROP DEFAULT,
  ALTER COLUMN max_participants DROP NOT NULL;

-- Add camp-specific content fields
ALTER TABLE camps
  ADD COLUMN IF NOT EXISTS bible_verse TEXT,
  ADD COLUMN IF NOT EXISTS verse_reference TEXT,
  ADD COLUMN IF NOT EXISTS theme_primary_color TEXT DEFAULT 'sky',
  ADD COLUMN IF NOT EXISTS theme_secondary_color TEXT DEFAULT 'blue',
  ADD COLUMN IF NOT EXISTS custom_content JSONB DEFAULT '{}'::jsonb;

-- Drop the old function first
DROP FUNCTION IF EXISTS get_camps_with_stats();

-- Update the get_camps_with_stats function to handle nullable max_participants
CREATE OR REPLACE FUNCTION get_camps_with_stats()
RETURNS TABLE (
  id UUID,
  name TEXT,
  season TEXT,
  year INTEGER,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN,
  registration_open BOOLEAN,
  max_participants INTEGER,
  description TEXT,
  registered_count BIGINT,
  spots_available INTEGER,
  bible_verse TEXT,
  verse_reference TEXT,
  theme_primary_color TEXT,
  theme_secondary_color TEXT,
  custom_content JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.season,
    c.year,
    c.start_date,
    c.end_date,
    c.is_active,
    c.registration_open,
    c.max_participants,
    c.description,
    COUNT(cr.id) as registered_count,
    -- If max_participants is NULL, spots_available is NULL (unlimited)
    CASE
      WHEN c.max_participants IS NULL THEN NULL
      ELSE (c.max_participants - COUNT(cr.id)::INTEGER)
    END as spots_available,
    c.bible_verse,
    c.verse_reference,
    c.theme_primary_color,
    c.theme_secondary_color,
    c.custom_content
  FROM camps c
  LEFT JOIN camp_registrations cr ON c.id = cr.camp_id
  GROUP BY c.id, c.name, c.season, c.year, c.start_date, c.end_date,
           c.is_active, c.registration_open, c.max_participants, c.description,
           c.bible_verse, c.verse_reference, c.theme_primary_color,
           c.theme_secondary_color, c.custom_content
  ORDER BY c.start_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Add some example data for Winter Camp 2026
UPDATE camps
SET
  bible_verse = 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
  verse_reference = 'John 3:16',
  theme_primary_color = 'sky',
  theme_secondary_color = 'blue',
  max_participants = NULL  -- Unlimited participants
WHERE season = 'winter' AND year = 2026;
