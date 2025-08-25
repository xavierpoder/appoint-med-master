-- Allow doctors to access patient profiles from both pacientes table and patient_view
-- Create RLS policies for patient_view so doctors can access patient profiles

-- Enable RLS on patient_view if not already enabled
ALTER TABLE public.patient_view ENABLE ROW LEVEL SECURITY;

-- Allow doctors to view all patient profiles in patient_view
CREATE POLICY "Doctors can view all patient profiles" 
ON public.patient_view 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'doctor'::user_role
  )
);

-- Update profiles table policy to allow doctors to view all patient profiles
-- Drop existing restrictive policy for doctors viewing patient profiles
DROP POLICY IF EXISTS "Doctors can view patient profiles for their appointments" ON public.profiles;

-- Create new policy allowing doctors to view all patient profiles
CREATE POLICY "Doctors can view all patient profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.role = 'doctor'::user_role
  ) AND role = 'patient'::user_role
);