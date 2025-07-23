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
    const { type, appointmentId, patientPhone, doctorPhone, message } = await req.json();

    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioWhatsappFrom = Deno.env.get('TWILIO_WHATSAPP_FROM');

    if (!twilioAccountSid || !twilioAuthToken || !twilioWhatsappFrom) {
      throw new Error('Missing Twilio credentials');
    }

    // Use official Twilio Sandbox WhatsApp number
    const whatsappFromFormatted = 'whatsapp:+14155238886';

    console.log('Twilio credentials check:', {
      accountSid: twilioAccountSid ? 'Present' : 'Missing',
      authToken: twilioAuthToken ? 'Present' : 'Missing',
      whatsappFrom: whatsappFromFormatted
    });

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Handle test cases
    if (appointmentId === 'test-123') {
      // Use test data for sandbox testing
      const testAppointment = {
        patient_name: 'Usuario de Prueba',
        doctor_name: 'Dr. Prueba',
        time: new Date().toISOString()
      };
      
      const appointmentDate = new Date(testAppointment.time);
      const formattedDate = appointmentDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const formattedTime = appointmentDate.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });

      // Validate that users have joined the sandbox
      const validateSandboxUser = async (phone: string): Promise<boolean> => {
        const { data } = await supabase
          .from('whatsapp_users')
          .select('*')
          .eq('phone', phone)
          .eq('is_active', true);
        return data && data.length > 0;
      };

      // Send WhatsApp messages for test
      const messages = [];

      if (type === 'confirmation') {
        // Send to patient
        if (patientPhone) {
          const isRegistered = await validateSandboxUser(patientPhone);
          if (isRegistered) {
            const patientMessage = `🧪 PRUEBA: Hola ${testAppointment.patient_name}, esta es una notificación de prueba del sandbox de Twilio. Fecha: ${formattedDate} a las ${formattedTime}`;
            messages.push({
              to: `whatsapp:${patientPhone}`,
              message: patientMessage
            });
          } else {
            console.log(`Patient ${patientPhone} not registered in sandbox`);
          }
        }

        // Send to doctor
        if (doctorPhone && doctorPhone !== patientPhone) {
          const isRegistered = await validateSandboxUser(doctorPhone);
          if (isRegistered) {
            const doctorMessage = `🧪 PRUEBA: Nueva cita de prueba: ${testAppointment.patient_name} el ${formattedDate} a las ${formattedTime}`;
            messages.push({
              to: `whatsapp:${doctorPhone}`,
              message: doctorMessage
            });
          } else {
            console.log(`Doctor ${doctorPhone} not registered in sandbox`);
          }
        }
      } else if (type === 'reminder') {
        // Send reminder to patient only
        if (patientPhone) {
          const isRegistered = await validateSandboxUser(patientPhone);
          if (isRegistered) {
            messages.push({
              to: `whatsapp:${patientPhone}`,
              message: `🧪 PRUEBA: ${message}`
            });
          } else {
            console.log(`Patient ${patientPhone} not registered in sandbox for reminder`);
          }
        }
      }

      // Send all messages
      const results = [];
      for (const msg of messages) {
        try {
          const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                From: whatsappFromFormatted,
                To: msg.to,
                Body: msg.message,
              }),
            }
          );

          const result = await response.json();
          results.push({
            to: msg.to,
            success: response.ok,
            result: result
          });

          console.log(`WhatsApp sent to ${msg.to}:`, result);
        } catch (error) {
          console.error(`Error sending WhatsApp to ${msg.to}:`, error);
          results.push({
            to: msg.to,
            success: false,
            error: error.message
          });
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        results: results,
        message: 'Test messages sent successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get appointment details from database for real appointments
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments_view')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      throw new Error('Appointment not found');
    }

    // Get doctor details including education, years_experience, and consultation_fee
    const { data: doctorDetails, error: doctorError } = await supabase
      .from('doctor_view')
      .select('*')
      .eq('id', appointment.doctor_id)
      .single();

    if (doctorError) {
      console.error('Error fetching doctor details:', doctorError);
    }

    // Format date and time
    const appointmentDate = new Date(appointment.time);
    const endTime = new Date(appointmentDate.getTime() + (appointment.duration_minutes || 60) * 60 * 1000);
    
    const formattedDate = appointmentDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedStartTime = appointmentDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const formattedEndTime = endTime.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Validate that users have joined the sandbox
    const validateSandboxUser = async (phone: string): Promise<boolean> => {
      const { data } = await supabase
        .from('whatsapp_users')
        .select('*')
        .eq('phone', phone)
        .eq('is_active', true);
      return data && data.length > 0;
    };

    // Send WhatsApp messages
    const messages = [];

    if (type === 'confirmation') {
      // Send to patient
      if (patientPhone) {
        const isRegistered = await validateSandboxUser(patientPhone);
        if (isRegistered) {
          // Create detailed confirmation message with doctor information
          const patientMessage = `Hola ${appointment.patient_name} saludamos desde Clínica Master esto es un mensaje *Confirmación de Cita Médica*

🏥 *Información del doctor:*
- *Doctor:* ${appointment.doctor_name || (doctorDetails ? `Dr. ${doctorDetails.first_name} ${doctorDetails.last_name}` : 'Doctor no especificado')}
- *Especialidad:* ${appointment.specialty || appointment.doctor_specialty || 'No especificada'}${doctorDetails?.consultation_fee ? `
- *Tarifa:* $${doctorDetails.consultation_fee} USD` : ''}${doctorDetails?.education ? `
- *Educación:* ${doctorDetails.education}` : ''}

📅 *Horario seleccionado:*
${formattedStartTime} - ${formattedEndTime} (${appointment.duration_minutes || 60} minutos)

Gracias por usar nuestro servicio. ¡Nos vemos en la consulta!`;

          messages.push({
            to: `whatsapp:${patientPhone}`,
            message: patientMessage
          });
        } else {
          console.log(`Patient ${patientPhone} not registered in sandbox`);
        }
      }

      // Send to doctor
      if (doctorPhone) {
        const isRegistered = await validateSandboxUser(doctorPhone);
        if (isRegistered) {
          const doctorMessage = `Nueva cita: ${appointment.patient_name} el ${formattedDate} a las ${formattedTime}. Responde OK para confirmar.`;
          messages.push({
            to: `whatsapp:${doctorPhone}`,
            message: doctorMessage
          });
        } else {
          console.log(`Doctor ${doctorPhone} not registered in sandbox`);
        }
      }
    } else if (type === 'reminder') {
      // Send reminder to patient only
      if (patientPhone) {
        const isRegistered = await validateSandboxUser(patientPhone);
        if (isRegistered) {
          messages.push({
            to: `whatsapp:${patientPhone}`,
            message: message
          });
        } else {
          console.log(`Patient ${patientPhone} not registered in sandbox for reminder`);
        }
      }
    }

    // Send all messages
    const results = [];
    for (const msg of messages) {
      try {
        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              From: whatsappFromFormatted,
              To: msg.to,
              Body: msg.message,
            }),
          }
        );

        const result = await response.json();
        results.push({
          to: msg.to,
          success: response.ok,
          result: result
        });

        console.log(`WhatsApp sent to ${msg.to}:`, result);
      } catch (error) {
        console.error(`Error sending WhatsApp to ${msg.to}:`, error);
        results.push({
          to: msg.to,
          success: false,
          error: error.message
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      results: results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-whatsapp-notification:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});