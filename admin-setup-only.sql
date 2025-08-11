-- Упрощенная настройка админ панели Smarto
-- Выполните этот скрипт, если у вас уже есть базовая структура

-- 1. Добавляем поле is_admin в profiles (если его нет)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 2. Создаем таблицу categories (если её нет)
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  product_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Создаем таблицу products (если её нет)
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  image_url TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  brand TEXT,
  rating DECIMAL(3,2) DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 0,
  in_stock BOOLEAN DEFAULT TRUE,
  features TEXT[] DEFAULT '{}',
  specifications JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Включаем RLS (если не включен)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 5. Создаем политики только если их нет
DO $$
BEGIN
  -- Политики для categories
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Admins can manage categories') THEN
    CREATE POLICY "Admins can manage categories" ON categories
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.is_admin = TRUE
        )
      );
  END IF;
  
  -- Политики для products
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Anyone can view products') THEN
    CREATE POLICY "Anyone can view products" ON products
      FOR SELECT USING (TRUE);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Admins can manage products') THEN
    CREATE POLICY "Admins can manage products" ON products
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.is_admin = TRUE
        )
      );
  END IF;
END $$;

-- 6. Создаем индексы
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON products(in_stock);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- 7. Создаем функцию для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Создаем триггеры (только если их нет)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_categories_updated_at') THEN
    CREATE TRIGGER update_categories_updated_at 
      BEFORE UPDATE ON categories 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_products_updated_at') THEN
    CREATE TRIGGER update_products_updated_at 
      BEFORE UPDATE ON products 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- 9. Создаем функцию для подсчета товаров в категории
CREATE OR REPLACE FUNCTION update_category_product_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE categories 
    SET product_count = product_count + 1 
    WHERE id = NEW.category_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE categories 
    SET product_count = product_count - 1 
    WHERE id = OLD.category_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.category_id != OLD.category_id THEN
      UPDATE categories 
      SET product_count = product_count - 1 
      WHERE id = OLD.category_id;
      UPDATE categories 
      SET product_count = product_count + 1 
      WHERE id = NEW.category_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- 10. Создаем триггер для подсчета товаров (только если его нет)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_category_product_count_trigger') THEN
    CREATE TRIGGER update_category_product_count_trigger
      AFTER INSERT OR DELETE OR UPDATE ON products
      FOR EACH ROW EXECUTE FUNCTION update_category_product_count();
  END IF;
END $$;

-- 11. Добавляем базовые категории (только если их нет)
INSERT INTO categories (name, description, image_url) VALUES
('Умный дом', 'Устройства для автоматизации дома', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'),
('Электроника', 'Бытовая электроника и гаджеты', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400'),
('Гаджеты', 'Портативные устройства и аксессуары', 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=400'),
('Аксессуары', 'Дополнительные аксессуары для устройств', 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400'),
('Новинки', 'Новые поступления и инновационные товары', 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400')
ON CONFLICT (name) DO NOTHING;

-- 12. Назначение администратора (раскомментируйте и замените email)
-- UPDATE profiles 
-- SET is_admin = TRUE 
-- WHERE id = (
--   SELECT id FROM auth.users 
--   WHERE email = 'vasilecaceaun@gmail.com'
-- );

-- Сообщение об успешном выполнении
SELECT 'Админ панель настроена успешно! Теперь назначьте администратора, раскомментировав последний запрос.' as status; 