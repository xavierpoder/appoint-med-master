-- Enable the necessary extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create cron job to send appointment reminders every hour
SELECT cron.schedule(
  'appointment-reminders',
  '0 * * * *', -- Run every hour at minute 0
  $$
  SELECT
    net.http_post(
      url:='https://fezajfdaydxtavjbabpt.supabase.co/functions/v1/send-appointment-reminders',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlemFqZmRheWR4dGF2amJhYnB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMTcxMjQsImV4cCI6MjA2Njg5MzEyNH0.bwHc-duXzsoarqcKx-vJmN8tmJKZ21l4VkXCUzNO_kw"}'::jsonb,
      body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);