/*
  # Create admins table for multiple admin accounts

  1. New Tables
    - `admins`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `role` (text, default 'admin')
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on `admins` table
    - Add policy to allow admins to view all admins
*/

CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role text DEFAULT 'admin',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all admins"
  ON admins FOR SELECT
  TO authenticated
  USING (true);
