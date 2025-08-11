-- Добавление поля stock_quantity к таблице products

-- 1. Добавляем поле stock_quantity
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;

-- 2. Устанавливаем значение по умолчанию для существующих записей
-- (если товар в наличии, устанавливаем количество 10, иначе 0)
UPDATE products 
SET stock_quantity = CASE 
  WHEN in_stock = TRUE THEN 10 
  ELSE 0 
END
WHERE stock_quantity IS NULL;

-- 3. Добавляем комментарий к полю
COMMENT ON COLUMN products.stock_quantity IS 'Количество товара на складе';

-- 4. Создаем индекс для быстрого поиска по количеству
CREATE INDEX IF NOT EXISTS idx_products_stock_quantity ON products(stock_quantity);

-- 5. Создаем функцию для автоматического обновления in_stock на основе stock_quantity
CREATE OR REPLACE FUNCTION update_in_stock_from_quantity()
RETURNS TRIGGER AS $$
BEGIN
  -- Автоматически обновляем in_stock на основе stock_quantity
  NEW.in_stock = (NEW.stock_quantity > 0);
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Создаем триггер для автоматического обновления in_stock
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_in_stock_from_quantity_trigger') THEN
    CREATE TRIGGER update_in_stock_from_quantity_trigger
      BEFORE INSERT OR UPDATE ON products
      FOR EACH ROW EXECUTE FUNCTION update_in_stock_from_quantity();
  END IF;
END $$;

-- Сообщение об успешном выполнении
SELECT 'Поле stock_quantity успешно добавлено к таблице products!' as status; 