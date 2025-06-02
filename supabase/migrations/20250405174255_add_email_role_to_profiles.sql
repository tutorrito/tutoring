/*
  # Add Email and Role to Profiles Table

  1. Changes
    - Add email column (text, not null)
    - Add role column (text, default 'student')
    - Update trigger to include these fields

  2. Security
    - No changes to existing policies needed
*/

BEGIN;

-- Add email column if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email text NOT NULL DEFAULT '';

-- Add role column if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'student';

-- Update the trigger function to include email and role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'role' -- Use the role from metadata
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql security definer;

COMMIT;
