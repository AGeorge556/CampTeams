-- Create rules_acceptance table
CREATE TABLE IF NOT EXISTS rules_acceptance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  accepted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE rules_acceptance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own rules acceptance"
  ON rules_acceptance
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own rules acceptance"
  ON rules_acceptance
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create function to check if user has accepted rules
CREATE OR REPLACE FUNCTION has_accepted_rules(user_id_param uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM rules_acceptance 
    WHERE user_id = user_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to accept rules
CREATE OR REPLACE FUNCTION accept_rules(user_id_param uuid)
RETURNS boolean AS $$
BEGIN
  INSERT INTO rules_acceptance (user_id)
  VALUES (user_id_param)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 