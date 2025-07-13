-- Create camp sessions table
CREATE TABLE camp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  session_type VARCHAR(50) NOT NULL CHECK (session_type IN ('sermon', 'quiet_time', 'activity', 'meal', 'other')),
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  qr_code TEXT, -- Store the QR code data
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance records table
CREATE TABLE attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES camp_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  checked_in_by UUID REFERENCES profiles(id), -- admin who marked attendance (null for self-check-in)
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, user_id) -- Prevent duplicate attendance records
);

-- Create indexes for better performance
CREATE INDEX idx_attendance_records_session_id ON attendance_records(session_id);
CREATE INDEX idx_attendance_records_user_id ON attendance_records(user_id);
CREATE INDEX idx_camp_sessions_active ON camp_sessions(is_active);
CREATE INDEX idx_camp_sessions_start_time ON camp_sessions(start_time);

-- Enable RLS
ALTER TABLE camp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for camp_sessions
CREATE POLICY "Admins can manage all sessions" ON camp_sessions
  FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));

CREATE POLICY "Users can view active sessions" ON camp_sessions
  FOR SELECT USING (is_active = true);

-- RLS Policies for attendance_records
CREATE POLICY "Admins can manage all attendance" ON attendance_records
  FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));

CREATE POLICY "Users can view their own attendance" ON attendance_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own attendance" ON attendance_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to generate QR code for a session
CREATE OR REPLACE FUNCTION generate_session_qr_code(session_uuid UUID)
RETURNS TEXT AS $$
BEGIN
  -- Generate a unique QR code based on session ID and timestamp
  RETURN encode(hmac(gen_random_uuid()::text || session_uuid::text, 'camp_attendance_secret', 'sha256'), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can attend a session
CREATE OR REPLACE FUNCTION can_attend_session(session_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if session exists and is active
  IF NOT EXISTS (SELECT 1 FROM camp_sessions WHERE id = session_uuid AND is_active = true) THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user hasn't already attended this session
  IF EXISTS (SELECT 1 FROM attendance_records WHERE session_id = session_uuid AND user_id = user_uuid) THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 