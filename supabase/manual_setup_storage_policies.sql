-- SQL to manually run in Supabase Dashboard

-- Enable RLS on the storage.objects table if not already enabled
-- This is a general setup step, usually done once.
-- alter table storage.objects enable row level security;
-- (Assuming RLS is already enabled for storage.objects as per common Supabase setup)

-- =================================================================
-- AVATARS BUCKET SETUP
-- =================================================================

-- Create the avatars bucket if it doesn't exist (set public: true for direct access)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif']) -- 5MB limit, common image types
ON CONFLICT (id) DO NOTHING;

-- Policies for 'avatars' bucket
DROP POLICY IF EXISTS "Allow authenticated avatar uploads" ON storage.objects;
CREATE POLICY "Allow authenticated avatar uploads"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND name LIKE auth.uid() || '/%'); -- Files must be in a folder named after user's UID

DROP POLICY IF EXISTS "Allow authenticated avatar updates" ON storage.objects;
CREATE POLICY "Allow authenticated avatar updates"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND name LIKE auth.uid() || '/%')
WITH CHECK (bucket_id = 'avatars' AND name LIKE auth.uid() || '/%');

DROP POLICY IF EXISTS "Allow authenticated avatar deletes" ON storage.objects;
CREATE POLICY "Allow authenticated avatar deletes"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND name LIKE auth.uid() || '/%');

DROP POLICY IF EXISTS "Public read access for avatars" ON storage.objects;
CREATE POLICY "Public read access for avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');


-- =================================================================
-- COURSE COVERS BUCKET SETUP
-- =================================================================

-- Attempt to delete the course-covers bucket first to ensure a clean recreation
-- This is to handle cases where it might exist but is misconfigured (e.g., not public)
-- Errors will be ignored if the bucket doesn't exist.
DO $$
BEGIN
  PERFORM storage.delete_bucket('course-covers');
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Bucket course-covers not found or could not be deleted, proceeding to create: %', SQLERRM;
END $$;

-- Create the course-covers bucket (set public: true for direct access)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('course-covers', 'course-covers', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']) -- 10MB limit, common image types
ON CONFLICT (id) DO UPDATE SET -- If it somehow still exists (e.g. due to concurrent operations or different error in DO block)
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Policies for 'course-covers' bucket

DROP POLICY IF EXISTS "Allow authenticated course cover uploads" ON storage.objects;
CREATE POLICY "Allow authenticated course cover uploads"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'course-covers');

DROP POLICY IF EXISTS "Allow tutors to update their own course covers" ON storage.objects;
CREATE POLICY "Allow tutors to update their own course covers"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'course-covers' AND name LIKE auth.uid() || '-%') -- Assumes filename starts with tutor's UID
WITH CHECK (bucket_id = 'course-covers' AND name LIKE auth.uid() || '-%');

DROP POLICY IF EXISTS "Allow tutors to delete their own course covers" ON storage.objects;
CREATE POLICY "Allow tutors to delete their own course covers"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'course-covers' AND name LIKE auth.uid() || '-%'); -- Assumes filename starts with tutor's UID

DROP POLICY IF EXISTS "Public read access for course covers" ON storage.objects;
CREATE POLICY "Public read access for course covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-covers');

-- Note: The generic `create_storage_policies` function is removed as more specific policies are defined per bucket.
-- Ensure RLS is enabled on storage.objects table:
-- Run this once if not already done: alter table storage.objects enable row level security;
-- This script assumes it's already enabled.

COMMIT;
