BEGIN;

-- Enable Row Level Security on the sessions table if not already enabled
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts (optional, but safer for re-running)
DROP POLICY IF EXISTS "Tutors can view their own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Students can view their own sessions" ON public.sessions;

-- Policy: Tutors can view all data from their own sessions
CREATE POLICY "Tutors can view their own sessions"
ON public.sessions
FOR SELECT
TO authenticated -- Or a specific 'tutor' role if you have one and prefer more granularity
USING (
  (SELECT auth.uid()) = tutor_id
);

-- Policy: Students can view all data from their own sessions
CREATE POLICY "Students can view their own sessions"
ON public.sessions
FOR SELECT
TO authenticated -- Or a specific 'student' role
USING (
  (SELECT auth.uid()) = student_id
);

-- Note: You might want to restrict the columns students can see.
-- For example, a student might not need to see the tutor's internal notes if such a column existed.
-- The policy above grants select on all columns.
-- If you need more granular column-level permissions, you'd typically handle that in views
-- or by being more specific in your SELECT statements on the client-side if the policy allows all.

COMMIT;
