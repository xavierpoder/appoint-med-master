import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Link, CheckCircle } from 'lucide-react';
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
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-green-600">Conectado a Google Calendar</span>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600">
              Conecte su cuenta de Google Calendar para sincronizar sus horarios de disponibilidad.
            </p>
            <Button 
              onClick={connectGoogleCalendar} 
              disabled={loading}
              className="w-full"
            >
              <Link className="mr-2 h-4 w-4" />
              {loading ? 'Conectando...' : 'Conectar Google Calendar'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CalendarIntegration;
