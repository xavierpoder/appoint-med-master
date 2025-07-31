import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Download, Edit, Trash2, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';
import PatientSearchInput from './PatientSearchInput';
import ClinicalHistoryForm from './ClinicalHistoryForm';
import { useClinicalHistory } from '@/hooks/useClinicalHistory';
import { generateClinicalHistoryPDF } from '@/utils/pdfExporter';
import { displayPhoneNumber } from '@/utils/phoneFormatter';

interface Patient {
  id: string;
  nombre: string;
  apellido: string;
  cedula: string;
  correo?: string;
  whatsapp?: string;
}

interface ClinicalHistory {
  id: string;
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

const ClinicalHistoryDocument: React.FC = () => {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [histories, setHistories] = useState<ClinicalHistory[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [editingHistory, setEditingHistory] = useState<ClinicalHistory | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  const { 
    getHistoriesByPatient, 
    deleteHistory, 
    getAppointmentsByPatient, 
    loading 
  } = useClinicalHistory();

  const loadPatientData = async (patient: Patient) => {
    setSelectedPatient(patient);
    
    try {
      // Cargar historias clínicas
      const historiesData = await getHistoriesByPatient(patient.id);
      setHistories(historiesData);

      // Cargar citas del paciente
      const appointmentsData = await getAppointmentsByPatient(patient.id);
      setAppointments(appointmentsData);
    } catch (error) {
      console.error('Error loading patient data:', error);
      toast.error('Error al cargar los datos del paciente');
    }
  };

  const handleDeleteHistory = async (historyId: string) => {
    if (!confirm('¿Está seguro de eliminar esta historia clínica?')) {
      return;
    }

    const success = await deleteHistory(historyId);
    if (success && selectedPatient) {
      await loadPatientData(selectedPatient);
      toast.success('Historia clínica eliminada');
    }
  };

  const handleEditHistory = (history: ClinicalHistory) => {
    setEditingHistory(history);
    setShowEditForm(true);
  };

  const handleExportPDF = async () => {
    if (!selectedPatient || histories.length === 0) {
      toast.error('No hay historias clínicas para exportar');
      return;
    }

    try {
      await generateClinicalHistoryPDF(selectedPatient, histories, appointments);
      toast.success('PDF generado exitosamente');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar el PDF');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Búsqueda de paciente */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Paciente</CardTitle>
        </CardHeader>
        <CardContent>
          <PatientSearchInput
            onPatientSelect={loadPatientData}
            onNewPatient={() => toast.info('Para crear un paciente, use la pestaña "Perfil del Paciente"')}
            placeholder="Buscar paciente para ver su historia completa..."
          />
        </CardContent>
      </Card>

      {/* Información del paciente seleccionado */}
      {selectedPatient && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl text-primary">
                  {selectedPatient.nombre} {selectedPatient.apellido}
                </CardTitle>
                <div className="space-y-1 text-sm text-muted-foreground mt-2">
                  <div><strong>Cédula:</strong> {selectedPatient.cedula}</div>
                  {selectedPatient.correo && (
                    <div><strong>Email:</strong> {selectedPatient.correo}</div>
                  )}
                  {selectedPatient.whatsapp && (
                    <div><strong>WhatsApp:</strong> {displayPhoneNumber(selectedPatient.whatsapp)}</div>
                  )}
                </div>
              </div>
              {histories.length > 0 && (
                <Button onClick={handleExportPDF} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar PDF
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Historial de citas */}
      {appointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-primary" />
              Historial de Citas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {formatDate(appointment.time)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatTime(appointment.time)} - {appointment.specialty}
                      </div>
                    </div>
                  </div>
                  <Badge 
                    variant={appointment.status === 'completed' ? 'default' : 'secondary'}
                  >
                    {appointment.status === 'completed' ? 'Completada' : 'Programada'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historias clínicas */}
      {selectedPatient && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary" />
              Historias Clínicas ({histories.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3">Cargando historias clínicas...</span>
              </div>
            ) : histories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No hay historias clínicas</p>
                <p>Este paciente no tiene registros médicos aún</p>
              </div>
            ) : (
              <div className="space-y-6">
                {histories.map((history, index) => (
                  <div key={history.id} className="border rounded-lg p-6 bg-card">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-lg font-semibold text-primary">
                          Registro #{histories.length - index}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(history.fecha_ingreso)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEditHistory(history)}
                          variant="outline"
                          size="sm"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteHistory(history.id)}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {history.sintoma && (
                        <div>
                          <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                            SÍNTOMAS
                          </h4>
                          <p className="text-sm">{history.sintoma}</p>
                        </div>
                      )}

                      {history.diagnostico && (
                        <div>
                          <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                            DIAGNÓSTICO
                          </h4>
                          <p className="text-sm">{history.diagnostico}</p>
                        </div>
                      )}

                      {history.tratamiento && (
                        <div>
                          <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                            TRATAMIENTO
                          </h4>
                          <p className="text-sm">{history.tratamiento}</p>
                        </div>
                      )}

                      {history.medicamento && (
                        <div>
                          <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                            MEDICAMENTOS
                          </h4>
                          <p className="text-sm">{history.medicamento}</p>
                        </div>
                      )}

                      {history.seguimiento && (
                        <div>
                          <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                            SEGUIMIENTO
                          </h4>
                          <p className="text-sm">{history.seguimiento}</p>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2 border-t">
                        <Badge 
                          variant={history.seguimiento_completado ? 'default' : 'secondary'}
                        >
                          {history.seguimiento_completado ? 'Seguimiento Completado' : 'Seguimiento Pendiente'}
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          Última actualización: {formatDate(history.updated_at)}
                        </div>
                      </div>
                    </div>

                    {index < histories.length - 1 && <Separator className="mt-6" />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal de edición */}
      {showEditForm && editingHistory && selectedPatient && (
        <ClinicalHistoryForm
          patient={selectedPatient}
          editingHistory={editingHistory}
          onClose={() => {
            setShowEditForm(false);
            setEditingHistory(null);
          }}
          onSaved={async () => {
            setShowEditForm(false);
            setEditingHistory(null);
            if (selectedPatient) {
              await loadPatientData(selectedPatient);
            }
          }}
        />
      )}
    </div>
  );
};

export default ClinicalHistoryDocument;