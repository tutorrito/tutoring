ALTER TABLE public.profiles
ADD COLUMN phone TEXT;

-- Optional: Add a comment to the column
COMMENT ON COLUMN public.profiles.phone IS 'Stores the user''s phone number.';
