-- Drop and recreate the view with proper column mapping and security invoker
DROP VIEW IF EXISTS public.historias_clinicas_view;

CREATE VIEW public.historias_clinicas_view 
WITH (security_invoker = true) AS
SELECT 
  hc.id,
  hc.paciente_id,
  hc.doctor_id,
  hc.fecha_ingreso,
  hc.sintoma,
  hc.diagnostico,
  hc.tratamiento,
  hc.medicamento,
  hc.seguimiento,
  hc.seguimiento_completado,
  hc.created_at,
  hc.updated_at,
  p.nombre,
  p.apellido,
  p.cedula,
  p.correo,
  p.whatsapp
FROM historias_clinicas hc
JOIN pacientes p ON hc.paciente_id = p.id;

-- Insert test patients for doctors to search
INSERT INTO pacientes (nombre, apellido, cedula, correo, whatsapp) VALUES
('Juan Carlos', 'Pérez García', '12345678', 'juan.perez@email.com', '+584121234567'),
('María Elena', 'González López', '87654321', 'maria.gonzalez@email.com', '+584129876543'),
('Pedro Luis', 'Rodríguez Silva', '11223344', 'pedro.rodriguez@email.com', '+584125566778'),
('Ana Sofía', 'Martínez Torres', '44332211', 'ana.martinez@email.com', '+584127788994'),
('Carlos Alberto', 'Hernández Ruiz', '99887766', 'carlos.hernandez@email.com', '+584123344556')
ON CONFLICT (cedula) DO NOTHING;