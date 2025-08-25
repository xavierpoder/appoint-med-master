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
      
      // Search in both pacientes table and profiles table (for registered patients)
      const [pacientesResult, profilesResult] = await Promise.all([
        // Search in pacientes table
        supabase
          .from('pacientes')
          .select('*')
          .or(`cedula.ilike.%${term}%,nombre.ilike.%${term}%,apellido.ilike.%${term}%`)
          .order('created_at', { ascending: false })
          .limit(10),
        
        // Search in profiles table for users with patient role only
        supabase
          .from('profiles')
          .select('id, first_name, last_name, id_number, email, phone')
          .eq('role', 'patient')
          .or(`id_number.ilike.%${term}%,first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%`)
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      const pacientesData = pacientesResult.data || [];
      const profilesData = profilesResult.data || [];

      // Convert profiles data to match pacientes structure
      const convertedProfiles = profilesData.map(profile => ({
        id: profile.id,
        nombre: profile.first_name || '',
        apellido: profile.last_name || '',
        cedula: profile.id_number || '',
        correo: profile.email || '',
        whatsapp: profile.phone || '',
        created_at: new Date().toISOString(), // Use current time as fallback
        source: 'profiles' // Add source identifier
      }));

      // Combine results, removing duplicates by cedula if both exist
      const allPatients = [...pacientesData.map(p => ({ ...p, source: 'pacientes' })), ...convertedProfiles];
      const uniquePatients = allPatients.reduce((acc, patient) => {
        const existingIndex = acc.findIndex(p => p.cedula && patient.cedula && p.cedula === patient.cedula);
        if (existingIndex === -1) {
          acc.push(patient);
        } else {
          // Prefer pacientes table data over profiles
          if (patient.source === 'pacientes') {
            acc[existingIndex] = patient;
          }
        }
        return acc;
      }, [] as any[]);

      console.log('Combined search results:', uniquePatients);
      setPatients(uniquePatients);
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