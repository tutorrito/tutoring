-- Drop existing policies if they exist
DO $$ 
BEGIN
  -- Drop policies one by one with error handling
  BEGIN
    DROP POLICY IF EXISTS "Users can upload avatar files" ON storage.objects;
  EXCEPTION WHEN OTHERS THEN
    -- Policy doesn't exist or can't be dropped, continue
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Users can view their own avatar files" ON storage.objects;
  EXCEPTION WHEN OTHERS THEN
    -- Policy doesn't exist or can't be dropped, continue
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Users can update their own avatar files" ON storage.objects;
  EXCEPTION WHEN OTHERS THEN
    -- Policy doesn't exist or can't be dropped, continue
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Users can delete their own avatar files" ON storage.objects;
  EXCEPTION WHEN OTHERS THEN
    -- Policy doesn't exist or can't be dropped, continue
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Public read access for avatar files" ON storage.objects;
  EXCEPTION WHEN OTHERS THEN
    -- Policy doesn't exist or can't be dropped, continue
  END;
END $$;

-- Create avatars bucket if it doesn't exist with proper settings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create new policies with safe CREATE OR REPLACE syntax
DO $$ 
BEGIN
  -- Upload policy
  EXECUTE 'CREATE POLICY "avatar_insert_policy" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = ''avatars'' AND
      (storage.foldername(name))[1] = auth.uid()::text
    )';
  
  -- View policy
  EXECUTE 'CREATE POLICY "avatar_select_policy" ON storage.objects
    FOR SELECT TO authenticated
    USING (
      bucket_id = ''avatars'' AND
      (storage.foldername(name))[1] = auth.uid()::text
    )';
  
  -- Update policy
  EXECUTE 'CREATE POLICY "avatar_update_policy" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
      bucket_id = ''avatars'' AND
      (storage.foldername(name))[1] = auth.uid()::text
    )';
  
  -- Delete policy
  EXECUTE 'CREATE POLICY "avatar_delete_policy" ON storage.objects
    FOR DELETE TO authenticated
    USING (
      bucket_id = ''avatars'' AND
      (storage.foldername(name))[1] = auth.uid()::text
    )';
  
  -- Public read access
  EXECUTE 'CREATE POLICY "avatar_public_select_policy" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = ''avatars'')';
EXCEPTION WHEN duplicate_object THEN
  -- If any policy already exists, we can safely ignore the error
  NULL;
END $$;