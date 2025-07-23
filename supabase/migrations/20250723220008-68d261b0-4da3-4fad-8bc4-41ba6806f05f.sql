-- Agregar campo id_number a la tabla profiles para el número de cédula
ALTER TABLE public.profiles ADD COLUMN id_number VARCHAR(20) UNIQUE;

-- Crear índice para búsquedas rápidas por número de cédula
CREATE INDEX idx_profiles_id_number ON public.profiles(id_number);

-- Actualizar las políticas RLS para permitir a los doctores crear pacientes durante la creación de citas
CREATE POLICY "Doctors can create patient profiles during appointment creation" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'doctor'
  )
);