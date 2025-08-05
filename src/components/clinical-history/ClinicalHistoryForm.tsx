import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useClinicalHistory } from '@/hooks/useClinicalHistory';
import { validateFormData, sanitizeText } from '@/utils/validation';

interface Patient {
  id: string;
  nombre: string;
  apellido: string;
  cedula: string;
  correo?: string;
  whatsapp?: string;
}

interface ClinicalHistoryFormProps {
  patient: Patient;
  onClose: () => void;
  onSaved: () => void;
  editingHistory?: any;
}

const ClinicalHistoryForm: React.FC<ClinicalHistoryFormProps> = ({
  patient,
  onClose,
  onSaved,
  editingHistory
}) => {
  const [fechaIngreso, setFechaIngreso] = useState<Date>(
    editingHistory ? new Date(editingHistory.fecha_ingreso) : new Date()
  );
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    sintoma: editingHistory?.sintoma || '',
    diagnostico: editingHistory?.diagnostico || '',
    tratamiento: editingHistory?.tratamiento || '',
    medicamento: editingHistory?.medicamento || '',
    seguimiento: editingHistory?.seguimiento || '',
    seguimientoCompletado: editingHistory?.seguimiento_completado || false
  });

  const { createHistory, updateHistory, loading } = useClinicalHistory();

  const handleSave = async () => {
    if (!fechaIngreso) {
      toast.error('Seleccione una fecha de ingreso');
      return;
    }

    // Validate form data
    const validationErrors = validateFormData.clinicalHistory(formData);
    if (validationErrors.length > 0) {
      toast.error(validationErrors.join(', '));
      return;
    }

    const historyData = {
      paciente_id: patient.id,
      fecha_ingreso: fechaIngreso.toISOString().split('T')[0],
      sintoma: sanitizeText(formData.sintoma).trim() || undefined,
      diagnostico: sanitizeText(formData.diagnostico).trim() || undefined,
      tratamiento: sanitizeText(formData.tratamiento).trim() || undefined,
      medicamento: sanitizeText(formData.medicamento).trim() || undefined,
      seguimiento: sanitizeText(formData.seguimiento).trim() || undefined,
      seguimiento_completado: formData.seguimientoCompletado
    };

    try {
      let result;
      if (editingHistory) {
        result = await updateHistory(editingHistory.id, historyData);
      } else {
        result = await createHistory(historyData);
      }

      if (result) {
        onSaved();
      }
    } catch (error) {
      console.error('Error saving clinical history:', error);
      toast.error('Error al guardar la historia clínica');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>
            {editingHistory ? 'Editar Historia Clínica' : 'Nueva Historia Clínica'}
          </CardTitle>
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Paciente: {patient.nombre} {patient.apellido} (Cédula: {patient.cedula})
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Fecha de ingreso */}
        <div>
          <Label>Fecha de Ingreso *</Label>
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !fechaIngreso && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {fechaIngreso ? (
                  format(fechaIngreso, "PPP", { locale: es })
                ) : (
                  "Seleccionar fecha"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={fechaIngreso}
                onSelect={(date) => {
                  setFechaIngreso(date || new Date());
                  setDatePickerOpen(false);
                }}
                disabled={(date) => date > new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Síntomas */}
        <div>
          <Label htmlFor="sintoma">Síntomas</Label>
          <Textarea
            id="sintoma"
            value={formData.sintoma}
            onChange={(e) => setFormData({ ...formData, sintoma: e.target.value })}
            placeholder="Describa los síntomas presentados por el paciente..."
            rows={3}
          />
        </div>

        {/* Diagnóstico */}
        <div>
          <Label htmlFor="diagnostico">Diagnóstico</Label>
          <Textarea
            id="diagnostico"
            value={formData.diagnostico}
            onChange={(e) => setFormData({ ...formData, diagnostico: e.target.value })}
            placeholder="Ingrese el diagnóstico médico..."
            rows={3}
          />
        </div>

        {/* Tratamiento */}
        <div>
          <Label htmlFor="tratamiento">Tratamiento</Label>
          <Textarea
            id="tratamiento"
            value={formData.tratamiento}
            onChange={(e) => setFormData({ ...formData, tratamiento: e.target.value })}
            placeholder="Describa el tratamiento recomendado..."
            rows={3}
          />
        </div>

        {/* Medicamentos */}
        <div>
          <Label htmlFor="medicamento">Medicamentos</Label>
          <Textarea
            id="medicamento"
            value={formData.medicamento}
            onChange={(e) => setFormData({ ...formData, medicamento: e.target.value })}
            placeholder="Lista de medicamentos prescritos, dosis y frecuencia..."
            rows={3}
          />
        </div>

        {/* Seguimiento */}
        <div>
          <Label htmlFor="seguimiento">Seguimiento</Label>
          <Textarea
            id="seguimiento"
            value={formData.seguimiento}
            onChange={(e) => setFormData({ ...formData, seguimiento: e.target.value })}
            placeholder="Instrucciones de seguimiento y próximas citas..."
            rows={3}
          />
        </div>

        {/* Seguimiento completado */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="seguimientoCompletado"
            checked={formData.seguimientoCompletado}
            onCheckedChange={(checked) => 
              setFormData({ ...formData, seguimientoCompletado: !!checked })
            }
          />
          <Label htmlFor="seguimientoCompletado">
            Seguimiento completado
          </Label>
        </div>

        {/* Botones */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleSave}
            disabled={loading}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            {editingHistory ? 'Actualizar' : 'Guardar'} Historia
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
          >
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClinicalHistoryForm;