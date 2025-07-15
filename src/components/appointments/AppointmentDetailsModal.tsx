import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { User, Phone, Mail, Clock, FileText, CheckCircle, XCircle } from 'lucide-react';

interface AppointmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: {
    id: string;
    patientName: string;
    time: string;
    originalTime?: string;
    specialty: string;
    status: 'confirmed' | 'pending' | 'cancelled';
    patientDetails?: {
      id: string;
      phone: string;
      email: string;
      firstName: string;
      lastName: string;
    } | null;
  } | null;
}

const AppointmentDetailsModal: React.FC<AppointmentDetailsModalProps> = ({
  isOpen,
  onClose,
  appointment,
}) => {
  if (!appointment) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Confirmada
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Pendiente
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelada
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Detalles de la Cita
          </DialogTitle>
          <DialogDescription>
            Información completa del paciente y la cita programada
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Información básica de la cita */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{appointment.patientName}</h3>
                    <p className="text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 inline mr-1" />
                      {appointment.originalTime ? (() => {
                        // Extraer fecha y hora sin conversión de zona horaria
                        const dateStr = appointment.originalTime.split('T')[0]; // "2025-07-15"
                        const timeStr = appointment.originalTime.split('T')[1].substring(0, 5); // "10:15"
                        const [year, month, day] = dateStr.split('-');
                        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                        
                        const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
                        const formattedDate = date.toLocaleDateString('es-ES', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        });
                        
                        return `${dayName}, ${formattedDate}, ${timeStr}`;
                      })() : 
                        `Hoy de ${appointment.time}`
                      }
                    </p>
                  </div>
                  {getStatusBadge(appointment.status)}
                </div>

                <div className="pt-2 border-t">
                  <p className="text-sm">
                    <strong>Especialidad:</strong> {appointment.specialty}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de contacto */}
          {appointment.patientDetails && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3">Información de Contacto</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span><strong>Paciente:</strong> {appointment.patientDetails.firstName} {appointment.patientDetails.lastName}</span>
                  </div>
                  
                  {appointment.patientDetails.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{appointment.patientDetails.phone}</span>
                    </div>
                  )}
                  
                  {appointment.patientDetails.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{appointment.patientDetails.email}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentDetailsModal;