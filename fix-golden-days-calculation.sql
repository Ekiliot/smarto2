-- Исправление логики расчета золотых дней
-- Проблема: неправильный расчет days_until_super в функции can_checkin_today

CREATE OR REPLACE FUNCTION can_checkin_today(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  already_checked BOOLEAN := false;
  last_checkin DATE;
  user_current_streak INTEGER := 0;
  next_is_super BOOLEAN := false;
  effective_streak INTEGER := 0;
  days_until_super INTEGER := 0;
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

  -- Рассчитываем эффективный стрейк
  IF last_checkin = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Стрейк продолжается, учитываем сегодняшний день если еще не отмечались
    effective_streak := user_current_streak + (CASE WHEN already_checked THEN 0 ELSE 1 END);
    next_is_super := (effective_streak % 10 = 0);
  ELSIF last_checkin IS NULL OR last_checkin < CURRENT_DATE - INTERVAL '1 day' THEN
    -- Стрейк сбросится, начинаем заново
    effective_streak := 1;
    next_is_super := false;
  ELSE
    -- Уже отмечались сегодня
    effective_streak := user_current_streak;
    next_is_super := false;
  END IF;

  -- Рассчитываем дни до следующего золотого дня
  IF next_is_super THEN
    days_until_super := 0;
  ELSE
    -- Находим следующий кратный 10 день
    days_until_super := 10 - (effective_streak % 10);
    -- Если остаток 0, значит следующий золотой день через 10 дней
    IF (effective_streak % 10) = 0 THEN
      days_until_super := 10;
    END IF;
  END IF;

  RETURN JSON_BUILD_OBJECT(
    'can_checkin', NOT already_checked,
    'already_checked', already_checked,
    'current_streak', user_current_streak,
    'next_is_super', next_is_super,
    'days_until_super', days_until_super
  );
END;
$$ LANGUAGE plpgsql;

-- Комментарий для понимания логики:
-- Золотой день наступает каждые 10 дней непрерывного стрейка
-- Примеры:
-- - Стрейк 9 дней -> следующий (10-й) будет золотым -> days_until_super = 1
-- - Стрейк 10 дней -> это золотой день -> days_until_super = 0 (если еще не отмечались)
-- - Стрейк 15 дней -> следующий золотой на 20-й день -> days_until_super = 5
-- - Стрейк 0 дней -> следующий золотой на 10-й день -> days_until_super = 10 