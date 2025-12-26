-- Таблица профилей пользователей
-- Запустите этот SQL в Supabase SQL Editor

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  nickname TEXT,
  avatar_url TEXT,
  member_id TEXT,
  role TEXT DEFAULT 'basic',
  balance DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Добавляем столбцы если их нет (для существующих таблиц)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='nickname') THEN
    ALTER TABLE profiles ADD COLUMN nickname TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='member_id') THEN
    ALTER TABLE profiles ADD COLUMN member_id TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='balance') THEN
    ALTER TABLE profiles ADD COLUMN balance DECIMAL(12, 2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='avatar_url') THEN
    ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='email') THEN
    ALTER TABLE profiles ADD COLUMN email TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
    ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'basic';
  END IF;
END $$;

-- Индексы
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_member_id ON profiles(member_id);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики если есть
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can upsert own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;
DROP POLICY IF EXISTS "Enable upsert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable read for all authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for own profile" ON profiles;
DROP POLICY IF EXISTS "Enable update for own profile" ON profiles;
DROP POLICY IF EXISTS "Enable update for admins" ON profiles;
DROP POLICY IF EXISTS "Enable read for anon users" ON profiles;

-- Новые политики (более гибкие для работы с регистрацией)
-- Разрешаем всем аутентифицированным пользователям читать все профили
CREATE POLICY "Enable read for all authenticated users" ON profiles 
  FOR SELECT TO authenticated 
  USING (true);

-- Разрешаем пользователям создавать свой профиль
CREATE POLICY "Enable insert for own profile" ON profiles 
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = id);

-- Разрешаем пользователям обновлять свой профиль
CREATE POLICY "Enable update for own profile" ON profiles 
  FOR UPDATE TO authenticated 
  USING (auth.uid() = id);

-- Разрешаем админам обновлять любые профили (проверяем роль в базе данных)
CREATE POLICY "Enable update for admins" ON profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Разрешаем анонимным пользователям читать профили (для публичных данных)
CREATE POLICY "Enable read for anon users" ON profiles 
  FOR SELECT TO anon 
  USING (true);

-- Функция для автоматического создания профиля при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nickname, member_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nickname', SPLIT_PART(NEW.email, '@', 1)),
    'THQ-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер для создания профиля при регистрации
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ручная вставка профилей для существующих пользователей
INSERT INTO profiles (id, email, nickname, member_id, balance)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'nickname', SPLIT_PART(email, '@', 1)),
  'THQ-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
  0
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- Обновляем member_id для существующих профилей, у которых его нет
UPDATE profiles 
SET member_id = 'THQ-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')
WHERE member_id IS NULL OR member_id = '';

-- Обновляем balance для существующих профилей, у которых его нет
UPDATE profiles 
SET balance = 0
WHERE balance IS NULL;

-- Обновляем nickname для существующих профилей из auth.users
UPDATE profiles p
SET nickname = COALESCE(u.raw_user_meta_data->>'nickname', SPLIT_PART(u.email, '@', 1))
FROM auth.users u
WHERE p.id = u.id AND (p.nickname IS NULL OR p.nickname = '');

-- Обновляем email для существующих профилей из auth.users
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

-- Устанавливаем роли из конфига для существующих пользователей
UPDATE profiles 
SET role = 'admin'
WHERE email IN ('maksbroska@gmail.com', 'littlehikai@gmail.com');

UPDATE profiles 
SET role = 'exclusive'
WHERE email IN ('jdsakd@gmail.com');

-- Устанавливаем basic для всех остальных где роль не установлена
UPDATE profiles 
SET role = 'basic'
WHERE role IS NULL OR role = '';
