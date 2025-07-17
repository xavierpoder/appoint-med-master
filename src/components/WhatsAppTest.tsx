import React, { useState } from 'react';
import { Button } from './ui/button';
import { supabase } from '@/integrations/supabase/client';

export const WhatsAppTest = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const sendTestNotification = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp-notification', {
        body: {
          type: 'confirmation',
          appointmentId: 'test-123',
          patientPhone: '+593999037862',
          doctorPhone: '+593999037862',
          message: 'Mensaje de prueba desde el sandbox de Twilio'
        }
      });

      if (error) {
        console.error('Error:', error);
        setResult({ error: error.message });
      } else {
        console.log('Success:', data);
        setResult(data);
      }
    } catch (error) {
      console.error('Error:', error);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Test WhatsApp Notification</h3>
      <Button 
        onClick={sendTestNotification}
        disabled={loading}
        className="mb-4"
      >
        {loading ? 'Enviando...' : 'Enviar Notificación WhatsApp Test'}
      </Button>
      
      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};