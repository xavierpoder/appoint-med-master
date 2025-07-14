
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, Plus, Trash2, Save, CalendarDays } from 'lucide-react';
import { useCustomCalendar } from '@/hooks/useCustomCalendar';
import DaySelector from '@/components/availability/DaySelector';
import { toast } from 'sonner';

const AvailabilityManager = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const { createAvailabilitySlot, loading } = useCustomCalendar();

  const generateDatesInRange = (start: string, end: string, selectedDays: number[]): string[] => {
    const dates: string[] = [];
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      if (selectedDays.includes(d.getDay())) {
        dates.push(d.toISOString().split('T')[0]);
      }
    }
    
    return dates;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate || selectedDays.length === 0 || !startTime || !endTime) {
      toast.error('Por favor completa todos los campos y selecciona al menos un día');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error('La fecha de inicio debe ser anterior a la fecha de fin');
      return;
    }

    if (startTime >= endTime) {
      toast.error('La hora de fin debe ser posterior a la hora de inicio');
      return;
    }

    // Validate that slots are at least 60 minutes
    const startMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
    const endMinutes = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);
    const durationMinutes = endMinutes - startMinutes;
    
    if (durationMinutes < 60) {
      toast.error('Los horarios deben tener una duración mínima de 60 minutos');
      return;
    }

    try {
      const datesToCreate = generateDatesInRange(startDate, endDate, selectedDays);
      
      toast.info(`Creando disponibilidad para ${datesToCreate.length} días...`);
      
      for (const date of datesToCreate) {
        await createAvailabilitySlot(date, startTime, endTime);
      }
      
      toast.success(`Disponibilidad creada para ${datesToCreate.length} días`);
      
      // Reset form
      setStartDate('');
      setEndDate('');
      setSelectedDays([]);
      setStartTime('');
      setEndTime('');
    } catch (error) {
      toast.error('Error al crear el horario de disponibilidad');
    }
  };

  // Get today's date for minimum date validation
  const today = new Date().toISOString().split('T')[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Gestionar Disponibilidad
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rango de fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Fecha de Inicio</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div>
              <Label htmlFor="endDate">Fecha de Fin</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Selector de días */}
          <DaySelector
            selectedDays={selectedDays}
            onDaysChange={setSelectedDays}
          />

          {/* Horarios */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Hora de Inicio</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="endTime">Hora de Fin</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Resumen */}
          {startDate && endDate && selectedDays.length > 0 && startTime && endTime && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                Resumen de Disponibilidad
              </h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <strong>Período:</strong> {new Date(startDate).toLocaleDateString('es-ES')} - {new Date(endDate).toLocaleDateString('es-ES')}
                </p>
                <p>
                  <strong>Horario:</strong> {startTime} - {endTime}
                </p>
                <p>
                  <strong>Días:</strong> {selectedDays.length} día{selectedDays.length !== 1 ? 's' : ''} por semana
                </p>
              </div>
            </div>
          )}
          
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Creando disponibilidad...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Crear Disponibilidad para Múltiples Días
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AvailabilityManager;
