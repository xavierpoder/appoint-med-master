
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime: string };
  end: { dateTime: string };
  status: string;
}

interface DoctorCalendar {
  id: string;
  google_calendar_id: string;
  calendar_name: string;
  is_primary: boolean;
}

export const useGoogleCalendar = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [calendars, setCalendars] = useState<DoctorCalendar[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkCalendarConnection();
    }
  }, [user]);

  const checkCalendarConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('doctor_calendars')
        .select('*')
        .eq('doctor_id', user?.id);

      if (error) throw error;
      
      setCalendars(data || []);
      setIsConnected((data?.length || 0) > 0);
    } catch (error) {
      console.error('Error checking calendar connection:', error);
    }
  };

  const connectGoogleCalendar = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
          redirectTo: `${window.location.origin}/doctor`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });

      if (error) throw error;
      
      toast.success('Conectando con Google Calendar...');
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      toast.error('Error al conectar con Google Calendar');
    } finally {
      setLoading(false);
    }
  };

  const callGoogleCalendarAPI = async (action: string, payload: any = {}) => {
    const { data, error } = await supabase.functions.invoke('google-calendar', {
      body: { action, ...payload }
    });

    if (error) throw error;
    return data;
  };

  const fetchCalendars = async () => {
    setLoading(true);
    try {
      await callGoogleCalendarAPI('list-calendars');
      await checkCalendarConnection(); // Refresh local data
      toast.success('Calendarios sincronizados');
    } catch (error) {
      console.error('Error fetching calendars:', error);
      toast.error('Error al sincronizar calendarios');
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendarEvents = async (calendarId: string, timeMin?: string, timeMax?: string) => {
    setLoading(true);
    try {
      const data = await callGoogleCalendarAPI('list-events', {
        calendarId,
        timeMin,
        timeMax
      });
      
      setEvents(data.items || []);
      toast.success('Eventos del calendario cargados');
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      toast.error('Error al cargar eventos del calendario');
    } finally {
      setLoading(false);
    }
  };

  const createAvailabilitySlot = async (startTime: string, endTime: string) => {
    if (calendars.length === 0) {
      toast.error('Primero conecta tu calendario de Google');
      return;
    }

    const primaryCalendar = calendars.find(cal => cal.is_primary) || calendars[0];
    
    try {
      const event = {
        summary: 'Disponible para citas',
        start: { dateTime: startTime },
        end: { dateTime: endTime },
        description: 'Horario disponible para citas médicas',
      };

      await callGoogleCalendarAPI('create-event', {
        calendarId: primaryCalendar.google_calendar_id,
        event
      });
      
      toast.success('Horario disponible creado en Google Calendar');
    } catch (error) {
      console.error('Error creating availability slot:', error);
      toast.error('Error al crear horario disponible');
    }
  };

  const createAppointmentEvent = async (appointmentData: {
    patientName: string;
    date: string;
    time: string;
    duration: number;
  }) => {
    if (calendars.length === 0) {
      toast.error('Primero conecta tu calendario de Google');
      return;
    }

    const primaryCalendar = calendars.find(cal => cal.is_primary) || calendars[0];
    const startDateTime = `${appointmentData.date}T${appointmentData.time}:00`;
    const endTime = new Date(startDateTime);
    endTime.setMinutes(endTime.getMinutes() + appointmentData.duration);
    
    try {
      const event = {
        summary: `Cita: ${appointmentData.patientName}`,
        start: { dateTime: startDateTime },
        end: { dateTime: endTime.toISOString() },
        description: `Cita médica con ${appointmentData.patientName}`,
      };

      const result = await callGoogleCalendarAPI('create-event', {
        calendarId: primaryCalendar.google_calendar_id,
        event
      });
      
      toast.success('Cita creada en Google Calendar');
      return result;
    } catch (error) {
      console.error('Error creating appointment event:', error);
      toast.error('Error al crear cita en Google Calendar');
    }
  };

  return {
    isConnected,
    calendars,
    events,
    loading,
    connectGoogleCalendar,
    fetchCalendars,
    fetchCalendarEvents,
    createAvailabilitySlot,
    createAppointmentEvent,
    refreshConnection: checkCalendarConnection
  };
};
