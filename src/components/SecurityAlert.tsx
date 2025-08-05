import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, ShieldAlert, CheckCircle } from 'lucide-react';

interface SecurityAlertProps {
  type: 'success' | 'warning' | 'info';
  title: string;
  message: string;
  className?: string;
}

const SecurityAlert: React.FC<SecurityAlertProps> = ({ type, title, message, className }) => {
  const icons = {
    success: CheckCircle,
    warning: ShieldAlert,
    info: Shield
  };

  const Icon = icons[type];
  
  return (
    <Alert className={className}>
      <Icon className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
};

export default SecurityAlert;