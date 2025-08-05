-- Drop the view if it exists and recreate it properly
DROP VIEW IF EXISTS public.historias_clinicas_view;

-- Create the view properly
CREATE VIEW public.historias_clinicas_view AS
SELECT 
  hc.*,
  p.nombre,
  p.apellido,
  p.cedula,
  p.correo,
  p.whatsapp
FROM public.historias_clinicas hc
LEFT JOIN public.pacientes p ON hc.paciente_id = p.id;

-- Add RLS policies for the view
ALTER VIEW public.historias_clinicas_view OWNER TO postgres;

-- Grant necessary permissions
GRANT ALL ON public.historias_clinicas_view TO postgres;
GRANT ALL ON public.historias_clinicas_view TO anon;
GRANT ALL ON public.historias_clinicas_view TO authenticated;
GRANT ALL ON public.historias_clinicas_view TO service_role;