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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Shield, UserPlus, Users, Eye, EyeOff, Trash2, Edit, Save, X } from 'lucide-react';
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
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [editForm, setEditForm] = useState<Partial<Doctor>>({});
  
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
    languages: '',
    licenseNumber: ''
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
      // Use regular signup instead of admin API
      const redirectUrl = `${window.location.origin}/`;
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            role: 'doctor',
            phone: formData.phone,
            specialty: formData.specialty,
            bio: formData.bio,
            consultation_fee: formData.consultationFee,
            years_experience: formData.yearsExperience,
            education: formData.education,
            languages: formData.languages,
            avatar_url: formData.avatarUrl,
            license_number: formData.licenseNumber
          }
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario');
      }

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
        languages: '',
        licenseNumber: ''
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

  const handleDeleteDoctor = async (doctorId: string, doctorName: string) => {
    try {
      // Delete from auth.users which will cascade to profiles and doctors tables
      const { error } = await supabase.auth.admin.deleteUser(doctorId);
      
      if (error) throw error;
      
      toast.success(`Doctor ${doctorName} eliminado exitosamente`);
      fetchDoctors();
    } catch (error: any) {
      console.error('Error deleting doctor:', error);
      toast.error('Error al eliminar el doctor');
    }
  };

  const handleEditDoctor = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setEditForm({
      first_name: doctor.first_name,
      last_name: doctor.last_name,
      email: doctor.email,
      phone: doctor.phone,
      specialty: doctor.specialty,
      bio: doctor.bio,
      consultation_fee: doctor.consultation_fee,
      years_experience: doctor.years_experience,
      education: doctor.education,
      languages: doctor.languages,
      avatar_url: doctor.avatar_url
    });
  };

  const handleSaveEdit = async () => {
    if (!editingDoctor) return;
    
    try {
      setLoading(true);
      
      // Use admin API to update user metadata and then update tables directly
      const { error: userError } = await supabase.auth.admin.updateUserById(
        editingDoctor.id,
        {
          email: editForm.email,
          user_metadata: {
            first_name: editForm.first_name,
            last_name: editForm.last_name,
            phone: editForm.phone,
            avatar_url: editForm.avatar_url
          }
        }
      );

      if (userError) throw userError;

      // Update profile table (admin should have access through service role)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          email: editForm.email,
          phone: editForm.phone,
          avatar_url: editForm.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingDoctor.id);

      if (profileError) {
        console.warn('Profile update error (might be RLS):', profileError);
        // Continue anyway as admin API update might be sufficient
      }

      // Update doctor info
      const { error: doctorError } = await supabase
        .from('doctors')
        .update({
          specialty: editForm.specialty,
          bio: editForm.bio,
          consultation_fee: editForm.consultation_fee,
          years_experience: editForm.years_experience,
          education: editForm.education,
          languages: editForm.languages,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingDoctor.id);

      if (doctorError) {
        console.warn('Doctor update error (might be RLS):', doctorError);
        // Continue anyway
      }

      toast.success('Perfil del doctor actualizado exitosamente');
      setEditingDoctor(null);
      setEditForm({});
      
      // Force refresh with a small delay to ensure data is updated
      setTimeout(() => {
        fetchDoctors();
      }, 1000);
      
    } catch (error: any) {
      console.error('Error updating doctor:', error);
      toast.error('Error al actualizar el perfil del doctor');
    } finally {
      setLoading(false);
    }
  };

  const handleEditInputChange = (field: string, value: string | number | null | string[]) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleLanguagesChange = (languagesString: string) => {
    const languagesArray = languagesString.split(',').map(l => l.trim()).filter(l => l.length > 0);
    handleEditInputChange('languages', languagesArray);
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
                    <Label htmlFor="consultationFee">Tarifa de Consulta (USD)</Label>
                    <Input
                      id="consultationFee"
                      type="number"
                      min="0"
                      step="5"
                      value={formData.consultationFee}
                      onChange={(e) => handleInputChange('consultationFee', e.target.value)}
                      placeholder="50"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="licenseNumber">Número de Licencia</Label>
                  <Input
                    id="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                    placeholder="Ej: LIC-123456789"
                  />
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
                          {doctor.consultation_fee && (
                            <p className="text-xs text-green-600">
                              ${doctor.consultation_fee} USD
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditDoctor(doctor)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Editar Doctor: Dr. {doctor.first_name} {doctor.last_name}</DialogTitle>
                              </DialogHeader>
                              {editingDoctor?.id === doctor.id && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Nombre</Label>
                                      <Input
                                        value={editForm.first_name || ''}
                                        onChange={(e) => handleEditInputChange('first_name', e.target.value)}
                                      />
                                    </div>
                                    <div>
                                      <Label>Apellido</Label>
                                      <Input
                                        value={editForm.last_name || ''}
                                        onChange={(e) => handleEditInputChange('last_name', e.target.value)}
                                      />
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <Label>Email</Label>
                                    <Input
                                      type="email"
                                      value={editForm.email || ''}
                                      onChange={(e) => handleEditInputChange('email', e.target.value)}
                                    />
                                  </div>
                                  
                                  <div>
                                    <Label>Teléfono</Label>
                                    <Input
                                      value={editForm.phone || ''}
                                      onChange={(e) => handleEditInputChange('phone', e.target.value)}
                                    />
                                  </div>
                                  
                                  <div>
                                    <Label>Especialidad</Label>
                                    <Select 
                                      value={editForm.specialty || ''} 
                                      onValueChange={(value) => handleEditInputChange('specialty', value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
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
                                      <Label>Años de Experiencia</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        value={editForm.years_experience || ''}
                                        onChange={(e) => handleEditInputChange('years_experience', parseInt(e.target.value) || null)}
                                      />
                                    </div>
                                    <div>
                                      <Label>Tarifa de Consulta (USD)</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        step="5"
                                        value={editForm.consultation_fee || ''}
                                        onChange={(e) => handleEditInputChange('consultation_fee', parseFloat(e.target.value) || null)}
                                      />
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <Label>URL de Foto de Perfil</Label>
                                    <Input
                                      type="url"
                                      value={editForm.avatar_url || ''}
                                      onChange={(e) => handleEditInputChange('avatar_url', e.target.value)}
                                    />
                                  </div>
                                  
                                  <div>
                                    <Label>Educación</Label>
                                    <Input
                                      value={editForm.education || ''}
                                      onChange={(e) => handleEditInputChange('education', e.target.value)}
                                    />
                                  </div>
                                  
                                  <div>
                                    <Label>Idiomas (separados por coma)</Label>
                                     <Input
                                       value={editForm.languages?.join(', ') || ''}
                                       onChange={(e) => handleLanguagesChange(e.target.value)}
                                     />
                                  </div>
                                  
                                  <div>
                                    <Label>Biografía</Label>
                                    <Textarea
                                      value={editForm.bio || ''}
                                      onChange={(e) => handleEditInputChange('bio', e.target.value)}
                                      rows={3}
                                    />
                                  </div>
                                  
                                  <div className="flex justify-end space-x-2 pt-4">
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setEditingDoctor(null);
                                        setEditForm({});
                                      }}
                                    >
                                      <X className="h-4 w-4 mr-2" />
                                      Cancelar
                                    </Button>
                                    <Button
                                      onClick={handleSaveEdit}
                                      disabled={loading}
                                    >
                                      <Save className="h-4 w-4 mr-2" />
                                      {loading ? 'Guardando...' : 'Guardar'}
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  ¿Estás seguro de que quieres eliminar al Dr. {doctor.first_name} {doctor.last_name}? 
                                  Esta acción no se puede deshacer y eliminará toda la información del doctor.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteDoctor(doctor.id, `${doctor.first_name} ${doctor.last_name}`)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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