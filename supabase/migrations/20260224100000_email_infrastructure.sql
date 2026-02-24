-- Email Infrastructure Migration
-- Epic: Email Lifecycle Strategy (EML)
-- Story: EML-1

-- 1. user_events: behavioral event tracking for email triggers
CREATE TABLE IF NOT EXISTS public.user_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_events_user_type ON public.user_events(user_id, event_type);
CREATE INDEX IF NOT EXISTS idx_user_events_created ON public.user_events(created_at);

-- 2. email_sends: dedup + tracking of all sent emails
CREATE TABLE IF NOT EXISTS public.email_sends (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  opened_at timestamptz,
  clicked_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  UNIQUE(user_id, email_type)
);

CREATE INDEX IF NOT EXISTS idx_email_sends_user_type ON public.email_sends(user_id, email_type);
CREATE INDEX IF NOT EXISTS idx_email_sends_sent ON public.email_sends(sent_at);

-- 3. email_preferences: user opt-in/out per category (LGPD)
CREATE TABLE IF NOT EXISTS public.email_preferences (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  onboarding boolean DEFAULT true,
  marketing boolean DEFAULT true,
  product_updates boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

-- RLS: user_events — service-role only (no client access)
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

-- RLS: email_sends — service-role only (no client access)
ALTER TABLE public.email_sends ENABLE ROW LEVEL SECURITY;

-- RLS: email_preferences — users can read/update their own row
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own email preferences"
  ON public.email_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own email preferences"
  ON public.email_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own email preferences"
  ON public.email_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Auto-create email_preferences row on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_email_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.email_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only create trigger if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_email_prefs'
  ) THEN
    CREATE TRIGGER on_auth_user_created_email_prefs
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user_email_preferences();
  END IF;
END;
$$;
