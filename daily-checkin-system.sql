-- Система ежедневных отметок с календарем и стрейками

-- 1. Создаем таблицу для ежедневных отметок
CREATE TABLE IF NOT EXISTS daily_checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_date DATE DEFAULT CURRENT_DATE,
  points_earned INTEGER NOT NULL DEFAULT 0,
  is_super_bonus BOOLEAN DEFAULT false, -- каждые 10 дней
  streak_day INTEGER DEFAULT 1, -- номер дня в стрейке
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, checkin_date)
);

-- 2. Добавляем поле текущего стрейка в profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_checkin_date DATE;

-- 3. Создаем индексы
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date ON daily_checkins(user_id, checkin_date);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_streak ON daily_checkins(user_id, streak_day);

-- 4. Настройка RLS
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own checkins" ON daily_checkins;
CREATE POLICY "Users can view their own checkins" ON daily_checkins
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own checkins" ON daily_checkins;
CREATE POLICY "Users can insert their own checkins" ON daily_checkins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all checkins" ON daily_checkins;
CREATE POLICY "Admins can view all checkins" ON daily_checkins
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- 5. Функция для выполнения ежедневной отметки
CREATE OR REPLACE FUNCTION perform_daily_checkin(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  last_checkin DATE;
  user_current_streak INTEGER := 0;
  user_longest_streak INTEGER := 0;
  streak_day INTEGER := 1;
  points_to_award INTEGER;
  is_super_day BOOLEAN := false;
  result JSON;
BEGIN
  -- Проверяем, не отмечался ли пользователь уже сегодня
  IF EXISTS(
    SELECT 1 FROM daily_checkins 
    WHERE user_id = p_user_id AND checkin_date = CURRENT_DATE
  ) THEN
    RETURN JSON_BUILD_OBJECT(
      'success', false,
      'message', 'Вы уже отмечались сегодня!',
      'already_checked', true
    );
  END IF;

  -- Получаем информацию о стрейке пользователя
  SELECT 
    COALESCE(p.current_streak, 0),
    COALESCE(p.longest_streak, 0),
    p.last_checkin_date
  INTO user_current_streak, user_longest_streak, last_checkin
  FROM profiles p
  WHERE p.id = p_user_id;

  -- Рассчитываем новый стрейк
  IF last_checkin IS NULL OR last_checkin < CURRENT_DATE - INTERVAL '1 day' THEN
    -- Если пропустили больше дня - стрейк сбрасывается
    user_current_streak := 1;
    streak_day := 1;
  ELSIF last_checkin = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Продолжаем стрейк
    user_current_streak := user_current_streak + 1;
    streak_day := user_current_streak;
  ELSE
    -- Если отмечались сегодня (не должно происходить из-за проверки выше)
    user_current_streak := user_current_streak;
    streak_day := user_current_streak;
  END IF;

  -- Проверяем, является ли это супер-днем (каждые 10 дней)
  is_super_day := (streak_day % 10 = 0);

  -- Рассчитываем баллы
  IF is_super_day THEN
    -- Супер-день: 5-15 баллов (чаще меньше, реже больше)
    -- Вероятности: 5-7 баллов (50%), 8-10 баллов (30%), 11-15 баллов (20%)
    CASE 
      WHEN RANDOM() < 0.5 THEN points_to_award := 5 + FLOOR(RANDOM() * 3); -- 5-7
      WHEN RANDOM() < 0.8 THEN points_to_award := 8 + FLOOR(RANDOM() * 3); -- 8-10  
      ELSE points_to_award := 11 + FLOOR(RANDOM() * 5); -- 11-15
    END CASE;
  ELSE
    -- Обычный день: 1-3 балла (чаще 1-2, реже 3)
    -- Вероятности: 1 балл (50%), 2 балла (35%), 3 балла (15%)
    CASE 
      WHEN RANDOM() < 0.5 THEN points_to_award := 1;
      WHEN RANDOM() < 0.85 THEN points_to_award := 2;
      ELSE points_to_award := 3;
    END CASE;
  END IF;

  -- Записываем отметку
  INSERT INTO daily_checkins (
    user_id,
    checkin_date,
    points_earned,
    is_super_bonus,
    streak_day
  ) VALUES (
    p_user_id,
    CURRENT_DATE,
    points_to_award,
    is_super_day,
    streak_day
  );

  -- Начисляем баллы
  INSERT INTO loyalty_transactions (
    user_id,
    points_change,
    reason
  ) VALUES (
    p_user_id,
    points_to_award,
    CASE 
      WHEN is_super_day THEN 'Супер отметка дня (день ' || streak_day || ')'
      ELSE 'Ежедневная отметка (день ' || streak_day || ')'
    END
  );

  -- Обновляем баланс и стрейк пользователя
  UPDATE profiles 
  SET 
    loyalty_points = loyalty_points + points_to_award,
    current_streak = user_current_streak,
    longest_streak = GREATEST(longest_streak, user_current_streak),
    last_checkin_date = CURRENT_DATE
  WHERE id = p_user_id;

  -- Формируем результат
  result := JSON_BUILD_OBJECT(
    'success', true,
    'points_earned', points_to_award,
    'is_super_day', is_super_day,
    'current_streak', user_current_streak,
    'longest_streak', GREATEST(user_longest_streak, user_current_streak),
    'message', CASE 
      WHEN is_super_day THEN 'Супер отметка! Стрейк ' || user_current_streak || ' дней!'
      ELSE 'Отметка засчитана! Стрейк ' || user_current_streak || ' дней!'
    END
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 6. Функция для получения календаря отметок пользователя
CREATE OR REPLACE FUNCTION get_user_checkin_calendar(
  p_user_id UUID,
  p_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
  p_month INTEGER DEFAULT EXTRACT(MONTH FROM NOW())
)
RETURNS JSON AS $$
DECLARE
  checkins_data JSON;
  user_streak INTEGER := 0;
  user_longest_streak INTEGER := 0;
BEGIN
  -- Получаем стрейк пользователя
  SELECT 
    COALESCE(p.current_streak, 0),
    COALESCE(p.longest_streak, 0)
  INTO user_streak, user_longest_streak
  FROM profiles p
  WHERE p.id = p_user_id;

  -- Получаем отметки за указанный месяц
  SELECT JSON_AGG(
    JSON_BUILD_OBJECT(
      'date', checkin_date,
      'points_earned', points_earned,
      'is_super_bonus', is_super_bonus,
      'streak_day', streak_day
    )
  )
  INTO checkins_data
  FROM (
    SELECT 
      checkin_date,
      points_earned,
      is_super_bonus,
      streak_day
    FROM daily_checkins
    WHERE user_id = p_user_id
      AND EXTRACT(YEAR FROM checkin_date) = p_year
      AND EXTRACT(MONTH FROM checkin_date) = p_month
    ORDER BY checkin_date
  ) sorted_checkins;

  RETURN JSON_BUILD_OBJECT(
    'checkins', COALESCE(checkins_data, '[]'::JSON),
    'current_streak', user_streak,
    'longest_streak', user_longest_streak,
    'year', p_year,
    'month', p_month
  );
END;
$$ LANGUAGE plpgsql;

-- 7. Функция для проверки, можно ли отметиться сегодня
CREATE OR REPLACE FUNCTION can_checkin_today(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  already_checked BOOLEAN := false;
  last_checkin DATE;
  user_current_streak INTEGER := 0;
  next_is_super BOOLEAN := false;
BEGIN
  -- Проверяем, отмечался ли сегодня
  SELECT EXISTS(
    SELECT 1 FROM daily_checkins 
    WHERE user_id = p_user_id AND checkin_date = CURRENT_DATE
  ) INTO already_checked;

  -- Получаем информацию о стрейке
  SELECT 
    COALESCE(p.current_streak, 0),
    p.last_checkin_date
  INTO user_current_streak, last_checkin
  FROM profiles p
  WHERE p.id = p_user_id;

  -- Проверяем, будет ли следующая отметка супер-днем
  IF last_checkin = CURRENT_DATE - INTERVAL '1 day' THEN
    next_is_super := ((user_current_streak + 1) % 10 = 0);
  ELSIF last_checkin IS NULL OR last_checkin < CURRENT_DATE - INTERVAL '1 day' THEN
    next_is_super := false; -- стрейк сбросится, следующий будет 1-й день
  END IF;

  RETURN JSON_BUILD_OBJECT(
    'can_checkin', NOT already_checked,
    'already_checked', already_checked,
    'current_streak', user_current_streak,
    'next_is_super', next_is_super,
    'days_until_super', CASE 
      WHEN next_is_super THEN 0
      ELSE CASE 
        WHEN last_checkin = CURRENT_DATE - INTERVAL '1 day' THEN 10 - ((user_current_streak + 1) % 10)
        ELSE 10 -- если стрейк сбросится, до супер-дня 10 дней
      END
    END
  );
END;
$$ LANGUAGE plpgsql;

-- 8. Удаляем старые задания, связанные с ежедневным входом
DELETE FROM loyalty_tasks WHERE task_name IN ('daily_login', 'add_5_items_to_cart', 'share_product', 'complete_all_daily');
DELETE FROM user_task_completions WHERE task_id IN (SELECT id FROM loyalty_tasks WHERE task_name IN ('daily_login', 'add_5_items_to_cart', 'share_product', 'complete_all_daily'));

-- 9. Создаем новые настройки для ежедневных отметок
INSERT INTO loyalty_settings (setting_name, setting_value) VALUES
('daily_checkin_min_points', '1'), -- минимум баллов за обычную отметку
('daily_checkin_max_points', '3'), -- максимум баллов за обычную отметку
('super_checkin_min_points', '5'), -- минимум баллов за супер отметку
('super_checkin_max_points', '15'), -- максимум баллов за супер отметку
('super_checkin_interval', '10') -- каждые N дней супер отметка
ON CONFLICT (setting_name) DO UPDATE SET setting_value = EXCLUDED.setting_value; 