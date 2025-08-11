-- Создание таблицы wishlist_items
CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Создание индексов для производительности
CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_id ON wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_product_id ON wishlist_items(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_created_at ON wishlist_items(created_at);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_wishlist_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Добавление колонки updated_at если её нет
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wishlist_items' AND column_name = 'updated_at') THEN
    ALTER TABLE wishlist_items ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Создание триггера для updated_at
DROP TRIGGER IF EXISTS trigger_update_wishlist_items_updated_at ON wishlist_items;
CREATE TRIGGER trigger_update_wishlist_items_updated_at
  BEFORE UPDATE ON wishlist_items
  FOR EACH ROW
  EXECUTE FUNCTION update_wishlist_items_updated_at();

-- RLS политики для wishlist_items
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wishlist_items' AND policyname = 'Users can view own wishlist items') THEN
    CREATE POLICY "Users can view own wishlist items" ON wishlist_items
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wishlist_items' AND policyname = 'Users can insert own wishlist items') THEN
    CREATE POLICY "Users can insert own wishlist items" ON wishlist_items
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wishlist_items' AND policyname = 'Users can delete own wishlist items') THEN
    CREATE POLICY "Users can delete own wishlist items" ON wishlist_items
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Включение RLS
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

-- Функция для получения количества товаров в вишлисте
CREATE OR REPLACE FUNCTION get_wishlist_items_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM wishlist_items
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для очистки вишлиста пользователя
CREATE OR REPLACE FUNCTION clear_user_wishlist(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM wishlist_items WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 