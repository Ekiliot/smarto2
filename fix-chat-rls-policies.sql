-- Исправление RLS политик для системы чата
-- Выполнить в Supabase SQL Editor

-- 1. Проверяем текущие RLS политики
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('chats', 'messages', 'profiles')
ORDER BY tablename, policyname;

-- 2. Удаляем существующие политики для чатов
DROP POLICY IF EXISTS "Users can view own chats" ON chats;
DROP POLICY IF EXISTS "Users can insert own chats" ON chats;
DROP POLICY IF EXISTS "Users can update own chats" ON chats;
DROP POLICY IF EXISTS "Admins can view all chats" ON chats;
DROP POLICY IF EXISTS "Admins can update all chats" ON chats;

-- 3. Удаляем существующие политики для сообщений
DROP POLICY IF EXISTS "Users can view messages in own chats" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in own chats" ON messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON messages;
DROP POLICY IF EXISTS "Admins can insert messages in any chat" ON messages;

-- 4. Создаем новые политики для чатов
-- Пользователи видят только свои чаты
CREATE POLICY "Users can view own chats" ON chats
    FOR SELECT USING (auth.uid() = user_id);

-- Пользователи могут создавать только свои чаты
CREATE POLICY "Users can insert own chats" ON chats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Пользователи могут обновлять только свои чаты
CREATE POLICY "Users can update own chats" ON chats
    FOR UPDATE USING (auth.uid() = user_id);

-- АДМИНЫ ВИДЯТ ВСЕ ЧАТЫ
CREATE POLICY "Admins can view all chats" ON chats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = TRUE
        )
    );

-- Админы могут обновлять все чаты
CREATE POLICY "Admins can update all chats" ON chats
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = TRUE
        )
    );

-- 5. Создаем новые политики для сообщений
-- Пользователи видят сообщения только в своих чатах
CREATE POLICY "Users can view messages in own chats" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chats 
            WHERE chats.id = messages.chat_id 
            AND chats.user_id = auth.uid()
        )
    );

-- Пользователи могут отправлять сообщения только в свои чаты
CREATE POLICY "Users can insert messages in own chats" ON messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM chats 
            WHERE chats.id = messages.chat_id 
            AND chats.user_id = auth.uid()
        )
    );

-- АДМИНЫ ВИДЯТ ВСЕ СООБЩЕНИЯ
CREATE POLICY "Admins can view all messages" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = TRUE
        )
    );

-- Админы могут отправлять сообщения в любой чат
CREATE POLICY "Admins can insert messages in any chat" ON messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = TRUE
        )
    );

-- 6. Проверяем что политики созданы
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('chats', 'messages')
ORDER BY tablename, policyname;

-- 7. Проверяем что RLS включен
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('chats', 'messages', 'profiles');

-- 8. Тестируем доступ админа к чатам
-- (выполните этот запрос будучи авторизованным как админ)
SELECT 
  c.id as chat_id,
  c.user_id,
  c.subject,
  c.status,
  c.created_at,
  p.email,
  p.first_name,
  p.last_name,
  p.is_admin
FROM chats c
LEFT JOIN profiles p ON c.user_id = p.id
ORDER BY c.created_at DESC
LIMIT 10;

-- Сообщение об успешном выполнении
SELECT 'RLS политики для системы чата исправлены! Админы теперь могут видеть все чаты.' as status; 