-- Очистка blob URL'ов из базы данных

-- 1. Очищаем поле images от blob URL'ов
UPDATE products 
SET images = ARRAY[]::TEXT[]
WHERE EXISTS (
  SELECT 1 FROM unnest(images) AS img 
  WHERE img LIKE 'blob:%'
);

-- 2. Очищаем поле image_url если это blob URL
UPDATE products 
SET image_url = ''
WHERE image_url LIKE 'blob:%';

-- 3. Показываем результат
SELECT 
  'Очищено товаров с blob URL в images: ' || 
  (SELECT COUNT(*) FROM products WHERE array_length(images, 1) = 0) as result_1,
  'Очищено товаров с blob URL в image_url: ' || 
  (SELECT COUNT(*) FROM products WHERE image_url = '') as result_2;

-- 4. Показываем текущее состояние
SELECT 
  id,
  name,
  image_url,
  images,
  array_length(images, 1) as images_count
FROM products 
WHERE array_length(images, 1) > 0 OR image_url != ''
ORDER BY created_at DESC
LIMIT 10; 