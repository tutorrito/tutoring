BEGIN;

-- Create courses table
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tutor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT, -- Prevent deleting subject if courses use it
    price NUMERIC NOT NULL CHECK (price >= 0),
    cover_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.courses IS 'Stores course information created by tutors.';
COMMENT ON COLUMN public.courses.tutor_id IS 'The tutor who created the course.';
COMMENT ON COLUMN public.courses.subject_id IS 'The subject of the course.';
COMMENT ON COLUMN public.courses.price IS 'Price of the course in QAR.';

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
DECLARE
  _new RECORD;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row update
CREATE TRIGGER set_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Enable RLS for the courses table
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Policies for courses table

-- Allow authenticated users to read all courses (e.g., for a public listing)
CREATE POLICY "Allow authenticated users to read courses"
ON public.courses
FOR SELECT
TO authenticated
USING (true);

-- Allow tutors to insert new courses for themselves
CREATE POLICY "Allow tutors to insert their own courses"
ON public.courses
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = tutor_id);

-- Allow tutors to update their own courses
CREATE POLICY "Allow tutors to update their own courses"
ON public.courses
FOR UPDATE
TO authenticated
USING (auth.uid() = tutor_id)
WITH CHECK (auth.uid() = tutor_id);

-- Allow tutors to delete their own courses
CREATE POLICY "Allow tutors to delete their own courses"
ON public.courses
FOR DELETE
TO authenticated
USING (auth.uid() = tutor_id);

-- Allow service_role to perform any action
CREATE POLICY "Allow service_role full access to courses"
ON public.courses
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

COMMIT;
