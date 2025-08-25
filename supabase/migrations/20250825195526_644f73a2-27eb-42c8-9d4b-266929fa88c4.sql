-- Fix infinite recursion in profiles table RLS policies
-- We need to create security definer functions to avoid recursion

-- First, create a security definer function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Drop all existing policies on profiles table to start fresh
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Doctors can create patient profiles during appointment creation" ON public.profiles;
DROP POLICY IF EXISTS "Doctors can view all patient profiles" ON public.profiles;
DROP POLICY IF EXISTS "Patients can view doctor profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile (except role)" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Recreate policies using security definer function to avoid recursion
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (id = auth.uid());

CREATE POLICY "Users can update their own profile (except role)" 
ON public.profiles 
FOR UPDATE 
USING (id = auth.uid())
WITH CHECK (id = auth.uid() AND (role = (SELECT role FROM public.profiles WHERE id = auth.uid()) OR is_admin()));

CREATE POLICY "Doctors can view all patient profiles" 
ON public.profiles 
FOR SELECT 
USING (
  (EXISTS (SELECT 1 FROM public.doctors WHERE id = auth.uid()) AND role = 'patient'::user_role)
);

CREATE POLICY "Patients can view doctor profiles" 
ON public.profiles 
FOR SELECT 
USING (role = 'doctor'::user_role);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admins can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (is_admin());

CREATE POLICY "Doctors can create patient profiles during appointment creation" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM public.doctors WHERE id = auth.uid())
);