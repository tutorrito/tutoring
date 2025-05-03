-- Drop existing policies
DO $$ 
BEGIN
  -- Drop all existing storage policies
  EXECUTE 'DROP POLICY IF EXISTS "avatar_insert_policy" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "avatar_select_policy" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "avatar_update_policy" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "avatar_delete_policy" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "avatar_public_select_policy" ON storage.objects';
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;

-- Ensure storage.objects has RLS enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Recreate avatars bucket with proper MIME type configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,  -- Set to true to allow public access to avatars
  5242880,  -- 5MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ];

-- Create policies for avatar management
CREATE POLICY "Allow public avatar access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Allow authenticated users to upload avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow users to update their avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow users to delete their avatars"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);