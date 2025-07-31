-- Fix trigger creation issue by dropping and recreating if needed
DROP TRIGGER IF EXISTS update_historias_clinicas_updated_at ON public.historias_clinicas;

-- Recreate the trigger
CREATE TRIGGER update_historias_clinicas_updated_at
  BEFORE UPDATE ON public.historias_clinicas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();