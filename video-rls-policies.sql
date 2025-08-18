-- Создание bucket и RLS политик для видео товаров

-- 1. Создаем bucket для видео товаров
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-videos',
  'product-videos',
  true,
  52428800, -- 50MB
  ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/mov', 'video/avi', 'video/mkv']
) ON CONFLICT (id) DO NOTHING;

-- 2. Создаем политики для bucket product-videos

-- Политика: Все могут просматривать видео
CREATE POLICY "Anyone can view product videos" ON storage.objects
FOR SELECT USING (bucket_id = 'product-videos');

-- Политика: Только админы могут загружать видео
CREATE POLICY "Admins can upload product videos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-videos' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = TRUE
  )
);

-- Политика: Только админы могут обновлять видео
CREATE POLICY "Admins can update product videos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'product-videos' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = TRUE
  )
);

-- Политика: Только админы могут удалять видео
CREATE POLICY "Admins can delete product videos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product-videos' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = TRUE
  )
);

-- 3. Проверяем что все создалось
SELECT * FROM storage.buckets WHERE id = 'product-videos';

SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%product videos%'; 