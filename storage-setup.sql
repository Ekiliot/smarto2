-- Настройка Supabase Storage для изображений товаров и категорий

-- 1. Создаем bucket для изображений товаров
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- 2. Создаем bucket для изображений категорий
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'category-images',
  'category-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- 3. Политики для product-images bucket
-- Разрешаем всем пользователям просматривать изображения товаров
CREATE POLICY "Anyone can view product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

-- Разрешаем только админам загружать изображения товаров
CREATE POLICY "Admins can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = TRUE
    )
  );

-- Разрешаем только админам обновлять изображения товаров
CREATE POLICY "Admins can update product images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'product-images' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = TRUE
    )
  );

-- Разрешаем только админам удалять изображения товаров
CREATE POLICY "Admins can delete product images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = TRUE
    )
  );

-- 4. Политики для category-images bucket
-- Разрешаем всем пользователям просматривать изображения категорий
CREATE POLICY "Anyone can view category images" ON storage.objects
  FOR SELECT USING (bucket_id = 'category-images');

-- Разрешаем только админам загружать изображения категорий
CREATE POLICY "Admins can upload category images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'category-images' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = TRUE
    )
  );

-- Разрешаем только админам обновлять изображения категорий
CREATE POLICY "Admins can update category images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'category-images' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = TRUE
    )
  );

-- Разрешаем только админам удалять изображения категорий
CREATE POLICY "Admins can delete category images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'category-images' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = TRUE
    )
  );

-- 5. Создаем функцию для очистки старых изображений при удалении товара
CREATE OR REPLACE FUNCTION cleanup_product_images()
RETURNS TRIGGER AS $$
BEGIN
  -- Удаляем все изображения товара из storage
  DELETE FROM storage.objects 
  WHERE bucket_id = 'product-images' 
  AND name LIKE 'products/' || OLD.id || '/%';
  
  RETURN OLD;
END;
$$ language 'plpgsql';

-- 6. Создаем триггер для автоматической очистки изображений
CREATE TRIGGER cleanup_product_images_trigger
  AFTER DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION cleanup_product_images();

-- 7. Создаем функцию для очистки изображений категорий
CREATE OR REPLACE FUNCTION cleanup_category_images()
RETURNS TRIGGER AS $$
BEGIN
  -- Удаляем все изображения категории из storage
  DELETE FROM storage.objects 
  WHERE bucket_id = 'category-images' 
  AND name LIKE 'categories/' || OLD.id || '/%';
  
  RETURN OLD;
END;
$$ language 'plpgsql';

-- 8. Создаем триггер для автоматической очистки изображений категорий
CREATE TRIGGER cleanup_category_images_trigger
  AFTER DELETE ON categories
  FOR EACH ROW EXECUTE FUNCTION cleanup_category_images();

-- Сообщение об успешном выполнении
SELECT 'Supabase Storage настроен успешно! Buckets и политики созданы.' as status; 