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
    console.log('Starting appointment reminders job...');

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date();
    const results = [];

    // Calculate reminder times
    const reminderTimes = [
      { hours: 48, label: '48h' },
      { hours: 24, label: '24h' },
      { hours: 4, label: '4h' }
    ];

    for (const reminder of reminderTimes) {
      const reminderTime = new Date(now.getTime() + reminder.hours * 60 * 60 * 1000);
      const startTime = new Date(reminderTime.getTime() - 30 * 60 * 1000); // 30 minutes before
      const endTime = new Date(reminderTime.getTime() + 30 * 60 * 1000); // 30 minutes after

      console.log(`Checking for ${reminder.label} reminders between ${startTime.toISOString()} and ${endTime.toISOString()}`);

      // Get appointments that need reminders
      const { data: appointments, error } = await supabase
        .from('appointments_view')
        .select('*')
        .gte('time', startTime.toISOString())
        .lt('time', endTime.toISOString())
        .eq('status', 'scheduled');

      if (error) {
        console.error('Error fetching appointments:', error);
        continue;
      }

      console.log(`Found ${appointments?.length || 0} appointments for ${reminder.label} reminders`);

      for (const appointment of appointments || []) {
        try {
          // Get patient phone number
          const { data: patient, error: patientError } = await supabase
            .from('profiles')
            .select('phone, first_name, last_name')
            .eq('id', appointment.patient_id)
            .single();

          if (patientError || !patient?.phone) {
            console.log(`No phone number found for patient ${appointment.patient_id}`);
            continue;
          }

          const appointmentDate = new Date(appointment.time);
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

          // Create reminder message based on time
          let message = '';
          if (reminder.hours === 48) {
            message = `Hola ${patient.first_name}, te recordamos tu cita con ${appointment.doctor_name} el ${formattedDate} a las ${formattedTime}.`;
          } else if (reminder.hours === 24) {
            message = `Hola ${patient.first_name}, mañana tienes cita con ${appointment.doctor_name} a las ${formattedTime}.`;
          } else if (reminder.hours === 4) {
            message = `Hola ${patient.first_name}, hoy tienes cita con ${appointment.doctor_name} a las ${formattedTime}. Por favor llegar puntual.`;
          }

          // Send reminder
          const response = await fetch(
            `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-whatsapp-notification`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              },
              body: JSON.stringify({
                type: 'reminder',
                appointmentId: appointment.id,
                patientPhone: patient.phone,
                message: message
              }),
            }
          );

          const result = await response.json();
          results.push({
            appointmentId: appointment.id,
            patientName: patient.first_name + ' ' + patient.last_name,
            reminderType: reminder.label,
            success: result.success,
            result: result
          });

          console.log(`Reminder sent for appointment ${appointment.id}:`, result);

        } catch (error) {
          console.error(`Error processing appointment ${appointment.id}:`, error);
          results.push({
            appointmentId: appointment.id,
            reminderType: reminder.label,
            success: false,
            error: error.message
          });
        }
      }
    }

    console.log('Appointment reminders job completed:', results);

    return new Response(JSON.stringify({ 
      success: true, 
      processed: results.length,
      results: results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-appointment-reminders:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});