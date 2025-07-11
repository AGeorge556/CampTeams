-- Add camp_schedule table
CREATE TABLE IF NOT EXISTS camp_schedule (
  id text PRIMARY KEY,
  day integer NOT NULL CHECK (day >= 1 AND day <= 4),
  time text NOT NULL,
  activity text NOT NULL,
  location text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add user_sport_selections table
CREATE TABLE IF NOT EXISTS user_sport_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sport_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, sport_id)
);

-- Enable RLS on new tables
ALTER TABLE camp_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sport_selections ENABLE ROW LEVEL SECURITY;

-- Camp schedule policies
CREATE POLICY "All users can view camp schedule"
  ON camp_schedule
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify camp schedule"
  ON camp_schedule
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- User sport selections policies
CREATE POLICY "Users can view all sport selections"
  ON user_sport_selections
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own sport selections"
  ON user_sport_selections
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Insert default schedule data
INSERT INTO camp_schedule (id, day, time, activity, location, description) VALUES
-- Day 1
('1-1', 1, '08:00', 'Depart from Cairo', 'Church', 'Meet at church for departure'),
('1-2', 1, '08:30', 'Travel to Camp', 'Bus', 'Journey to camp location'),
('1-3', 1, '10:00', 'Arrive at Camp', 'Camp House', 'Unload and settle in'),
('1-4', 1, '10:30', 'Orientation', 'Main Hall', 'Camp rules and introductions'),
('1-5', 1, '11:00', 'Team Assignments', 'Outdoor Area', 'Meet your team members'),
('1-6', 1, '12:00', 'Lunch', 'Dining Hall', 'Team lunch together'),
('1-7', 1, '13:00', 'Free Time', 'Camp Grounds', 'Explore the camp'),
('1-8', 1, '14:00', 'Sports Activities', 'Sports Field', 'Soccer, dodgeball, chairball'),
('1-9', 1, '15:30', 'Snack Break', 'Dining Hall', 'Refreshments'),
('1-10', 1, '16:00', 'Team Building', 'Outdoor Area', 'Team challenges and games'),
('1-11', 1, '17:30', 'Dinner', 'Dining Hall', 'Evening meal'),
('1-12', 1, '19:00', 'Evening Program', 'Main Hall', 'Worship and fellowship'),
('1-13', 1, '21:00', 'Lights Out', 'Cabins', 'Prepare for bed'),

-- Day 2
('2-1', 2, '07:00', 'Wake Up', 'Cabins', 'Morning routine'),
('2-2', 2, '07:30', 'Breakfast', 'Dining Hall', 'Morning meal'),
('2-3', 2, '08:30', 'Morning Devotion', 'Outdoor Chapel', 'Spiritual time'),
('2-4', 2, '09:00', 'Sports Tournament', 'Sports Field', 'Soccer matches'),
('2-5', 2, '10:30', 'Dodgeball Games', 'Indoor Gym', 'Team dodgeball'),
('2-6', 2, '12:00', 'Lunch', 'Dining Hall', 'Team lunch'),
('2-7', 2, '13:00', 'Chairball Tournament', 'Sports Field', 'Chairball matches'),
('2-8', 2, '14:30', 'Water Activities', 'Lake', 'Swimming and water games'),
('2-9', 2, '16:00', 'Snack Break', 'Dining Hall', 'Refreshments'),
('2-10', 2, '16:30', 'Team Challenges', 'Outdoor Area', 'Obstacle courses'),
('2-11', 2, '18:00', 'Dinner', 'Dining Hall', 'Evening meal'),
('2-12', 2, '19:30', 'Campfire', 'Fire Pit', 'Songs and stories'),
('2-13', 2, '21:00', 'Lights Out', 'Cabins', 'Prepare for bed'),

-- Day 3
('3-1', 3, '07:00', 'Wake Up', 'Cabins', 'Morning routine'),
('3-2', 3, '07:30', 'Breakfast', 'Dining Hall', 'Morning meal'),
('3-3', 3, '08:30', 'Morning Devotion', 'Outdoor Chapel', 'Spiritual time'),
('3-4', 3, '09:00', 'Championship Matches', 'Sports Field', 'Final soccer games'),
('3-5', 3, '10:30', 'Dodgeball Finals', 'Indoor Gym', 'Championship dodgeball'),
('3-6', 3, '12:00', 'Lunch', 'Dining Hall', 'Team lunch'),
('3-7', 3, '13:00', 'Chairball Finals', 'Sports Field', 'Championship chairball'),
('3-8', 3, '14:30', 'Award Ceremony', 'Main Hall', 'Trophy presentation'),
('3-9', 3, '15:00', 'Free Time', 'Camp Grounds', 'Relax and explore'),
('3-10', 3, '16:30', 'Snack Break', 'Dining Hall', 'Refreshments'),
('3-11', 3, '17:00', 'Talent Show', 'Main Hall', 'Performances and fun'),
('3-12', 3, '18:30', 'Dinner', 'Dining Hall', 'Evening meal'),
('3-13', 3, '20:00', 'Final Campfire', 'Fire Pit', 'Closing ceremony'),
('3-14', 3, '21:00', 'Lights Out', 'Cabins', 'Prepare for bed'),

-- Day 4
('4-1', 4, '07:00', 'Wake Up', 'Cabins', 'Morning routine'),
('4-2', 4, '07:30', 'Breakfast', 'Dining Hall', 'Morning meal'),
('4-3', 4, '08:00', 'Pack Up', 'Cabins', 'Clean and pack belongings'),
('4-4', 4, '08:30', 'Final Devotion', 'Outdoor Chapel', 'Closing prayer'),
('4-5', 4, '09:00', 'Goodbyes', 'Main Hall', 'Farewell to new friends'),
('4-6', 4, '09:30', 'Load Bus', 'Camp Entrance', 'Board bus for return'),
('4-7', 4, '10:00', 'Depart Camp', 'Bus', 'Journey back to Cairo'),
('4-8', 4, '11:30', 'Arrive at Church', 'Church', 'Return to church')
ON CONFLICT (id) DO NOTHING; 