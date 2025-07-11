-- Tarea 1: Limpiar datos existentes de doctores y crear perfil de ejemplo
-- Eliminar todos los doctores existentes (manteniendo la integridad referencial)
DELETE FROM public.doctors;
DELETE FROM public.profiles WHERE role = 'doctor';

-- Crear perfil de doctor ejemplo: Juan Tello
-- Primero creamos el usuario en auth.users (simulando el proceso)
-- En producción, esto se hará desde el panel de admin

INSERT INTO public.profiles (id, email, first_name, last_name, role, phone, avatar_url, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  'juan.tello@clinicamaster.com',
  'Juan',
  'Tello',
  'doctor',
  '+57 300 123 4567',
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face',
  now(),
  now()
);

INSERT INTO public.doctors (id, specialty, bio, consultation_fee, years_experience, education, languages, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  'Cardiología',
  'Dr. Juan Tello es un cardiólogo experimentado con más de 15 años de experiencia en el tratamiento de enfermedades cardiovasculares. Especializado en procedimientos mínimamente invasivos y medicina preventiva. Graduado de la Universidad Nacional de Colombia con especialización en el Hospital San Ignacio.',
  150000.00,
  15,
  'Universidad Nacional de Colombia - Medicina, Hospital San Ignacio - Especialización en Cardiología',
  ARRAY['Español', 'Inglés'],
  now(),
  now()
);

-- Agregar enum para rol de admin si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_extended') THEN
        ALTER TYPE user_role ADD VALUE 'admin';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;