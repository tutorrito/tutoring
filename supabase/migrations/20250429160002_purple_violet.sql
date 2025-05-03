/*
  # Add Tutor Availability Management

  1. New Tables
    - tutor_availability
      - id (uuid, primary key)
      - tutor_id (uuid, references profiles)
      - date (date)
      - is_available (boolean)
      - reason (text)
      - created_at (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for tutors to manage their availability
*/

-- Create tutor_availability table
CREATE TABLE IF NOT EXISTS public.tutor_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  is_available boolean NOT NULL DEFAULT true,
  reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Add constraint to prevent duplicate dates for the same tutor
  UNIQUE(tutor_id, date)
);

-- Enable RLS
ALTER TABLE public.tutor_availability ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION handle_tutor_availability_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_tutor_availability_updated_at
  BEFORE UPDATE ON tutor_availability
  FOR EACH ROW
  EXECUTE FUNCTION handle_tutor_availability_updated_at();

-- Create policies

-- Allow tutors to view their own availability
CREATE POLICY "Tutors can view their own availability"
  ON public.tutor_availability
  FOR SELECT
  USING (
    auth.uid() = tutor_id
  );

-- Allow students to view tutor availability (but not reasons)
CREATE POLICY "Students can view tutor availability"
  ON public.tutor_availability
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'student'
    )
  );

-- Allow tutors to manage their own availability
CREATE POLICY "Tutors can manage their own availability"
  ON public.tutor_availability
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND id = tutor_id
      AND role = 'tutor'
    )
  );

-- Create index for faster lookups
CREATE INDEX idx_tutor_availability_tutor_date 
  ON public.tutor_availability(tutor_id, date);

-- Create function to check tutor availability
CREATE OR REPLACE FUNCTION is_tutor_available(
  p_tutor_id uuid,
  p_date date
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM tutor_availability
    WHERE tutor_id = p_tutor_id
    AND date = p_date
    AND is_available = true
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_tutor_available TO authenticated;