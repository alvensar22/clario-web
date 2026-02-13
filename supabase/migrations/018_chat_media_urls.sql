-- Add media_urls to chat messages (JSON array of image URLs)
ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS media_urls jsonb DEFAULT '[]'::jsonb;

-- Storage bucket for chat images
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated can upload to chat-images bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-images');

CREATE POLICY "Public can view chat-images bucket"
ON storage.objects
FOR SELECT
USING (bucket_id = 'chat-images');
