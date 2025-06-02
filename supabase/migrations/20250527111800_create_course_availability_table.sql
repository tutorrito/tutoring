BEGIN;

-- Create course_availability table
CREATE TABLE IF NOT EXISTS public.course_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_end_time_after_start_time CHECK (end_time > start_time)
);

COMMENT ON TABLE public.course_availability IS 'Stores availability slots for courses.';
COMMENT ON COLUMN public.course_availability.course_id IS 'The course these availability slots belong to.';
COMMENT ON COLUMN public.course_availability.day_of_week IS 'Day of the week for the slot (e.g., Monday).';
COMMENT ON COLUMN public.course_availability.start_time IS 'Start time of the availability slot.';
COMMENT ON COLUMN public.course_availability.end_time IS 'End time of the availability slot.';

-- Enable RLS for the course_availability table
ALTER TABLE public.course_availability ENABLE ROW LEVEL SECURITY;

-- Policies for course_availability table

-- Allow authenticated users to read course availability (e.g., for booking)
CREATE POLICY "Allow authenticated users to read course availability"
ON public.course_availability
FOR SELECT
TO authenticated
USING (true);

-- Allow tutors to insert availability for their own courses
-- This policy relies on checking the tutor_id of the associated course
CREATE POLICY "Allow tutors to insert availability for their own courses"
ON public.course_availability
FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT tutor_id FROM public.courses WHERE id = course_availability.course_id) = auth.uid()
);

-- Allow tutors to update availability for their own courses
CREATE POLICY "Allow tutors to update availability for their own courses"
ON public.course_availability
FOR UPDATE
TO authenticated
USING (
    (SELECT tutor_id FROM public.courses WHERE id = course_id) = auth.uid()
)
WITH CHECK (
    (SELECT tutor_id FROM public.courses WHERE id = course_id) = auth.uid()
);

-- Allow tutors to delete availability for their own courses
CREATE POLICY "Allow tutors to delete availability for their own courses"
ON public.course_availability
FOR DELETE
TO authenticated
USING (
    (SELECT tutor_id FROM public.courses WHERE id = course_id) = auth.uid()
);

-- Allow service_role to perform any action
CREATE POLICY "Allow service_role full access to course_availability"
ON public.course_availability
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

COMMIT;
