BEGIN;

-- Function to get monthly earnings for a tutor
-- (sum of hourly_rate * (duration/60) for completed sessions in the current month)
CREATE OR REPLACE FUNCTION public.get_tutor_monthly_earnings(p_tutor_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(prof.hourly_rate * (sess.duration / 60.0)), 0)
    FROM public.sessions sess
    JOIN public.profiles prof ON sess.tutor_id = prof.id
    WHERE sess.tutor_id = p_tutor_id
      AND sess.status = 'completed'
      AND date_trunc('month', sess.start_time) = date_trunc('month', NOW())
  );
END;
$$;

COMMIT;
