/*
  # Add Bio Field to Profiles

  1. Changes
    - Add bio column if it doesn't exist
    - Set default empty string for existing NULL values
    - Add trigger for updating timestamps
    
  2. Security
    - No changes to existing policies needed
    - Inherits existing table RLS
*/

DO $$ 
BEGIN
  -- Only add the bio column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'bio'
  ) THEN
    ALTER TABLE profiles
    ADD COLUMN bio TEXT;
  END IF;
END $$;

-- Update existing rows with empty bio if NULL
UPDATE profiles 
SET bio = '' 
WHERE bio IS NULL;

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS handle_profiles_updated_at ON profiles;

CREATE TRIGGER handle_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();