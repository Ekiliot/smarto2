-- Добавляем поле video_url в таблицу products
ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Добавляем комментарий к полю
COMMENT ON COLUMN products.video_url IS 'URL видео товара';

-- Создаем bucket для видео товаров (если не существует)
-- Примечание: этот bucket нужно создать вручную в Supabase Dashboard
-- Название: product-videos
-- Публичный: true
-- RLS: включен

-- Обновляем RLS политики для доступа к видео
-- (если нужно ограничить доступ к видео)

-- Проверяем структуру таблицы
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('image_url', 'video_url', 'images');

-- Проверяем существующие записи
SELECT id, name, image_url, video_url, images 
FROM products 
LIMIT 5; 