# 🔧 Исправление RLS политик для системы чата

## 🚨 Проблема

Админ видит только свои чаты, а не все чаты пользователей. Это происходит из-за RLS (Row Level Security) политик, которые ограничивают доступ только к собственным чатам.

## 🔍 Причина

Текущие RLS политики для таблиц `chats` и `messages` не учитывают права администратора. Они позволяют пользователям видеть только свои чаты, даже если у пользователя `is_admin = true`.

## 🛠️ Решение

### Шаг 1: Выполните SQL скрипт

Откройте **Supabase SQL Editor** и выполните скрипт `fix-chat-rls-policies.sql`:

```sql
-- Исправление RLS политик для системы чата
-- Выполнить в Supabase SQL Editor

-- 1. Удаляем существующие политики для чатов
DROP POLICY IF EXISTS "Users can view own chats" ON chats;
DROP POLICY IF EXISTS "Users can insert own chats" ON chats;
DROP POLICY IF EXISTS "Users can update own chats" ON chats;
DROP POLICY IF EXISTS "Admins can view all chats" ON chats;
DROP POLICY IF EXISTS "Admins can update all chats" ON chats;

-- 2. Удаляем существующие политики для сообщений
DROP POLICY IF EXISTS "Users can view messages in own chats" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in own chats" ON messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON messages;
DROP POLICY IF EXISTS "Admins can insert messages in any chat" ON messages;

-- 3. Создаем новые политики для чатов
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

-- 4. Создаем новые политики для сообщений
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

-- Сообщение об успешном выполнении
SELECT 'RLS политики для системы чата исправлены! Админы теперь могут видеть все чаты.' as status;
```

### Шаг 2: Проверьте результаты

После выполнения скрипта должны появиться новые политики:

1. **Для чатов**:
   - `Users can view own chats` - пользователи видят только свои чаты
   - `Admins can view all chats` - админы видят все чаты

2. **Для сообщений**:
   - `Users can view messages in own chats` - пользователи видят сообщения только в своих чатах
   - `Admins can view all messages` - админы видят все сообщения

### Шаг 3: Перезапустите приложение

1. Остановите сервер разработки (Ctrl+C)
2. Запустите заново: `npm run dev`
3. Откройте `/admin/support`

## ✅ Ожидаемый результат

После исправления:

1. **Админ увидит все чаты** пользователей, а не только свои
2. **В консоли браузера** появятся логи с данными всех чатов
3. **Информация о пользователях** будет загружаться для всех чатов

## 🚨 Если проблема остается

### Проверьте:

1. **Выполнен ли SQL скрипт** полностью
2. **Есть ли у вас права администратора** (`is_admin = true` в таблице `profiles`)
3. **Включен ли RLS** для таблиц `chats` и `messages`

### Проверка прав администратора:

```sql
-- Проверьте что у вас is_admin = true
SELECT id, email, is_admin 
FROM profiles 
WHERE id = auth.uid();
```

### Проверка RLS политик:

```sql
-- Проверьте что политики созданы
SELECT 
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('chats', 'messages')
ORDER BY tablename, policyname;
```

## 📝 Примечание

После исправления RLS политик админы смогут видеть все чаты и сообщения, а обычные пользователи - только свои. Это обеспечит безопасность данных и правильную работу системы чата. 