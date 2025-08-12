-- Функция для получения статистики чатов
-- Выполнить в Supabase SQL Editor

CREATE OR REPLACE FUNCTION get_chat_stats()
RETURNS TABLE (
  total_chats BIGINT,
  open_chats BIGINT,
  closed_chats BIGINT,
  pending_chats BIGINT,
  total_messages BIGINT,
  unread_messages BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM chats) as total_chats,
    (SELECT COUNT(*) FROM chats WHERE status = 'open') as open_chats,
    (SELECT COUNT(*) FROM chats WHERE status = 'closed') as closed_chats,
    (SELECT COUNT(*) FROM chats WHERE status = 'pending') as pending_chats,
    (SELECT COUNT(*) FROM messages) as total_messages,
    (SELECT COUNT(*) FROM messages WHERE is_read = false) as unread_messages;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Комментарий к функции
COMMENT ON FUNCTION get_chat_stats() IS 'Возвращает статистику по чатам и сообщениям для админ-панели'; 