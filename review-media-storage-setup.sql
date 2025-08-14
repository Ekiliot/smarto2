-- Создание bucket для медиа файлов отзывов
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'review-media',
  'review-media',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/ogg']
)
ON CONFLICT (id) DO NOTHING;

-- RLS политики для bucket
CREATE POLICY "Review media is publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'review-media');

CREATE POLICY "Users can upload review media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'review-media' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own review media" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'review-media' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own review media" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'review-media' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Создание функции для получения публичного URL
CREATE OR REPLACE FUNCTION get_review_media_url(storage_path text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT storage.url('review-media', storage_path);
$$; 