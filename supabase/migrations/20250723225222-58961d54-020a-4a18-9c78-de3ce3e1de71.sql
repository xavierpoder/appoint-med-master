-- Crear política para que doctores puedan crear citas para pacientes
CREATE POLICY "Doctors can create appointments for patients" 
ON public.appointments 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'doctor'
  )
);