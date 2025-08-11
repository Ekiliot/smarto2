-- Система лояльности: настройка базы данных

-- 1. Добавляем поле loyalty_points в таблицу profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0;

-- 2. Создаем таблицу для истории транзакций баллов
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  points_change INTEGER NOT NULL, -- + для начисления, - для списания
  reason TEXT NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '180 days')
);

-- 3. Создаем таблицу заданий для получения баллов
CREATE TABLE IF NOT EXISTS loyalty_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_name TEXT NOT NULL,
  description TEXT NOT NULL,
  points_reward INTEGER NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('daily', 'once')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Создаем таблицу для отслеживания выполненных заданий
CREATE TABLE IF NOT EXISTS user_task_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES loyalty_tasks(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_completed DATE DEFAULT CURRENT_DATE, -- для ежедневных заданий
  UNIQUE(user_id, task_id, date_completed)
);

-- 5. Создаем таблицу настроек системы лояльности
CREATE TABLE IF NOT EXISTS loyalty_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_name TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Вставляем дефолтные настройки
INSERT INTO loyalty_settings (setting_name, setting_value) VALUES
('points_percentage', '5'), -- 5% от суммы заказа
('max_payment_percentage', '40'), -- максимум 40% оплаты баллами
('points_expiry_days', '180'), -- срок действия баллов
('daily_login_points', '5'), -- баллы за ежедневный вход
('cart_items_points', '10'), -- баллы за добавление товаров в корзину
('share_points', '15'), -- баллы за поделиться товаром
('daily_bonus_points', '20') -- бонус за выполнение всех заданий дня
ON CONFLICT (setting_name) DO NOTHING;

-- 7. Создаем базовые задания
INSERT INTO loyalty_tasks (task_name, description, points_reward, task_type, status) VALUES
('daily_login', 'Ежедневный вход на сайт', 5, 'daily', 'active'),
('add_5_items_to_cart', 'Добавить 5 товаров в корзину за день', 10, 'daily', 'active'),
('share_product', 'Поделиться товаром', 15, 'daily', 'active'),
('complete_all_daily', 'Выполнить все задания дня', 20, 'daily', 'active')
ON CONFLICT DO NOTHING;

-- 8. Создаем индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created_at ON loyalty_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_expires_at ON loyalty_transactions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_task_completions_user_date ON user_task_completions(user_id, date_completed);

-- 9. Настройка RLS (Row Level Security)
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_settings ENABLE ROW LEVEL SECURITY;

-- Политики для loyalty_transactions
DROP POLICY IF EXISTS "Users can view their own loyalty transactions" ON loyalty_transactions;
CREATE POLICY "Users can view their own loyalty transactions" ON loyalty_transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all loyalty transactions" ON loyalty_transactions;
CREATE POLICY "Admins can view all loyalty transactions" ON loyalty_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Политики для loyalty_tasks
DROP POLICY IF EXISTS "Anyone can view active loyalty tasks" ON loyalty_tasks;
CREATE POLICY "Anyone can view active loyalty tasks" ON loyalty_tasks
  FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Admins can manage loyalty tasks" ON loyalty_tasks;
CREATE POLICY "Admins can manage loyalty tasks" ON loyalty_tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Политики для user_task_completions
DROP POLICY IF EXISTS "Users can view their own task completions" ON user_task_completions;
CREATE POLICY "Users can view their own task completions" ON user_task_completions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own task completions" ON user_task_completions;
CREATE POLICY "Users can insert their own task completions" ON user_task_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all task completions" ON user_task_completions;
CREATE POLICY "Admins can view all task completions" ON user_task_completions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Политики для loyalty_settings
DROP POLICY IF EXISTS "Anyone can view loyalty settings" ON loyalty_settings;
CREATE POLICY "Anyone can view loyalty settings" ON loyalty_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can modify loyalty settings" ON loyalty_settings;
CREATE POLICY "Only admins can modify loyalty settings" ON loyalty_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- 10. Функция для начисления баллов за заказ
CREATE OR REPLACE FUNCTION award_loyalty_points_for_order()
RETURNS TRIGGER AS $$
DECLARE
  points_percentage DECIMAL;
  points_to_award INTEGER;
