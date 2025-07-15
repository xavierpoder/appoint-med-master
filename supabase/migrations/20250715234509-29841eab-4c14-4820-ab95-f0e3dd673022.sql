-- Temporarily allow all authenticated users to update/delete profiles and doctors for testing
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all doctor information" ON public.doctors;
DROP POLICY IF EXISTS "Admins can delete doctors" ON public.doctors;

-- Create temporary policies for testing (will restrict later)
CREATE POLICY "Temp: Allow authenticated users to update profiles" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Temp: Allow authenticated users to delete profiles" 
ON public.profiles 
FOR DELETE 
TO authenticated
USING (true);

CREATE POLICY "Temp: Allow authenticated users to update doctors" 
ON public.doctors 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Temp: Allow authenticated users to delete doctors" 
ON public.doctors 
FOR DELETE 
TO authenticated
USING (true);