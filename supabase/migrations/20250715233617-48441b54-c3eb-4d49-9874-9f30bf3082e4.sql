-- Allow admins to delete profiles and doctors
CREATE POLICY "Admins can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (public.is_admin());

CREATE POLICY "Admins can delete doctors" 
ON public.doctors 
FOR DELETE 
USING (public.is_admin());