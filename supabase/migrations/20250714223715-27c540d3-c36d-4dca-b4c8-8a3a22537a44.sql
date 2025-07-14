-- Actualizar la función handle_new_user para procesar correctamente todos los campos del user_metadata
-- y agregar el campo license_number que falta

-- Primero, agregamos el campo license_number al formulario y estado
-- Luego actualizamos la función para procesar todos los campos correctamente

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
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
$function$;