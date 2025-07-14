-- Drop the trigger that's causing the partition error
DROP TRIGGER IF EXISTS log_appointment_changes_trigger ON public.appointments;

-- Drop the appointment_history table and recreate it as a regular table
DROP TABLE IF EXISTS public.appointment_history;

-- Recreate appointment_history as a regular table (not partitioned)
CREATE TABLE public.appointment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID,
  changed_by UUID,
  change_type TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appointment_history ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies
CREATE POLICY "Doctors can view their appointment history" 
ON public.appointment_history 
FOR SELECT 
USING (appointment_id IN (
  SELECT id FROM public.appointments WHERE doctor_id = auth.uid()
));

CREATE POLICY "Patients can view their appointment history" 
ON public.appointment_history 
FOR SELECT 
USING (appointment_id IN (
  SELECT id FROM public.appointments WHERE patient_id = auth.uid()
));

-- Recreate the trigger
CREATE TRIGGER log_appointment_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.log_appointment_changes();