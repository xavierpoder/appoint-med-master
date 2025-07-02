
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Plus, RefreshCw } from 'lucide-react';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';

const CalendarIntegration = () => {
  const { 
    isConnected, 
    calendars, 
    loading, 
    connectGoogleCalendar, 
    refreshConnection 
  } = useGoogleCalendar();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Integración de Google Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              Conecta tu cuenta de Google Calendar para sincronizar tus horarios disponibles
            </p>
            <Button 
              onClick={connectGoogleCalendar}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Calendar className="h-4 w-4 mr-2" />
              )}
              Conectar Google Calendar
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-600">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Calendario conectado</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshConnection}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700">Calendarios conectados:</h4>
              {calendars.map((calendar) => (
                <div 
                  key={calendar.id} 
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm">{calendar.calendar_name}</span>
                  {calendar.is_primary && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Principal
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CalendarIntegration;
