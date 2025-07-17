// Test script to send WhatsApp notification
const testData = {
  type: 'confirmation',
  appointmentId: 'test-123',
  patientPhone: '+593999037862',
  doctorPhone: '+593999037862',
  message: 'Test message from sandbox'
};

const response = await fetch('https://fezajfdaydxtavjbabpt.supabase.co/functions/v1/send-whatsapp-notification', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlemFqZmRheWR4dGF2amJhYnB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMTcxMjQsImV4cCI6MjA2Njg5MzEyNH0.bwHc-duXzsoarqcKx-vJmN8tmJKZ21l4VkXCUzNO_kw'
  },
  body: JSON.stringify(testData)
});

const result = await response.json();
console.log('Response:', result);