import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react';
import { useCustomCalendar } from '@/hooks/useCustomCalendar';

const CustomCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { events, loading, fetchAvailabilitySlots } = useCustomCalendar();

  useEffect(() => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    fetchAvailabilitySlots(dateStr);
  }, [selectedDate, fetchAvailabilitySlots]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Días vacíos del mes anterior
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const selectDate = (date: Date) => {
    setSelectedDate(date);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const days = getDaysInMonth(currentDate);
  const monthYear = currentDate.toLocaleDateString('es-ES', { 
    month: 'long', 
    year: 'numeric' 
  });

  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Mi Calendario
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-lg font-semibold capitalize min-w-48 text-center">
                {monthYear}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-4">
            {weekDays.map(day => (
              <div 
                key={day} 
                className="p-2 text-center text-sm font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => (
              <div key={index} className="aspect-square">
                {date && (
                  <Button
                    variant={isSelected(date) ? "default" : "ghost"}
                    className={`w-full h-full p-1 text-sm ${
                      isToday(date) ? 'border-2 border-primary' : ''
                    } ${
                      date < new Date() ? 'opacity-50' : ''
                    }`}
                    onClick={() => selectDate(date)}
                    disabled={date < new Date()}
                  >
                    {date.getDate()}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horarios para {selectedDate.toLocaleDateString('es-ES')}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay horarios disponibles para esta fecha</p>
              <p className="text-sm">Crea un horario en la sección de disponibilidad</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {events.map((event: any) => (
                <div 
                  key={event.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {event.startTime} - {event.endTime}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">Disponible</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomCalendar;