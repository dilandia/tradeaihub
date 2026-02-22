-- Email report preferences on profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_reports_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_report_frequency TEXT DEFAULT 'weekly',
  ADD COLUMN IF NOT EXISTS email_reports_last_sent TIMESTAMPTZ DEFAULT NULL;

-- Constraint for valid frequency values
ALTER TABLE public.profiles
  ADD CONSTRAINT chk_email_report_frequency
  CHECK (email_report_frequency IN ('weekly', 'monthly'));
