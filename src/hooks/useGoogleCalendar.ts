
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

  // Check if doctor has Google Calendar connected
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
      // Request additional Google Calendar scopes
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
          redirectTo: `${window.location.origin}/doctor`
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

  const fetchCalendarEvents = async (calendarId: string) => {
    setLoading(true);
    try {
      // This would be implemented with the Google Calendar API
      // For now, we'll simulate the data structure
      const mockEvents: CalendarEvent[] = [
        {
          id: '1',
          summary: 'Cita con Juan Pérez',
          start: { dateTime: '2024-01-15T09:00:00' },
          end: { dateTime: '2024-01-15T09:30:00' },
          status: 'confirmed'
        }
      ];
      
      setEvents(mockEvents);
      toast.success('Eventos del calendario cargados');
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      toast.error('Error al cargar eventos del calendario');
    } finally {
      setLoading(false);
    }
  };

  const createAvailabilitySlot = async (startTime: string, endTime: string) => {
    try {
      const { error } = await supabase
        .from('availability_slots')
        .insert({
          doctor_id: user?.id,
          start_time: startTime,
          end_time: endTime,
          is_available: true
        });

      if (error) throw error;
      
      toast.success('Horario disponible creado');
    } catch (error) {
      console.error('Error creating availability slot:', error);
      toast.error('Error al crear horario disponible');
    }
  };

  return {
    isConnected,
    calendars,
    events,
    loading,
    connectGoogleCalendar,
    fetchCalendarEvents,
    createAvailabilitySlot,
    refreshConnection: checkCalendarConnection
  };
};
