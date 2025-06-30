
-- Create enum types for user roles and appointment status
CREATE TYPE user_role AS ENUM ('doctor', 'patient');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'cancelled', 'completed');

-- Create profiles table for both doctors and patients
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create doctors table for doctor-specific information
CREATE TABLE public.doctors (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  specialty TEXT NOT NULL,
  license_number TEXT UNIQUE,
  bio TEXT,
  consultation_fee DECIMAL(10,2),
  years_experience INTEGER,
  education TEXT,
  languages TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create doctor availability table
CREATE TABLE public.doctor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(doctor_id, day_of_week, start_time)
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status appointment_status DEFAULT 'scheduled',
  notes TEXT,
  patient_notes TEXT,
  doctor_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(doctor_id, appointment_date, appointment_time)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Patients can view doctor profiles" ON public.profiles
  FOR SELECT USING (role = 'doctor');

-- RLS Policies for doctors
CREATE POLICY "Anyone can view doctor information" ON public.doctors
  FOR SELECT USING (true);

CREATE POLICY "Doctors can update their own information" ON public.doctors
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for doctor availability
CREATE POLICY "Anyone can view doctor availability" ON public.doctor_availability
  FOR SELECT USING (true);

CREATE POLICY "Doctors can manage their own availability" ON public.doctor_availability
  FOR ALL USING (auth.uid() = doctor_id);

-- RLS Policies for appointments
CREATE POLICY "Doctors can view their appointments" ON public.appointments
  FOR SELECT USING (auth.uid() = doctor_id);

CREATE POLICY "Patients can view their appointments" ON public.appointments
  FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Patients can create appointments" ON public.appointments
  FOR INSERT WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Doctors can update their appointments" ON public.appointments
  FOR UPDATE USING (auth.uid() = doctor_id);

CREATE POLICY "Patients can update their appointments" ON public.appointments
  FOR UPDATE USING (auth.uid() = patient_id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient')::user_role
  );
  
  -- If user is a doctor, create doctor record
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'patient') = 'doctor' THEN
    INSERT INTO public.doctors (id, specialty)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'specialty', 'General Medicine'));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_appointments_doctor_date ON public.appointments(doctor_id, appointment_date);
CREATE INDEX idx_appointments_patient_date ON public.appointments(patient_id, appointment_date);
CREATE INDEX idx_doctor_availability_doctor ON public.doctor_availability(doctor_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);
