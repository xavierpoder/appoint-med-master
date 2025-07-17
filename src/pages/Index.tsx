import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Stethoscope, Users, UserCheck, Calendar, Shield, Clock } from 'lucide-react';
import { WhatsAppTest } from '@/components/WhatsAppTest';
const Index = () => {
  const navigate = useNavigate();
  const {
    user,
    userRole,
    loading
  } = useAuth();

  // Redirect authenticated users to their respective dashboards
  useEffect(() => {
    if (!loading && user && userRole) {
      if (userRole === 'admin') {
        navigate('/admin');
      } else if (userRole === 'doctor') {
        navigate('/doctor');
      } else if (userRole === 'patient') {
        navigate('/patient');
      }
    }
  }, [user, userRole, loading, navigate]);
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>;
  }

  // Show landing page for non-authenticated users
  if (!user) {
    return <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        {/* Hero Section */}
        <div className="container mx-auto px-4 pt-20 pb-16">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <Stethoscope className="h-16 w-16 text-blue-600 mr-4" />
              <div>
                <h1 className="text-5xl font-bold text-gray-900 mb-2">
                  Clínica Master v1.1
                </h1>
                <p className="text-xl text-blue-600 font-medium">
                  Sistema de Gestión de Citas Médicas
                </p>
              </div>
            </div>
            
            <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">Plataforma integral para la gestión eficiente de citas médicas. Simplificamos el proceso de reservas y seguimiento.</p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button size="lg" onClick={() => navigate('/auth')} className="medical-gradient text-white px-8 py-3 text-lg font-medium hover:scale-105 transition-transform">
                <UserCheck className="h-5 w-5 mr-2" />
                Iniciar Sesión
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/auth')} className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3 text-lg font-medium">
                <Users className="h-5 w-5 mr-2" />
                Registrarse
              </Button>
            </div>

            {/* Role Selection Cards */}
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="medical-shadow hover:scale-105 transition-transform cursor-pointer border-2 hover:border-blue-200">
                <CardContent className="p-8 text-center">
                  <Stethoscope className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    Soy Doctor
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Gestiona tu agenda, consulta citas programadas y administra 
                    la información de tus pacientes.
                  </p>
                  <Button onClick={() => navigate('/auth')} className="w-full bg-blue-600 hover:bg-blue-700">
                    Acceso para Doctores
                  </Button>
                </CardContent>
              </Card>

              <Card className="medical-shadow hover:scale-105 transition-transform cursor-pointer border-2 hover:border-green-200">
                <CardContent className="p-8 text-center">
                  <Users className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    Soy Paciente
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Busca especialistas, agenda citas médicas y mantén 
                    un seguimiento de tu historial médico.
                  </p>
                  <Button onClick={() => navigate('/auth')} className="w-full bg-green-600 hover:bg-green-700">
                    Acceso para Pacientes
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Características Principales
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="text-center">
                <Calendar className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Gestión de Citas
                </h3>
                <p className="text-gray-600">
                  Sistema completo para programar, modificar y cancelar citas médicas.
                </p>
              </div>
              <div className="text-center">
                <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Seguridad Total
                </h3>
                <p className="text-gray-600">
                  Protección completa de datos médicos con encriptación avanzada.
                </p>
              </div>
              <div className="text-center">
                <Clock className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Recordatorios
                </h3>
                <p className="text-gray-600">Notificaciones automáticas por WhatsApp, email, llamadas, sms y confirmaciones de citas.</p>
              </div>
            </div>
          </div>
        </div>

        {/* WhatsApp Test Section */}
        <div className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
                Prueba de WhatsApp
              </h2>
              <WhatsAppTest />
            </div>
          </div>
        </div>
      </div>;
  }

  // Default fallback - shouldn't reach here due to useEffect redirect
  return <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Redirigiendo...
        </h2>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </div>;
};
export default Index;