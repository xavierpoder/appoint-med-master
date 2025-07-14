import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';

export const useCustomCalendar = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const createAvailabilitySlot = useCallback(async (date: string, startTime: string, endTime: string) => {
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
  }, [user?.id]);

  const fetchAvailabilitySlots = useCallback(async (date: string, doctorId?: string) => {
    const targetDoctorId = doctorId || user?.id;
    if (!targetDoctorId) return;
    
    setLoading(true);
    try {
      const startOfDay = `${date}T00:00:00.000Z`;
      const endOfDay = `${date}T23:59:59.999Z`;

      const { data, error } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('doctor_id', targetDoctorId)
        .gte('start_time', startOfDay)
        .lte('start_time', endOfDay)
        .eq('is_available', true) // Only show available slots
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
        doctor_id: slot.doctor_id,
        is_available: slot.is_available
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching availability slots:', error);
      toast.error('Error al cargar los horarios');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchAppointments = useCallback(async (date: string) => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const startOfDay = `${date}T00:00:00.000Z`;
      const endOfDay = `${date}T23:59:59.999Z`;

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          time,
          patient_id,
          patient_view!inner(first_name, last_name)
        `)
        .eq('doctor_id', user.id)
        .gte('time', startOfDay)
        .lte('time', endOfDay);

      if (error) throw error;

      const formattedAppointments = data.map((appointment: any) => ({
        id: appointment.id,
        time: appointment.time,
        patientName: `${appointment.patient_view.first_name} ${appointment.patient_view.last_name}`,
        patient_id: appointment.patient_id,
      }));

      setAppointments(formattedAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Error al cargar las citas');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const deleteAvailabilitySlot = useCallback(async (slotId: string) => {
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
  }, []);

  return {
    loading,
    events,
    appointments,
    createAvailabilitySlot,
    fetchAvailabilitySlots,
    fetchAppointments,
    deleteAvailabilitySlot
  };
};