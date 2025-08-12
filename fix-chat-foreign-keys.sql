-- Исправление внешних ключей для системы чата
-- Выполнить в Supabase SQL Editor

-- 1. Проверяем текущую структуру таблиц
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('chats', 'messages', 'users', 'profiles')
ORDER BY table_name, ordinal_position;

-- 2. Проверяем существующие внешние ключи
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('chats', 'messages');

-- 3. Если таблица chats ссылается на users, но нужно на profiles:
-- Сначала удаляем существующие внешние ключи
ALTER TABLE chats DROP CONSTRAINT IF EXISTS chats_user_id_fkey;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;

-- 4. Создаем правильные внешние ключи на profiles
ALTER TABLE chats 
ADD CONSTRAINT chats_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE messages 
ADD CONSTRAINT messages_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 5. Проверяем что внешние ключи созданы
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('chats', 'messages');

-- 6. Проверяем что данные в chats соответствуют profiles
SELECT 
  c.id as chat_id,
  c.user_id,
  p.email,
  p.first_name,
  p.last_name
FROM chats c
LEFT JOIN profiles p ON c.user_id = p.id
LIMIT 10;

-- 7. Проверяем что данные в messages соответствуют profiles
SELECT 
  m.id as message_id,
  m.sender_id,
  p.email,
  p.first_name,
  p.last_name
FROM messages m
LEFT JOIN profiles p ON m.sender_id = p.id
LIMIT 10;

-- Сообщение об успешном выполнении
SELECT 'Внешние ключи для системы чата исправлены!' as status; 