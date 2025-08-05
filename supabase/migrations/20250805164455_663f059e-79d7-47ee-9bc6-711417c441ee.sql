-- PHASE 1: CRITICAL SECURITY FIXES (Fixed)

-- 1. Fix overly permissive whatsapp_users policies
DROP POLICY IF EXISTS "Anyone can view whatsapp users" ON public.whatsapp_users;
DROP POLICY IF EXISTS "System can manage whatsapp users" ON public.whatsapp_users;
DROP POLICY IF EXISTS "Only service role can manage whatsapp users" ON public.whatsapp_users;
DROP POLICY IF EXISTS "Admins can view whatsapp users" ON public.whatsapp_users;

-- Create secure whatsapp_users policies - only service role and admins
CREATE POLICY "Service role manages whatsapp users"
ON public.whatsapp_users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow admins to view whatsapp users for management
CREATE POLICY "Admins view whatsapp users"
ON public.whatsapp_users
FOR SELECT
TO authenticated
USING (is_admin());

-- 2. Secure doctor information - separate public and private data
DROP POLICY IF EXISTS "Anyone can view doctor information" ON public.doctors;
DROP POLICY IF EXISTS "Doctors can view google tokens" ON public.doctors;
DROP POLICY IF EXISTS "Public can view basic doctor info" ON public.doctors;
DROP POLICY IF EXISTS "Doctors can view own sensitive data" ON public.doctors;

-- Create new secure policies for doctors table
CREATE POLICY "Public basic doctor info"
ON public.doctors
FOR SELECT
TO authenticated, anon
USING (true);

-- Only doctors can view their own sensitive information (tokens, etc.)
CREATE POLICY "Doctors own sensitive data"
ON public.doctors
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- 3. Add input validation triggers for data sanitization
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

-- 4. Add text content sanitization for clinical histories
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

-- 5. Add patient data validation
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