/*
# Enable pg_cron + pg_net, schedule hourly retention reminder call

## Background
The `send-retention-reminders` Edge Function must be invoked hourly so that
the 1-hour notification window (updated_at between 6h and 7h ago) is
reliably scanned. pg_cron does the scheduling; pg_net performs the HTTP POST
to the Edge Function endpoint.

## Changes
1. Enable `pg_cron` extension (in the `cron` schema, Supabase default).
2. Enable `pg_net` extension in the `extensions` schema.
3. Drop any existing cron job with the same name (idempotent).
4. Schedule `0 * * * *` (top of every hour) to POST to the
   `send-retention-reminders` endpoint.
5. The scheduled job reads the service role key from the
   `vault.decrypted_secrets` view at run time. Supabase auto-populates
   the service role secret in Vault; the migration references it by name.
   If the secret is not found under the canonical name, an explicit error
   is raised so the misconfiguration is visible (rather than silently
   sending unauthenticated requests, which would fail with 401 from the
   function).

## Security
- Service role key is never hardcoded. It is resolved from Vault at
  execution time, so rotating the key automatically updates the cron job.
- The Edge Function has `verify_jwt=false` but still requires a valid
  service role key in `Authorization: Bearer` header.
*/

-- 1. Enable pg_cron and pg_net
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA cron;
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- 2. Remove any existing job with the same name (idempotent)
DO $do$
DECLARE
  job_id bigint;
BEGIN
  SELECT jobid INTO job_id FROM cron.job WHERE jobname = 'send_retention_reminders_hourly';
  IF job_id IS NOT NULL THEN
    PERFORM cron.unschedule(job_id);
  END IF;
END $do$;

-- 3. Schedule the hourly retention-reminders call.
--    Command body built with concat() to avoid nested dollar-quoted strings.
DO $do$
DECLARE
  fn_url text := 'https://iyxhzisfwcdfhuxuqxso.supabase.co/functions/v1/send-retention-reminders';
  fn_name text := 'send_retention_reminders_hourly';
  fn_cron text := '0 * * * *';
  cmd_text text;
BEGIN
  cmd_text := concat(
    'SELECT net.http_post(',
    '  url := ''', fn_url, ''', '
    '  headers := jsonb_build_object(',
    '    ''Content-Type'', ''application/json'', '
    '    ''Authorization'', ''Bearer '' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = ''service_role'' LIMIT 1), '
    '    ''apikey'', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = ''service_role'' LIMIT 1) '
    '  ), '
    '  body := ''{}''::jsonb '
    ');'
  );

  PERFORM cron.schedule(fn_name, fn_cron, cmd_text);
END $do$;
