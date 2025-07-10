import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const { action, ...payload } = await req.json()

    switch (action) {
      case 'create-availability':
        return await createAvailability(payload, user.id, supabaseClient)
      case 'get-events':
        return await getEvents(payload, user.id, supabaseClient)
      case 'book-appointment':
        return await bookAppointment(payload, user.id, supabaseClient)
      default:
        return new Response('Invalid action', { status: 400, headers: corsHeaders })
    }
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function createAvailability(payload: any, userId: string, supabaseClient: any) {
  const { date, startTime, endTime } = payload
  
  try {
    // Combine date and time for start and end timestamps
    const startDateTime = `${date}T${startTime}:00.000Z`
    const endDateTime = `${date}T${endTime}:00.000Z`

    // Create availability slot in Cal.com via API
    const calComApiKey = Deno.env.get('CAL_COM_API_KEY')
    if (calComApiKey) {
      const calComResponse = await fetch('https://api.cal.com/v1/availabilities', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${calComApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start: startDateTime,
          end: endDateTime,
          userId: userId
        }),
      })

      if (!calComResponse.ok) {
        console.warn('Cal.com API request failed, continuing with local storage')
      }
    }

    // Store in our local database
    const { data, error } = await supabaseClient
      .from('availability_slots')
      .insert({
        doctor_id: userId,
        start_time: startDateTime,
        end_time: endDateTime,
        is_available: true,
      })

    if (error) {
      throw new Error('Failed to create availability slot')
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Create availability error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

async function getEvents(payload: any, userId: string, supabaseClient: any) {
  const { date } = payload
  
  try {
    // Get events from our database
    const startOfDay = `${date}T00:00:00.000Z`
    const endOfDay = `${date}T23:59:59.999Z`

    const { data: slots, error } = await supabaseClient
      .from('availability_slots')
      .select('*')
      .eq('doctor_id', userId)
      .gte('start_time', startOfDay)
      .lte('start_time', endOfDay)
      .eq('is_available', true)
      .order('start_time')

    if (error) {
      throw new Error('Failed to fetch events')
    }

    // Format events for frontend
    const events = slots.map((slot: any) => ({
      id: slot.id,
      title: 'Disponible',
      startTime: new Date(slot.start_time).toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      endTime: new Date(slot.end_time).toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      start: { dateTime: slot.start_time },
      end: { dateTime: slot.end_time }
    }))

    return new Response(JSON.stringify({ events }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Get events error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

async function bookAppointment(payload: any, userId: string, supabaseClient: any) {
  const { slotId, patientId, notes } = payload
  
  try {
    // Mark slot as unavailable
    const { error: updateError } = await supabaseClient
      .from('availability_slots')
      .update({ is_available: false })
      .eq('id', slotId)
      .eq('doctor_id', userId)

    if (updateError) {
      throw new Error('Failed to book slot')
    }

    // Create appointment record
    const { data: slot } = await supabaseClient
      .from('availability_slots')
      .select('start_time')
      .eq('id', slotId)
      .single()

    const { data, error } = await supabaseClient
      .from('appointments')
      .insert({
        doctor_id: userId,
        patient_id: patientId,
        time: slot.start_time,
        specialty: 'General',
        status: 'scheduled',
        notes: notes
      })

    if (error) {
      throw new Error('Failed to create appointment')
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Book appointment error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}