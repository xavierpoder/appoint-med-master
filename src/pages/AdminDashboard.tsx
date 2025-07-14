import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Shield, UserPlus, Users, Eye, EyeOff, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  specialty: string;
  bio: string | null;
  consultation_fee: number | null;
  years_experience: number | null;
  education: string | null;
  languages: string[] | null;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form state for new doctor
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    specialty: '',
    bio: '',
    consultationFee: '',
    yearsExperience: '',
    education: '',
    avatarUrl: '',
    languages: ''
  });

  // Redirect if not admin
  useEffect(() => {
    if (userRole && userRole !== 'admin') {
      navigate('/');
    }
  }, [userRole, navigate]);

  // Fetch doctors
  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('doctor_view')
        .select('*')
        .order('first_name');

      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Error al cargar los doctores');
    }
  };

  useEffect(() => {
    if (userRole === 'admin') {
      fetchDoctors();
    }
  }, [userRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
        user_metadata: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: 'doctor',
          phone: formData.phone
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario');
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: 'doctor',
          phone: formData.phone || null,
          avatar_url: formData.avatarUrl || null
        });

      if (profileError) throw profileError;

      // Create doctor record
      const { error: doctorError } = await supabase
        .from('doctors')
        .insert({
          id: authData.user.id,
          specialty: formData.specialty,
          bio: formData.bio || null,
          consultation_fee: formData.consultationFee ? parseFloat(formData.consultationFee) : null,
          years_experience: formData.yearsExperience ? parseInt(formData.yearsExperience) : null,
          education: formData.education || null,
          languages: formData.languages ? formData.languages.split(',').map(l => l.trim()) : null
        });

      if (doctorError) throw doctorError;

      toast.success('Doctor creado exitosamente');
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        specialty: '',
        bio: '',
        consultationFee: '',
        yearsExperience: '',
        education: '',
        avatarUrl: '',
        languages: ''
      });

      // Refresh doctors list
      fetchDoctors();

    } catch (error: any) {
      console.error('Error creating doctor:', error);
      toast.error(error.message || 'Error al crear el doctor');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600">No tienes permisos para acceder a esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Panel de Administrador</h1>
                <p className="text-sm text-gray-500">Gestión de doctores del sistema</p>
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
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form to create new doctor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5" />
                <span>Registrar Nuevo Doctor</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Nombre</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Apellido</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-auto p-1"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+57 300 123 4567"
                  />
                </div>

                <div>
                  <Label htmlFor="specialty">Especialidad</Label>
                  <Select onValueChange={(value) => handleInputChange('specialty', value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar especialidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cardiología">Cardiología</SelectItem>
                      <SelectItem value="Pediatría">Pediatría</SelectItem>
                      <SelectItem value="Dermatología">Dermatología</SelectItem>
                      <SelectItem value="Medicina General">Medicina General</SelectItem>
                      <SelectItem value="Ginecología">Ginecología</SelectItem>
                      <SelectItem value="Neurología">Neurología</SelectItem>
                      <SelectItem value="Psiquiatría">Psiquiatría</SelectItem>
                      <SelectItem value="Oftalmología">Oftalmología</SelectItem>
                      <SelectItem value="Ortopedia">Ortopedia</SelectItem>
                      <SelectItem value="Urología">Urología</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="yearsExperience">Años de Experiencia</Label>
                    <Input
                      id="yearsExperience"
                      type="number"
                      min="0"
                      value={formData.yearsExperience}
                      onChange={(e) => handleInputChange('yearsExperience', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="consultationFee">Tarifa de Consulta (COP)</Label>
                    <Input
                      id="consultationFee"
                      type="number"
                      min="0"
                      step="1000"
                      value={formData.consultationFee}
                      onChange={(e) => handleInputChange('consultationFee', e.target.value)}
                      placeholder="150000"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="avatarUrl">URL de Foto de Perfil</Label>
                  <Input
                    id="avatarUrl"
                    type="url"
                    value={formData.avatarUrl}
                    onChange={(e) => handleInputChange('avatarUrl', e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>

                <div>
                  <Label htmlFor="education">Educación</Label>
                  <Input
                    id="education"
                    value={formData.education}
                    onChange={(e) => handleInputChange('education', e.target.value)}
                    placeholder="Universidad - Especialización"
                  />
                </div>

                <div>
                  <Label htmlFor="languages">Idiomas (separados por coma)</Label>
                  <Input
                    id="languages"
                    value={formData.languages}
                    onChange={(e) => handleInputChange('languages', e.target.value)}
                    placeholder="Español, Inglés, Francés"
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Biografía</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={4}
                    placeholder="Descripción profesional del doctor..."
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? 'Creando...' : 'Crear Doctor'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Doctors list */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Doctores Registrados ({doctors.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {doctors.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No hay doctores registrados</p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto space-y-3">
                    {doctors.map((doctor) => (
                      <div key={doctor.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                        <Avatar>
                          <AvatarImage src={doctor.avatar_url || undefined} />
                          <AvatarFallback>
                            {doctor.first_name[0]}{doctor.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">
                            Dr. {doctor.first_name} {doctor.last_name}
                          </p>
                          <p className="text-sm text-blue-600">{doctor.specialty}</p>
                          <p className="text-xs text-gray-500">{doctor.email}</p>
                          {doctor.years_experience && (
                            <p className="text-xs text-gray-500">
                              {doctor.years_experience} años de experiencia
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;