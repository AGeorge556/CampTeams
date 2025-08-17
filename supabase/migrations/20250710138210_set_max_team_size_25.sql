-- Set the default and current max team size to 25

-- Ensure default in camp_settings is 25 for future rows
DO $$ BEGIN
  -- Some Postgres flavors don’t support altering default easily via dynamic; attempt direct change
  BEGIN
    ALTER TABLE camp_settings ALTER COLUMN max_team_size SET DEFAULT 25;
  EXCEPTION WHEN others THEN
    -- ignore if not applicable
    NULL;
  END;
END $$;

-- Update existing record(s)
UPDATE camp_settings SET max_team_size = 25;

