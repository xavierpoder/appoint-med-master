
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Plus, RefreshCw, Sync } from 'lucide-react';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';

const CalendarIntegration = () => {
  const { 
    isConnected, 
    calendars, 
    loading, 
    connectGoogleCalendar, 
    fetchCalendars,
    refreshConnection 
  } = useGoogleCalendar();

  const handleSyncCalendars = async () => {
    if (isConnected) {
      await fetchCalendars();
    }
  };

  return (
    <div className="space-y-6">
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
                Conecta tu cuenta de Google Calendar para sincronizar tus horarios disponibles y gestionar citas automáticamente
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
              <div className="text-sm text-gray-500 space-y-2">
                <p><strong>Beneficios de la integración:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Sincronización automática de disponibilidad</li>
                  <li>Creación automática de eventos de citas</li>
                  <li>Prevención de conflictos de horario</li>
                  <li>Notificaciones automáticas</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-600">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Calendario conectado</span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSyncCalendars}
                    disabled={loading}
                  >
                    <Sync className="h-4 w-4 mr-1" />
                    Sincronizar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={refreshConnection}
                    disabled={loading}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-700">Calendarios conectados:</h4>
                {calendars.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">No hay calendarios sincronizados</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleSyncCalendars}
                      disabled={loading}
                      className="mt-2"
                    >
                      <Sync className="h-4 w-4 mr-1" />
                      Sincronizar calendarios
                    </Button>
                  </div>
                ) : (
                  calendars.map((calendar) => (
                    <div 
                      key={calendar.id} 
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">{calendar.calendar_name}</span>
                      </div>
                      {calendar.is_primary && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Principal
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Estado de sincronización</h4>
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="flex justify-between">
                    <span>Calendarios conectados:</span>
                    <span className="font-medium">{calendars.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Última sincronización:</span>
                    <span className="font-medium">Hace un momento</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarIntegration;
