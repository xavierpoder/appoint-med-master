-- Modificar la tabla historias_clinicas para que funcione con pacientes de ambas tablas
-- Eliminar la foreign key constraint existente si existe
ALTER TABLE public.historias_clinicas DROP CONSTRAINT IF EXISTS historias_clinicas_paciente_id_fkey;

-- Cambiar el tipo de paciente_id para que pueda referenciar tanto pacientes como profiles
-- Ya que ambas tablas usan UUID, no necesitamos cambiar el tipo

-- Agregar un campo para identificar el tipo de paciente
ALTER TABLE public.historias_clinicas 
ADD COLUMN IF NOT EXISTS paciente_tipo text DEFAULT 'pacientes' CHECK (paciente_tipo IN ('pacientes', 'profiles'));

-- Actualizar registros existentes
UPDATE public.historias_clinicas 
SET paciente_tipo = 'pacientes' 
WHERE paciente_tipo IS NULL;

-- Crear índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_historias_clinicas_paciente 
ON public.historias_clinicas(paciente_id, paciente_tipo);