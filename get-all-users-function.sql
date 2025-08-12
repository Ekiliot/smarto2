-- Функция для получения всех пользователей
-- Выполнить в Supabase SQL Editor

CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  is_admin BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Проверяем, существует ли таблица profiles
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
    -- Если profiles существует, возвращаем данные из неё
    RETURN QUERY
    SELECT 
      p.id,
      COALESCE(p.email, p.email_address) as email,
      COALESCE(p.first_name, p.firstname) as first_name,
      COALESCE(p.last_name, p.lastname) as last_name,
      COALESCE(p.is_admin, p.isAdmin, false) as is_admin,
      p.created_at,
      COALESCE(p.updated_at, p.created_at) as updated_at
    FROM profiles p
    ORDER BY p.created_at DESC;
  ELSE
    -- Если profiles не существует, возвращаем данные из auth.users
    RETURN QUERY
    SELECT 
      au.id,
      au.email,
      (au.raw_user_meta_data->>'first_name')::TEXT as first_name,
      (au.raw_user_meta_data->>'last_name')::TEXT as last_name,
      COALESCE((au.raw_user_meta_data->>'is_admin')::BOOLEAN, false) as is_admin,
      au.created_at,
      COALESCE(au.updated_at, au.created_at) as updated_at
    FROM auth.users au
    ORDER BY au.created_at DESC;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Комментарий к функции
COMMENT ON FUNCTION get_all_users() IS 'Возвращает всех пользователей из profiles или auth.users в зависимости от структуры БД';

-- Даём права на выполнение функции
GRANT EXECUTE ON FUNCTION get_all_users() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_users() TO service_role; 