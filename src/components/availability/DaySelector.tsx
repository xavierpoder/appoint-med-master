import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface DaySelectorProps {
  selectedDays: number[];
  onDaysChange: (days: number[]) => void;
}

const DaySelector: React.FC<DaySelectorProps> = ({ selectedDays, onDaysChange }) => {
  const days = [
    { label: 'Lunes', value: 1 },
    { label: 'Martes', value: 2 },
    { label: 'Miércoles', value: 3 },
    { label: 'Jueves', value: 4 },
    { label: 'Viernes', value: 5 },
    { label: 'Sábado', value: 6 },
    { label: 'Domingo', value: 0 },
  ];

  const handleDayToggle = (dayValue: number, checked: boolean) => {
    if (checked) {
      onDaysChange([...selectedDays, dayValue]);
    } else {
      onDaysChange(selectedDays.filter(day => day !== dayValue));
    }
  };

  const selectAll = () => {
    onDaysChange([1, 2, 3, 4, 5, 6, 0]);
  };

  const selectWeekdays = () => {
    onDaysChange([1, 2, 3, 4, 5]);
  };

  const selectWeekend = () => {
    onDaysChange([6, 0]);
  };

  const clearAll = () => {
    onDaysChange([]);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">Días de la Semana</Label>
        <p className="text-xs text-muted-foreground mb-3">
          Selecciona los días en los que quieres aplicar este horario
        </p>
      </div>

      {/* Botones de selección rápida */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={selectWeekdays}
          className="px-3 py-1 text-xs bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
        >
          Lun-Vie
        </button>
        <button
          type="button"
          onClick={selectWeekend}
          className="px-3 py-1 text-xs bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
        >
          Fin de semana
        </button>
        <button
          type="button"
          onClick={selectAll}
          className="px-3 py-1 text-xs bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
        >
          Todos
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="px-3 py-1 text-xs bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-colors"
        >
          Limpiar
        </button>
      </div>

      {/* Checkboxes individuales */}
      <div className="grid grid-cols-2 gap-3">
        {days.map((day) => (
          <div key={day.value} className="flex items-center space-x-2">
            <Checkbox
              id={`day-${day.value}`}
              checked={selectedDays.includes(day.value)}
              onCheckedChange={(checked) => handleDayToggle(day.value, checked as boolean)}
            />
            <Label
              htmlFor={`day-${day.value}`}
              className="text-sm font-normal cursor-pointer"
            >
              {day.label}
            </Label>
          </div>
        ))}
      </div>

      {selectedDays.length > 0 && (
        <div className="p-3 bg-muted/50 rounded-md">
          <p className="text-xs text-muted-foreground">
            Días seleccionados: {selectedDays.length} día{selectedDays.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
};

export default DaySelector;