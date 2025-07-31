-- Fix security issues and SQL errors

-- 1. Create admin_users table for proper admin management
CREATE TABLE IF NOT EXISTS public.admin_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    UNIQUE(user_id)
);

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 2. Insert current hardcoded admin into the table
INSERT INTO public.admin_users (user_id) 
SELECT id FROM auth.users 
WHERE email = 'latitudceroimportaciones@hotmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- 3. Update the is_admin function to use the new table and fix search path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  );
END;
$function$;

-- 4. Create secure admin policies for admin_users table
CREATE POLICY "Only admins can view admin users" 
ON public.admin_users 
FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Only admins can manage admin users" 
ON public.admin_users 
FOR ALL 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

-- 5. Remove temporary permissive policies and replace with secure ones
DROP POLICY IF EXISTS "Temp: Allow authenticated users to update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Temp: Allow authenticated users to delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Temp: Allow authenticated users to update doctors" ON public.doctors;
DROP POLICY IF EXISTS "Temp: Allow authenticated users to delete doctors" ON public.doctors;

-- 6. Add proper admin policies for profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (public.is_admin());

-- 7. Add proper admin policies for doctors
CREATE POLICY "Admins can update all doctors" 
ON public.doctors 
FOR UPDATE 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete doctors" 
ON public.doctors 
FOR DELETE 
USING (public.is_admin());

-- 8. Prevent users from updating their own role
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile (except role)" 
ON public.profiles 
FOR UPDATE 
USING (id = auth.uid()) 
WITH CHECK (
    id = auth.uid() 
    AND (
        role = (SELECT role FROM public.profiles WHERE id = auth.uid())
        OR public.is_admin()
    )
);

-- 9. Fix the log_appointment_changes function to have proper search path
CREATE OR REPLACE FUNCTION public.log_appointment_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.appointment_history (appointment_id, changed_by, change_type, new_values)
    VALUES (NEW.id, auth.uid(), 'CREATE', to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.appointment_history (appointment_id, changed_by, change_type, old_values, new_values)
    VALUES (NEW.id, auth.uid(), 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.appointment_history (appointment_id, changed_by, change_type, old_values)
    VALUES (OLD.id, auth.uid(), 'DELETE', to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- 10. Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS appointment_changes_trigger ON public.appointments;
CREATE TRIGGER appointment_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.log_appointment_changes();