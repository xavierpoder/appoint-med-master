
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, RefreshCw } from 'lucide-react';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';

const CalendarEvents = () => {
  const { 
    calendars, 
    events, 
    loading, 
    fetchCalendarEvents, 
    isConnected 
  } = useGoogleCalendar();
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (isConnected && calendars.length > 0) {
      loadEventsForDate();
    }
  }, [selectedDate, calendars, isConnected]);

  const loadEventsForDate = async () => {
    if (calendars.length === 0) return;
    
    const primaryCalendar = calendars.find(cal => cal.is_primary) || calendars[0];
    const timeMin = `${selectedDate}T00:00:00Z`;
    const timeMax = `${selectedDate}T23:59:59Z`;
    
    await fetchCalendarEvents(primaryCalendar.google_calendar_id, timeMin, timeMax);
  };

  const formatTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Conecta tu Google Calendar para ver eventos</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Eventos del calendario
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadEventsForDate}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <label htmlFor="event-date" className="text-sm font-medium">
            Fecha:
          </label>
          <input
            id="event-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-4">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-600" />
              <p className="text-sm text-gray-600 mt-2">Cargando eventos...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No hay eventos para esta fecha</p>
            </div>
          ) : (
            events.map((event) => (
              <div 
                key={event.id} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div>
                    <h4 className="font-medium text-gray-900">{event.summary}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatTime(event.start.dateTime)} - {formatTime(event.end.dateTime)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {event.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarEvents;