BEGIN
  -- Проверяем, что заказ оплачен и не отменен
  IF NEW.payment_status = 'paid' AND NEW.status NOT IN ('cancelled', 'refunded') THEN
    -- Получаем процент начисления баллов
    SELECT CAST(setting_value AS DECIMAL) INTO points_percentage
    FROM loyalty_settings 
    WHERE setting_name = 'points_percentage';
    
    -- Рассчитываем количество баллов (округляем до целого)
    points_to_award := ROUND(NEW.total_amount * points_percentage / 100);
    
    -- Начисляем баллы
    INSERT INTO loyalty_transactions (
      user_id, 
      points_change, 
      reason, 
      order_id
    ) VALUES (
      NEW.user_id,
      points_to_award,
      'Покупка товара',
      NEW.id
    );
    
    -- Обновляем баланс пользователя
    UPDATE profiles 
    SET loyalty_points = loyalty_points + points_to_award
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Создаем триггер для автоматического начисления баллов
DROP TRIGGER IF EXISTS trigger_award_loyalty_points ON orders;
CREATE TRIGGER trigger_award_loyalty_points
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (OLD.payment_status IS DISTINCT FROM NEW.payment_status OR OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION award_loyalty_points_for_order();

-- 12. Функция для списания баллов при оплате
CREATE OR REPLACE FUNCTION spend_loyalty_points(
  p_user_id UUID,
  p_points_to_spend INTEGER,
  p_order_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  current_points INTEGER;
BEGIN
  -- Получаем текущий баланс баллов
  SELECT loyalty_points INTO current_points
  FROM profiles
  WHERE id = p_user_id;
  
  -- Проверяем, достаточно ли баллов
  IF current_points >= p_points_to_spend THEN
    -- Списываем баллы
    INSERT INTO loyalty_transactions (
      user_id,
      points_change,
      reason,
      order_id
    ) VALUES (
      p_user_id,
      -p_points_to_spend,
      'Оплата заказа баллами',
      p_order_id
    );
    
    -- Обновляем баланс
    UPDATE profiles
    SET loyalty_points = loyalty_points - p_points_to_spend
    WHERE id = p_user_id;
    
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 13. Функция для завершения задания
CREATE OR REPLACE FUNCTION complete_loyalty_task(
  p_user_id UUID,
  p_task_name TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  task_record RECORD;
  already_completed BOOLEAN := FALSE;
BEGIN
  -- Получаем информацию о задании
  SELECT * INTO task_record
  FROM loyalty_tasks
  WHERE task_name = p_task_name AND status = 'active';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Проверяем, выполнено ли уже задание
  IF task_record.task_type = 'daily' THEN
    SELECT EXISTS(
      SELECT 1 FROM user_task_completions
      WHERE user_id = p_user_id 
      AND task_id = task_record.id 
      AND date_completed = CURRENT_DATE
    ) INTO already_completed;
  ELSE
    SELECT EXISTS(
      SELECT 1 FROM user_task_completions
      WHERE user_id = p_user_id 
      AND task_id = task_record.id
    ) INTO already_completed;
  END IF;
  
  IF already_completed THEN
    RETURN FALSE;
  END IF;
  
  -- Отмечаем задание как выполненное
  INSERT INTO user_task_completions (user_id, task_id)
  VALUES (p_user_id, task_record.id);
  
  -- Начисляем баллы
  INSERT INTO loyalty_transactions (
    user_id,
    points_change,
    reason
  ) VALUES (
    p_user_id,
    task_record.points_reward,
    task_record.description
  );
  
  -- Обновляем баланс
  UPDATE profiles
  SET loyalty_points = loyalty_points + task_record.points_reward
  WHERE id = p_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 14. Функция для получения статистики по лояльности
CREATE OR REPLACE FUNCTION get_loyalty_stats()
RETURNS TABLE (
  total_users_with_points BIGINT,
  total_points_awarded BIGINT,
  total_points_spent BIGINT,
  avg_points_per_user DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM profiles WHERE loyalty_points > 0),
    (SELECT COALESCE(SUM(points_change), 0) FROM loyalty_transactions WHERE points_change > 0),
    (SELECT COALESCE(ABS(SUM(points_change)), 0) FROM loyalty_transactions WHERE points_change < 0),
    (SELECT COALESCE(AVG(loyalty_points), 0) FROM profiles WHERE loyalty_points > 0);
END;
$$ LANGUAGE plpgsql;

-- 15. Функция для очистки просроченных баллов (можно запускать периодически)
CREATE OR REPLACE FUNCTION cleanup_expired_points()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER := 0;
  user_record RECORD;
  expired_points INTEGER;
BEGIN
  -- Для каждого пользователя проверяем просроченные баллы
  FOR user_record IN 
    SELECT DISTINCT user_id FROM loyalty_transactions 
    WHERE expires_at < NOW() AND points_change > 0
  LOOP
    -- Считаем просроченные баллы
    SELECT COALESCE(SUM(points_change), 0) INTO expired_points
    FROM loyalty_transactions
    WHERE user_id = user_record.user_id 
    AND expires_at < NOW() 
    AND points_change > 0;
    
    IF expired_points > 0 THEN
      -- Списываем просроченные баллы
      INSERT INTO loyalty_transactions (
        user_id,
        points_change,
        reason
      ) VALUES (
        user_record.user_id,
        -expired_points,
        'Истечение срока действия баллов'
      );
      
      -- Обновляем баланс
      UPDATE profiles
      SET loyalty_points = GREATEST(0, loyalty_points - expired_points)
      WHERE id = user_record.user_id;
      
      expired_count := expired_count + 1;
    END IF;
  END LOOP;
  
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql; 