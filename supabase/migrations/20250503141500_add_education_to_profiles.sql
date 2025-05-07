-- Add education column to profiles table for tutor qualifications
BEGIN;

-- Add education column if it doesn't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS education text;

-- Update existing rows with empty string if NULL
UPDATE public.profiles 
SET education = ''
WHERE education IS NULL;

COMMIT;
