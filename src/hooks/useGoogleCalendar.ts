
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
        try {
          const { data, error } = await supabase
            .from("doctors")
            .select("google_calendar_access_token")
            .eq("id", user.id)
            .maybeSingle();

          if (error) {
            console.error("Error checking connection:", error);
            setIsConnected(false);
          } else if (data?.google_calendar_access_token) {
            console.log("User is connected to Google Calendar.");
            setIsConnected(true);
            fetchCalendars();
          } else {
            console.log("User is not connected to Google Calendar.");
            setIsConnected(false);
          }
        } catch (error) {
          console.error("Error checking Google Calendar connection:", error);
          setIsConnected(false);
        }
      }
    };
    checkConnection();
  }, [user]);

  const connectGoogleCalendar = async () => {
    console.log("Attempting to connect Google Calendar...");
    toast.info("Funcionalidad de Google Calendar en desarrollo. Próximamente disponible.");
  };

  const handleAuthCallback = async (code: string) => {
    setLoading(true);
    console.log("Handling Google Auth callback with code:", code);
    // TODO: Implement auth callback handling
    setLoading(false);
  };

  const fetchCalendars = async () => {
    if (!user) return;
    
    setLoading(true);
    console.log("Fetching Google Calendars...");
    try {
      const { data, error } = await supabase
        .from("doctor_calendars")
        .select("*")
        .eq("doctor_id", user.id);

      if (error) {
        console.error("Error fetching calendars:", error);
        setCalendars([]);
      } else {
        console.log("Calendars fetched successfully:", data);
        setCalendars(data || []);
      }
    } catch (error) {
      console.error("Error al obtener calendarios:", error);
      setCalendars([]);
    } finally {
      setLoading(false);
    }
  };

  const createAvailabilitySlot = async (date: string, startTime: string, endTime: string) => {
    if (!user) {
      toast.error("Usuario no autenticado");
      return;
    }

    // Validate inputs
    if (!date || !startTime || !endTime) {
      console.error("Missing required parameters for availability slot");
      toast.error("Todos los campos son requeridos");
      return;
    }

    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      toast.error("Formato de hora inválido. Use formato HH:MM");
      return;
    }

    // Validate that end time is after start time
    const startDateTime = new Date(`${date}T${startTime}:00`);
    const endDateTime = new Date(`${date}T${endTime}:00`);
    
    if (endDateTime <= startDateTime) {
      toast.error("La hora de fin debe ser posterior a la hora de inicio");
      return;
    }

    // Validate that the date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const slotDate = new Date(date);
    
    if (slotDate < today) {
      toast.error("No se pueden crear horarios en fechas pasadas");
      return;
    }

    setLoading(true);
    console.log(`Creating availability slot for ${date} from ${startTime} to ${endTime}`);
    
    try {
      const startDateTimeString = `${date}T${startTime}:00`;
      const endDateTimeString = `${date}T${endTime}:00`;

      console.log(`Creating slot from ${startDateTimeString} to ${endDateTimeString}`);

      // Check if there's already a slot for this time
      const { data: existingSlots, error: checkError } = await supabase
        .from("availability_slots")
        .select("*")
        .eq("doctor_id", user.id)
        .eq("start_time", startDateTimeString)
        .eq("end_time", endDateTimeString);

      if (checkError) {
        console.error("Error checking existing slots:", checkError);
        toast.error("Error al verificar horarios existentes");
        return;
      }

      if (existingSlots && existingSlots.length > 0) {
        toast.error("Ya existe un horario para esta fecha y hora");
        return;
      }

      const { data, error } = await supabase
        .from("availability_slots")
        .insert({
          doctor_id: user.id,
          start_time: startDateTimeString,
          end_time: endDateTimeString,
          is_available: true,
        })
        .select();

      if (error) {
        console.error("Error creating availability slot:", error);
        toast.error("Error al crear el horario de disponibilidad: " + error.message);
      } else {
        console.log("Availability slot created successfully:", data);
        toast.success("Horario de disponibilidad creado exitosamente");
        // Refresh events for the selected date
        fetchCalendarEvents(date);
      }
    } catch (error) {
      console.error("Error al crear horario de disponibilidad:", error);
      toast.error("Error inesperado al crear el horario de disponibilidad");
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendarEvents = async (date: string) => {
    if (!user) return;
    
    setLoading(true);
    console.log("Fetching calendar events for date:", date);
    try {
      const startOfDay = `${date}T00:00:00`;
      const endOfDay = `${date}T23:59:59`;

      const { data, error } = await supabase
        .from("availability_slots")
        .select("*")
        .eq("doctor_id", user.id)
        .gte("start_time", startOfDay)
        .lte("end_time", endOfDay)
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Error fetching availability slots:", error);
        toast.error("Error al obtener horarios de disponibilidad");
        setEvents([]);
      } else {
        console.log("Availability slots fetched successfully:", data);
        const mappedEvents = data.map((slot: any) => ({
          id: slot.id,
          summary: slot.is_available ? "Disponible" : "Ocupado",
          start: { dateTime: slot.start_time, date: slot.start_time.split('T')[0] },
          end: { dateTime: slot.end_time, date: slot.end_time.split('T')[0] },
          status: slot.is_available ? "available" : "busy",
        }));
        setEvents(mappedEvents);
      }
    } catch (error) {
      console.error("Error al obtener eventos del calendario:", error);
      toast.error("Error al obtener eventos del calendario");
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
