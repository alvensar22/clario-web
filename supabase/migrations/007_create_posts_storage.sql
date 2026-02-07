-- Storage bucket for post images
INSERT INTO storage.buckets (id, name, public)
VALUES ('posts', 'posts', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated can upload to posts bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'posts');

CREATE POLICY "Public can view posts bucket"
ON storage.objects
FOR SELECT
USING (bucket_id = 'posts');

CREATE POLICY "Users can update own post files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'posts')
WITH CHECK (bucket_id = 'posts');

CREATE POLICY "Users can delete own post files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'posts');
