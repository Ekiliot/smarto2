-- Тестовый скрипт для проверки системы чата
-- Выполнить в Supabase SQL Editor после исправления

-- 1. Проверяем что таблицы существуют
SELECT 'Tables check:' as info;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name IN ('profiles', 'chats', 'messages')
ORDER BY table_name;

-- 2. Проверяем структуру таблицы profiles
SELECT 'Profiles structure:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Проверяем данные в profiles
SELECT 'Profiles data:' as info;
SELECT id, email, first_name, last_name, is_admin, created_at
FROM profiles
LIMIT 5;

-- 4. Проверяем внешние ключи
SELECT 'Foreign keys:' as info;
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('chats', 'messages');

-- 5. Проверяем RLS политики
SELECT 'RLS policies:' as info;
SELECT tablename, policyname, cmd, qual
FROM pg_policies 
WHERE tablename IN ('chats', 'messages')
ORDER BY tablename, policyname;

-- 6. Тестируем создание чата (замените USER_ID на реальный ID пользователя)
SELECT 'Testing chat creation:' as info;
-- SELECT create_user_chat('YOUR_USER_ID_HERE', 'Тестовый чат');

-- 7. Проверяем функции
SELECT 'Functions:' as info;
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname IN ('get_user_active_chat', 'create_user_chat', 'update_chat_last_message')
ORDER BY proname; 