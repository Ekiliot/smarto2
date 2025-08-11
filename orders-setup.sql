-- Создание таблицы orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number VARCHAR(20) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  total_amount DECIMAL(10,2) NOT NULL,
  shipping_address JSONB NOT NULL,
  contact_info JSONB NOT NULL,
  payment_method VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы order_items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индексов для производительности
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создание триггера для updated_at
DROP TRIGGER IF EXISTS trigger_update_orders_updated_at ON orders;
CREATE TRIGGER trigger_update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

-- Функция для генерации номера заказа
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS VARCHAR(20) AS $$
DECLARE
  order_num VARCHAR(20);
  counter INTEGER;
BEGIN
  -- Получаем текущий счетчик
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 9) AS INTEGER)), 0) + 1
  INTO counter
  FROM orders
  WHERE order_number LIKE 'SMARTO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-%';
  
  -- Формируем номер заказа: SMARTO-YYYYMMDD-XXXXX
  order_num := 'SMARTO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 5, '0');
  
  RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- RLS политики для orders
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Users can view own orders') THEN
    CREATE POLICY "Users can view own orders" ON orders
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Users can insert own orders') THEN
    CREATE POLICY "Users can insert own orders" ON orders
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Admins can view all orders') THEN
    CREATE POLICY "Admins can view all orders" ON orders
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Admins can update all orders') THEN
    CREATE POLICY "Admins can update all orders" ON orders
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
      );
  END IF;
END $$;

-- RLS политики для order_items
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'Users can view own order items') THEN
    CREATE POLICY "Users can view own order items" ON order_items
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM orders 
          WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'Users can insert own order items') THEN
    CREATE POLICY "Users can insert own order items" ON order_items
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM orders 
          WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'Admins can view all order items') THEN
    CREATE POLICY "Admins can view all order items" ON order_items
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
      );
  END IF;
END $$;

-- Включение RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Функция для получения статистики заказов
CREATE OR REPLACE FUNCTION get_orders_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_orders', COUNT(*),
    'pending_orders', COUNT(*) FILTER (WHERE status = 'pending'),
    'confirmed_orders', COUNT(*) FILTER (WHERE status = 'confirmed'),
    'processing_orders', COUNT(*) FILTER (WHERE status = 'processing'),
    'shipped_orders', COUNT(*) FILTER (WHERE status = 'shipped'),
    'delivered_orders', COUNT(*) FILTER (WHERE status = 'delivered'),
    'cancelled_orders', COUNT(*) FILTER (WHERE status = 'cancelled'),
    'total_revenue', COALESCE(SUM(total_amount) FILTER (WHERE status IN ('confirmed', 'processing', 'shipped', 'delivered')), 0)
  ) INTO result
  FROM orders;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 