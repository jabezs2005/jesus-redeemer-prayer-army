/*
  # Storage Buckets Configuration

  1. Storage Buckets
    - `prayer-voice-recordings` - Store voice recordings
    - `prayer-images` - Store uploaded images
    - `prayer-documents` - Store uploaded documents

  2. Security
    - Public read access for all buckets
    - Authenticated users can upload files
    - Anyone (including anonymous) can upload to support public prayer request submission
*/

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('prayer-voice-recordings', 'prayer-voice-recordings', true),
  ('prayer-images', 'prayer-images', true),
  ('prayer-documents', 'prayer-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for prayer-voice-recordings bucket
CREATE POLICY "Anyone can upload voice recordings"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'prayer-voice-recordings');

CREATE POLICY "Anyone can view voice recordings"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'prayer-voice-recordings');

CREATE POLICY "Authenticated users can delete voice recordings"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'prayer-voice-recordings');

-- Policies for prayer-images bucket
CREATE POLICY "Anyone can upload images"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'prayer-images');

CREATE POLICY "Anyone can view images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'prayer-images');

CREATE POLICY "Authenticated users can delete images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'prayer-images');

-- Policies for prayer-documents bucket
CREATE POLICY "Anyone can upload documents"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'prayer-documents');

CREATE POLICY "Anyone can view documents"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'prayer-documents');

CREATE POLICY "Authenticated users can delete documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'prayer-documents');