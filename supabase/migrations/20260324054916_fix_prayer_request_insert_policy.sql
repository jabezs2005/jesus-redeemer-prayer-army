/*
  # Fix prayer request INSERT policy
  
  1. Changes
    - Replace the overly restrictive INSERT policy with separate policies for anonymous and authenticated users
    - Remove conflicting policies that might be blocking anonymous inserts
    - Ensure anonymous users (public) can successfully submit prayer requests
    - Keep authenticated user policies for admin access
*/

DROP POLICY IF EXISTS "Anyone can submit prayer requests" ON prayer_requests;

-- Allow anonymous users to insert prayer requests
CREATE POLICY "Allow anonymous prayer request submission"
  ON prayer_requests FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to insert prayer requests
CREATE POLICY "Allow authenticated prayer request submission"
  ON prayer_requests FOR INSERT
  TO authenticated
  WITH CHECK (true);
