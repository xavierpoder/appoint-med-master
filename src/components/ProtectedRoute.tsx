
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  component: React.ComponentType;
  allowedRoles?: ('doctor' | 'patient')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  component: Component, 
  allowedRoles 
}) => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return <Component />;
};

export default ProtectedRoute;
