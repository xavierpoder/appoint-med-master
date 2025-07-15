import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, CheckCircle, XCircle } from 'lucide-react';

interface AppointmentCardProps {
  appointment: {
    id: string;
    patientName: string;
    time: string;
    specialty: string;
    status: 'confirmed' | 'pending' | 'cancelled';
  };
  onClick: () => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, onClick }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-xs">
            <CheckCircle className="w-3 h-3 mr-1" />
            Confirmada
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="text-xs">
            <Clock className="w-3 h-3 mr-1" />
            Pendiente
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="destructive" className="text-xs">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelada
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatTime = (timeString: string) => {
    // Si ya es un tiempo formateado (ej: "10:15"), devolverlo tal como está
    if (timeString && timeString.match(/^\d{2}:\d{2}$/)) {
      return timeString;
    }
    // Si es una fecha completa, formatearla
    return new Date(timeString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow duration-200 hover:border-primary/50"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <span className="font-semibold text-lg">{formatTime(appointment.time)}</span>
          </div>
          {getStatusBadge(appointment.status)}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{appointment.patientName}</span>
          </div>
          
          <p className="text-sm text-muted-foreground">
            {appointment.specialty}
          </p>
        </div>

        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-muted-foreground">
            Haz clic para ver detalles completos
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppointmentCard;