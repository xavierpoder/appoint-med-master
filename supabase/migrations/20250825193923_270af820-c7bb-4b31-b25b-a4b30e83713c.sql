-- Check current policies on pacientes table and fix doctor access
-- The issue is likely that doctors can't read from pacientes table due to RLS policies

-- Let's check what policies exist for pacientes
SELECT schemaname, tablename, policyname, cmd, permissive, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'pacientes';

-- Drop and recreate the policies to ensure doctors can access patients
DROP POLICY IF EXISTS "Doctors can view all patients" ON public.pacientes;

-- Create policy allowing doctors to select all patients
CREATE POLICY "Doctors can view all patients" 
ON public.pacientes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'doctor'::user_role
  )
);