-- Упрощенная версия функции get_user_checkin_calendar

CREATE OR REPLACE FUNCTION get_user_checkin_calendar(
  p_user_id UUID,
  p_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
  p_month INTEGER DEFAULT EXTRACT(MONTH FROM NOW())
)
RETURNS JSON AS $$
DECLARE
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

  -- Возвращаем результат с простым запросом отметок
  RETURN JSON_BUILD_OBJECT(
    'checkins', (
      SELECT COALESCE(JSON_AGG(
        JSON_BUILD_OBJECT(
          'date', checkin_date,
          'points_earned', points_earned,
          'is_super_bonus', is_super_bonus,
          'streak_day', streak_day
        )
      ), '[]'::JSON)
      FROM daily_checkins
      WHERE user_id = p_user_id
        AND EXTRACT(YEAR FROM checkin_date) = p_year
        AND EXTRACT(MONTH FROM checkin_date) = p_month
    ),
    'current_streak', user_streak,
    'longest_streak', user_longest_streak,
    'year', p_year,
    'month', p_month
  );
END;
$$ LANGUAGE plpgsql; 