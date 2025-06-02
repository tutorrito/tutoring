/*
  # Add avatar_url Column to Profiles Table

  1. Changes
    - Add avatar_url column to profiles table if it doesn't exist
    - Ensure the column is nullable
    - Add proper type definition

  2. Security
    - No changes to existing policies required
    - Column inherits existing table RLS policies
*/

DO $$ 
BEGIN
  -- Check if the column exists before trying to add it
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'avatar_url'
  ) THEN
    -- Add the avatar_url column
    ALTER TABLE public.profiles
    ADD COLUMN avatar_url text;
  END IF;
END $$;