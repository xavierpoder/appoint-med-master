
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, User, ArrowUp, ArrowDown, Settings, Plus } from "lucide-react";
import { toast } from "sonner";
import CustomCalendar from "@/components/calendar/CustomCalendar";
import AvailabilityManager from "@/components/calendar/AvailabilityManager";
import AppointmentCard from "@/components/appointments/AppointmentCard";
import AppointmentDetailsModal from "@/components/appointments/AppointmentDetailsModal";
import CreateAppointmentModal from "@/components/appointments/CreateAppointmentModal";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Appointment {
  id: string;
  patientName: string;
  time: string;
  originalTime?: string;
  specialty: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  patientDetails?: {
    id: string;
    phone: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
}

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("appointments");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isCreateAppointmentOpen, setIsCreateAppointmentOpen] = useState(false);
  const { user, userRole, signOut } = useAuth();

  useEffect(() => {
    const fetchAppointments = async () => {
      if (user && userRole === 'doctor') {
        setLoadingAppointments(true);
        try {
          // Get today's date range
          const today = new Date();
          const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
          const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();

          const { data, error } = await supabase
            .from('appointments')
            .select(`
              id,
              time,
              specialty,
              status,
              patient_id
            `)
            .eq('doctor_id', user.id)
            .gte('time', startOfDay)
            .lte('time', endOfDay);

          if (error) {
            console.error("Error fetching appointments:", error);
            toast.error("Error al cargar las citas.");
          } else {
            console.log("Appointments fetched successfully:", data);
            
            // Get patient IDs to fetch their profiles
            const patientIds = data.map(appt => appt.patient_id).filter(id => id);
            console.log("Patient IDs to fetch:", patientIds);
            let patientProfiles = [];
            
            if (patientIds.length > 0) {
              const { data: profilesData, error: profilesError } = await supabase
                .from("patient_view")
                .select("id, first_name, last_name, phone, email")
                .in("id", patientIds);
                
              if (profilesError) {
                console.error("Error fetching patient profiles:", profilesError);
              } else {
                console.log("Profiles query result:", { profilesData, profilesError });
                patientProfiles = profilesData || [];
              }
            }
            console.log("Final profiles data:", patientProfiles);
            
            const formattedAppointments = data.map((appt: any) => {
              const profile = patientProfiles.find((p: any) => p.id === appt.patient_id);
              
              // Extraer la hora directamente del string sin conversión de timezone
              const timeString = appt.time.includes('T') 
                ? appt.time.split('T')[1].substring(0, 5) // Extrae "10:15" de "2025-07-15T10:15:00+00:00"
                : new Date(appt.time).toLocaleTimeString('es-ES', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false
                  });
              
              // Calcular hora de fin (asumiendo 1 hora de duración)
              const startTime = timeString;
              const [hours, minutes] = startTime.split(':').map(Number);
              const endHours = (hours + 1) % 24;
              const endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
              
              console.log('Appointment time fixed:', {
                originalTime: appt.time,
                extractedTime: timeString
              });
              
              return {
                id: appt.id,
                patientName: profile ? `${profile.first_name} ${profile.last_name}` : 'Paciente sin perfil',
                time: `${startTime} - ${endTime}`, // Mostrar rango de tiempo
                originalTime: appt.time, // Mantener fecha original para el modal
                specialty: appt.specialty,
                status: appt.status,
                patientDetails: profile ? {
                  id: profile.id,
                  phone: profile.phone || 'No disponible',
                  email: profile.email || 'No disponible',
                  firstName: profile.first_name,
                  lastName: profile.last_name
                } : null
              };
            });
            
            console.log('Final formatted appointments:', formattedAppointments);
            setAppointments(formattedAppointments);
          }
        } catch (error) {
          console.error("Error fetching appointments:", error);
          toast.error("Error al cargar las citas.");
        } finally {
          setLoadingAppointments(false);
        }
      }
    };

    fetchAppointments();
  }, [user, userRole]);

  const handleLogout = async () => {
    await signOut();
    toast.success("Sesión cerrada exitosamente");
    navigate("/auth");
  };

  const refreshAppointments = async () => {
    if (user && userRole === 'doctor') {
      setLoadingAppointments(true);
      try {
        // Get today's date range
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();

        const { data, error } = await supabase
          .from('appointments')
          .select(`
            id,
            time,
            specialty,
            status,
            patient_id
          `)
          .eq('doctor_id', user.id)
          .gte('time', startOfDay)
          .lte('time', endOfDay);

        if (error) {
          console.error("Error fetching appointments:", error);
          toast.error("Error al cargar las citas.");
        } else {
          // Get patient IDs to fetch their profiles
          const patientIds = data.map(appt => appt.patient_id).filter(id => id);
          let patientProfiles = [];
          
          if (patientIds.length > 0) {
            const { data: profilesData, error: profilesError } = await supabase
              .from("patient_view")
              .select("id, first_name, last_name, phone, email")
              .in("id", patientIds);
              
            if (profilesError) {
              console.error("Error fetching patient profiles:", profilesError);
            } else {
              patientProfiles = profilesData || [];
            }
          }
          
          const formattedAppointments = data.map((appt: any) => {
            const profile = patientProfiles.find((p: any) => p.id === appt.patient_id);
            
            // Extraer la hora directamente del string sin conversión de timezone
            const timeString = appt.time.includes('T') 
              ? appt.time.split('T')[1].substring(0, 5)
              : new Date(appt.time).toLocaleTimeString('es-ES', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false
                });
            
            // Calcular hora de fin (asumiendo 1 hora de duración)
            const startTime = timeString;
            const [hours, minutes] = startTime.split(':').map(Number);
            const endHours = (hours + 1) % 24;
            const endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            
            return {
              id: appt.id,
              patientName: profile ? `${profile.first_name} ${profile.last_name}` : 'Paciente sin perfil',
              time: `${startTime} - ${endTime}`,
              originalTime: appt.time,
              specialty: appt.specialty,
              status: appt.status,
              patientDetails: profile ? {
                id: profile.id,
                phone: profile.phone || 'No disponible',
                email: profile.email || 'No disponible',
                firstName: profile.first_name,
                lastName: profile.last_name
              } : null
            };
          });
          
          setAppointments(formattedAppointments);
        }
      } catch (error) {
        console.error("Error fetching appointments:", error);
        toast.error("Error al cargar las citas.");
      } finally {
        setLoadingAppointments(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10">
      <Card className="w-full max-w-4xl p-8 shadow-lg rounded-lg bg-white">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Panel del Doctor</h1>
          <Button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white">
            Cerrar Sesión
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="appointments">
              <Calendar className="mr-2 h-4 w-4" /> Citas
            </TabsTrigger>
            <TabsTrigger value="availability">
              <Clock className="mr-2 h-4 w-4" /> Disponibilidad
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <Calendar className="mr-2 h-4 w-4" /> Calendario
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appointments" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Mis Citas de Hoy</h2>
              <div className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
            
            {loadingAppointments ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3">Cargando citas...</span>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">No tienes citas programadas para hoy</p>
                <p className="text-muted-foreground">Las citas aparecerán aquí cuando sean agendadas</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {appointments
                  .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
                  .map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      onClick={() => setSelectedAppointment(appointment)}
                    />
                  ))}
              </div>
            )}

            <AppointmentDetailsModal
              isOpen={!!selectedAppointment}
              onClose={() => setSelectedAppointment(null)}
              appointment={selectedAppointment}
            />
          </TabsContent>

          <TabsContent value="availability" className="mt-6">
            <h2 className="text-2xl font-semibold mb-4">Gestionar Disponibilidad</h2>
            <AvailabilityManager />
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
            <h2 className="text-2xl font-semibold mb-4">Mi Calendario</h2>
            <CustomCalendar />
          </TabsContent>
        </Tabs>
      </Card>

      {/* Botón flotante para crear nueva cita */}
      <Button
        onClick={() => setIsCreateAppointmentOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow bg-primary hover:bg-primary/90"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Modal para crear cita */}
      <CreateAppointmentModal
        isOpen={isCreateAppointmentOpen}
        onClose={() => setIsCreateAppointmentOpen(false)}
        onAppointmentCreated={refreshAppointments}
      />
    </div>
  );
};

export default DoctorDashboard;
