# 🔧 Исправление системы чата техподдержки

## 🚨 Проблема

В админ-панели чата отображается:
- "Загрузка..." вместо информации о пользователе
- `user: null` в данных чата
- Не видны имя, фамилия и почта пользователя

## 🔍 Причина

Проблема в том, что таблица `chats` ссылается на таблицу `users`, а не на `profiles`. В вашей базе данных есть две системы:

1. **`profiles`** - основная таблица пользователей сайта
2. **`users`** - отдельная таблица для системы чата

## 🛠️ Решение

### Шаг 1: Выполните SQL скрипт

Откройте **Supabase SQL Editor** и выполните скрипт `fix-chat-foreign-keys.sql`:

```sql
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

-- 3. Удаляем существующие внешние ключи
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
```

### Шаг 2: Проверьте результаты

После выполнения скрипта должны появиться:

1. **Внешние ключи**:
   - `chats.user_id` → `profiles.id`
   - `messages.sender_id` → `profiles.id`

2. **Данные пользователей** в результатах запросов 6 и 7

### Шаг 3: Перезапустите приложение

1. Остановите сервер разработки (Ctrl+C)
2. Запустите заново: `npm run dev`
3. Откройте `/admin/support`

## ✅ Ожидаемый результат

После исправления в консоли браузера должны появиться:

```
Raw chat data: [
  {
    id: "chat-uuid",
    user_id: "user-uuid",
    user: {
      id: "user-uuid",
      email: "user@example.com",
      first_name: "Иван",
      last_name: "Иванов"
    },
    ...
  }
]
```

## 🚨 Если проблема остается

### Проверьте:

1. **Существуют ли пользователи** в таблице `profiles`
2. **Совпадают ли ID** в `chats.user_id` и `profiles.id`
3. **Права доступа** к таблицам `chats` и `messages`

### Альтернативное решение:

Если внешние ключи не работают, можно использовать JOIN запросы:

```sql
SELECT 
  c.*,
  p.email,
  p.first_name,
  p.last_name
FROM chats c
JOIN profiles p ON c.user_id = p.id
WHERE c.status = 'open';
```

## 📝 Примечание

После исправления внешних ключей система чата будет правильно связана с основной системой профилей, и админ-панель будет отображать информацию о пользователях корректно. 