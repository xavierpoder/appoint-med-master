
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, Plus, AlertCircle } from 'lucide-react';
import { useCustomCalendar } from '@/hooks/useCustomCalendar';
import { toast } from 'sonner';

const AvailabilityManager = () => {
  const { createAvailabilitySlot, loading } = useCustomCalendar();
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [date, setDate] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateSlot = async () => {
    if (!date || !startTime || !endTime) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    // Additional validation
    if (startTime >= endTime) {
      toast.error('La hora de inicio debe ser anterior a la hora de fin');
      return;
    }

    setIsCreating(true);
    try {
      await createAvailabilitySlot(date, startTime, endTime);
      
      // Reset form on success
      setDate('');
      setStartTime('');
      setEndTime('');
    } catch (error) {
      console.error('Error creating availability slot:', error);
      toast.error('Error al crear el horario de disponibilidad');
    } finally {
      setIsCreating(false);
    }
  };

  // Get today's date for minimum date validation
  const today = new Date().toISOString().split('T')[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Gestionar Disponibilidad
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <p className="text-sm text-blue-700">
            Crea tus horarios de disponibilidad para que los pacientes puedan agendar citas contigo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Fecha</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={today}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="start-time">Hora de inicio</Label>
            <Input
              id="start-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="end-time">Hora de fin</Label>
            <Input
              id="end-time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
        </div>
        
        <Button 
          onClick={handleCreateSlot}
          disabled={isCreating || loading}
          className="w-full"
        >
          {isCreating ? (
            <Clock className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          {isCreating ? 'Creando...' : 'Crear Horario Disponible'}
        </Button>

        {date && startTime && endTime && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Vista previa:</strong> {new Date(date).toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} de {startTime} a {endTime}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AvailabilityManager;
