-- =====================================================
-- ПОЛНАЯ НАСТРОЙКА ЗАГРУЗКИ ФОТО ПРОФИЛЯ
-- =====================================================

-- 1. Создание bucket для изображений профиля
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
    'profile-images', 
    'profile-images', 
    true, 
    5242880, -- 5MB лимит
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- 2. Удаляем все существующие политики для profile-images (если есть)
DROP POLICY IF EXISTS "profile-images-public-read" ON storage.objects;
DROP POLICY IF EXISTS "profile-images-insert" ON storage.objects;
DROP POLICY IF EXISTS "profile-images-update" ON storage.objects;
DROP POLICY IF EXISTS "profile-images-delete" ON storage.objects;
DROP POLICY IF EXISTS "profile-images-all" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile images" ON storage.objects;

-- 3. Создаем правильные RLS политики

-- Политика для чтения - публичный доступ ко всем файлам в bucket
CREATE POLICY "profile-images-public-read" ON storage.objects 
FOR SELECT USING (bucket_id = 'profile-images');

-- Политика для загрузки - только авторизованные пользователи могут загружать
CREATE POLICY "profile-images-insert" ON storage.objects 
FOR INSERT WITH CHECK (
    bucket_id = 'profile-images' 
    AND auth.role() = 'authenticated'
);

-- Политика для обновления - только владелец файла может обновлять
CREATE POLICY "profile-images-update" ON storage.objects 
FOR UPDATE USING (
    bucket_id = 'profile-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Политика для удаления - только владелец файла может удалять
CREATE POLICY "profile-images-delete" ON storage.objects 
FOR DELETE USING (
    bucket_id = 'profile-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Добавление колонки image_url в таблицу profiles (если её нет)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 5. Создание индекса для быстрого поиска по image_url
CREATE INDEX IF NOT EXISTS idx_profiles_image_url ON profiles(image_url);

-- 6. Проверяем, что все создалось правильно
SELECT 
    'Bucket created:' as status,
    id, name, public, file_size_limit
FROM storage.buckets 
WHERE id = 'profile-images';

SELECT 
    'Policies created:' as status,
    policyname, cmd, qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE 'profile-images%';

SELECT 
    'Column added:' as status,
    column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'image_url';

-- 7. Тестовая загрузка (опционально - можно удалить)
-- INSERT INTO storage.objects (bucket_id, name, owner, metadata) 
-- VALUES ('profile-images', 'test/test.txt', auth.uid(), '{"test": true}'); 