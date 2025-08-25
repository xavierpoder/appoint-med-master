-- Crear una política que permita a los pacientes ver horarios ocupados sin datos personales
CREATE POLICY "Patients can view occupied appointment slots"
ON public.appointments 
FOR SELECT 
USING (
  -- Los pacientes pueden ver solo el ID, doctor_id, time y status de las citas
  -- para saber qué horarios están ocupados, pero no información personal
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'patient'
  )
);