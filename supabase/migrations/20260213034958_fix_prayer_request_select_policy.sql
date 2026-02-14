/*
  # Fix SELECT policy for prayer requests

  1. Changes
    - Update prayer_requests SELECT policy to allow anonymous users to read
    - This allows users to see their submitted request number and confirmation
*/

DROP POLICY IF EXISTS "Authenticated users can view prayer requests" ON prayer_requests;

CREATE POLICY "Anyone can view prayer requests"
  ON prayer_requests FOR SELECT
  TO anon, authenticated
  USING (true);
