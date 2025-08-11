-- Создание bucket для изображений профиля
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Удаляем все существующие политики для profile-images (если есть)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile images" ON storage.objects;

-- Создаем простую политику для чтения - публичный доступ
CREATE POLICY "profile-images-public-read" ON storage.objects FOR SELECT 
USING (bucket_id = 'profile-images');

-- Создаем политику для загрузки - любой авторизованный пользователь
CREATE POLICY "profile-images-insert" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'profile-images' AND auth.role() = 'authenticated');

-- Создаем политику для обновления - только владелец файла
CREATE POLICY "profile-images-update" ON storage.objects FOR UPDATE 
USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Создаем политику для удаления - только владелец файла
CREATE POLICY "profile-images-delete" ON storage.objects FOR DELETE 
USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Добавление колонки image_url в таблицу profiles (если её нет)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Проверяем, что bucket создался
SELECT * FROM storage.buckets WHERE id = 'profile-images'; 