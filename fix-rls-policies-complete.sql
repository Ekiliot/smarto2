-- =====================================================
-- ПОЛНЫЙ СКРИПТ ДЛЯ ИСПРАВЛЕНИЯ RLS ПОЛИТИК
-- =====================================================

-- 1. Включаем RLS для всех таблиц
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 2. Удаляем все существующие политики (если есть)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile with email" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

DROP POLICY IF EXISTS "Users can view own chats" ON chats;
DROP POLICY IF EXISTS "Users can insert own chats" ON chats;
DROP POLICY IF EXISTS "Users can update own chats" ON chats;
DROP POLICY IF EXISTS "Admins can view all chats" ON chats;
DROP POLICY IF EXISTS "Admins can update all chats" ON chats;

DROP POLICY IF EXISTS "Users can view messages in own chats" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in own chats" ON messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON messages;
DROP POLICY IF EXISTS "Admins can insert messages in any chat" ON messages;

DROP POLICY IF EXISTS "Anyone can view products" ON products;
DROP POLICY IF EXISTS "Only admins can manage products" ON products;
DROP POLICY IF EXISTS "Admins can manage products" ON products;

DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
DROP POLICY IF EXISTS "Only admins can manage categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;

-- 3. Создаем новые правильные политики

-- PROFILES: пользователи видят свои, админы видят все
CREATE POLICY "Users can view own profile, admins can view all" ON profiles
    FOR SELECT USING (
        auth.uid() = id OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Users can update own profile, admins can update all" ON profiles
    FOR UPDATE USING (
        auth.uid() = id OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- CHATS: пользователи видят свои, админы видят все
CREATE POLICY "Users can view own chats, admins can view all" ON chats
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Users can create own chats" ON chats
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own chats, admins can update all" ON chats
    FOR UPDATE USING (
        user_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- MESSAGES: пользователи видят сообщения в своих чатах, админы видят все
CREATE POLICY "Users can view messages in own chats, admins can view all" ON messages
    FOR SELECT USING (
        chat_id IN (SELECT id FROM chats WHERE user_id = auth.uid()) OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Users can send messages in own chats" ON messages
    FOR INSERT WITH CHECK (
        chat_id IN (SELECT id FROM chats WHERE user_id = auth.uid())
    );

-- PRODUCTS: все могут просматривать, только админы могут управлять
CREATE POLICY "Anyone can view products" ON products
    FOR SELECT USING (true);

CREATE POLICY "Only admins can manage products" ON products
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- CATEGORIES: все могут просматривать, только админы могут управлять
CREATE POLICY "Anyone can view categories" ON categories
    FOR SELECT USING (true);

CREATE POLICY "Only admins can manage categories" ON categories
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- LOYALTY_TRANSACTIONS: пользователи видят свои, админы видят все
CREATE POLICY "Users can view own loyalty transactions, admins can view all" ON loyalty_transactions
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Users can create own loyalty transactions" ON loyalty_transactions
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- LOYALTY_TASKS: все могут просматривать, только админы могут управлять
CREATE POLICY "Anyone can view loyalty tasks" ON loyalty_tasks
    FOR SELECT USING (true);

CREATE POLICY "Only admins can manage loyalty tasks" ON loyalty_tasks
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- WISHLIST_ITEMS: пользователи видят свои, админы видят все
CREATE POLICY "Users can view own wishlist items, admins can view all" ON wishlist_items
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Users can manage own wishlist items" ON wishlist_items
    FOR ALL USING (user_id = auth.uid());

-- CART_ITEMS: пользователи видят свои, админы видят все
CREATE POLICY "Users can view own cart items, admins can view all" ON cart_items
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Users can manage own cart items" ON cart_items
    FOR ALL USING (user_id = auth.uid());

-- USER_TASK_COMPLETIONS: пользователи видят свои, админы видят все
CREATE POLICY "Users can view own task completions, admins can view all" ON user_task_completions
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Users can create own task completions" ON user_task_completions
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- DAILY_CHECKINS: пользователи видят свои, админы видят все
CREATE POLICY "Users can view own daily checkins, admins can view all" ON daily_checkins
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Users can create own daily checkins" ON daily_checkins
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- ORDERS: пользователи видят свои, админы видят все
CREATE POLICY "Users can view own orders, admins can view all" ON orders
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Users can create own orders" ON orders
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- ORDER_ITEMS: пользователи видят свои заказы, админы видят все
CREATE POLICY "Users can view own order items, admins can view all" ON order_items
    FOR SELECT USING (
        order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()) OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- 4. Проверяем, что политики созданы
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

-- =====================================================
-- ГОТОВО! ТЕПЕРЬ:
-- - Обычные пользователи видят свои данные
-- - Админы видят все данные
-- - Публичные данные (товары, категории) видны всем
-- ===================================================== 