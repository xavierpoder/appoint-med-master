
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar, Search, User, Clock } from "lucide-react";
import { toast } from "sonner";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  experience: string;
  rating: number;
  availableSlots: string[];
  image: string;
}

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<'specialty' | 'doctor'>('specialty');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  
  // Mock doctors data
  const doctors: Doctor[] = [
    {
      id: '1',
      name: 'Dr. María González',
      specialty: 'Cardiología',
      experience: '15 años',
      rating: 4.8,
      availableSlots: ['09:00', '10:30', '14:00', '15:30'],
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: '2',
      name: 'Dr. Carlos Ruiz',
      specialty: 'Pediatría',
      experience: '12 años',
      rating: 4.9,
      availableSlots: ['08:30', '11:00', '13:30', '16:00'],
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: '3',
      name: 'Dra. Ana López',
      specialty: 'Dermatología',
      experience: '10 años',
      rating: 4.7,
      availableSlots: ['09:30', '12:00', '14:30', '17:00'],
      image: 'https://images.unsplash.com/photo-1594824475643-71b2bdc4c7f6?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: '4',
      name: 'Dr. Roberto Silva',
      specialty: 'Medicina General',
      experience: '8 años',
      rating: 4.6,
      availableSlots: ['08:00', '10:00', '13:00', '15:00'],
      image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&h=150&fit=crop&crop=face'
    }
  ];

  const filteredDoctors = doctors.filter(doctor => {
    if (!searchTerm) return true;
    
    if (searchType === 'specialty') {
      return doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    } else {
      return doctor.name.toLowerCase().includes(searchTerm.toLowerCase());
    }
  });

  const handleBookAppointment = () => {
    if (!selectedDoctor || !selectedSlot) {
      toast.error("Por favor selecciona un doctor y horario");
      return;
    }

    toast.success(`Cita agendada con ${selectedDoctor.name} a las ${selectedSlot}`);
    setSelectedDoctor(null);
    setSelectedSlot("");
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
                      src={doctor.image} 
                      alt={doctor.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{doctor.name}</h3>
                    <p className="text-green-600 font-medium">{doctor.specialty}</p>
                    <p className="text-sm text-gray-500">{doctor.experience} de experiencia</p>
                  </div>
                  
                  <div className="flex items-center justify-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-sm ${
                          i < Math.floor(doctor.rating) ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                    <span className="text-sm text-gray-600 ml-1">({doctor.rating})</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Appointment Booking */}
          {selectedDoctor && (
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Agendar cita con {selectedDoctor.name}
              </h3>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Horarios disponibles para hoy:</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedDoctor.availableSlots.map((slot) => (
                      <Button
                        key={slot}
                        variant={selectedSlot === slot ? 'default' : 'outline'}
                        onClick={() => setSelectedSlot(slot)}
                        className="flex items-center justify-center space-x-2 p-3"
                      >
                        <Clock className="h-4 w-4" />
                        <span>{slot}</span>
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h5 className="font-medium text-blue-900 mb-2">Detalles de la cita:</h5>
                    <div className="space-y-2 text-sm text-blue-800">
                      <p><strong>Doctor:</strong> {selectedDoctor.name}</p>
                      <p><strong>Especialidad:</strong> {selectedDoctor.specialty}</p>
                      <p><strong>Fecha:</strong> {new Date().toLocaleDateString('es-ES')}</p>
                      {selectedSlot && <p><strong>Hora:</strong> {selectedSlot}</p>}
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleBookAppointment}
                    disabled={!selectedSlot}
                    className="w-full bg-green-600 hover:bg-green-700 py-3 text-lg"
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    Confirmar Cita
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
