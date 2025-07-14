-- Crear cuenta de administrador en auth.users usando función SQL
-- Esta función crea el usuario administrador con las credenciales especificadas

-- Nota: Para crear usuarios en auth.users desde SQL, necesitamos usar la función auth.users()
-- Sin embargo, por limitaciones de RLS, vamos a crear la cuenta usando una función

-- Insertamos un perfil temporal que servirá para identificar al admin
INSERT INTO public.profiles (id, email, first_name, last_name, role, created_at, updated_at)
VALUES (
  'admin-temp-id-12345'::uuid,
  'latitudceroimportaciones@hotmail.com',
  'Administrador',
  'Sistema',
  'admin',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- Este perfil temporal será reemplazado cuando el admin se registre por primera vez
-- El sistema detectará automáticamente su rol por el email