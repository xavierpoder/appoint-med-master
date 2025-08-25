-- Fix security definer view issue by adding security invoker
CREATE OR REPLACE VIEW public.historias_clinicas_view 
WITH (security_invoker = true) AS
SELECT 
  hc.*,
  p.nombre,
  p.apellido,
  p.cedula,
  p.correo,
  p.whatsapp
FROM historias_clinicas hc
JOIN pacientes p ON hc.paciente_id = p.id;

-- Create some test patients for doctors to search
INSERT INTO pacientes (nombre, apellido, cedula, correo, whatsapp) VALUES
('Juan Carlos', 'Pérez García', '12345678', 'juan.perez@email.com', '+584121234567'),
('María Elena', 'González López', '87654321', 'maria.gonzalez@email.com', '+584129876543'),
('Pedro Luis', 'Rodríguez Silva', '11223344', 'pedro.rodriguez@email.com', '+584125566778'),
('Ana Sofía', 'Martínez Torres', '44332211', 'ana.martinez@email.com', '+584127788994'),
('Carlos Alberto', 'Hernández Ruiz', '99887766', 'carlos.hernandez@email.com', '+584123344556')
ON CONFLICT (cedula) DO NOTHING;

-- Verify RLS policies are working correctly for doctors searching patients
-- The existing policy should allow doctors to view all patients