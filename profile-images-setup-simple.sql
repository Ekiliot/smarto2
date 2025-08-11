-- Создание bucket для изображений профиля
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Временно отключаем RLS для bucket profile-images
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Или создаем очень простую политику, которая разрешает все
DROP POLICY IF EXISTS "profile-images-all" ON storage.objects;
CREATE POLICY "profile-images-all" ON storage.objects 
FOR ALL USING (bucket_id = 'profile-images');

-- Добавление колонки image_url в таблицу profiles (если её нет)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Проверяем, что bucket создался
SELECT * FROM storage.buckets WHERE id = 'profile-images'; 