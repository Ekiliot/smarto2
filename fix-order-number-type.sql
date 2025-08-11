-- Исправление типа поля order_number с INTEGER на VARCHAR

-- 1. Изменяем тип поля order_number на VARCHAR(25)
ALTER TABLE orders ALTER COLUMN order_number TYPE VARCHAR(25);

-- 2. Создаем правильную функцию generate_order_number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS VARCHAR(25) AS $$
DECLARE
  order_num VARCHAR(25);
  counter INTEGER;
BEGIN
  -- Получаем количество заказов за сегодня + 1
  SELECT COUNT(*) + 1
  INTO counter
  FROM orders
  WHERE DATE(created_at) = CURRENT_DATE;
  
  -- Формируем номер заказа: SMARTO-YYYYMMDD-XXXXX
  order_num := 'SMARTO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 5, '0');
  
  RETURN order_num;
END;
$$ LANGUAGE plpgsql; 