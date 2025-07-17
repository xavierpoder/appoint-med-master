-- Create table to track WhatsApp sandbox users
CREATE TABLE public.whatsapp_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL UNIQUE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view whatsapp users" 
ON public.whatsapp_users 
FOR SELECT 
USING (true);

CREATE POLICY "System can manage whatsapp users" 
ON public.whatsapp_users 
FOR ALL 
USING (true);