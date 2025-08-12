-- Скрипт для проверки существующих политик RLS
-- Выполнить в Supabase SQL Editor перед установкой системы чата

-- Проверяем существующие таблицы
SELECT 
    schemaname,
    tablename,
    tableowner,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('users', 'profiles', 'chats', 'messages')
ORDER BY tablename;

-- Проверяем существующие политики для всех таблиц
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
WHERE tablename IN ('users', 'profiles', 'chats', 'messages')
ORDER BY tablename, policyname;

-- Проверяем существующие функции
SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc 
WHERE proname IN ('get_user_active_chat', 'create_user_chat', 'update_chat_last_message')
ORDER BY proname;

-- Проверяем существующие триггеры
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('users', 'profiles', 'chats', 'messages')
ORDER BY event_object_table, trigger_name;

-- Проверяем права доступа к таблицам
SELECT 
    grantee,
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name IN ('users', 'profiles', 'chats', 'messages')
ORDER BY table_name, grantee; 