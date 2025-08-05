import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus } from 'lucide-react';
import { usePatients } from '@/hooks/usePatients';
import { sanitizeText } from '@/utils/validation';

interface Patient {
  id: string;
  nombre: string;
  apellido: string;
  cedula: string;
  correo?: string;
  whatsapp?: string;
}

interface PatientSearchInputProps {
  onPatientSelect: (patient: Patient) => void;
  onNewPatient: () => void;
  placeholder?: string;
}

const PatientSearchInput: React.FC<PatientSearchInputProps> = ({
  onPatientSelect,
  onNewPatient,
  placeholder = "Buscar paciente por cédula o nombre..."
}) => {
  const { patients, loading, searchTerm, setSearchTerm } = usePatients();

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(sanitizeText(e.target.value))}
            className="pl-10"
          />
        </div>
        <Button
          onClick={onNewPatient}
          variant="outline"
          className="shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo
        </Button>
      </div>

      {/* Resultados de búsqueda */}
      {patients.length > 0 && (
        <div className="border rounded-md max-h-60 overflow-y-auto bg-background">
          {patients.map((patient) => (
            <div
              key={patient.id}
              className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0 transition-colors"
              onClick={() => {
                onPatientSelect(patient);
                setSearchTerm('');
              }}
            >
              <div className="font-medium text-foreground">
                {patient.nombre} {patient.apellido}
              </div>
              <div className="text-sm text-muted-foreground">
                Cédula: {patient.cedula}
                {patient.correo && ` | ${patient.correo}`}
              </div>
              {patient.whatsapp && (
                <div className="text-xs text-muted-foreground">
                  WhatsApp: {patient.whatsapp}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span className="ml-2 text-sm text-muted-foreground">Buscando...</span>
        </div>
      )}

      {searchTerm.length >= 2 && !loading && patients.length === 0 && (
        <div className="text-center py-4 text-muted-foreground text-sm">
          No se encontraron pacientes. 
          <Button 
            variant="link" 
            onClick={onNewPatient}
            className="p-0 ml-1 h-auto"
          >
            Crear nuevo paciente
          </Button>
        </div>
      )}
    </div>
  );
};

export default PatientSearchInput;