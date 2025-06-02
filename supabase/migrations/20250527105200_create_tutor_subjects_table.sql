BEGIN;

-- Create tutor_subjects table to link tutors to subjects they teach
CREATE TABLE IF NOT EXISTS public.tutor_subjects (
    tutor_id UUID NOT NULL,
    subject_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT tutor_subjects_pkey PRIMARY KEY (tutor_id, subject_id),
    CONSTRAINT tutor_subjects_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT tutor_subjects_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE
);

-- Enable RLS for the new table
ALTER TABLE public.tutor_subjects ENABLE ROW LEVEL SECURITY;

-- Create policies for tutor_subjects
-- Allow authenticated users to read tutor_subjects
CREATE POLICY "Allow authenticated users to read tutor_subjects"
ON public.tutor_subjects
FOR SELECT
TO authenticated
USING (true);

-- Allow tutors to manage their own subject links
CREATE POLICY "Allow tutors to manage their own subjects"
ON public.tutor_subjects
FOR ALL
TO authenticated
USING (auth.uid() = tutor_id)
WITH CHECK (auth.uid() = tutor_id);

COMMENT ON TABLE public.tutor_subjects IS 'Join table linking tutors to the subjects they teach.';
COMMENT ON COLUMN public.tutor_subjects.tutor_id IS 'Foreign key referencing the tutor''s profile.';
COMMENT ON COLUMN public.tutor_subjects.subject_id IS 'Foreign key referencing the subject.';

COMMIT;
