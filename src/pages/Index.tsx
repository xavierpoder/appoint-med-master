
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { User, Calendar } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  Clínica Master
                </h1>
                <p className="text-sm text-gray-500">v1.1</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Sistema de Gestión de Citas Médicas
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Plataforma integral para doctores y pacientes que facilita la programación, 
              gestión y seguimiento de citas médicas.
            </p>
          </div>

          {/* Role Selection Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Doctor Card */}
            <Card className="p-8 hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-200 group cursor-pointer">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <User className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Soy Doctor</h3>
                  <p className="text-gray-600 mb-6">
                    Gestiona tu agenda, programa citas y administra tus pacientes
                  </p>
                  <ul className="text-sm text-gray-500 space-y-2 mb-6">
                    <li>• Ver agenda diaria</li>
                    <li>• Gestionar citas</li>
                    <li>• Notificaciones automatizadas</li>
                    <li>• Historial de pacientes</li>
                  </ul>
                </div>
                <Button 
                  onClick={() => navigate('/doctor')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold"
                >
                  Acceder como Doctor
                </Button>
              </div>
            </Card>

            {/* Patient Card */}
            <Card className="p-8 hover:shadow-xl transition-all duration-300 border-2 hover:border-green-200 group cursor-pointer">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Calendar className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Soy Paciente</h3>
                  <p className="text-gray-600 mb-6">
                    Busca doctores, programa citas y gestiona tus consultas médicas
                  </p>
                  <ul className="text-sm text-gray-500 space-y-2 mb-6">
                    <li>• Buscar por especialidad</li>
                    <li>• Programar citas</li>
                    <li>• Recordatorios automáticos</li>
                    <li>• Historial médico</li>
                  </ul>
                </div>
                <Button 
                  onClick={() => navigate('/patient')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold"
                >
                  Acceder como Paciente
                </Button>
              </div>
            </Card>
          </div>

          {/* Features Section */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">Características Principales</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Gestión Inteligente</h4>
                <p className="text-gray-600 text-sm">Sistema automatizado de citas con recordatorios</p>
              </div>
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Perfiles Personalizados</h4>
                <p className="text-gray-600 text-sm">Interfaces adaptadas para doctores y pacientes</p>
              </div>
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Notificaciones</h4>
                <p className="text-gray-600 text-sm">Recordatorios automáticos por WhatsApp</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
