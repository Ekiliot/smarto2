-- Создание bucket для изображений профиля
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Политика RLS для bucket profile-images - публичный доступ для чтения (если не существует)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Public Access' 
        AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'profile-images');
    END IF;
END $$;

-- Политика для загрузки изображений профиля (только авторизованные пользователи)
DROP POLICY IF EXISTS "Users can upload profile images" ON storage.objects;
CREATE POLICY "Users can upload profile images" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Политика для обновления изображений профиля (только владелец)
DROP POLICY IF EXISTS "Users can update own profile images" ON storage.objects;
CREATE POLICY "Users can update own profile images" ON storage.objects FOR UPDATE 
USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Политика для удаления изображений профиля (только владелец)
DROP POLICY IF EXISTS "Users can delete own profile images" ON storage.objects;
CREATE POLICY "Users can delete own profile images" ON storage.objects FOR DELETE 
USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Добавление колонки image_url в таблицу profiles (если её нет)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS image_url TEXT; 