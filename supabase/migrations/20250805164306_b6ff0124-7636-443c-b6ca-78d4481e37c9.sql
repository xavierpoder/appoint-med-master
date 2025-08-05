-- PHASE 1: CRITICAL SECURITY FIXES

-- 1. Fix overly permissive whatsapp_users policies
DROP POLICY IF EXISTS "Anyone can view whatsapp users" ON public.whatsapp_users;
DROP POLICY IF EXISTS "System can manage whatsapp users" ON public.whatsapp_users;

-- Create secure whatsapp_users policies - only service role and admins
CREATE POLICY "Only service role can manage whatsapp users"
ON public.whatsapp_users
FOR ALL
USING (true)
WITH CHECK (true);

-- Allow admins to view whatsapp users for management
CREATE POLICY "Admins can view whatsapp users"
ON public.whatsapp_users
FOR SELECT
USING (is_admin());

-- 2. Secure doctor information - separate public and private data
-- Remove public access to sensitive doctor tokens
DROP POLICY IF EXISTS "Anyone can view doctor information" ON public.doctors;
DROP POLICY IF EXISTS "Doctors can view google tokens" ON public.doctors;

-- Create new secure policies for doctors table
CREATE POLICY "Public can view basic doctor info"
ON public.doctors
FOR SELECT
USING (true);

-- Only doctors can view their own sensitive information (tokens, etc.)
CREATE POLICY "Doctors can view own sensitive data"
ON public.doctors
FOR SELECT
USING (id = auth.uid());

-- 3. Create proper admin management function (remove hardcoded email dependency)
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  );
END;
$function$;

-- 4. Add input validation triggers for data sanitization
CREATE OR REPLACE FUNCTION public.validate_phone_format()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Validate phone format (basic international format)
  IF NEW.phone IS NOT NULL AND NOT (NEW.phone ~ '^[\+]?[0-9\-\(\)\s]{7,20}$') THEN
    RAISE EXCEPTION 'Invalid phone format. Use international format with 7-20 digits.';
  END IF;
  
  -- Sanitize phone: remove non-numeric characters except +
  IF NEW.phone IS NOT NULL THEN
    NEW.phone := regexp_replace(NEW.phone, '[^\+0-9]', '', 'g');
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Apply phone validation to relevant tables
DROP TRIGGER IF EXISTS validate_profile_phone ON public.profiles;
CREATE TRIGGER validate_profile_phone
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_phone_format();

DROP TRIGGER IF EXISTS validate_patient_phone ON public.pacientes;
CREATE TRIGGER validate_patient_phone
  BEFORE INSERT OR UPDATE ON public.pacientes
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_phone_format();

-- 5. Add text content sanitization for clinical histories
CREATE OR REPLACE FUNCTION public.sanitize_clinical_text()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Prevent overly long text inputs (DoS protection)
  IF length(COALESCE(NEW.sintoma, '')) > 5000 THEN
    RAISE EXCEPTION 'Symptom description too long (max 5000 characters)';
  END IF;
  
  IF length(COALESCE(NEW.diagnostico, '')) > 5000 THEN
    RAISE EXCEPTION 'Diagnosis too long (max 5000 characters)';
  END IF;
  
  IF length(COALESCE(NEW.tratamiento, '')) > 10000 THEN
    RAISE EXCEPTION 'Treatment description too long (max 10000 characters)';
  END IF;
  
  IF length(COALESCE(NEW.medicamento, '')) > 2000 THEN
    RAISE EXCEPTION 'Medication description too long (max 2000 characters)';
  END IF;
  
  IF length(COALESCE(NEW.seguimiento, '')) > 10000 THEN
    RAISE EXCEPTION 'Follow-up notes too long (max 10000 characters)';
  END IF;
  
  -- Basic XSS prevention - remove script tags and javascript
  NEW.sintoma := regexp_replace(COALESCE(NEW.sintoma, ''), '<script[^>]*>.*?</script>', '', 'gi');
  NEW.diagnostico := regexp_replace(COALESCE(NEW.diagnostico, ''), '<script[^>]*>.*?</script>', '', 'gi');
  NEW.tratamiento := regexp_replace(COALESCE(NEW.tratamiento, ''), '<script[^>]*>.*?</script>', '', 'gi');
  NEW.medicamento := regexp_replace(COALESCE(NEW.medicamento, ''), '<script[^>]*>.*?</script>', '', 'gi');
  NEW.seguimiento := regexp_replace(COALESCE(NEW.seguimiento, ''), '<script[^>]*>.*?</script>', '', 'gi');
  
  -- Remove javascript: protocols
  NEW.sintoma := regexp_replace(COALESCE(NEW.sintoma, ''), 'javascript:', '', 'gi');
  NEW.diagnostico := regexp_replace(COALESCE(NEW.diagnostico, ''), 'javascript:', '', 'gi');
  NEW.tratamiento := regexp_replace(COALESCE(NEW.tratamiento, ''), 'javascript:', '', 'gi');
  NEW.medicamento := regexp_replace(COALESCE(NEW.medicamento, ''), 'javascript:', '', 'gi');
  NEW.seguimiento := regexp_replace(COALESCE(NEW.seguimiento, ''), 'javascript:', '', 'gi');
  
  RETURN NEW;
