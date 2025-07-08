
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Link, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';

const CalendarIntegration = () => {
  const { isConnected, loading, connectGoogleCalendar } = useGoogleCalendar();

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="mr-2" /> Integración con Google Calendar
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-green-600">Conectado a Google Calendar</span>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">
                Tu calendario de Google está sincronizado. Los horarios que crees aquí se reflejarán en tu calendario personal.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Info className="h-5 w-5 text-blue-500" />
              <span className="text-blue-600">Integración disponible próximamente</span>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                La integración completa con Google Calendar está en desarrollo. Por ahora puedes gestionar tu disponibilidad localmente y los pacientes podrán ver tus horarios disponibles.
              </p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Funcionalidad actual:</p>
                  <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                    <li>• Crear horarios de disponibilidad</li>
                    <li>• Ver horarios programados</li>
                    <li>• Gestionar citas con pacientes</li>
                  </ul>
                </div>
              </div>
            </div>
            <Button 
              onClick={connectGoogleCalendar} 
              disabled={loading}
              className="w-full"
              variant="outline"
            >
              <Link className="mr-2 h-4 w-4" />
              {loading ? 'Conectando...' : 'Conectar Google Calendar (Próximamente)'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CalendarIntegration;
