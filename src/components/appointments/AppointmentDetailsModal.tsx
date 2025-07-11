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
    specialty: string;
    status: 'confirmed' | 'pending' | 'cancelled';
    patientDetails?: {
      id: string;
      phone?: string;
      email?: string;
      reason?: string;
    };
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
                      {new Date(appointment.time).toLocaleString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
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
                  {appointment.patientDetails.id && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>ID: {appointment.patientDetails.id}</span>
                    </div>
                  )}
                  
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

          {/* Motivo de consulta */}
          {appointment.patientDetails?.reason && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Motivo de Consulta
                </h4>
                <p className="text-sm text-muted-foreground">
                  {appointment.patientDetails.reason}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentDetailsModal;