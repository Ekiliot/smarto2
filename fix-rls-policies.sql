-- Исправление RLS политик для доступа обычных пользователей
-- Выполните этот скрипт в Supabase SQL Editor

-- 1. Исправляем политики для categories - все могут читать, админы могут управлять
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
CREATE POLICY "Anyone can view categories" ON categories
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage categories" ON categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = TRUE
    )
  );

-- 2. Исправляем политики для loyalty_transactions - пользователи могут создавать свои записи
DROP POLICY IF EXISTS "Users can view their own loyalty transactions" ON loyalty_transactions;
CREATE POLICY "Users can view their own loyalty transactions" ON loyalty_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Добавляем политику для INSERT - пользователи могут создавать свои записи
DROP POLICY IF EXISTS "Users can insert their own loyalty transactions" ON loyalty_transactions;
CREATE POLICY "Users can insert their own loyalty transactions" ON loyalty_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Добавляем политику для UPDATE - пользователи могут обновлять свои записи
DROP POLICY IF EXISTS "Users can update their own loyalty transactions" ON loyalty_transactions;
CREATE POLICY "Users can update their own loyalty transactions" ON loyalty_transactions
  FOR UPDATE USING (auth.uid() = user_id);

-- 3. Исправляем политики для daily_checkins - пользователи могут создавать свои записи
DROP POLICY IF EXISTS "Users can view their own checkins" ON daily_checkins;
CREATE POLICY "Users can view their own checkins" ON daily_checkins
  FOR SELECT USING (auth.uid() = user_id);

-- Добавляем политику для INSERT - пользователи могут создавать свои записи
DROP POLICY IF EXISTS "Users can insert their own checkins" ON daily_checkins;
CREATE POLICY "Users can insert their own checkins" ON daily_checkins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Проверяем, что RLS включен для всех таблиц
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;

-- 5. Создаем политику для profiles - пользователи могут читать и обновлять свой профиль
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 6. Создаем политику для cart_items - пользователи могут управлять своей корзиной
DROP POLICY IF EXISTS "Users can manage their own cart" ON cart_items;
CREATE POLICY "Users can manage their own cart" ON cart_items
  FOR ALL USING (auth.uid() = user_id);

-- 7. Создаем политику для wishlist_items - пользователи могут управлять своим вишлистом
DROP POLICY IF EXISTS "Users can manage their own wishlist" ON wishlist_items;
CREATE POLICY "Users can manage their own wishlist" ON wishlist_items
  FOR ALL USING (auth.uid() = user_id);

-- 8. Создаем политику для orders - пользователи могут видеть и создавать свои заказы
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own orders" ON orders;
CREATE POLICY "Users can create their own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 9. Создаем политику для order_items - пользователи могут видеть свои заказы
DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;
CREATE POLICY "Users can view their own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- 10. Проверяем, что все таблицы имеют правильные политики
-- Выводим информацию о текущих политиках
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- Сообщение об успешном выполнении
SELECT 'RLS политики исправлены успешно! Обычные пользователи теперь могут:' as message
UNION ALL
SELECT '- Видеть категории товаров'
UNION ALL
SELECT '- Использовать систему лояльности'
UNION ALL
SELECT '- Отмечать дни в календаре'
UNION ALL
SELECT '- Управлять своим профилем'
UNION ALL
SELECT '- Использовать корзину и вишлист'; 