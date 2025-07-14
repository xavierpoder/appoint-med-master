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

      // Divide each availability slot into 1-hour slots
      const oneHourSlots = [];
      data.forEach((slot: any) => {
        const startTime = new Date(slot.start_time);
        const endTime = new Date(slot.end_time);
        
        let currentTime = new Date(startTime);
        while (currentTime < endTime) {
          const slotEndTime = new Date(currentTime.getTime() + 60 * 60 * 1000); // Add 1 hour
          
          // Don't create slots that extend beyond the original availability
          if (slotEndTime <= endTime) {
            oneHourSlots.push({
              id: `${slot.id}-${currentTime.getTime()}`, // Unique ID for each hour slot
              originalSlotId: slot.id,
              title: 'Disponible',
              start: new Date(currentTime),
              end: new Date(slotEndTime),
              startTime: currentTime.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit',
                timeZone: 'UTC'
              }),
              endTime: slotEndTime.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit',
                timeZone: 'UTC'
              }),
              doctor_id: slot.doctor_id,
              is_available: slot.is_available
            });
          }
          
          currentTime = new Date(slotEndTime);
        }
      });

      setEvents(oneHourSlots);
    } catch (error) {
      console.error('Error fetching availability slots:', error);
      toast.error('Error al cargar los horarios');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchAppointments = useCallback(async (date: string, doctorId?: string) => {
    const targetDoctorId = doctorId || user?.id;
    if (!targetDoctorId) return;
    
    setLoading(true);
    try {
      const startOfDay = `${date}T00:00:00.000Z`;
      const endOfDay = `${date}T23:59:59.999Z`;

      console.log('Fetching appointments for doctor:', targetDoctorId, 'date range:', startOfDay, 'to', endOfDay);

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          time,
          patient_id,
          status,
          profiles!patient_id(first_name, last_name, phone, email)
        `)
        .eq('doctor_id', targetDoctorId)
        .gte('time', startOfDay)
        .lte('time', endOfDay)
        .eq('status', 'scheduled');

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Raw appointments data from DB:', data);

      const formattedAppointments = data.map((appointment: any) => {
        const profile = appointment.profiles;
        if (!profile) {
          console.warn('No profile found for patient_id:', appointment.patient_id);
          return {
            id: appointment.id,
            time: appointment.time,
            patientName: 'Paciente sin perfil',
            patientPhone: '',
            patientEmail: '',
            patient_id: appointment.patient_id,
            startTime: new Date(appointment.time).toLocaleTimeString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit',
              timeZone: 'UTC'
            }),
            endTime: new Date(new Date(appointment.time).getTime() + 60 * 60 * 1000).toLocaleTimeString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit',
              timeZone: 'UTC'
            })
          };
        }
        
        return {
          id: appointment.id,
          time: appointment.time,
          patientName: `${profile.first_name} ${profile.last_name}`,
          patientPhone: profile.phone || '',
          patientEmail: profile.email || '',
          patient_id: appointment.patient_id,
          startTime: new Date(appointment.time).toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: 'UTC'
          }),
          endTime: new Date(new Date(appointment.time).getTime() + 60 * 60 * 1000).toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: 'UTC'
          })
        };
      });

      console.log('Formatted appointments:', formattedAppointments);
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

  const deleteAllAvailabilitySlots = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('availability_slots')
        .delete()
        .eq('doctor_id', user.id);

      if (error) throw error;
      
      toast.success('Todos los horarios han sido eliminados exitosamente');
    } catch (error) {
      console.error('Error deleting all slots:', error);
      toast.error('Error al eliminar los horarios');
      throw error;
    }
  }, [user?.id]);

  return {
    loading,
    events,
    appointments,
    createAvailabilitySlot,
    fetchAvailabilitySlots,
    fetchAppointments,
    deleteAvailabilitySlot,
    deleteAllAvailabilitySlots
  };
};