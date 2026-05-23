-- Activate Summer Camp 2026 (Aug 20-23) and deactivate Winter Camp 2026
UPDATE camps SET is_active = false WHERE season = 'winter' AND year = 2026;
UPDATE camps SET
  is_active = true,
  description = 'Summer Camp 2026 - August 20-23. Teams, sports, gallery, and more!'
WHERE season = 'summer' AND year = 2026;
