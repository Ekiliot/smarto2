-- Добавление статуса "refunded" (возврат) для заказов

-- Обновляем тип status в таблице orders
ALTER TABLE orders 
ALTER COLUMN status TYPE TEXT;

-- Удаляем существующее ограничение, если оно есть
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'orders_status_check' 
        AND table_name = 'orders'
    ) THEN
        ALTER TABLE orders DROP CONSTRAINT orders_status_check;
    END IF;
END $$;

-- Добавляем новое ограничение с поддержкой статуса refunded
ALTER TABLE orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'));

-- Комментарий для документации
COMMENT ON COLUMN orders.status IS 'Статус заказа: pending, confirmed, processing, shipped, delivered, cancelled, refunded'; 