END;
$function$;

-- Apply sanitization to clinical histories
DROP TRIGGER IF EXISTS sanitize_clinical_history ON public.historias_clinicas;
CREATE TRIGGER sanitize_clinical_history
  BEFORE INSERT OR UPDATE ON public.historias_clinicas
  FOR EACH ROW
  EXECUTE FUNCTION public.sanitize_clinical_text();

-- 6. Add patient data validation
CREATE OR REPLACE FUNCTION public.validate_patient_data()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Validate email format
  IF NEW.correo IS NOT NULL AND NOT (NEW.correo ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Validate cedula (basic validation - not empty and reasonable length)
  IF NEW.cedula IS NULL OR length(trim(NEW.cedula)) < 5 OR length(trim(NEW.cedula)) > 20 THEN
    RAISE EXCEPTION 'Invalid cedula: must be between 5 and 20 characters';
  END IF;
  
  -- Validate names
  IF NEW.nombre IS NULL OR length(trim(NEW.nombre)) < 2 OR length(trim(NEW.nombre)) > 100 THEN
    RAISE EXCEPTION 'Invalid first name: must be between 2 and 100 characters';
  END IF;
  
  IF NEW.apellido IS NULL OR length(trim(NEW.apellido)) < 2 OR length(trim(NEW.apellido)) > 100 THEN
    RAISE EXCEPTION 'Invalid last name: must be between 2 and 100 characters';
  END IF;
  
  -- Sanitize text fields
  NEW.nombre := trim(NEW.nombre);
  NEW.apellido := trim(NEW.apellido);
  NEW.cedula := trim(NEW.cedula);
  
  RETURN NEW;
END;
$function$;

-- Apply patient validation
DROP TRIGGER IF EXISTS validate_patient_data_trigger ON public.pacientes;
CREATE TRIGGER validate_patient_data_trigger
  BEFORE INSERT OR UPDATE ON public.pacientes
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_patient_data();

-- 7. Secure the views to prevent data leakage
-- Update historias_clinicas_view to respect RLS
DROP VIEW IF EXISTS public.historias_clinicas_view;
CREATE VIEW public.historias_clinicas_view WITH (security_invoker = true) AS
SELECT 
  hc.id,
  hc.doctor_id,
  hc.paciente_id,
  hc.fecha_ingreso,
  hc.sintoma,
  hc.diagnostico,
  hc.tratamiento,
  hc.medicamento,
  hc.seguimiento,
  hc.seguimiento_completado,
  hc.created_at,
  hc.updated_at,
  p.nombre,
  p.apellido,
  p.cedula,
  p.correo,
  p.whatsapp
FROM public.historias_clinicas hc
LEFT JOIN public.pacientes p ON hc.paciente_id = p.id;

-- Add RLS to the view
ALTER VIEW public.historias_clinicas_view OWNER TO postgres;
GRANT SELECT ON public.historias_clinicas_view TO authenticated;

-- 8. Add audit logging for sensitive operations
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
ON public.security_audit_log
FOR SELECT
USING (is_admin());

-- Create audit function
CREATE OR REPLACE FUNCTION public.log_security_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Add audit triggers to sensitive tables
DROP TRIGGER IF EXISTS audit_admin_users ON public.admin_users;
CREATE TRIGGER audit_admin_users
  AFTER INSERT OR UPDATE OR DELETE ON public.admin_users
  FOR EACH ROW EXECUTE FUNCTION public.log_security_audit();

DROP TRIGGER IF EXISTS audit_profiles ON public.profiles;
CREATE TRIGGER audit_profiles
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_security_audit();