-- Создание таблиц для системы ежедневных отметок

-- 1. Создаем таблицу для ежедневных отметок
CREATE TABLE IF NOT EXISTS daily_checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_date DATE DEFAULT CURRENT_DATE,
  points_earned INTEGER NOT NULL DEFAULT 0,
  is_super_bonus BOOLEAN DEFAULT false,
  streak_day INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, checkin_date)
);

-- 2. Добавляем поля стрейка в profiles
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