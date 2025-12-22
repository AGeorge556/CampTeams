-- Test 1: Check if function exists
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'get_camps_with_stats';

-- Test 2: Try to run the function
SELECT * FROM get_camps_with_stats();

-- Test 3: Check camps table directly
SELECT id, name, season, year, bible_verse, theme_primary_color
FROM camps;

-- Test 4: Check if there are any camp_registrations
SELECT COUNT(*) as registration_count FROM camp_registrations;

-- Test 5: Check RLS on camps table
SELECT * FROM camps WHERE is_active = true;
