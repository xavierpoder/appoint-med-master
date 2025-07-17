import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Mail, User, Edit2, Save } from "lucide-react";

const UserSettings = () => {
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone, email')
        .eq('id', user.user.id)
        .single();

      if (error) throw error;
      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile.phone) {
      toast.error('El número de teléfono es requerido para recibir notificaciones');
      return;
    }

    // Validate phone number format
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(profile.phone)) {
      toast.error('Por favor ingresa un número de teléfono válido (ej: +1234567890)');
      return;
    }

    setSaving(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone
        })
        .eq('id', user.user.id);

      if (error) throw error;

      toast.success('Perfil actualizado exitosamente');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Configuración del Perfil
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* WhatsApp Notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Phone className="h-5 w-5 text-green-600" />
            <h3 className="font-medium text-green-900">Notificaciones WhatsApp</h3>
          </div>
          <p className="text-sm text-green-800">
            Configura tu número de teléfono para recibir confirmaciones de citas y recordatorios automáticos 
            por WhatsApp 48h, 24h y 4h antes de tu cita.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">Nombre</Label>
            <Input
              id="first_name"
              value={profile.first_name}
              onChange={(e) => handleChange('first_name', e.target.value)}
              disabled={!isEditing}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="last_name">Apellido</Label>
            <Input
              id="last_name"
              value={profile.last_name}
              onChange={(e) => handleChange('last_name', e.target.value)}
              disabled={!isEditing}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="email"
              type="email"
              value={profile.email}
              disabled={true}
              className="pl-10 bg-gray-50"
            />
          </div>
          <p className="text-xs text-gray-500">El email no se puede cambiar desde aquí</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Número de Teléfono *</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="phone"
              type="tel"
              value={profile.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              disabled={!isEditing}
              placeholder="+1234567890"
              className="pl-10"
            />
          </div>
          <p className="text-xs text-gray-500">
            Incluye el código de país (ej: +1 para Estados Unidos, +52 para México)
          </p>
        </div>

        <div className="flex justify-end gap-2">
          {isEditing ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditing(false);
                  fetchProfile(); // Reset changes
                }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSave}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserSettings;