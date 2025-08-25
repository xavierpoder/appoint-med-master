import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Patient {
  id: string;
  nombre: string;
  apellido: string;
  cedula: string;
  correo?: string;
  whatsapp?: string;
}

interface DoctorAppointmentModalProps {
  patient: Patient;
  isOpen: boolean;
  onClose: () => void;
  onAppointmentCreated: () => void;
}

interface AvailableSlot {
  id: string;
  start_time_iso: string;
  startTime: string;
  endTime: string;
  isOccupied: boolean;
}

const DoctorAppointmentModal: React.FC<DoctorAppointmentModalProps> = ({
  patient,
  isOpen,
  onClose,
  onAppointmentCreated,
}) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Cargar horarios disponibles para la fecha seleccionada
  const loadAvailableSlots = async (date: Date) => {
    if (!user) return;

    try {
      const dateStr = date.toISOString().split('T')[0];
      const startOfDay = `${dateStr}T00:00:00.000Z`;
      const endOfDay = `${dateStr}T23:59:59.999Z`;

      // Obtener citas ya agendadas
      const { data: appointments, error: appointmentsError } = await supabase
        .from("appointments")
        .select("time")
        .eq("doctor_id", user.id)
        .gte("time", startOfDay)
        .lte("time", endOfDay)
        .eq("status", "scheduled");

      if (appointmentsError) {
        console.error("Error fetching appointments:", appointmentsError);
        return;
      }

      // Lista de horarios ocupados
      const occupiedTimes = appointments?.map(appt => 
        new Date(appt.time).toISOString()
      ) || [];

      // Obtener slots disponibles del doctor
      const { data, error } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('doctor_id', user.id)
        .gte('start_time', startOfDay)
        .lte('start_time', endOfDay)
        .eq('is_available', true)
        .order('start_time');

      if (error) {
        console.error('Error fetching availability slots:', error);
        throw error;
      }

      // Dividir cada slot en intervalos de 1 hora
      const oneHourSlots: AvailableSlot[] = [];
      data.forEach((slot: any) => {
        const startTime = new Date(slot.start_time);
        const endTime = new Date(slot.end_time);
        
        let currentTime = new Date(startTime);
        while (currentTime < endTime) {
          const slotEndTime = new Date(currentTime.getTime() + 60 * 60 * 1000);
          
          if (slotEndTime <= endTime) {
            const slotStartISO = currentTime.toISOString();
            const isOccupied = occupiedTimes.includes(slotStartISO);
            
            oneHourSlots.push({
              id: `${slot.id}-${currentTime.getTime()}`,
              start_time_iso: slotStartISO,
              startTime: currentTime.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit',
                timeZone: 'UTC'
              }),
              endTime: slotEndTime.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit',
                timeZone: 'UTC'
              }),
              isOccupied: isOccupied
            });
          }
          
          currentTime = new Date(slotEndTime);
        }
      });

      setAvailableSlots(oneHourSlots);
    } catch (error) {
      console.error('Error loading available slots:', error);
      toast.error('Error al cargar horarios disponibles');
    }
  };

  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots(selectedDate);
    }
  }, [selectedDate, user]);

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("593")) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith("0")) {
      return `+593${cleaned.slice(1)}`;
    } else if (cleaned.length === 9) {
      return `+593${cleaned}`;
    }
    return `+${cleaned}`;
  };

  const createAppointment = async () => {
    if (!selectedDate || !selectedTime || !user) {
      toast.error("Seleccione fecha y hora para la cita");
      return;
    }

    setLoading(true);
    try {
      // Buscar o crear el paciente en profiles
      let patientId = null;

      // Primero intentar encontrar el paciente en profiles por cédula
      const { data: existingProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id_number", patient.cedula)
        .eq("role", "patient")
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error("Error checking existing profile:", profileError);
        toast.error("Error al verificar paciente existente");
        setLoading(false);
        return;
      }

      if (existingProfile) {
        patientId = existingProfile.id;
      } else {
        // Crear nuevo paciente usando signUp
        const tempEmail = `${patient.cedula}@temp.medicalapp.com`;
        const { data: newUser, error: authError } = await supabase.auth.signUp({
          email: tempEmail,
          password: Math.random().toString(36).slice(-8),
          options: {
            data: {
              first_name: patient.nombre,
              last_name: patient.apellido,
              role: "patient",
              phone: patient.whatsapp ? formatPhoneNumber(patient.whatsapp) : '',
              id_number: patient.cedula,
            }
          }
        });

        if (authError) {
          console.error("Error creating user:", authError);
          toast.error("Error al crear el paciente en el sistema");
          setLoading(false);
          return;
        }

        patientId = newUser.user?.id;

        // Actualizar el email en el perfil si el paciente tiene email real
        if (patient.correo && patient.correo !== tempEmail) {
          await supabase
            .from("profiles")
            .update({ email: patient.correo })
            .eq("id", patientId);
        }
      }

      if (!patientId) {
        toast.error("Error: No se pudo obtener el ID del paciente");
        setLoading(false);
        return;
      }

      // Crear la cita
      const { data: appointment, error: appointmentError } = await supabase
        .from("appointments")
        .insert({
          doctor_id: user.id,
          patient_id: patientId,
          time: selectedTime, // usar el tiempo ISO seleccionado
          duration_minutes: 60,
          status: "scheduled",
          specialty: "Consulta General",
          notes: `Cita agendada por el doctor para ${patient.nombre} ${patient.apellido}`
        })
        .select()
        .single();

      if (appointmentError) {
        console.error("Error creating appointment:", appointmentError);
        toast.error("Error al crear la cita");
        setLoading(false);
        return;
      }

      // Enviar notificación WhatsApp
      try {
        await supabase.functions.invoke("send-whatsapp-notification", {
          body: {
            appointmentId: appointment.id,
            type: "confirmation"
          }
        });
        toast.success("Cita creada y notificación WhatsApp enviada");
      } catch (error) {
        console.error("Error sending WhatsApp notification:", error);
        toast.success("Cita creada (error en notificación WhatsApp)");
      }

      onAppointmentCreated();
      onClose();
      resetForm();
    } catch (error) {
      console.error("Error creating appointment:", error);
      toast.error("Error al crear la cita");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedDate(undefined);
    setSelectedTime("");
    setAvailableSlots([]);
  };

  const availableSlotsList = availableSlots.filter(slot => !slot.isOccupied);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agendar Cita para {patient.nombre} {patient.apellido}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del paciente */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Información del Paciente:</h3>
            <div className="space-y-1 text-sm text-blue-800">
              <p><strong>Nombre:</strong> {patient.nombre} {patient.apellido}</p>
              <p><strong>Cédula:</strong> {patient.cedula}</p>
              {patient.correo && <p><strong>Email:</strong> {patient.correo}</p>}
              {patient.whatsapp && <p><strong>WhatsApp:</strong> {patient.whatsapp}</p>}
            </div>
          </div>

          {/* Selección de fecha */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Fecha de la cita</label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "PPP", { locale: es })
                  ) : (
                    <span>Seleccionar fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setSelectedTime("");
                    setDatePickerOpen(false);
                  }}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Horarios disponibles */}
          {selectedDate && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Horarios disponibles</label>
              {availableSlotsList.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {availableSlotsList.map((slot) => (
                    <Button
                      key={slot.id}
                      variant={selectedTime === slot.start_time_iso ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTime(slot.start_time_iso)}
                      className="text-xs"
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {slot.startTime} - {slot.endTime}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground p-4 text-center border border-dashed rounded-lg">
                  No hay horarios disponibles para esta fecha
                </p>
              )}
            </div>
          )}

          {/* Información de la cita seleccionada */}
          {selectedTime && (
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Cita programada para:</strong> {selectedDate && format(selectedDate, "PPP", { locale: es })}
              </p>
              <p className="text-sm text-green-800">
                <strong>Horario:</strong> {availableSlots.find(s => s.start_time_iso === selectedTime)?.startTime} - {availableSlots.find(s => s.start_time_iso === selectedTime)?.endTime}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Duración: 60 minutos
              </p>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={createAppointment}
              disabled={!selectedDate || !selectedTime || loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? "Creando..." : "Agendar Cita"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DoctorAppointmentModal;