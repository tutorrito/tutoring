/*
  # Add Contact Fields to Profiles Table

  1. Changes
    - Add email and phone fields to profiles table
    - Make fields nullable to maintain compatibility
    - Update existing rows with null values

  2. Security
    - No changes to existing policies needed
    - Fields inherit existing RLS policies
*/

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS phone text;

-- Update the handle_new_user function to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    role,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    'student',
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql security definer;