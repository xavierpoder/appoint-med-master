import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime: string; date: string };
  end: { dateTime: string; date: string };
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

  // TODO: Make timezone configurable, for now using a default for Ecuador
  const TIMEZONE = "America/Guayaquil"; 

  useEffect(() => {
    const checkConnection = async () => {
      if (user) {
        console.log("Checking Google Calendar connection for user:", user.id);
        const { data, error } = await supabase
          .from("doctor_profiles")
          .select("google_calendar_access_token")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error checking connection:", error);
          setIsConnected(false);
        } else if (data && data.google_calendar_access_token) {
          console.log("User is connected to Google Calendar.");
          setIsConnected(true);
          fetchCalendars();
        } else {
          console.log("User is not connected to Google Calendar.");
          setIsConnected(false);
        }
      }
    };
    checkConnection();
  }, [user]);

  const connectGoogleCalendar = async () => {
    console.log("Attempting to connect Google Calendar...");
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-auth", {
        method: "POST",
        body: { action: "auth" },
      });

      if (error) {
        console.error("Error invoking google-calendar-auth for auth action:", error);
        throw error;
      }

      if (data && data.authUrl) {
        console.log("Redirecting to Google Auth URL:", data.authUrl);
        window.location.href = data.authUrl;
      } else {
        console.error("No authUrl received from google-calendar-auth function.", data);
        toast.error("No se pudo obtener la URL de autenticación.");
      }
    } catch (error) {
      console.error("Error al conectar Google Calendar:", error);
      toast.error("Error al conectar Google Calendar. Por favor, intente de nuevo.");
    }
  };

  const handleAuthCallback = async (code: string) => {
    setLoading(true);
    console.log("Handling Google Auth callback with code:", code);
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-auth", {
        method: "POST",
        body: { action: "callback", code, userId: user?.id },
      });

      if (error) {
        console.error("Error invoking google-calendar-auth for callback action:", error);
        throw error;
      }

      if (data && data.success) {
        console.log("Google Calendar connected successfully.");
        setIsConnected(true);
        toast.success("Google Calendar conectado exitosamente.");
        fetchCalendars();
      } else {
        console.error("Google Calendar connection failed. Data:", data);
        toast.error("Fallo la conexión con Google Calendar.");
      }
    } catch (error) {
      console.error("Error en el callback de autenticación:", error);
      toast.error("Error en el callback de autenticación. Por favor, intente de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendars = async () => {
    setLoading(true);
    console.log("Fetching Google Calendars...");
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-api", {
        method: "POST",
        body: { action: "listCalendars", userId: user?.id },
      });

      if (error) {
        console.error("Error invoking google-calendar-api for listCalendars action:", error);
        throw error;
      }

      if (data && data.calendars) {
        console.log("Calendars fetched successfully:", data.calendars);
        setCalendars(data.calendars.map((cal: any) => ({
          id: cal.id,
          google_calendar_id: cal.id,
          calendar_name: cal.summary,
          is_primary: cal.primary || false,
        })));
      } else {
        console.warn("No calendars received or data is empty.", data);
        toast.error("No se pudieron cargar los calendarios.");
      }
    } catch (error) {
      console.error("Error al obtener calendarios:", error);
      toast.error("Error al obtener calendarios. Por favor, intente de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const createAvailabilitySlot = async (date: string, startTime: string, endTime: string) => {
    setLoading(true);
    console.log(`Attempting to create availability slot for ${date} from ${startTime} to ${endTime}`);
    try {
      const primaryCalendar = calendars.find(cal => cal.is_primary);
      if (!primaryCalendar) {
        console.error("No primary calendar found for the user.", calendars);
        toast.error("No se encontró un calendario principal para crear el horario.");
        setLoading(false);
        return;
      }
      console.log("Using primary calendar:", primaryCalendar);

      const startDateTime = `${date}T${startTime}:00`;
      const endDateTime = `${date}T${endTime}:00`;
      console.log("Start DateTime:", startDateTime, "End DateTime:", endDateTime);

      const eventBody = {
        summary: "Horario Disponible",
        start: { dateTime: startDateTime, timeZone: TIMEZONE }, 
        end: { dateTime: endDateTime, timeZone: TIMEZONE },
      };
      console.log("Event body to be sent:", eventBody);

      const { data, error } = await supabase.functions.invoke("google-calendar-api", {
        method: "POST",
        body: {
          action: "createEvent",
          userId: user?.id,
          calendarId: primaryCalendar.google_calendar_id,
          event: eventBody,
        },
      });

      if (error) {
        console.error("Error invoking google-calendar-api for createEvent action:", error);
        throw error;
      }

      if (data && data.event) {
        console.log("Availability slot created successfully:", data.event);
        toast.success("Horario de disponibilidad creado en Google Calendar.");
        fetchCalendarEvents(date); 
      } else {
        console.error("Failed to create availability slot. Data:", data);
        toast.error("No se pudo crear el horario de disponibilidad.");
      }
    } catch (error) {
      console.error("Error al crear horario de disponibilidad:", error);
      toast.error("Error al crear el horario de disponibilidad. Por favor, intente de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendarEvents = async (date: string) => {
    setLoading(true);
    console.log("Fetching Google Calendar events for date:", date);
    try {
      const primaryCalendar = calendars.find(cal => cal.is_primary);
      if (!primaryCalendar) {
        console.warn("No primary calendar found, cannot fetch events.");
        setEvents([]);
        setLoading(false);
        return;
      }
      console.log("Using primary calendar for fetching events:", primaryCalendar);

      const timeMin = `${date}T00:00:00-05:00`; 
      const timeMax = `${date}T23:59:59-05:00`;
      console.log("Time range for events: ", timeMin, "to", timeMax);

      const { data, error } = await supabase.functions.invoke("google-calendar-api", {
        method: "POST",
        body: {
          action: "listEvents",
          userId: user?.id,
          calendarId: primaryCalendar.google_calendar_id,
          timeMin,
          timeMax,
        },
      });

      if (error) {
        console.error("Error invoking google-calendar-api for listEvents action:", error);
        throw error;
      }

      if (data && data.events) {
        console.log("Events fetched successfully:", data.events);
        setEvents(data.events.map((event: any) => ({
          id: event.id,
          summary: event.summary,
          start: event.start,
          end: event.end,
          status: event.status,
        })));
      } else {
        console.warn("No events received or data is empty.", data);
        setEvents([]);
      }
    } catch (error) {
      console.error("Error al obtener eventos del calendario:", error);
      toast.error("Error al cargar los eventos del calendario. Por favor, intente de nuevo.");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    isConnected,
    calendars,
    events,
    loading,
    connectGoogleCalendar,
    handleAuthCallback,
    createAvailabilitySlot,
    fetchCalendarEvents,
  };
};


