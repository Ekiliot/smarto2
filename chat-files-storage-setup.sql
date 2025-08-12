-- Настройка Supabase Storage для файлов чата техподдержки
-- Выполнить в Supabase SQL Editor

-- 1. Создаем bucket для файлов чата
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat_files',
  'chat_files',
  true,
  20971520, -- 20MB (как указано в коде)
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
    'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/mp4', 'audio/aac',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain', 'text/csv', 'text/html'
  ]
) ON CONFLICT (id) DO NOTHING;

-- 2. Политики для chat_files bucket
DO $$
BEGIN
  -- Разрешаем всем пользователям просматривать файлы чата (они публичные)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Anyone can view chat files') THEN
    CREATE POLICY "Anyone can view chat files" ON storage.objects
      FOR SELECT USING (bucket_id = 'chat_files');
  END IF;

  -- Разрешаем авторизованным пользователям загружать файлы в свои чаты
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can upload chat files') THEN
    CREATE POLICY "Users can upload chat files" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'chat_files' AND
        auth.uid() IS NOT NULL AND
        -- Проверяем что пользователь загружает файл в свой чат
        (name LIKE 'user_' || auth.uid()::text || '/%')
      );
  END IF;

  -- Разрешаем пользователям обновлять свои файлы
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can update their chat files') THEN
    CREATE POLICY "Users can update their chat files" ON storage.objects
      FOR UPDATE USING (
        bucket_id = 'chat_files' AND
        auth.uid() IS NOT NULL AND
        (name LIKE 'user_' || auth.uid()::text || '/%')
      );
  END IF;

  -- Разрешаем пользователям удалять свои файлы
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can delete their chat files') THEN
    CREATE POLICY "Users can delete their chat files" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'chat_files' AND
        auth.uid() IS NOT NULL AND
        (name LIKE 'user_' || auth.uid()::text || '/%')
      );
  END IF;

  -- Разрешаем админам управлять всеми файлами чата
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Admins can manage all chat files') THEN
    CREATE POLICY "Admins can manage all chat files" ON storage.objects
      FOR ALL USING (
        bucket_id = 'chat_files' AND
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.is_admin = TRUE
        )
      );
  END IF;
END $$;

-- 3. Создаем функцию для очистки файлов чата при удалении чата
CREATE OR REPLACE FUNCTION cleanup_chat_files()
RETURNS TRIGGER AS $$
BEGIN
  -- Удаляем все файлы чата из storage
  DELETE FROM storage.objects 
  WHERE bucket_id = 'chat_files' 
  AND name LIKE '%/' || OLD.id || '/%';
  
  RETURN OLD;
END;
$$ language 'plpgsql';

-- 4. Создаем триггер для автоматической очистки файлов чата
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'cleanup_chat_files_trigger') THEN
    CREATE TRIGGER cleanup_chat_files_trigger
      AFTER DELETE ON chats
      FOR EACH ROW EXECUTE FUNCTION cleanup_chat_files();
  END IF;
END $$;

-- 5. Создаем функцию для очистки файлов при удалении пользователя
CREATE OR REPLACE FUNCTION cleanup_user_chat_files()
RETURNS TRIGGER AS $$
BEGIN
  -- Удаляем все файлы пользователя из storage
  DELETE FROM storage.objects 
  WHERE bucket_id = 'chat_files' 
  AND name LIKE 'user_' || OLD.id || '/%';
  
  RETURN OLD;
END;
$$ language 'plpgsql';

-- 6. Создаем триггер для автоматической очистки файлов пользователя
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'cleanup_user_chat_files_trigger') THEN
    CREATE TRIGGER cleanup_user_chat_files_trigger
      AFTER DELETE ON profiles
      FOR EACH ROW EXECUTE FUNCTION cleanup_user_chat_files();
  END IF;
END $$;

-- 7. Создаем функцию для получения статистики использования storage
CREATE OR REPLACE FUNCTION get_chat_files_stats()
RETURNS TABLE (
  total_files BIGINT,
  total_size BIGINT,
  users_with_files BIGINT,
  chats_with_files BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_files,
    COALESCE(SUM(metadata->>'size')::BIGINT, 0) as total_size,
    COUNT(DISTINCT SPLIT_PART(name, '/', 2)) as users_with_files,
    COUNT(DISTINCT SPLIT_PART(name, '/', 3)) as chats_with_files
  FROM storage.objects 
  WHERE bucket_id = 'chat_files';
END;
$$ LANGUAGE plpgsql;

-- Сообщение об успешном выполнении
SELECT 'Chat files storage настроен успешно! Bucket chat_files и политики созданы.' as status;

-- Проверяем создание bucket
SELECT 
  id, 
  name, 
  public, 
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'chat_files'; 