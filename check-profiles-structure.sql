-- Скрипт для проверки структуры таблицы profiles
-- Выполнить в Supabase SQL Editor

-- Проверяем структуру таблицы profiles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Проверяем данные в таблице profiles
SELECT 
    id,
    email,
    first_name,
    last_name,
    is_admin,
    created_at,
    updated_at
FROM profiles
LIMIT 5;

-- Проверяем RLS политики для profiles
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Проверяем права доступа к profiles
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'profiles'
ORDER BY grantee, privilege_type; 