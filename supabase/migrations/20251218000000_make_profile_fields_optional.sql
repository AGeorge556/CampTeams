-- Migration: Make profile fields optional for initial signup
-- Date: 2025-12-18
-- Description: Remove NOT NULL constraints from grade, gender, and preferred_team
--              Users will provide these details when registering for a specific camp

-- Remove NOT NULL constraints
ALTER TABLE profiles
  ALTER COLUMN grade DROP NOT NULL,
  ALTER COLUMN gender DROP NOT NULL,
  ALTER COLUMN preferred_team DROP NOT NULL;

-- Update check constraints to allow NULL
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_grade_check;

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_gender_check;

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_preferred_team_check;

-- Re-add check constraints that allow NULL
ALTER TABLE profiles
  ADD CONSTRAINT profiles_grade_check
  CHECK (grade IS NULL OR (grade >= 7 AND grade <= 12));

ALTER TABLE profiles
  ADD CONSTRAINT profiles_gender_check
  CHECK (gender IS NULL OR gender IN ('male', 'female'));

ALTER TABLE profiles
  ADD CONSTRAINT profiles_preferred_team_check
  CHECK (preferred_team IS NULL OR preferred_team IN ('red', 'blue', 'green', 'yellow'));
