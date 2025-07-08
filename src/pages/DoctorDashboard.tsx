
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, User, ArrowUp, ArrowDown, Settings } from "lucide-react";
import { toast } from "sonner";
import CalendarIntegration from "@/components/calendar/CalendarIntegration";
import AvailabilityManager from "@/components/calendar/AvailabilityManager";
import CalendarEvents from "@/components/calendar/CalendarEvents";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Appointment {
  id: string;
  patientName: string;
  time: string;
  specialty: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("appointments");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const { user, userRole } = useAuth();

  useEffect(() => {
    const fetchAppointments = async () => {
      if (user && userRole === 'doctor') {
        setLoadingAppointments(true);
        try {
          const { data, error } = await supabase
            .from('appointments')
            .select(`
              id,
              time,
              specialty,
              status,
              patient_view!inner(first_name, last_name)
            `)
            .eq('doctor_id', user.id);

          if (error) {
            console.error("Error fetching appointments:", error);
            toast.error("Error al cargar las citas.");
          } else {
            console.log("Appointments fetched successfully:", data);
            setAppointments(data.map((appt: any) => ({
              id: appt.id,
              patientName: `${appt.patient_view.first_name} ${appt.patient_view.last_name}`,
              time: appt.time,
              specialty: appt.specialty,
              status: appt.status,
            })));
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

  const handleLogout = () => {
    // Lógica para cerrar sesión
    toast.success("Sesión cerrada exitosamente");
    navigate("/auth");
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
            <h2 className="text-2xl font-semibold mb-4">Mis Citas</h2>
            {loadingAppointments ? (
              <p>Cargando citas...</p>
            ) : appointments.length === 0 ? (
              <p>No tienes citas programadas.</p>
            ) : (
              <ul className="space-y-4">
                {appointments.map((appointment) => (
                  <li key={appointment.id} className="p-4 border rounded-md flex justify-between items-center">
                    <div>
                      <p className="text-lg font-medium">Paciente: {appointment.patientName}</p>
                      <p className="text-gray-600">Hora: {appointment.time}</p>
                      <p className="text-gray-600">Especialidad: {appointment.specialty}</p>
                      <p className="text-gray-600">Estado: {appointment.status}</p>
                    </div>
                    <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                      Ver Detalles
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="availability" className="mt-6">
            <h2 className="text-2xl font-semibold mb-4">Gestionar Disponibilidad</h2>
            <AvailabilityManager />
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
            <h2 className="text-2xl font-semibold mb-4">Mi Calendario (Google Calendar)</h2>
            <CalendarIntegration />
            <CalendarEvents />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default DoctorDashboard;
