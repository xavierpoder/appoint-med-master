
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar, Search, User, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import CustomCalendar from "@/components/calendar/CustomCalendar";

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  specialty: string;
  years_experience: number | null;
  bio: string | null;
  consultation_fee: number | null;
  avatar_url: string | null;
  education: string | null;
  languages: string[] | null;
}

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<'specialty' | 'doctor'>('specialty');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('doctor_view')
        .select('*')
        .order('first_name');

      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Error al cargar los doctores');
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter(doctor => {
    if (!searchTerm) return true;
    
    if (searchType === 'specialty') {
      return doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    } else {
      const fullName = `${doctor.first_name} ${doctor.last_name}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    }
  });

  const handleSlotSelect = (slot: any) => {
    setSelectedSlot(slot);
    console.log('Slot seleccionado:', slot);
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedSlot) {
      toast.error("Por favor selecciona un doctor y horario");
      return;
    }

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast.error("Debes iniciar sesión para agendar una cita");
        return;
      }

      // Create the appointment
      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          doctor_id: selectedDoctor.id,
          patient_id: user.user.id,
          time: selectedSlot.start,
          specialty: selectedDoctor.specialty,
          status: 'scheduled',
          duration_minutes: 60, // 60 minutes minimum
          notes: `Cita agendada con Dr. ${selectedDoctor.first_name} ${selectedDoctor.last_name}`
        });

      if (appointmentError) throw appointmentError;

      // Mark the availability slot as unavailable
      const { error: slotError } = await supabase
        .from('availability_slots')
        .update({ is_available: false })
        .eq('id', selectedSlot.id);

      if (slotError) throw slotError;

      toast.success(`Cita agendada exitosamente con Dr. ${selectedDoctor.first_name} ${selectedDoctor.last_name}`);
      setSelectedDoctor(null);
      setSelectedSlot(null);
      
      // Refresh the availability to show updated slots
      const dateStr = new Date().toISOString().split('T')[0];
      // This will be handled by the calendar component refresh
      
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error('Error al agendar la cita. Por favor intenta nuevamente.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Panel del Paciente</h1>
                <p className="text-sm text-gray-500">Busca y agenda tu cita médica</p>
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
          {/* Search Section */}
          <Card className="p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Buscar Doctor</h2>
            
            <div className="space-y-4">
              <div className="flex space-x-4">
                <Button
                  variant={searchType === 'specialty' ? 'default' : 'outline'}
                  onClick={() => setSearchType('specialty')}
                  className="flex-1"
                >
                  Buscar por Especialidad
                </Button>
                <Button
                  variant={searchType === 'doctor' ? 'default' : 'outline'}
                  onClick={() => setSearchType('doctor')}
                  className="flex-1"
                >
                  Buscar por Nombre
                </Button>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder={searchType === 'specialty' ? 'Ej: Cardiología, Pediatría...' : 'Ej: Dr. García...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 py-3 text-lg"
                />
              </div>
            </div>
          </Card>

          {/* Doctors Grid */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Cargando doctores...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredDoctors.map((doctor) => (
                <Card 
                  key={doctor.id} 
                  className={`p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    selectedDoctor?.id === doctor.id ? 'ring-2 ring-green-500 bg-green-50' : ''
                  }`}
                  onClick={() => setSelectedDoctor(doctor)}
                >
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-gray-200">
                      <img 
                        src={doctor.avatar_url || `https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face`} 
                        alt={`Dr. ${doctor.first_name} ${doctor.last_name}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Dr. {doctor.first_name} {doctor.last_name}
                      </h3>
                      <p className="text-green-600 font-medium">{doctor.specialty}</p>
                      {doctor.years_experience && (
                        <p className="text-sm text-gray-500">
                          {doctor.years_experience} años de experiencia
                        </p>
                      )}
                      {doctor.consultation_fee && (
                        <p className="text-sm text-blue-600 font-medium">
                          ${doctor.consultation_fee.toLocaleString()} COP
                        </p>
                      )}
                    </div>
                    
                    {doctor.languages && doctor.languages.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-1">
                        {doctor.languages.map((lang, i) => (
                          <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {lang}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Appointment Booking */}
          {selectedDoctor && (
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Agendar cita con Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}
              </h3>
              
              {selectedDoctor.bio && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">Acerca del doctor:</h5>
                  <p className="text-sm text-gray-700">{selectedDoctor.bio}</p>
                </div>
              )}
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Horarios disponibles:</h4>
                  <CustomCalendar 
                    viewMode="patient" 
                    onSlotSelect={handleSlotSelect}
                    doctorId={selectedDoctor.id}
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h5 className="font-medium text-blue-900 mb-2">Información del doctor:</h5>
                    <div className="space-y-2 text-sm text-blue-800">
                      <p><strong>Doctor:</strong> Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}</p>
                      <p><strong>Especialidad:</strong> {selectedDoctor.specialty}</p>
                      {selectedDoctor.years_experience && (
                        <p><strong>Experiencia:</strong> {selectedDoctor.years_experience} años</p>
                      )}
                      {selectedDoctor.consultation_fee && (
                        <p><strong>Tarifa:</strong> ${selectedDoctor.consultation_fee.toLocaleString()} COP</p>
                      )}
                      {selectedDoctor.education && (
                        <p><strong>Educación:</strong> {selectedDoctor.education}</p>
                      )}
                    </div>
                  </div>
                  
                  {selectedSlot && (
                    <div className="p-3 bg-green-50 rounded-lg mb-4">
                      <p className="text-sm text-green-800">
                        <strong>Horario seleccionado:</strong> {selectedSlot.startTime} - {selectedSlot.endTime}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Duración: 60 minutos
                      </p>
                    </div>
                  )}
                  
                  <Button
                    onClick={handleBookAppointment}
                    disabled={!selectedSlot}
                    className="w-full bg-green-600 hover:bg-green-700 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    {selectedSlot ? 'Confirmar Cita' : 'Selecciona un horario'}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Empty State */}
          {filteredDoctors.length === 0 && searchTerm && (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron resultados</h3>
              <p className="text-gray-600">
                Intenta con otro término de búsqueda o revisa la ortografía.
              </p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default PatientDashboard;
