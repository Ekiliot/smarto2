-- Функция для безопасного уменьшения количества товаров на складе
-- Эта функция проверяет наличие товара и уменьшает количество только если его достаточно

CREATE OR REPLACE FUNCTION decrease_stock_quantity(
  product_id UUID,
  decrease_amount INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_stock INTEGER;
  new_stock INTEGER;
BEGIN
  -- Получаем текущее количество товара на складе
  SELECT stock_quantity INTO current_stock
  FROM products
  WHERE id = product_id;
  
  -- Проверяем что товар существует
  IF current_stock IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;
  
  -- Проверяем что на складе достаточно товара
  IF current_stock < decrease_amount THEN
    RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', current_stock, decrease_amount;
  END IF;
  
  -- Вычисляем новое количество
  new_stock := current_stock - decrease_amount;
  
  -- Обновляем количество товара
  UPDATE products
  SET 
    stock_quantity = new_stock,
    updated_at = NOW(),
    in_stock = CASE 
      WHEN new_stock > 0 THEN true 
      ELSE false 
    END
  WHERE id = product_id;
  
  -- Возвращаем новое количество
  RETURN new_stock;
END;
$$;

-- Функция для возврата товаров на склад (при отмене заказа)
CREATE OR REPLACE FUNCTION increase_stock_quantity(
  product_id UUID,
  increase_amount INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_stock INTEGER;
  new_stock INTEGER;
BEGIN
  -- Получаем текущее количество товара на складе
  SELECT stock_quantity INTO current_stock
  FROM products
  WHERE id = product_id;
  
  -- Проверяем что товар существует
  IF current_stock IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;
  
  -- Вычисляем новое количество
  new_stock := current_stock + increase_amount;
  
  -- Обновляем количество товара
  UPDATE products
  SET 
    stock_quantity = new_stock,
    updated_at = NOW(),
    in_stock = true  -- Товар снова в наличии
  WHERE id = product_id;
  
  -- Возвращаем новое количество
  RETURN new_stock;
END;
$$;

-- Комментарии к функциям
COMMENT ON FUNCTION decrease_stock_quantity(UUID, INTEGER) IS 
'Безопасно уменьшает количество товара на складе. Проверяет наличие товара и обновляет статус in_stock.';

COMMENT ON FUNCTION increase_stock_quantity(UUID, INTEGER) IS 
'Возвращает товары на склад. Используется при отмене заказов.';

-- Проверяем что функции создались
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name IN ('decrease_stock_quantity', 'increase_stock_quantity')
ORDER BY routine_name;

-- Тестируем функции (опционально)
-- SELECT decrease_stock_quantity('product-id-here', 1);
-- SELECT increase_stock_quantity('product-id-here', 1); 