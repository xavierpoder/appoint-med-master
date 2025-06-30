
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Stethoscope, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleProfileClick = () => {
    if (userRole === 'doctor') {
      navigate('/doctor');
    } else if (userRole === 'patient') {
      navigate('/patient');
    }
  };

  return (
    <nav className="bg-white shadow-md border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div 
            className="flex items-center cursor-pointer" 
            onClick={() => navigate('/')}
          >
            <Stethoscope className="h-8 w-8 text-blue-600 mr-2" />
            <span className="text-xl font-bold text-gray-900">
              Clínica Master v1.1
            </span>
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {userRole === 'doctor' ? 'Dr.' : 'Paciente'} {user.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleProfileClick}
              >
                <User className="h-4 w-4 mr-2" />
                Mi Perfil
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
