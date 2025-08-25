-- Fix the handle_new_user function to only create patients for users who explicitly register as patients
-- and not assume all users without a role are patients

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
  
  -- Only create entry in pacientes table if user explicitly registers as patient
  -- AND has the required patient information (cedula/id_number)
  IF (NEW.raw_user_meta_data->>'role')::user_role = 'patient' 
     AND NEW.raw_user_meta_data->>'id_number' IS NOT NULL 
     AND trim(NEW.raw_user_meta_data->>'id_number') != '' THEN
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
      NEW.raw_user_meta_data->>'id_number',
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

-- Remove any doctor entries that were incorrectly added to pacientes table
-- We identify doctors by checking if they exist in the doctors table
DELETE FROM public.pacientes 
WHERE correo IN (
  SELECT p.email 
  FROM public.profiles p 
  JOIN public.doctors d ON p.id = d.id 
  WHERE p.role = 'doctor'
);