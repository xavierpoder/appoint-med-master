-- Fix foreign key constraints to allow cascading deletes for doctors
-- This will allow proper deletion of doctors and their related data

-- Drop existing foreign key constraints and recreate them with ON DELETE CASCADE

-- Availability slots
ALTER TABLE public.availability_slots
DROP CONSTRAINT IF EXISTS availability_slots_doctor_id_fkey;

ALTER TABLE public.availability_slots
ADD CONSTRAINT availability_slots_doctor_id_fkey
FOREIGN KEY (doctor_id)
REFERENCES public.doctors(id)
ON DELETE CASCADE;

-- Doctor availability
ALTER TABLE public.doctor_availability
DROP CONSTRAINT IF EXISTS doctor_availability_doctor_id_fkey;

ALTER TABLE public.doctor_availability
ADD CONSTRAINT doctor_availability_doctor_id_fkey
FOREIGN KEY (doctor_id)
REFERENCES public.doctors(id)
ON DELETE CASCADE;

-- Doctor calendars
ALTER TABLE public.doctor_calendars
DROP CONSTRAINT IF EXISTS doctor_calendars_doctor_id_fkey;

ALTER TABLE public.doctor_calendars
ADD CONSTRAINT doctor_calendars_doctor_id_fkey
FOREIGN KEY (doctor_id)
REFERENCES public.doctors(id)
ON DELETE CASCADE;

-- Appointments (set doctor_id to NULL when doctor is deleted, don't cascade delete appointments)
ALTER TABLE public.appointments
DROP CONSTRAINT IF EXISTS appointments_doctor_id_fkey;

ALTER TABLE public.appointments
ADD CONSTRAINT appointments_doctor_id_fkey
FOREIGN KEY (doctor_id)
REFERENCES public.doctors(id)
ON DELETE SET NULL;