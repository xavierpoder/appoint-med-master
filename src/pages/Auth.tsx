
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Stethoscope } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const { signUp, signIn, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  // Check if this is a password recovery flow
  const isPasswordRecovery = searchParams.get('type') === 'recovery';

  // User type selection
  const [userType, setUserType] = useState<'doctor' | 'patient' | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'patient'>('patient');
  const [specialty, setSpecialty] = useState('');

  // Password recovery form state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    // Log para debugging
    console.log('Auth component loaded with params:', {
      type: searchParams.get('type'),
      isPasswordRecovery,
      user: user?.id
    });

    // Solo redirigir si el usuario está autenticado Y no estamos en proceso de recuperación
    if (user && !isPasswordRecovery) {
      console.log('Redirecting authenticated user to dashboard');
      navigate('/');
    }
  }, [user, navigate, isPasswordRecovery, searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(loginEmail, loginPassword);
      if (error) {
        toast.error(error.message || 'Error al iniciar sesión');
      } else {
        toast.success('¡Sesión iniciada exitosamente!');
        navigate('/');
      }
    } catch (error) {
      toast.error('Error inesperado al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!loginEmail) {
      toast.error('Por favor, ingresa tu correo electrónico para recuperar la contraseña.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(loginEmail, {
        redirectTo: `${window.location.origin}/auth?type=recovery`,
      });
      if (error) {
        toast.error(error.message || 'Error al enviar el correo de recuperación.');
      } else {
        toast.success('Se ha enviado un correo electrónico con instrucciones para restablecer tu contraseña.');
      }
    } catch (error) {
      toast.error('Error inesperado al recuperar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userData = {
        firstName,
        lastName,
        role: 'patient' as const,
        phone
      };

      const { error } = await signUp(signupEmail, signupPassword, userData);
      
      if (error) {
        toast.error(error.message || 'Error al crear la cuenta');
      } else {
        toast.success('¡Cuenta creada exitosamente! Por favor verifica tu email.');
      }
    } catch (error) {
      toast.error('Error inesperado al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast.error(error.message || 'Error al iniciar sesión con Google');
      }
    } catch (error) {
      toast.error('Error inesperado al iniciar sesión con Google');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting to update password...');
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Password update error:', error);
        toast.error(error.message || 'Error al actualizar la contraseña');
      } else {
        console.log('Password updated successfully');
        toast.success('¡Contraseña actualizada exitosamente!');
        // Pequeña pausa antes de redirigir para que el usuario vea el mensaje
        setTimeout(() => {
          navigate('/');
        }, 1000);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Error inesperado al actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Header */}
      <div className="text-center mb-12 animate-fade-in">
        <div className="flex items-center justify-center mb-6">
          <Stethoscope className="h-16 w-16 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Clínica Master v1.1</h1>
        <p className="text-gray-600 text-lg">Sistema de Gestión de Citas Médicas</p>
      </div>

      {isPasswordRecovery ? (
        // Password Recovery Form
        <div className="w-full max-w-md animate-scale-in">
          <Card>
            <CardHeader>
              <CardTitle>Establecer Nueva Contraseña</CardTitle>
              <CardDescription>
                Ingresa tu nueva contraseña para completar la recuperación.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div>
                  <Input
                    type="password"
                    placeholder="Nueva contraseña (mínimo 6 caracteres)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Confirmar nueva contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-sm text-red-600">Las contraseñas no coinciden</p>
                )}
                <Button type="submit" className="w-full" disabled={loading || (newPassword !== confirmPassword)}>
                  {loading ? 'Actualizando contraseña...' : 'Actualizar Contraseña'}
                </Button>
                <div className="text-center">
                  <Button 
                    type="button" 
                    variant="link" 
                    onClick={() => navigate('/auth')}
                    className="text-sm"
                  >
                    Volver al inicio de sesión
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : userType === null ? (
        // User Type Selection
        <div className="w-full max-w-lg animate-scale-in">
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl">¿Cómo deseas acceder?</CardTitle>
              <CardDescription className="text-base">
                Selecciona tu tipo de usuario para continuar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Patient Button - Destacado */}
              <Button
                onClick={() => setUserType('patient')}
                className="w-full h-20 text-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover-scale"
                size="lg"
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="text-2xl">👥</span>
                  <span className="font-semibold">Soy Paciente</span>
                </div>
              </Button>

              {/* Doctor Button - Secundario */}
              <Button
                onClick={() => setUserType('doctor')}
                variant="outline"
                className="w-full h-16 text-lg border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 hover-scale"
                size="lg"
              >
                <div className="flex items-center gap-3">
                  <Stethoscope className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Soy Doctor</span>
                </div>
              </Button>

              <div className="text-center mt-6">
                <p className="text-sm text-gray-500">
                  Los doctores son registrados por el administrador del sistema
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : userType === 'doctor' ? (
        // Doctor Login Form
        <div className="w-full max-w-md animate-fade-in">
          <Card>
            <CardHeader className="text-center">
              <Button
                variant="ghost"
                className="mb-4 text-sm text-gray-500 hover:text-gray-700"
                onClick={() => setUserType(null)}
              >
                ← Volver a selección
              </Button>
              <CardTitle className="flex items-center justify-center gap-2">
                <Stethoscope className="h-5 w-5 text-blue-600" />
                Acceso para Doctores
              </CardTitle>
              <CardDescription>
                Solo iniciar sesión
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Button
                onClick={handleGoogleSignIn}
                disabled={loading}
                variant="outline"
                className="w-full h-12"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuar con Google
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">O</span>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="Correo electrónico"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Contraseña"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>
                <Button type="submit" className="w-full h-12" disabled={loading}>
                  {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Button>
                <div className="text-center">
                  <a href="#" onClick={handleForgotPassword} className="text-sm text-blue-600 hover:underline">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
              </form>

              <div className="bg-blue-50 p-4 rounded-lg text-sm border-l-4 border-blue-400">
                <p className="text-blue-800">
                  <strong>Nota:</strong> Si no tienes cuenta, contacta al administrador del sistema.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Patient Login/Signup Form
        <div className="w-full max-w-md animate-fade-in">
          <Card>
            <CardHeader className="text-center">
              <Button
                variant="ghost"
                className="mb-4 text-sm text-gray-500 hover:text-gray-700"
                onClick={() => setUserType(null)}
              >
                ← Volver a selección
              </Button>
              <CardTitle className="text-blue-600">Acceso para Pacientes</CardTitle>
              <CardDescription>
                Inicia sesión o crea tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="patient-login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="patient-login">Iniciar Sesión</TabsTrigger>
                  <TabsTrigger value="patient-signup">Registrarse</TabsTrigger>
                </TabsList>

                <TabsContent value="patient-login" className="space-y-6">
                  <Button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    variant="outline"
                    className="w-full h-12"
                  >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continuar con Google
                  </Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">O</span>
                    </div>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Input
                        type="email"
                        placeholder="Correo electrónico"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        className="h-12"
                      />
                    </div>
                    <div>
                      <Input
                        type="password"
                        placeholder="Contraseña"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        className="h-12"
                      />
                    </div>
                    <Button type="submit" className="w-full h-12" disabled={loading}>
                      {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </Button>
                    <div className="text-center">
                      <a href="#" onClick={handleForgotPassword} className="text-sm text-blue-600 hover:underline">
                        ¿Olvidaste tu contraseña?
                      </a>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="patient-signup" className="space-y-6">
                  <Button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    variant="outline"
                    className="w-full h-12"
                  >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Registrarse con Google
                  </Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">O</span>
                    </div>
                  </div>

                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        placeholder="Nombre"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="h-12"
                      />
                      <Input
                        placeholder="Apellido"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className="h-12"
                      />
                    </div>
                    
                    <Input
                      type="email"
                      placeholder="Correo electrónico"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                      className="h-12"
                    />
                    
                    <Input
                      type="tel"
                      placeholder="Número de teléfono"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-12"
                    />
                    
                    <Input
                      type="password"
                      placeholder="Contraseña"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      className="h-12"
                    />

                    <Button type="submit" className="w-full h-12" disabled={loading}>
                      {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Auth;
