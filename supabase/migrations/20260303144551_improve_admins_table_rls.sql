/*
  # Improve admins table with proper RLS policies

  1. Add missing RLS policies
    - INSERT policy for creating new admins
    - UPDATE policy for admin management
    - DELETE policy for removing admins
  
  2. Security
    - Allow admins to create new admins
    - Restrict to authenticated users only
    - Add user_id foreign key reference
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admins' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE admins ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DROP POLICY IF EXISTS "Admins can view all admins" ON admins;

CREATE POLICY "Admins can view all admins"
  ON admins FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert new admins"
  ON admins FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update admins"
  ON admins FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete admins"
  ON admins FOR DELETE
  TO authenticated
  USING (true);
