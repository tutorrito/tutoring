-- Add bio column to profiles table
ALTER TABLE profiles
ADD COLUMN bio TEXT;

-- Update existing rows with empty bio
UPDATE profiles SET bio = '' WHERE bio IS NULL;

-- Create a trigger to update the updated_at timestamp when bio is modified
CREATE OR REPLACE FUNCTION update_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profile_bio_updated
BEFORE UPDATE OF bio ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_profile_updated_at();
