BEGIN;

-- Create tutor_availability table for marking specific dates as unavailable
CREATE TABLE IF NOT EXISTS public.tutor_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tutor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT false, -- True if available override, false if marked unavailable
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_tutor_date UNIQUE (tutor_id, date) -- A tutor can only have one entry per date
);

COMMENT ON TABLE public.tutor_availability IS 'Stores specific dates when a tutor is unavailable or has special availability.';
COMMENT ON COLUMN public.tutor_availability.tutor_id IS 'The tutor who this availability entry belongs to.';
COMMENT ON COLUMN public.tutor_availability.date IS 'The specific date of this availability entry.';
COMMENT ON COLUMN public.tutor_availability.is_available IS 'Indicates if the tutor is available (true) or unavailable (false) on this date.';
COMMENT ON COLUMN public.tutor_availability.reason IS 'Optional reason for the unavailability or special availability.';

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row update
CREATE TRIGGER set_tutor_availability_updated_at
BEFORE UPDATE ON public.tutor_availability
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Enable RLS for the tutor_availability table
ALTER TABLE public.tutor_availability ENABLE ROW LEVEL SECURITY;

-- Policies for tutor_availability table

-- Allow authenticated users to read tutor availability (e.g., for booking checks)
CREATE POLICY "Allow authenticated users to read tutor availability"
ON public.tutor_availability
FOR SELECT
TO authenticated
USING (true);

-- Allow tutors to insert their own unavailability/availability entries
CREATE POLICY "Allow tutors to insert their own availability"
ON public.tutor_availability
FOR INSERT
TO authenticated
WITH CHECK (tutor_id = auth.uid());

-- Allow tutors to update their own availability entries
CREATE POLICY "Allow tutors to update their own availability"
ON public.tutor_availability
FOR UPDATE
TO authenticated
USING (tutor_id = auth.uid())
WITH CHECK (tutor_id = auth.uid());

-- Allow tutors to delete their own availability entries
CREATE POLICY "Allow tutors to delete their own availability"
ON public.tutor_availability
FOR DELETE
TO authenticated
USING (tutor_id = auth.uid());

-- Allow service_role to perform any action
CREATE POLICY "Allow service_role full access to tutor_availability"
ON public.tutor_availability
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

COMMIT;
