/*
  # Fix Storage Policies

  1. Changes
    - Drop and recreate storage policies with proper permissions
    - Fix bucket configuration
    - Add proper MIME type restrictions
*/

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Recreate avatars bucket with proper settings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,  -- 5MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

-- Drop existing policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow public avatar access" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to upload avatars" ON storage.objects;
  DROP POLICY IF EXISTS "Allow users to update their avatars" ON storage.objects;
  DROP POLICY IF EXISTS "Allow users to delete their avatars" ON storage.objects;
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;

-- Create new storage policies
CREATE POLICY "Allow public avatar access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Allow authenticated users to upload avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow users to update their avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow users to delete their avatars"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);