BEGIN;

-- Function to get the count of upcoming sessions for a tutor
CREATE OR REPLACE FUNCTION public.get_tutor_upcoming_sessions_count(p_tutor_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.sessions
    WHERE tutor_id = p_tutor_id
      AND start_time > NOW()
      AND status = 'confirmed'
  );
END;
$$;

-- Function to get the count of active students for a tutor
-- (unique students with confirmed sessions, past or future)
CREATE OR REPLACE FUNCTION public.get_tutor_active_students_count(p_tutor_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT student_id)
    FROM public.sessions
    WHERE tutor_id = p_tutor_id
      AND status = 'confirmed'
  );
END;
$$;

-- Function to get monthly earnings for a tutor
-- (sum of price for completed sessions in the current month)
CREATE OR REPLACE FUNCTION public.get_tutor_monthly_earnings(p_tutor_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(price), 0)
    FROM public.sessions
    WHERE tutor_id = p_tutor_id
      AND status = 'completed'
      AND date_trunc('month', start_time) = date_trunc('month', NOW())
  );
END;
$$;

COMMIT;
