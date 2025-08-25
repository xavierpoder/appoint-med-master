-- Allow doctors to access patient profiles from both pacientes table and patient_view
-- Note: patient_view is a VIEW, so we can't enable RLS on it directly
-- Instead, we'll update the profiles table policies to allow doctors broader access

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

-- Since patient_view is a view based on profiles table with role = 'patient',
-- the above policy will automatically allow doctors to see data through patient_view as well