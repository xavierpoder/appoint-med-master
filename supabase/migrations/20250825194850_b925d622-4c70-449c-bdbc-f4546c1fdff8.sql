-- Revert recent changes and implement unified patient storage solution
-- Drop the patient_view policies that were created
DROP POLICY IF EXISTS "Doctors can view patient profiles" ON public.profiles;
DROP POLICY IF EXISTS "Patients can view doctor profiles" ON public.profiles;

-- Drop the test policy on pacientes
DROP POLICY IF EXISTS "Doctors can view all patients" ON public.pacientes;

-- Recreate the original policy for pacientes
CREATE POLICY "Doctors can view all patients" 
ON public.pacientes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'doctor'::user_role
  )
);

-- Modify the handle_new_user function to create patients in pacientes table when they register
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public 
AS $$
BEGIN
  -- Insert into profiles table (existing functionality)
  INSERT INTO public.profiles (id, email, first_name, last_name, role, phone, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'patient'),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- If the new user is a patient, also create entry in pacientes table
  IF COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'patient') = 'patient' THEN
    INSERT INTO public.pacientes (
      nombre, 
      apellido, 
      cedula,
      correo, 
      whatsapp
    )
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'id_number', NEW.id::text), -- Use id_number or fallback to user id
      NEW.email,
      NEW.raw_user_meta_data->>'phone'
    );
  END IF;
  
  -- If the new user is a doctor, create doctor record (existing functionality)
  IF (NEW.raw_user_meta_data->>'role')::user_role = 'doctor' THEN
    INSERT INTO public.doctors (
      id, 
      specialty, 
      bio, 
      consultation_fee, 
      years_experience, 
      education, 
      languages,
      license_number
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'specialty', 'General Medicine'),
      NEW.raw_user_meta_data->>'bio',
      CASE 
        WHEN NEW.raw_user_meta_data->>'consultation_fee' IS NOT NULL 
        AND NEW.raw_user_meta_data->>'consultation_fee' != '' 
        THEN (NEW.raw_user_meta_data->>'consultation_fee')::numeric
        ELSE NULL
      END,
      CASE 
        WHEN NEW.raw_user_meta_data->>'years_experience' IS NOT NULL 
        AND NEW.raw_user_meta_data->>'years_experience' != '' 
        THEN (NEW.raw_user_meta_data->>'years_experience')::integer
        ELSE NULL
      END,
      NEW.raw_user_meta_data->>'education',
      CASE 
        WHEN NEW.raw_user_meta_data->>'languages' IS NOT NULL 
        AND NEW.raw_user_meta_data->>'languages' != '' 
        THEN string_to_array(NEW.raw_user_meta_data->>'languages', ',')
        ELSE NULL
      END,
      NEW.raw_user_meta_data->>'license_number'
    );
  END IF;
  
  RETURN NEW;
END;
$$;