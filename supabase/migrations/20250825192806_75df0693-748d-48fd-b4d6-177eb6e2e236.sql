-- Remove the problematic triggers and function in cascade
DROP FUNCTION IF EXISTS validate_phone_format() CASCADE;

-- Create new validation function just for pacientes
CREATE OR REPLACE FUNCTION public.validate_pacientes_data()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validate whatsapp format (basic international format)
  IF NEW.whatsapp IS NOT NULL AND NOT (NEW.whatsapp ~ '^[\+]?[0-9\-\(\)\s]{7,20}$') THEN
    RAISE EXCEPTION 'Invalid WhatsApp format. Use international format with 7-20 digits.';
  END IF;
  
  -- Sanitize whatsapp: remove non-numeric characters except +
  IF NEW.whatsapp IS NOT NULL THEN
    NEW.whatsapp := regexp_replace(NEW.whatsapp, '[^\+0-9]', '', 'g');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add trigger for pacientes
CREATE TRIGGER validate_pacientes_data_trigger
  BEFORE INSERT OR UPDATE ON pacientes
  FOR EACH ROW
  EXECUTE FUNCTION validate_pacientes_data();

-- Insert test patients
INSERT INTO pacientes (nombre, apellido, cedula, correo, whatsapp) VALUES
('Juan Carlos', 'Pérez García', '12345678', 'juan.perez@email.com', '+584121234567'),
('María Elena', 'González López', '87654321', 'maria.gonzalez@email.com', '+584129876543'),
('Pedro Luis', 'Rodríguez Silva', '11223344', 'pedro.rodriguez@email.com', '+584125566778'),
('Ana Sofía', 'Martínez Torres', '44332211', 'ana.martinez@email.com', '+584127788994'),
('Carlos Alberto', 'Hernández Ruiz', '99887766', 'carlos.hernandez@email.com', '+584123344556')
ON CONFLICT (cedula) DO NOTHING;