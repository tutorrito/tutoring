BEGIN;

-- Add the course_id column to the sessions table
ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE;

COMMENT ON COLUMN public.sessions.course_id IS 'Links to the course this session belongs to.';

-- Add an index for better query performance on this new foreign key
CREATE INDEX IF NOT EXISTS idx_sessions_course_id ON public.sessions(course_id);

COMMIT;
