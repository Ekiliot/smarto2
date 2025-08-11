-- Добавление поля email в таблицу profiles
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email') THEN
    ALTER TABLE profiles ADD COLUMN email TEXT;
  END IF;
END $$;

-- Обновление существующих записей, копируя email из auth.users
UPDATE profiles 
SET email = auth.users.email 
FROM auth.users 
WHERE profiles.id = auth.users.id 
AND profiles.email IS NULL;

-- Создание индекса для email
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Обновление RLS политики для включения email
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile with email') THEN
    CREATE POLICY "Users can update own profile with email" ON profiles
      FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$; 