/*
  # Prayer Request Management System Schema

  1. New Tables
    - `prayer_requests`
      - `id` (uuid, primary key) - Unique prayer request identifier
      - `request_number` (text, unique) - Human-readable request number (e.g., PR-001)
      - `name` (text) - Name of person requesting prayer
      - `mobile_number` (text) - Contact mobile number
      - `prayer_text` (text) - Written prayer request
      - `voice_recording_url` (text, nullable) - URL to voice recording in storage
      - `image_url` (text, nullable) - URL to uploaded image
      - `document_url` (text, nullable) - URL to uploaded document
      - `status` (text) - Status: 'pending' or 'completed'
      - `created_at` (timestamptz) - Timestamp of request creation
      - `completed_at` (timestamptz, nullable) - Timestamp when marked as completed

    - `fellowships`
      - `id` (uuid, primary key) - Unique fellowship identifier
      - `name` (text) - Fellowship name
      - `created_at` (timestamptz) - Creation timestamp

    - `team_members`
      - `id` (uuid, primary key) - Unique team member identifier
      - `user_id` (uuid, nullable) - Reference to auth.users (for admin users)
      - `name` (text) - Team member name
      - `email` (text, nullable) - Team member email
      - `fellowship_id` (uuid) - Reference to fellowships table
      - `created_at` (timestamptz) - Creation timestamp

    - `prayer_completions`
      - `id` (uuid, primary key) - Unique completion record identifier
      - `prayer_request_id` (uuid) - Reference to prayer_requests table
      - `team_member_id` (uuid) - Reference to team_members table
      - `completed_at` (timestamptz) - Timestamp when prayer was completed
      - Unique constraint on (prayer_request_id, team_member_id)

  2. Security
    - Enable RLS on all tables
    - Public can insert prayer requests
    - Only authenticated users (admins) can view and manage data
    - Team members can mark prayers as completed
*/

-- Create prayer_requests table
CREATE TABLE IF NOT EXISTS prayer_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number text UNIQUE NOT NULL,
  name text NOT NULL,
  mobile_number text NOT NULL,
  prayer_text text,
  voice_recording_url text,
  image_url text,
  document_url text,
  status text DEFAULT 'pending' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz
);

-- Create fellowships table
CREATE TABLE IF NOT EXISTS fellowships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  email text,
  fellowship_id uuid REFERENCES fellowships(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create prayer_completions table
CREATE TABLE IF NOT EXISTS prayer_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_request_id uuid REFERENCES prayer_requests(id) ON DELETE CASCADE,
  team_member_id uuid REFERENCES team_members(id) ON DELETE CASCADE,
  completed_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(prayer_request_id, team_member_id)
);

-- Enable RLS
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE fellowships ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prayer_requests
CREATE POLICY "Anyone can submit prayer requests"
  ON prayer_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view prayer requests"
  ON prayer_requests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update prayer requests"
  ON prayer_requests FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete prayer requests"
  ON prayer_requests FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for fellowships
CREATE POLICY "Authenticated users can view fellowships"
  ON fellowships FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert fellowships"
  ON fellowships FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update fellowships"
  ON fellowships FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete fellowships"
  ON fellowships FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for team_members
CREATE POLICY "Authenticated users can view team members"
  ON team_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert team members"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update team members"
  ON team_members FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete team members"
  ON team_members FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for prayer_completions
CREATE POLICY "Authenticated users can view prayer completions"
  ON prayer_completions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert prayer completions"
  ON prayer_completions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete prayer completions"
  ON prayer_completions FOR DELETE
  TO authenticated
  USING (true);

-- Create function to generate sequential request numbers
CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS text AS $$
DECLARE
  next_number integer;
  new_request_number text;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(request_number FROM 4) AS integer)), 0) + 1
  INTO next_number
  FROM prayer_requests;
  
  new_request_number := 'PR-' || LPAD(next_number::text, 4, '0');
  RETURN new_request_number;
END;
$$ LANGUAGE plpgsql;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_prayer_requests_status ON prayer_requests(status);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_created_at ON prayer_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_members_fellowship ON team_members(fellowship_id);