-- Allow admins to update doctor profiles and information
CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles admin_profile 
    WHERE admin_profile.id = auth.uid() 
    AND admin_profile.role = 'admin'
  )
);

CREATE POLICY "Admins can update all doctor information" 
ON public.doctors 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles admin_profile 
    WHERE admin_profile.id = auth.uid() 
    AND admin_profile.role = 'admin'
  )
);