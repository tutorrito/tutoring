BEGIN;

-- Create subjects table
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.subjects IS 'Stores the list of available subjects for courses.';
COMMENT ON COLUMN public.subjects.id IS 'Unique identifier for the subject.';
COMMENT ON COLUMN public.subjects.name IS 'Name of the subject (e.g., Mathematics, History).';

-- Insert some initial subjects
INSERT INTO public.subjects (name) VALUES
('Mathematics'),
('Science'),
('History'),
('English'),
('Computer Science'),
('Physics'),
('Chemistry'),
('Biology'),
('Geography'),
('Art');

-- Enable RLS for the subjects table
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- Policies for subjects table
-- Allow authenticated users to read all subjects
CREATE POLICY "Allow authenticated users to read subjects"
ON public.subjects
FOR SELECT
TO authenticated
USING (true);

-- Allow service_role to perform any action (useful for admin tasks or migrations)
CREATE POLICY "Allow service_role full access to subjects"
ON public.subjects
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

COMMIT;
