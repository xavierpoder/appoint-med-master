import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, User, ArrowUp, ArrowDown, Settings } from "lucide-react";
import { toast } from "sonner";
import CalendarIntegration from "@/components/calendar/CalendarIntegration";
import AvailabilityManager from "@/components/calendar/AvailabilityManager";
import CalendarEvents from "@/components/calendar/CalendarEvents";

interface Appointment {
  id: string;
  patientName: string;
  time: string;
  specialty: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Mock appointments data
  const [appointments, setAppointments] = useState<Appointment[]>([
    { id: '1', patientName: 'María García', time: '09:00', specialty: 'Consulta General', status: 'confirmed' },
    { id: '2', patientName: 'Juan Pérez', time: '10:30', specialty: 'Cardiología', status: 'pending' },
    { id: '3', patientName: 'Ana López', time: '14:00', specialty: 'Pediatría', status: 'confirmed' },
    { id: '4', patientName: 'Carlos Ruiz', time: '15:30', specialty: 'Dermatología', status: 'pending' },
  ]);

  const moveAppointment = (id: string, direction: 'up' | 'down') => {
    const currentIndex = appointments.findIndex(apt => apt.id === id);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === appointments.length - 1)
    ) return;

    const newAppointments = [...appointments];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    [newAppointments[currentIndex], newAppointments[targetIndex]] = 
    [newAppointments[targetIndex], newAppointments[currentIndex]];
    
    setAppointments(newAppointments);
    toast.success("Cita movida exitosamente");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelada';
      default: return 'Desconocido';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Panel del Doctor</h1>
                <p className="text-sm text-gray-500">Gestiona tus citas médicas</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="text-gray-600"
            >
              Volver al inicio
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Citas Hoy</p>
                  <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Confirmadas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {appointments.filter(apt => apt.status === 'confirmed').length}
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {appointments.filter(apt => apt.status === 'pending').length}
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Esta Semana</p>
                  <p className="text-2xl font-bold text-gray-900">24</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="appointments" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="appointments" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Citas del Día
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Calendario
              </TabsTrigger>
              <TabsTrigger value="availability" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Disponibilidad
              </TabsTrigger>
            </TabsList>

            <TabsContent value="appointments" className="space-y-6">
              {/* Date Selector and Appointments */}
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Calendar/Date Selector */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Seleccionar Fecha</h3>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Horario disponible:</span>
                      <span className="font-medium text-gray-900">9:00 - 17:00</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Duración promedio:</span>
                      <span className="font-medium text-gray-900">30 min</span>
                    </div>
                  </div>
                </Card>

                {/* Appointments List */}
                <div className="lg:col-span-2">
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Citas del {new Date(selectedDate).toLocaleDateString('es-ES', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </h3>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        Nueva Cita
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {appointments.map((appointment, index) => (
                        <div
                          key={appointment.id}
                          className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <div className="font-semibold text-gray-900">
                                  {appointment.time}
                                </div>
                                <div className="text-lg font-medium text-gray-900">
                                  {appointment.patientName}
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                                  {getStatusText(appointment.status)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">{appointment.specialty}</p>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => moveAppointment(appointment.id, 'up')}
                                disabled={index === 0}
                                className="p-2"
                              >
                                <ArrowUp className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => moveAppointment(appointment.id, 'down')}
                                disabled={index === appointments.length - 1}
                                className="p-2"
                              >
                                <ArrowDown className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="calendar" className="space-y-6">
              <div className="grid gap-6">
                <CalendarIntegration />
                <CalendarEvents />
              </div>
            </TabsContent>

            <TabsContent value="availability" className="space-y-6">
              <div className="grid gap-6">
                <AvailabilityManager />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default DoctorDashboard;
