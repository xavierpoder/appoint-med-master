import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, Search } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CreateAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAppointmentCreated: () => void;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  id_number: string;
}

interface AvailableSlot {
  id: string;
  start_time: string;
  end_time: string;
}

const CreateAppointmentModal: React.FC<CreateAppointmentModalProps> = ({
  isOpen,
  onClose,
  onAppointmentCreated,
}) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    idNumber: "",
    email: "",
    phone: "",
    consultationReason: "",
  });

  // Buscar pacientes existentes
  const searchPatients = async (term: string) => {
    if (term.length < 2) {
      setPatients([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, phone, id_number")
        .eq("role", "patient")
        .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,id_number.ilike.%${term}%`)
        .limit(10);

      if (error) {
        console.error("Error searching patients:", error);
      } else {
        setPatients(data || []);
      }
    } catch (error) {
      console.error("Error searching patients:", error);
    }
  };

  // Cargar horarios disponibles para la fecha seleccionada
  const loadAvailableSlots = async (date: Date) => {
    if (!user) return;

    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Obtener slots disponibles del doctor
      const { data: slots, error: slotsError } = await supabase
        .from("availability_slots")
        .select("id, start_time, end_time")
        .eq("doctor_id", user.id)
        .eq("is_available", true)
        .gte("start_time", startOfDay.toISOString())
        .lte("start_time", endOfDay.toISOString())
        .order("start_time");

      if (slotsError) {
        console.error("Error fetching slots:", slotsError);
        return;
      }

      // Obtener citas ya agendadas para filtrar horarios ocupados
      const { data: appointments, error: appointmentsError } = await supabase
        .from("appointments")
        .select("time")
        .eq("doctor_id", user.id)
        .gte("time", startOfDay.toISOString())
        .lte("time", endOfDay.toISOString());

      if (appointmentsError) {
        console.error("Error fetching appointments:", appointmentsError);
        return;
      }

      // Filtrar slots que no estén ocupados
      const occupiedTimes = appointments?.map(appt => appt.time) || [];
      const availableSlots = slots?.filter(slot => 
        !occupiedTimes.includes(slot.start_time)
      ) || [];

      setAvailableSlots(availableSlots);
    } catch (error) {
      console.error("Error loading available slots:", error);
    }
  };

  useEffect(() => {
    if (searchTerm) {
      const timeoutId = setTimeout(() => {
        searchPatients(searchTerm);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setPatients([]);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots(selectedDate);
    }
  }, [selectedDate, user]);

  const selectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setFormData({
      firstName: patient.first_name,
      lastName: patient.last_name,
      idNumber: patient.id_number,
      email: patient.email,
      phone: patient.phone,
      consultationReason: "",
    });
    setSearchTerm(`${patient.first_name} ${patient.last_name}`);
    setIsNewPatient(false);
    setPatients([]);
  };

  const handleNewPatient = () => {
    setSelectedPatient(null);
    setFormData({
      firstName: "",
      lastName: "",
      idNumber: "",
      email: "",
      phone: "",
      consultationReason: "",
    });
    setIsNewPatient(true);
    setPatients([]);
  };

  const formatPhoneNumber = (phone: string) => {
    // Asegurar formato internacional (+593999037862)
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

  const validateForm = () => {
    if (!formData.firstName || formData.firstName.length < 3) {
      toast.error("El nombre debe tener al menos 3 caracteres");
      return false;
    }
    if (!formData.lastName || formData.lastName.length < 3) {
      toast.error("El apellido debe tener al menos 3 caracteres");
      return false;
    }
    if (!formData.idNumber) {
      toast.error("El número de cédula es obligatorio");
      return false;
    }
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error("Ingrese un email válido");
      return false;
    }
    if (!formData.phone) {
      toast.error("El teléfono es obligatorio");
      return false;
    }
    if (!selectedDate || !selectedTime) {
      toast.error("Seleccione fecha y hora para la cita");
      return false;
    }
    return true;
  };

  const createAppointment = async () => {
    if (!validateForm() || !user) return;

    setLoading(true);
    try {
      let patientId = selectedPatient?.id;

      // Si es un nuevo paciente, crearlo primero
      if (isNewPatient || !selectedPatient) {
        // Verificar si la cédula ya existe
        const { data: existingPatient, error: checkError } = await supabase
          .from("profiles")
          .select("id")
          .eq("id_number", formData.idNumber)
          .single();

        if (existingPatient) {
          toast.error("Ya existe un paciente con esta cédula");
          setLoading(false);
          return;
        }

        // Crear nuevo paciente
        const { data: newUser, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: Math.random().toString(36).slice(-8), // Password temporal
          options: {
            data: {
              first_name: formData.firstName,
              last_name: formData.lastName,
              role: "patient",
              phone: formatPhoneNumber(formData.phone),
              id_number: formData.idNumber,
            }
          }
        });

        if (authError) {
          console.error("Error creating user:", authError);
          toast.error("Error al crear el paciente");
          setLoading(false);
          return;
        }

        patientId = newUser.user?.id;
      }

      if (!patientId) {
        toast.error("Error: No se pudo obtener el ID del paciente");
        setLoading(false);
        return;
      }

      // Crear la cita
      const appointmentTime = new Date(selectedDate!);
      const [hours, minutes] = selectedTime.split(":");
      appointmentTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const { data: appointment, error: appointmentError } = await supabase
        .from("appointments")
        .insert({
          doctor_id: user.id,
          patient_id: patientId,
          time: appointmentTime.toISOString(),
          duration_minutes: 60,
          status: "scheduled",
          specialty: "Consulta General",
          patient_notes: formData.consultationReason,
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
            type: "appointment_confirmation"
          }
        });
      } catch (error) {
        console.error("Error sending WhatsApp notification:", error);
        // No bloquear la creación de la cita por error en notificación
      }

      toast.success("Cita creada exitosamente");
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
    setFormData({
      firstName: "",
      lastName: "",
      idNumber: "",
      email: "",
      phone: "",
      consultationReason: "",
    });
    setSelectedDate(undefined);
    setSelectedTime("");
    setSelectedPatient(null);
    setSearchTerm("");
    setIsNewPatient(false);
    setPatients([]);
    setAvailableSlots([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nueva Cita</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Búsqueda de paciente */}
          <div className="space-y-4">
            <Label>Buscar Paciente</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o cédula..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (selectedPatient) {
                    setSelectedPatient(null);
                    setIsNewPatient(true);
                  }
                }}
                className="pl-10"
              />
            </div>

            {/* Resultados de búsqueda */}
            {patients.length > 0 && (
              <div className="border rounded-md max-h-40 overflow-y-auto">
                {patients.map((patient) => (
                  <div
                    key={patient.id}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    onClick={() => selectPatient(patient)}
                  >
                    <div className="font-medium">
                      {patient.first_name} {patient.last_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Cédula: {patient.id_number} | {patient.email}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchTerm && patients.length === 0 && searchTerm.length >= 2 && (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No se encontraron pacientes</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNewPatient}
                  className="mt-2"
                >
                  Crear nuevo paciente
                </Button>
              </div>
            )}
          </div>

          {/* Formulario de datos del paciente */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Nombre *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                disabled={selectedPatient && !isNewPatient}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Apellido *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                disabled={selectedPatient && !isNewPatient}
              />
            </div>
            <div>
              <Label htmlFor="idNumber">Número de Cédula *</Label>
              <Input
                id="idNumber"
                value={formData.idNumber}
                onChange={(e) => setFormData({...formData, idNumber: e.target.value})}
                disabled={selectedPatient && !isNewPatient}
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                disabled={selectedPatient && !isNewPatient}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="phone">Teléfono WhatsApp *</Label>
              <Input
                id="phone"
                placeholder="+593999037862"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                disabled={selectedPatient && !isNewPatient}
              />
            </div>
          </div>

          {/* Selector de fecha */}
          <div>
            <Label>Fecha de la Cita *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date() || date.getDay() === 0} // No domingos ni fechas pasadas
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Selector de hora */}
          {selectedDate && (
            <div>
              <Label>Hora de la Cita *</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {availableSlots.map((slot) => {
                  const startTime = new Date(slot.start_time).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  });
                  
                  return (
                    <Button
                      key={slot.id}
                      variant={selectedTime === startTime ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTime(startTime)}
                      className="flex items-center gap-1"
                    >
                      <Clock className="h-3 w-3" />
                      {startTime}
                    </Button>
                  );
                })}
              </div>
              {availableSlots.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  No hay horarios disponibles para esta fecha
                </p>
              )}
            </div>
          )}

          {/* Motivo de consulta */}
          <div>
            <Label htmlFor="consultationReason">Motivo de la Consulta</Label>
            <Textarea
              id="consultationReason"
              value={formData.consultationReason}
              onChange={(e) => setFormData({...formData, consultationReason: e.target.value})}
              placeholder="Describa brevemente el motivo de la consulta..."
              rows={3}
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={createAppointment} disabled={loading}>
              {loading ? "Creando..." : "Crear Cita"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAppointmentModal;