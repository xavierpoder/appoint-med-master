import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';

export const useCustomCalendar = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);

  const createAvailabilitySlot = async (date: string, startTime: string, endTime: string) => {
    setLoading(true);
    try {
      const startDateTime = `${date}T${startTime}:00.000Z`;
      const endDateTime = `${date}T${endTime}:00.000Z`;

      const { error } = await supabase
        .from('availability_slots')
        .insert({
          doctor_id: user?.id,
          start_time: startDateTime,
          end_time: endDateTime,
          is_available: true,
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

  const fetchAvailabilitySlots = async (date: string) => {
    setLoading(true);
    try {
      const startOfDay = `${date}T00:00:00.000Z`;
      const endOfDay = `${date}T23:59:59.999Z`;

      const { data, error } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('doctor_id', user?.id)
        .gte('start_time', startOfDay)
        .lte('start_time', endOfDay)
        .eq('is_available', true)
        .order('start_time');

      if (error) throw error;

      const formattedEvents = data.map((slot: any) => ({
        id: slot.id,
        title: 'Disponible',
        start: new Date(slot.start_time),
        end: new Date(slot.end_time),
        startTime: new Date(slot.start_time).toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        endTime: new Date(slot.end_time).toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching availability slots:', error);
      toast.error('Error al cargar los horarios');
    } finally {
      setLoading(false);
    }
  };

  const deleteAvailabilitySlot = async (slotId: string) => {
    try {
      const { error } = await supabase
        .from('availability_slots')
        .delete()
        .eq('id', slotId);

      if (error) throw error;
      
      toast.success('Horario eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting slot:', error);
      toast.error('Error al eliminar el horario');
    }
  };

  return {
    loading,
    events,
    createAvailabilitySlot,
    fetchAvailabilitySlots,
    deleteAvailabilitySlot
  };
};