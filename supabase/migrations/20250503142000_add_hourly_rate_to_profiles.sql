-- Add hourly_rate column to profiles table for tutor pricing
ALTER TABLE profiles
ADD COLUMN hourly_rate numeric(10,2) DEFAULT 0.00;

COMMENT ON COLUMN profiles.hourly_rate IS 'Tutor''s hourly rate in local currency';
