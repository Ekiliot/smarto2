-- Создание системы чата с поддержкой для Smarto2 (ИСПРАВЛЕННАЯ ВЕРСИЯ)
-- Выполнить в Supabase SQL Editor

-- Включаем расширение для UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Таблица пользователей (если не существует)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'support')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица чатов
CREATE TABLE IF NOT EXISTS chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'pending')),
    subject TEXT DEFAULT 'Вопрос по заказу',
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица сообщений
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    text TEXT,
    file_url TEXT,
    file_type TEXT,
    file_name TEXT,
    file_size INTEGER,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для оптимизации (если не существуют)
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_status ON chats(status);
CREATE INDEX IF NOT EXISTS idx_chats_last_message_at ON chats(last_message_at);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Функция для обновления времени последнего сообщения в чате
CREATE OR REPLACE FUNCTION update_chat_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chats 
    SET last_message_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.chat_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления времени последнего сообщения
DROP TRIGGER IF EXISTS trigger_update_chat_last_message ON messages;
CREATE TRIGGER trigger_update_chat_last_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_last_message();

-- Функция для проверки активного чата пользователя
CREATE OR REPLACE FUNCTION get_user_active_chat(user_uuid UUID)
RETURNS UUID AS $$
DECLARE
    active_chat_id UUID;
BEGIN
    SELECT id INTO active_chat_id
    FROM chats
    WHERE user_id = user_uuid AND status = 'open'
    ORDER BY created_at DESC
    LIMIT 1;
    
    RETURN active_chat_id;
END;
$$ LANGUAGE plpgsql;

-- Функция для создания нового чата
CREATE OR REPLACE FUNCTION create_user_chat(user_uuid UUID, chat_subject TEXT DEFAULT 'Вопрос по заказу')
RETURNS UUID AS $$
DECLARE
    new_chat_id UUID;
    active_chat_id UUID;
BEGIN
    -- Проверяем, есть ли уже активный чат
    active_chat_id := get_user_active_chat(user_uuid);
    
    IF active_chat_id IS NOT NULL THEN
        RETURN active_chat_id;
    END IF;
    
    -- Создаем новый чат
    INSERT INTO chats (user_id, subject, status)
    VALUES (user_uuid, chat_subject, 'open')
    RETURNING id INTO new_chat_id;
    
    RETURN new_chat_id;
END;
$$ LANGUAGE plpgsql;

-- Включаем RLS (если еще не включен)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- УДАЛЯЕМ существующие политики для таблицы users (если они есть)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view own chats" ON chats;
DROP POLICY IF EXISTS "Users can insert own chats" ON chats;
DROP POLICY IF EXISTS "Users can update own chats" ON chats;
DROP POLICY IF EXISTS "Admins can view all chats" ON chats;
DROP POLICY IF EXISTS "Admins can update all chats" ON chats;
DROP POLICY IF EXISTS "Users can view messages in own chats" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in own chats" ON messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON messages;
DROP POLICY IF EXISTS "Admins can insert messages in any chat" ON messages;

-- Создаем новые политики для пользователей
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Создаем политики для чатов
CREATE POLICY "Users can view own chats" ON chats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chats" ON chats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chats" ON chats
    FOR UPDATE USING (auth.uid() = user_id);

-- Админы видят все чаты
CREATE POLICY "Admins can view all chats" ON chats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'support')
        )
    );

CREATE POLICY "Admins can update all chats" ON chats
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'support')
        )
    );

-- Создаем политики для сообщений
CREATE POLICY "Users can view messages in own chats" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chats 
            WHERE chats.id = messages.chat_id 
            AND chats.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages in own chats" ON messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM chats 
            WHERE chats.id = messages.chat_id 
            AND chats.user_id = auth.uid()
        )
    );

-- Админы видят все сообщения
CREATE POLICY "Admins can view all messages" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'support')
        )
    );

CREATE POLICY "Admins can insert messages in any chat" ON messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'support')
        )
    );

-- Вставка тестовых данных (опционально)
INSERT INTO users (email, role) VALUES 
    ('admin@smarto2.com', 'admin'),
    ('support@smarto2.com', 'support')
ON CONFLICT (email) DO NOTHING;

-- Комментарии к таблицам
COMMENT ON TABLE users IS 'Пользователи системы (клиенты, админы, поддержка)';
COMMENT ON TABLE chats IS 'Чаты с поддержкой';
COMMENT ON TABLE messages IS 'Сообщения в чатах';
COMMENT ON COLUMN chats.subject IS 'Тема чата';
COMMENT ON COLUMN chats.status IS 'Статус: open - открыт, closed - закрыт, pending - ожидает ответа';
COMMENT ON COLUMN messages.file_type IS 'Тип файла: image, video, document, audio';
COMMENT ON COLUMN messages.file_size IS 'Размер файла в байтах';
COMMENT ON COLUMN messages.is_read IS 'Прочитано ли сообщение';

-- Проверяем созданные таблицы
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name IN ('users', 'chats', 'messages')
ORDER BY table_name;

-- Проверяем политики RLS
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
WHERE tablename IN ('users', 'chats', 'messages')
ORDER BY tablename, policyname; 