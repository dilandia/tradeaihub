-- Migration: Add attachment support to ticket replies
-- Date: 2026-02-27

-- Add attachment_url column to support_ticket_replies
ALTER TABLE support_ticket_replies ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- Create bucket for ticket attachments (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-attachments', 'ticket-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: Authenticated users can upload to ticket-attachments bucket
CREATE POLICY "Authenticated users can upload ticket attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'ticket-attachments');

-- RLS: Public read for ticket attachments
CREATE POLICY "Public read for ticket attachments"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'ticket-attachments');

-- RLS: Users can delete their own uploads
CREATE POLICY "Users can delete own ticket attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'ticket-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);
