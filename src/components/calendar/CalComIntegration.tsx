import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Settings, ExternalLink } from 'lucide-react';

const CalComIntegration = () => {
  const handleConnectCalCom = () => {
    // Redirect to Cal.com for OAuth
    window.open('https://cal.com/settings/organizations', '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Integración Cal.com
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-primary/10 rounded-full">
            <Calendar className="h-8 w-8 text-primary" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold">Conecta con Cal.com</h3>
            <p className="text-muted-foreground">
              Gestiona tus citas y disponibilidad con Cal.com
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={handleConnectCalCom} className="w-full">
              <ExternalLink className="mr-2 h-4 w-4" />
              Configurar en Cal.com
            </Button>
            
            <Button variant="outline" className="w-full">
              <Settings className="mr-2 h-4 w-4" />
              Configurar API
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            <p>Para conectar Cal.com necesitarás:</p>
            <ul className="list-disc list-inside mt-1">
              <li>Cuenta en Cal.com</li>
              <li>API key de Cal.com</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CalComIntegration;