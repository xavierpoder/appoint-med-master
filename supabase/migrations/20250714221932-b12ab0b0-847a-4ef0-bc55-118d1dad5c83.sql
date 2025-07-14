-- Agregar 'admin' al enum user_role
ALTER TYPE user_role ADD VALUE 'admin';

-- Ahora crear el perfil del administrador
INSERT INTO public.profiles (id, email, first_name, last_name, role, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'latitudceroimportaciones@hotmail.com',
  'Administrador',
  'Sistema',
  'admin'::user_role,
  now(),
  now()
);