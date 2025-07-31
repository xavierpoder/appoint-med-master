-- Crear tabla de pacientes
CREATE TABLE public.pacientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  cedula TEXT NOT NULL UNIQUE,
  correo TEXT,
  whatsapp TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de historias clínicas
CREATE TABLE public.historias_clinicas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL,
  sintoma TEXT,
  diagnostico TEXT,
  tratamiento TEXT,
  medicamento TEXT,
  seguimiento TEXT,
  seguimiento_completado BOOLEAN DEFAULT false,
  fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historias_clinicas ENABLE ROW LEVEL SECURITY;

-- Crear políticas para pacientes
CREATE POLICY "Doctors can view all patients" 
ON public.pacientes 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'doctor'
));

CREATE POLICY "Doctors can create patients" 
ON public.pacientes 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'doctor'
));

CREATE POLICY "Doctors can update patients" 
ON public.pacientes 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'doctor'
));

-- Crear políticas para historias clínicas
CREATE POLICY "Doctors can view their own clinical histories" 
ON public.historias_clinicas 
FOR SELECT 
USING (doctor_id = auth.uid());

CREATE POLICY "Doctors can create clinical histories" 
ON public.historias_clinicas 
FOR INSERT 
WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "Doctors can update their own clinical histories" 
ON public.historias_clinicas 
FOR UPDATE 
USING (doctor_id = auth.uid());

CREATE POLICY "Doctors can delete their own clinical histories" 
ON public.historias_clinicas 
FOR DELETE 
USING (doctor_id = auth.uid());

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_pacientes_cedula ON public.pacientes(cedula);
CREATE INDEX idx_pacientes_nombre_apellido ON public.pacientes(nombre, apellido);
CREATE INDEX idx_historias_clinicas_paciente ON public.historias_clinicas(paciente_id);
CREATE INDEX idx_historias_clinicas_doctor ON public.historias_clinicas(doctor_id);

-- Crear función para actualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers para actualizar timestamps automáticamente
CREATE TRIGGER update_pacientes_updated_at
  BEFORE UPDATE ON public.pacientes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_historias_clinicas_updated_at
  BEFORE UPDATE ON public.historias_clinicas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();