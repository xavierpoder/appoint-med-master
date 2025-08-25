-- Fix the remaining security definer view issue by recreating views with security invoker
DROP VIEW IF EXISTS public.historias_clinicas_view;

-- Recreate the view with proper security settings
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