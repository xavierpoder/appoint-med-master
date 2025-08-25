import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Patient {
  id: string;
  nombre: string;
  apellido: string;
  cedula: string;
  correo?: string;
  whatsapp?: string;
  created_at: string;
}

export const usePatients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const searchPatients = async (term: string) => {
    if (term.length < 2) {
      setPatients([]);
      return;
    }

    setLoading(true);
    try {
      console.log('Searching patients with term:', term);
      
      // First, let's check if we have access to the table
      const { data: testData, error: testError } = await supabase
        .from('pacientes')
        .select('id')
        .limit(1);
      
      if (testError) {
        console.error('No access to pacientes table:', testError);
        toast.error('Sin acceso a la tabla de pacientes. Debe ser doctor para buscar pacientes.');
        return;
      }

      console.log('Table access test passed');

      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .or(`cedula.ilike.%${term}%,nombre.ilike.%${term}%,apellido.ilike.%${term}%`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error searching patients:', error);
        toast.error('Error al buscar pacientes: ' + error.message);
        return;
      }

      console.log('Search results:', data);
      setPatients(data || []);
    } catch (error) {
      console.error('Error searching patients:', error);
      toast.error('Error al buscar pacientes');
    } finally {
      setLoading(false);
    }
  };

  const createPatient = async (patientData: Omit<Patient, 'id' | 'created_at'>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pacientes')
        .insert({
          nombre: patientData.nombre,
          apellido: patientData.apellido,
          cedula: patientData.cedula,
          correo: patientData.correo,
          whatsapp: patientData.whatsapp
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating patient:', error);
        toast.error('Error al crear paciente');
        return null;
      }

      toast.success('Paciente creado exitosamente');
      return data;
    } catch (error) {
      console.error('Error creating patient:', error);
      toast.error('Error al crear paciente');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updatePatient = async (id: string, patientData: Partial<Patient>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pacientes')
        .update(patientData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating patient:', error);
        toast.error('Error al actualizar paciente');
        return null;
      }

      toast.success('Paciente actualizado exitosamente');
      return data;
    } catch (error) {
      console.error('Error updating patient:', error);
      toast.error('Error al actualizar paciente');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getPatientByCedula = async (cedula: string) => {
    try {
      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .eq('cedula', cedula)
        .maybeSingle();

      if (error) {
        console.error('Error getting patient by cedula:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting patient by cedula:', error);
      return null;
    }
  };

  useEffect(() => {
    if (searchTerm) {
      const timeoutId = setTimeout(() => {
        searchPatients(searchTerm);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setPatients([]);
    }
  }, [searchTerm]);

  return {
    patients,
    loading,
    searchTerm,
    setSearchTerm,
    searchPatients,
    createPatient,
    updatePatient,
    getPatientByCedula
  };
};