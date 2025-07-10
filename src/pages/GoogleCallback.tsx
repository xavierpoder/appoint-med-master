import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const GoogleCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to doctor dashboard since we're no longer using Google Calendar
    setTimeout(() => {
      navigate('/doctor');
    }, 1000);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-center">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Redirigiendo...
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600">
            Regresando al panel del doctor...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleCallback;