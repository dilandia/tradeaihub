-- Feedback table for in-app user feedback (bug reports, feature requests, etc.)
CREATE TABLE public.feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('bug', 'feature', 'improvement', 'other')),
  rating integer CHECK (rating >= 1 AND rating <= 5),
  message text NOT NULL,
  page_url text,
  user_agent text,
  status text DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'resolved')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback"
  ON public.feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own feedback"
  ON public.feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_feedback_user ON public.feedback (user_id, created_at DESC);
