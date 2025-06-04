BEGIN;

-- Enable Row Level Security on the sessions table if not already enabled
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts (optional, but safer for re-running)
DROP POLICY IF EXISTS "Tutors can view their own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Students can view their own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Tutors can update their own sessions" ON public.sessions;

-- Policy: Tutors can view all data from their own sessions
CREATE POLICY "Tutors can view their own sessions"
ON public.sessions
FOR SELECT
TO authenticated
USING (
  (SELECT auth.uid()) = tutor_id AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'tutor'
);

-- Policy: Students can view all data from their own sessions
CREATE POLICY "Students can view their own sessions"
ON public.sessions
FOR SELECT
TO authenticated
USING (
  (SELECT auth.uid()) = student_id AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'student'
);

-- Policy: Tutors can update their own sessions
CREATE POLICY "Tutors can update their own sessions"
ON public.sessions
FOR UPDATE
TO authenticated
USING (
  (SELECT auth.uid()) = tutor_id AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'tutor'
)
WITH CHECK (
  (SELECT auth.uid()) = tutor_id AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'tutor'
);

-- Note: You might want to restrict the columns students can see.
-- For example, a student might not need to see the tutor's internal notes if such a column existed.
-- The policy above grants select on all columns.
-- If you need more granular column-level permissions, you'd typically handle that in views
-- or by being more specific in your SELECT statements on the client-side if the policy allows all.

COMMIT;
