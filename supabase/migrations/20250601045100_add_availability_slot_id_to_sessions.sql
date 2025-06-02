BEGIN;

-- Add the availability_slot_id column to the sessions table
ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS availability_slot_id UUID REFERENCES public.course_availability(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.sessions.availability_slot_id IS 'Links to the specific availability slot chosen for this session, if applicable.';

-- Add an index for better query performance on this new foreign key
CREATE INDEX IF NOT EXISTS idx_sessions_availability_slot_id ON public.sessions(availability_slot_id);

COMMIT;
