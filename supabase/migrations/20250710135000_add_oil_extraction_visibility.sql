-- Add oil extraction visibility setting to camp_settings table
-- This allows admins to hide the oil extraction tab from campers

-- Add the new column to camp_settings table
ALTER TABLE camp_settings 
ADD COLUMN IF NOT EXISTS oil_extraction_visible boolean DEFAULT true;

-- Update existing records to have oil extraction visible by default
UPDATE camp_settings 
SET oil_extraction_visible = true 
WHERE oil_extraction_visible IS NULL;

-- Add comment to document the new field
COMMENT ON COLUMN camp_settings.oil_extraction_visible IS 'Controls whether the oil extraction tab is visible to non-admin users'; 