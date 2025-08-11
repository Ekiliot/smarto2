-- Создание таблицы корзины
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Создание индексов для производительности
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_cart_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления updated_at
DROP TRIGGER IF EXISTS trigger_update_cart_items_updated_at ON cart_items;
CREATE TRIGGER trigger_update_cart_items_updated_at
    BEFORE UPDATE ON cart_items
    FOR EACH ROW
    EXECUTE FUNCTION update_cart_items_updated_at();

-- RLS политики для корзины
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Пользователи могут видеть только свои товары в корзине
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cart_items' AND policyname = 'Users can view own cart items') THEN
        CREATE POLICY "Users can view own cart items" ON cart_items
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- Пользователи могут добавлять товары в свою корзину
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cart_items' AND policyname = 'Users can insert own cart items') THEN
        CREATE POLICY "Users can insert own cart items" ON cart_items
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Пользователи могут обновлять свои товары в корзине
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cart_items' AND policyname = 'Users can update own cart items') THEN
        CREATE POLICY "Users can update own cart items" ON cart_items
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Пользователи могут удалять свои товары из корзины
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cart_items' AND policyname = 'Users can delete own cart items') THEN
        CREATE POLICY "Users can delete own cart items" ON cart_items
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Функция для получения количества товаров в корзине пользователя
CREATE OR REPLACE FUNCTION get_cart_items_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN COALESCE((
        SELECT SUM(quantity) 
        FROM cart_items 
        WHERE user_id = user_uuid
    ), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для очистки корзины пользователя
CREATE OR REPLACE FUNCTION clear_user_cart(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    DELETE FROM cart_items WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 