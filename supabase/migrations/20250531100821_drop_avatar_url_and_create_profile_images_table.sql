-- Drop avatar_url column from profiles table
ALTER TABLE public.profiles
DROP COLUMN IF EXISTS avatar_url;

-- Create profile_images table
CREATE TABLE public.profile_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
    image_path TEXT NOT NULL, -- Stores the path to the image in Supabase Storage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add comments to the new table and columns
COMMENT ON TABLE public.profile_images IS 'Stores profile images for users, linking to Supabase Storage.';
COMMENT ON COLUMN public.profile_images.id IS 'Unique identifier for the profile image record.';
COMMENT ON COLUMN public.profile_images.user_id IS 'Foreign key referencing the user this image belongs to.';
COMMENT ON COLUMN public.profile_images.image_path IS 'Path to the image file in Supabase Storage (e.g., user_id/avatar.png).';
COMMENT ON COLUMN public.profile_images.created_at IS 'Timestamp of when the image record was created.';
COMMENT ON COLUMN public.profile_images.updated_at IS 'Timestamp of when the image record was last updated.';

-- Enable Row Level Security for the profile_images table
ALTER TABLE public.profile_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profile_images table
CREATE POLICY "Users can view their own profile images."
ON public.profile_images
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile images."
ON public.profile_images
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile images."
ON public.profile_images
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile images."
ON public.profile_images
FOR DELETE
USING (auth.uid() = user_id);

-- Optional: Create a trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_profile_image_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_image_updated
BEFORE UPDATE ON public.profile_images
FOR EACH ROW
EXECUTE FUNCTION public.handle_profile_image_updated_at();
