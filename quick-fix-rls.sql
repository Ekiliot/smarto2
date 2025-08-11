-- Быстрое исправление основных RLS проблем
-- Выполните этот скрипт в Supabase SQL Editor

-- 1. Категории - все могут читать
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
CREATE POLICY "Anyone can view categories" ON categories FOR SELECT USING (TRUE);
CREATE POLICY "Admins can manage categories" ON categories FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE)
);

-- 2. Лояльность - пользователи могут создавать свои записи
DROP POLICY IF EXISTS "Users can insert their own loyalty transactions" ON loyalty_transactions;
CREATE POLICY "Users can insert their own loyalty transactions" ON loyalty_transactions 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Ежедневные отметки - пользователи могут создавать свои записи
DROP POLICY IF EXISTS "Users can insert their own checkins" ON daily_checkins;
CREATE POLICY "Users can insert their own checkins" ON daily_checkins 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Профили - пользователи могут читать и обновлять свой профиль
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 5. Корзина - пользователи могут управлять своей корзиной
DROP POLICY IF EXISTS "Users can manage their own cart" ON cart_items;
CREATE POLICY "Users can manage their own cart" ON cart_items FOR ALL USING (auth.uid() = user_id);

-- 6. Вишлист - пользователи могут управлять своим вишлистом
DROP POLICY IF EXISTS "Users can manage their own wishlist" ON wishlist_items;
CREATE POLICY "Users can manage their own wishlist" ON wishlist_items FOR ALL USING (auth.uid() = user_id);

SELECT 'Основные RLS проблемы исправлены!' as result; 