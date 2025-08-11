-- Обновление схемы таблицы products

-- 1. Добавляем поле images для множественных изображений
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- 2. Удаляем поля rating и reviews_count
ALTER TABLE products 
DROP COLUMN IF EXISTS rating;

ALTER TABLE products 
DROP COLUMN IF EXISTS reviews_count;

-- 3. Добавляем комментарии к полям
COMMENT ON COLUMN products.price IS 'Цена продажи (видна клиентам)';
COMMENT ON COLUMN products.purchase_price IS 'Закупочная цена (только для админов)';
COMMENT ON COLUMN products.original_price IS 'Старая цена для сравнения (compare-at price)';
COMMENT ON COLUMN products.images IS 'Массив URL дополнительных изображений товара';

-- 4. Создаем функцию для расчета прибыли
CREATE OR REPLACE FUNCTION calculate_profit(price DECIMAL, purchase_price DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  RETURN price - purchase_price;
END;
$$ LANGUAGE plpgsql;

-- 5. Создаем функцию для расчета маржи в процентах
CREATE OR REPLACE FUNCTION calculate_margin_percent(price DECIMAL, purchase_price DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  IF price = 0 THEN
    RETURN 0;
  END IF;
  RETURN ((price - purchase_price) / price) * 100;
END;
$$ LANGUAGE plpgsql;

-- Сообщение об успешном выполнении
SELECT 'Схема таблицы products успешно обновлена!' as status; 