import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useCalCom = () => {
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  const createAvailabilitySlot = async (date: string, startTime: string, endTime: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('cal-com-integration', {
        body: {
          action: 'create-availability',
          date,
          startTime,
          endTime
        }
      });

      if (error) throw error;

      toast.success('Horario de disponibilidad creado exitosamente');
    } catch (error) {
      console.error('Error creating availability slot:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendarEvents = async (date: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cal-com-integration', {
        body: {
          action: 'get-events',
          date
        }
      });

      if (error) throw error;

      setEvents(data?.events || []);
      setIsConnected(true);
    } catch (error) {
      console.error('Error fetching events:', error);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    events,
    isConnected,
    createAvailabilitySlot,
    fetchCalendarEvents
  };
};