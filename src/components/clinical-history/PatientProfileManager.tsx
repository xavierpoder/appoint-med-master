import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Save, X, UserPlus, Calendar } from 'lucide-react';
import PatientSearchInput from './PatientSearchInput';
import ClinicalHistoryForm from './ClinicalHistoryForm';
import DoctorAppointmentModal from './DoctorAppointmentModal';
import { usePatients } from '@/hooks/usePatients';
import { useClinicalHistory } from '@/hooks/useClinicalHistory';
import { formatWhatsAppNumber, validateWhatsAppNumber, displayPhoneNumber } from '@/utils/phoneFormatter';

interface Patient {
  id: string;
  nombre: string;
  apellido: string;
  cedula: string;
  correo?: string;
  whatsapp?: string;
}

const PatientProfileManager: React.FC = () => {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [showHistoryForm, setShowHistoryForm] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    correo: '',
    whatsapp: ''
  });

  const { createPatient, updatePatient, getPatientByCedula, loading } = usePatients();
  const { getHistoriesByPatient } = useClinicalHistory();

  useEffect(() => {
    if (selectedPatient) {
      setFormData({
        nombre: selectedPatient.nombre,
        apellido: selectedPatient.apellido,
        cedula: selectedPatient.cedula,
        correo: selectedPatient.correo || '',
        whatsapp: selectedPatient.whatsapp || ''
      });
      setIsNewPatient(false);
      setIsEditing(false);
    }
  }, [selectedPatient]);

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowHistoryForm(false);
  };

  const handleNewPatient = () => {
    setSelectedPatient(null);
    setFormData({
      nombre: '',
      apellido: '',
      cedula: '',
      correo: '',
      whatsapp: ''
    });
    setIsNewPatient(true);
    setIsEditing(true);
    setShowHistoryForm(false);
  };

  const validateForm = (): boolean => {
    if (!formData.nombre.trim() || formData.nombre.length < 2) {
      toast.error('El nombre debe tener al menos 2 caracteres');
      return false;
    }

    if (!formData.apellido.trim() || formData.apellido.length < 2) {
      toast.error('El apellido debe tener al menos 2 caracteres');
      return false;
    }

    if (!formData.cedula.trim() || formData.cedula.length < 8) {
      toast.error('La cédula debe tener al menos 8 caracteres');
      return false;
    }

    if (formData.correo && !/\S+@\S+\.\S+/.test(formData.correo)) {
      toast.error('Ingrese un email válido');
      return false;
    }

    if (formData.whatsapp && !validateWhatsAppNumber(formData.whatsapp)) {
      toast.error('Ingrese un número de WhatsApp válido (formato: 0999123456)');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    // Verificar si ya existe otro paciente con la misma cédula
    if (isNewPatient) {
      const existingPatient = await getPatientByCedula(formData.cedula);
      if (existingPatient) {
        toast.error('Ya existe un paciente con esta cédula');
        return;
      }
    }

    const patientData = {
      ...formData,
      whatsapp: formData.whatsapp ? formatWhatsAppNumber(formData.whatsapp) : undefined
    };

    try {
      if (isNewPatient) {
        const newPatient = await createPatient(patientData);
        if (newPatient) {
          setSelectedPatient(newPatient);
          setIsNewPatient(false);
          setIsEditing(false);
        }
      } else if (selectedPatient) {
        const updatedPatient = await updatePatient(selectedPatient.id, patientData);
        if (updatedPatient) {
          setSelectedPatient(updatedPatient);
          setIsEditing(false);
        }
      }
    } catch (error) {
      console.error('Error saving patient:', error);
    }
  };

  const handleCancel = () => {
    if (isNewPatient) {
      setSelectedPatient(null);
      setIsNewPatient(false);
      setFormData({
        nombre: '',
        apellido: '',
        cedula: '',
        correo: '',
        whatsapp: ''
      });
    } else if (selectedPatient) {
      setFormData({
        nombre: selectedPatient.nombre,
        apellido: selectedPatient.apellido,
        cedula: selectedPatient.cedula,
        correo: selectedPatient.correo || '',
        whatsapp: selectedPatient.whatsapp || ''
      });
    }
    setIsEditing(false);
  };

  const handleAddHistory = () => {
    if (selectedPatient) {
      setShowHistoryForm(true);
    } else {
      toast.error('Primero seleccione o cree un paciente');
    }
  };

  const handleScheduleAppointment = () => {
    if (selectedPatient) {
      setShowAppointmentModal(true);
    } else {
      toast.error('Primero seleccione o cree un paciente');
    }
  };

  return (
    <div className="space-y-6">
      {/* Búsqueda de pacientes */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar o Crear Paciente</CardTitle>
        </CardHeader>
        <CardContent>
          <PatientSearchInput
            onPatientSelect={handlePatientSelect}
            onNewPatient={handleNewPatient}
          />
        </CardContent>
      </Card>

      {/* Información del paciente */}
      {(selectedPatient || isNewPatient) && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                {isNewPatient ? 'Nuevo Paciente' : 'Información del Paciente'}
              </CardTitle>
              <div className="flex gap-2">
                {!isEditing && !isNewPatient && (
                  <>
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                      size="sm"
                    >
                      Editar
                    </Button>
                    <Button
                      onClick={handleAddHistory}
                      size="sm"
                      variant="outline"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Agregar Historia
                    </Button>
                    <Button
                      onClick={handleScheduleAppointment}
                      size="sm"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Agendar Cita
                    </Button>
                  </>
                )}
                {isEditing && (
                  <>
                    <Button
                      onClick={handleSave}
                      size="sm"
                      disabled={loading}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Guardar
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      size="sm"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Ingrese el nombre"
                />
              </div>

              <div>
                <Label htmlFor="apellido">Apellido *</Label>
                <Input
                  id="apellido"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Ingrese el apellido"
                />
              </div>

              <div>
                <Label htmlFor="cedula">Cédula *</Label>
                <Input
                  id="cedula"
                  value={formData.cedula}
                  onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Ingrese la cédula"
                />
              </div>

              <div>
                <Label htmlFor="correo">Email</Label>
                <Input
                  id="correo"
                  type="email"
                  value={formData.correo}
                  onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                  disabled={!isEditing}
                  placeholder="email@ejemplo.com"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  disabled={!isEditing}
                  placeholder="0999123456"
                />
                {formData.whatsapp && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Formato: {displayPhoneNumber(formData.whatsapp)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulario de historia clínica */}
      {showHistoryForm && selectedPatient && (
        <ClinicalHistoryForm
          patient={selectedPatient}
          onClose={() => setShowHistoryForm(false)}
          onSaved={() => {
            setShowHistoryForm(false);
            toast.success('Historia clínica guardada exitosamente');
          }}
        />
      )}

      {/* Modal de agendamiento de cita */}
      {showAppointmentModal && selectedPatient && (
        <DoctorAppointmentModal
          patient={selectedPatient}
          isOpen={showAppointmentModal}
          onClose={() => setShowAppointmentModal(false)}
          onAppointmentCreated={() => {
            setShowAppointmentModal(false);
            toast.success('Cita agendada exitosamente');
          }}
        />
      )}
    </div>
  );
};

export default PatientProfileManager;