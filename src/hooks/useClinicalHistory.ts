import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface ClinicalHistory {
  id: string;
  paciente_id: string;
  doctor_id: string;
  fecha_ingreso: string;
  sintoma?: string;
  diagnostico?: string;
  tratamiento?: string;
  medicamento?: string;
  seguimiento?: string;
  seguimiento_completado: boolean;
  created_at: string;
  updated_at: string;
}

interface ClinicalHistoryWithPatient extends ClinicalHistory {
  paciente?: {
    id: string;
    nombre: string;
    apellido: string;
    cedula: string;
    correo?: string;
    whatsapp?: string;
  };
}

export const useClinicalHistory = () => {
  const { user } = useAuth();
  const [histories, setHistories] = useState<ClinicalHistoryWithPatient[]>([]);
  const [loading, setLoading] = useState(false);

  const getHistoriesByPatient = async (patientId: string) => {
    setLoading(true);
    try {
      // Primero obtener las historias clínicas sin joins
      const { data: historiesData, error: historiesError } = await supabase
        .from('historias_clinicas')
        .select('*')
        .eq('paciente_id', patientId)
        .order('fecha_ingreso', { ascending: false });

      if (historiesError) {
        console.error('Error fetching clinical histories:', historiesError);
        toast.error('Error al cargar historias clínicas');
        return [];
      }

      if (!historiesData || historiesData.length === 0) {
        return [];
      }

      // Para cada historia, obtener los datos del paciente según el tipo
      const historiesWithPatient = await Promise.all(
        historiesData.map(async (history) => {
          let pacienteData = null;
          
          if (history.paciente_tipo === 'profiles') {
            // Buscar en la tabla profiles
            const { data: profileData } = await supabase
              .from('profiles')
              .select('id, first_name, last_name, id_number, email, phone')
              .eq('id', history.paciente_id)
              .eq('role', 'patient')
              .single();
              
            if (profileData) {
              pacienteData = {
                id: profileData.id,
                nombre: profileData.first_name,
                apellido: profileData.last_name,
                cedula: profileData.id_number,
                correo: profileData.email,
                whatsapp: profileData.phone
              };
            }
          } else {
            // Buscar en la tabla pacientes (default)
            const { data: pacienteDataDb } = await supabase
              .from('pacientes')
              .select('id, nombre, apellido, cedula, correo, whatsapp')
              .eq('id', history.paciente_id)
              .single();
              
            pacienteData = pacienteDataDb;
          }

          return {
            ...history,
            paciente: pacienteData
          };
        })
      );

      return historiesWithPatient;
    } catch (error) {
      console.error('Error fetching clinical histories:', error);
      toast.error('Error al cargar historias clínicas');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createHistory = async (historyData: {
    paciente_id: string;
    fecha_ingreso: string;
    sintoma?: string;
    diagnostico?: string;
    tratamiento?: string;
    medicamento?: string;
    seguimiento?: string;
    paciente_tipo?: 'pacientes' | 'profiles';
  }) => {
    if (!user) {
      toast.error('No hay usuario autenticado');
      return null;
    }

    setLoading(true);
    try {
      // Verificar si el paciente existe en la tabla pacientes o profiles
      let pacienteTipo: 'pacientes' | 'profiles' = 'pacientes';
      
      // Primero buscar en pacientes
      const { data: pacienteData } = await supabase
        .from('pacientes')
        .select('id')
        .eq('id', historyData.paciente_id)
        .single();
      
      if (!pacienteData) {
        // Si no está en pacientes, debe estar en profiles
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', historyData.paciente_id)
          .eq('role', 'patient')
          .single();
          
        if (!profileData) {
          toast.error('Paciente no encontrado');
          return null;
        }
        pacienteTipo = 'profiles';
      }

      const { data, error } = await supabase
        .from('historias_clinicas')
        .insert({
          ...historyData,
          doctor_id: user.id,
          seguimiento_completado: false,
          paciente_tipo: pacienteTipo
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating clinical history:', error);
        toast.error('Error al crear historia clínica');
        return null;
      }

      toast.success('Historia clínica creada exitosamente');
      return data;
    } catch (error) {
      console.error('Error creating clinical history:', error);
      toast.error('Error al crear historia clínica');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateHistory = async (id: string, historyData: Partial<ClinicalHistory>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('historias_clinicas')
        .update(historyData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating clinical history:', error);
        toast.error('Error al actualizar historia clínica');
        return null;
      }

      toast.success('Historia clínica actualizada exitosamente');
      return data;
    } catch (error) {
      console.error('Error updating clinical history:', error);
      toast.error('Error al actualizar historia clínica');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteHistory = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('historias_clinicas')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting clinical history:', error);
        toast.error('Error al eliminar historia clínica');
        return false;
      }

      toast.success('Historia clínica eliminada exitosamente');
      return true;
    } catch (error) {
      console.error('Error deleting clinical history:', error);
      toast.error('Error al eliminar historia clínica');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getAppointmentsByPatient = async (patientId: string) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('id, time, status, specialty')
        .eq('patient_id', patientId)
        .order('time', { ascending: false });

      if (error) {
        console.error('Error fetching patient appointments:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching patient appointments:', error);
      return [];
    }
  };

  return {
    histories,
    loading,
    getHistoriesByPatient,
    createHistory,
    updateHistory,
    deleteHistory,
    getAppointmentsByPatient
  };
};