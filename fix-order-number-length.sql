-- Исправление длины поля order_number
-- Вариант 1: Увеличиваем размер поля до VARCHAR(25)
ALTER TABLE orders ALTER COLUMN order_number TYPE VARCHAR(25);

-- Вариант 2: Более короткий формат номера заказа (если нужно сэкономить место)
-- ALTER TABLE orders ALTER COLUMN order_number TYPE VARCHAR(15);

-- Обновляем функцию generate_order_number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS VARCHAR(25) AS $$
DECLARE
  order_num VARCHAR(25);
  counter INTEGER;
BEGIN
  -- Получаем текущий счетчик
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 9) AS INTEGER)), 0) + 1
  INTO counter
  FROM orders
  WHERE order_number LIKE 'SMARTO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-%';
  
  -- Формируем номер заказа: SMARTO-YYYYMMDD-XXXXX (20 символов)
  order_num := 'SMARTO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 5, '0');
  
  RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Альтернативная функция для более короткого формата (если нужно)
-- CREATE OR REPLACE FUNCTION generate_order_number()
-- RETURNS VARCHAR(15) AS $$
-- DECLARE
--   order_num VARCHAR(15);
--   counter INTEGER;
-- BEGIN
--   -- Получаем текущий счетчик
--   SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 8) AS INTEGER)), 0) + 1
--   INTO counter
--   FROM orders
--   WHERE order_number LIKE 'SM-' || TO_CHAR(NOW(), 'YYMMDD') || '-%';
--   
--   -- Формируем номер заказа: SM-YYMMDD-XXXXX (15 символов)
--   order_num := 'SM-' || TO_CHAR(NOW(), 'YYMMDD') || '-' || LPAD(counter::TEXT, 5, '0');
--   
--   RETURN order_num;
-- END;
-- $$ LANGUAGE plpgsql; 