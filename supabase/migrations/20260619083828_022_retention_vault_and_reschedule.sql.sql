/*
# Store retention invocation secrets in Vault and wire cron to use them

## Background
The earlier cron job referenced `service_role` secret in Vault, but that
secret name was not present. The official Supabase pattern for scheduling
edge functions is to store `project_url` and the publishable (anon) key in
Vault and reference them at run time. The anon key is safe to use here because
the target Edge Function (`send-retention-reminders`) is registered with
`verify_jwt=false`, which means the Supabase gateway only requires a valid
`apikey` header for routing — the anon key satisfies that. No sensitive data
is exposed: the anon key is already present in the client bundle of every
Supabase frontend by design.

## Changes
1. Create Vault secrets:
   - `retention_project_url`    = https://iyxhzisfwcdfhuxuqxso.supabase.co
   - `retention_publishable_key` = the project anon (publishable) key
2. Rewrite the cron schedule to read these secrets at run time and build
   the POST request. The old job (referencing service_role) is dropped first.
3. Re-schedule with the same name and the same `0 * * * *` cron.

This migration is idempotent: re-running it unschedules and recreates the job.
*/

-- 1. Upsert Vault secrets (delete-then-create to keep it idempotent)
DELETE FROM vault.secrets WHERE name IN ('retention_project_url', 'retention_publishable_key');

SELECT vault.create_secret(
  'https://iyxhzisfwcdfhuxuqxso.supabase.co',
  'retention_project_url',
  'Project URL for retention reminders cron'
);

SELECT vault.create_secret(
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5eGh6aXNmd2NkZmh1eHVxeHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNTkwMTEsImV4cCI6MjA5NjkzNTAxMX0.Ht3Q37iGcpBiYgRHGvyAnnVKlgi5qvCc_Ecf73A7bvs',
  'retention_publishable_key',
  'Publishable (anon) key used by the retention cron to invoke the edge function'
);

-- 2. Drop existing job (covers the original service_role-based job and any prior run)
DO $do$
DECLARE
  job_id bigint;
BEGIN
  SELECT jobid INTO job_id FROM cron.job WHERE jobname = 'send_retention_reminders_hourly';
  IF job_id IS NOT NULL THEN
    PERFORM cron.unschedule(job_id);
  END IF;
END $do$;

-- 3. Build the command text with concat() to avoid nested dollar-quoting.
--    The command calls net.http_post, pulling URL and apikey from Vault.
DO $do$
DECLARE
  cmd text;
BEGIN
  cmd := concat(
    'SELECT net.http_post(',
    '  url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = ''retention_project_url'' LIMIT 1) || ''/functions/v1/send-retention-reminders'', ',
    '  headers := jsonb_build_object(',
    '    ''Content-Type'', ''application/json'', ',
    '    ''Authorization'', ''Bearer '' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = ''retention_publishable_key'' LIMIT 1), ',
    '    ''apikey'', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = ''retention_publishable_key'' LIMIT 1) ',
    '  ), ',
    '  body := ''{}''::jsonb ',
    ');'
  );

  PERFORM cron.schedule(
    'send_retention_reminders_hourly',
    '0 * * * *',
    cmd
  );
END $do$;
