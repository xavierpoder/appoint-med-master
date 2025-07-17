import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Webhook received:', req.method);

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse form data from Twilio webhook
    const formData = await req.formData();
    const from = formData.get('From')?.toString() || '';
    const body = formData.get('Body')?.toString() || '';
    const messageId = formData.get('MessageSid')?.toString() || '';

    console.log('Webhook data:', { from, body, messageId });

    // Extract phone number (remove whatsapp: prefix)
    const phoneNumber = from.replace('whatsapp:', '');

    // Handle sandbox join command
    if (body.toLowerCase().trim() === 'join fix-camera') {
      // Register user in sandbox
      const { error } = await supabase
        .from('whatsapp_users')
        .upsert([{ 
          phone: phoneNumber,
          joined_at: new Date().toISOString(),
          is_active: true 
        }], { 
          onConflict: 'phone',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error registering user:', error);
      } else {
        console.log(`User ${phoneNumber} registered successfully`);
      }

      const welcomeMessage = 'Gracias por unirte al sandbox de Clínica Master. Ahora podrás recibir notificaciones de tus citas.';
      
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
         <Response>
           <Message>${welcomeMessage}</Message>
         </Response>`, 
        {
          headers: { 
            'Content-Type': 'application/xml',
            ...corsHeaders 
          }
        }
      );
    }

    // Handle appointment confirmations
    if (body.toLowerCase().includes('confirmar') || body.toLowerCase().includes('ok')) {
      const confirmationMessage = 'Tu cita ha sido confirmada. Te enviaremos recordatorios antes de tu cita.';
      
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
         <Response>
           <Message>${confirmationMessage}</Message>
         </Response>`, 
        {
          headers: { 
            'Content-Type': 'application/xml',
            ...corsHeaders 
          }
        }
      );
    }

    // Handle appointment cancellations
    if (body.toLowerCase().includes('cancelar')) {
      const cancellationMessage = 'Entendido. Por favor contacta a la clínica para reprogramar tu cita.';
      
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
         <Response>
           <Message>${cancellationMessage}</Message>
         </Response>`, 
        {
          headers: { 
            'Content-Type': 'application/xml',
            ...corsHeaders 
          }
        }
      );
    }

    // Default response for unrecognized messages
    const defaultMessage = 'Gracias por tu mensaje. Para unirte al sandbox envía "join fix-camera". Para confirmar citas responde CONFIRMAR.';
    
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
       <Response>
         <Message>${defaultMessage}</Message>
       </Response>`, 
      {
        headers: { 
          'Content-Type': 'application/xml',
          ...corsHeaders 
        }
      }
    );

  } catch (error) {
    console.error('Error in webhook-handler:', error);
    
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
       <Response>
         <Message>Error procesando mensaje. Intenta más tarde.</Message>
       </Response>`, 
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/xml',
          ...corsHeaders 
        }
      }
    );
  }
});