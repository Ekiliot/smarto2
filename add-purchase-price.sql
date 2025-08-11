-- Добавление поля purchase_price к таблице products

-- 1. Добавляем поле purchase_price
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(10,2);

-- 2. Устанавливаем значение по умолчанию для существующих записей
-- (используем price как purchase_price для существующих товаров)
UPDATE products 
SET purchase_price = price 
WHERE purchase_price IS NULL;

-- 3. Делаем поле обязательным
ALTER TABLE products 
ALTER COLUMN purchase_price SET NOT NULL;

-- 4. Добавляем комментарий к полю
COMMENT ON COLUMN products.purchase_price IS 'Закупочная цена товара';

-- Сообщение об успешном выполнении
SELECT 'Поле purchase_price успешно добавлено к таблице products!' as status; 