
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, User, RefreshCw } from 'lucide-react';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';

const CalendarEvents = () => {
  const { events, loading, fetchCalendarEvents, isConnected } = useGoogleCalendar();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchCalendarEvents(selectedDate);
  }, [selectedDate, fetchCalendarEvents]);

  const handleRefresh = () => {
    fetchCalendarEvents(selectedDate);
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-4">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="mr-2" /> Horarios de Disponibilidad
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="flex items-center"><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Cargando horarios...</p>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
              />
              <Button onClick={handleRefresh} size="sm">
                <RefreshCw className="mr-2 h-4 w-4" /> Actualizar
              </Button>
            </div>
            {events.length === 0 ? (
              <p className="text-gray-600">No hay horarios disponibles para la fecha seleccionada.</p>
            ) : (
              <ul className="space-y-2">
                {events.map((event: any) => (
                  <li key={event.id} className="p-3 border rounded-md">
                    <p className="font-medium">{event.summary}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(event.start.dateTime).toLocaleTimeString()} - {new Date(event.end.dateTime).toLocaleTimeString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CalendarEvents;
