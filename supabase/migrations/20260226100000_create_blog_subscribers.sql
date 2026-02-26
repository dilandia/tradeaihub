-- Blog newsletter subscribers table
CREATE TABLE IF NOT EXISTS public.blog_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  locale text DEFAULT 'en',
  subscribed_at timestamptz DEFAULT now(),
  unsubscribed_at timestamptz,
  confirmed boolean DEFAULT false,
  confirmation_token uuid DEFAULT gen_random_uuid()
);

ALTER TABLE public.blog_subscribers ENABLE ROW LEVEL SECURITY;

-- Only service_role can manage subscribers (no public access)
-- No RLS policies = default deny for anon/authenticated
-- service_role bypasses RLS automatically

COMMENT ON TABLE public.blog_subscribers IS 'Blog newsletter subscribers. Managed via service_role only.';
