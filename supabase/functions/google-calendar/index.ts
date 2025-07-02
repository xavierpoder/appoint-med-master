
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  start: { dateTime: string };
  end: { dateTime: string };
  description?: string;
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
      case 'list-calendars':
        return await listCalendars(user.id, supabaseClient)
      case 'create-event':
        return await createCalendarEvent(payload, user.id, supabaseClient)
      case 'list-events':
        return await listCalendarEvents(payload, user.id, supabaseClient)
      case 'update-event':
        return await updateCalendarEvent(payload, user.id, supabaseClient)
      case 'delete-event':
        return await deleteCalendarEvent(payload, user.id, supabaseClient)
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

async function getAccessToken(userId: string, supabaseClient: any) {
  // This would get the OAuth token from Supabase auth
  // For now, we'll simulate the token retrieval
  // In production, you'd get this from the user's auth session
  const { data: session } = await supabaseClient.auth.getSession()
  return session?.provider_token
}

async function listCalendars(userId: string, supabaseClient: any) {
  const accessToken = await getAccessToken(userId, supabaseClient)
  
  if (!accessToken) {
    return new Response(JSON.stringify({ error: 'No access token found' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch calendars')
  }

  const calendars = await response.json()
  
  // Store calendars in our database
  for (const calendar of calendars.items) {
    await supabaseClient
      .from('doctor_calendars')
      .upsert({
        doctor_id: userId,
        google_calendar_id: calendar.id,
        calendar_name: calendar.summary,
        is_primary: calendar.primary || false,
      })
  }

  return new Response(JSON.stringify(calendars), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function createCalendarEvent(payload: any, userId: string, supabaseClient: any) {
  const { calendarId, event } = payload
  const accessToken = await getAccessToken(userId, supabaseClient)

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  })

  if (!response.ok) {
    throw new Error('Failed to create calendar event')
  }

  const createdEvent = await response.json()
  
  // Store availability slot in our database
  await supabaseClient
    .from('availability_slots')
    .insert({
      doctor_id: userId,
      start_time: event.start.dateTime,
      end_time: event.end.dateTime,
      google_event_id: createdEvent.id,
      is_available: true,
    })

  return new Response(JSON.stringify(createdEvent), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function listCalendarEvents(payload: any, userId: string, supabaseClient: any) {
  const { calendarId, timeMin, timeMax } = payload
  const accessToken = await getAccessToken(userId, supabaseClient)

  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`)
  if (timeMin) url.searchParams.append('timeMin', timeMin)
  if (timeMax) url.searchParams.append('timeMax', timeMax)
  url.searchParams.append('singleEvents', 'true')
  url.searchParams.append('orderBy', 'startTime')

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch calendar events')
  }

  const events = await response.json()
  return new Response(JSON.stringify(events), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function updateCalendarEvent(payload: any, userId: string, supabaseClient: any) {
  const { calendarId, eventId, event } = payload
  const accessToken = await getAccessToken(userId, supabaseClient)

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  })

  if (!response.ok) {
    throw new Error('Failed to update calendar event')
  }

  const updatedEvent = await response.json()
  return new Response(JSON.stringify(updatedEvent), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function deleteCalendarEvent(payload: any, userId: string, supabaseClient: any) {
  const { calendarId, eventId } = payload
  const accessToken = await getAccessToken(userId, supabaseClient)

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to delete calendar event')
  }

  // Remove from our database too
  await supabaseClient
    .from('availability_slots')
    .delete()
    .eq('google_event_id', eventId)

  return new Response('Event deleted', {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
