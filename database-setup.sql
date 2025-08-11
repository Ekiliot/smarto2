-- Настройка базы данных для Smarto Admin Panel

-- 1. Обновляем таблицу profiles для добавления поля is_admin
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 2. Создаем таблицу categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  product_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Создаем таблицу products
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  purchase_price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  image_url TEXT,
  images TEXT[] DEFAULT '{}',
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  brand TEXT,
  in_stock BOOLEAN DEFAULT TRUE,
  stock_quantity INTEGER DEFAULT 0,
  features TEXT[] DEFAULT '{}',
  specifications JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Включаем Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 5. Политики для profiles (с проверкой существования)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own profile') THEN
    CREATE POLICY "Users can view own profile" ON profiles
      FOR SELECT USING (auth.uid() = id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON profiles
      FOR UPDATE USING (auth.uid() = id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile') THEN
    CREATE POLICY "Users can insert own profile" ON profiles
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- 6. Политики для categories (только админы)
DO $$
BEGIN
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
END $$;

-- 7. Политики для products (админы могут управлять, все могут читать)
DO $$
BEGIN
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

-- 8. Назначаем администратора (замените на ваш email)
-- Сначала нужно найти ID пользователя по email
-- UPDATE profiles 
-- SET is_admin = TRUE 
-- WHERE id = (
--   SELECT id FROM auth.users 
--   WHERE email = 'vasilecaceaun@gmail.com'
-- );

-- 9. Создаем индексы для производительности
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON products(in_stock);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- 10. Создаем функцию для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 11. Создаем триггеры для автоматического обновления updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
    CREATE TRIGGER update_profiles_updated_at 
      BEFORE UPDATE ON profiles 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
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

-- 12. Создаем функцию для подсчета товаров в категории
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

-- 13. Создаем триггер для автоматического обновления счетчика товаров
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_category_product_count_trigger') THEN
    CREATE TRIGGER update_category_product_count_trigger
      AFTER INSERT OR DELETE OR UPDATE ON products
      FOR EACH ROW EXECUTE FUNCTION update_category_product_count();
  END IF;
END $$;

-- 14. Добавляем несколько базовых категорий
INSERT INTO categories (name, description, image_url) VALUES
('Умный дом', 'Устройства для автоматизации дома', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'),
('Электроника', 'Бытовая электроника и гаджеты', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400'),
('Гаджеты', 'Портативные устройства и аксессуары', 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=400'),
('Аксессуары', 'Дополнительные аксессуары для устройств', 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400'),
('Новинки', 'Новые поступления и инновационные товары', 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400')
ON CONFLICT (name) DO NOTHING;

-- Инструкции по назначению администратора:
-- 1. Войдите в Supabase Dashboard
-- 2. Перейдите в SQL Editor
-- 3. Выполните этот запрос (замените email на ваш):
-- UPDATE profiles 
-- SET is_admin = TRUE 
-- WHERE id = (
--   SELECT id FROM auth.users 
--   WHERE email = 'vasilecaceaun@gmail.com'
-- ); 