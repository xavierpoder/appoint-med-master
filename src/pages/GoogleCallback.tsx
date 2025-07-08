import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const GoogleCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleAuthCallback } = useGoogleCalendar();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      setTimeout(() => {
        navigate('/doctor-dashboard');
      }, 3000);
      return;
    }

    if (code) {
      handleAuthCallback(code).finally(() => {
        setTimeout(() => {
          navigate('/doctor-dashboard');
        }, 2000);
      });
    } else {
      console.error('No authorization code received');
      setTimeout(() => {
        navigate('/doctor-dashboard');
      }, 3000);
    }
  }, [searchParams, handleAuthCallback, navigate]);

  const error = searchParams.get('error');
  const code = searchParams.get('code');

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-center">
            {error ? (
              <>
                <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
                Error de Autenticación
              </>
            ) : code ? (
              <>
                <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                Conectando...
              </>
            ) : (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Procesando...
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          {error ? (
            <div className="space-y-2">
              <p className="text-red-600">
                Error al conectar con Google Calendar: {error}
              </p>
              <p className="text-gray-600 text-sm">
                Serás redirigido al dashboard en unos segundos...
              </p>
            </div>
          ) : code ? (
            <div className="space-y-2">
              <p className="text-green-600">
                Procesando la conexión con Google Calendar...
              </p>
              <p className="text-gray-600 text-sm">
                Serás redirigido al dashboard una vez completado.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-gray-600">
                Procesando la respuesta de Google...
              </p>
              <p className="text-gray-600 text-sm">
                Serás redirigido al dashboard en unos segundos...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleCallback;