-- ============================================
-- ПОЛНАЯ НАСТРОЙКА СИСТЕМЫ РЕЛИЗОВ
-- Выполните этот скрипт в Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. СОЗДАНИЕ/ОБНОВЛЕНИЕ ТАБЛИЦЫ RELEASES
-- ============================================

-- Удаляем старые политики если они есть
DROP POLICY IF EXISTS "Users can view own releases" ON releases;
DROP POLICY IF EXISTS "Users can create own releases" ON releases;
DROP POLICY IF EXISTS "Users can update own pending releases" ON releases;
DROP POLICY IF EXISTS "Admins can view all releases" ON releases;
DROP POLICY IF EXISTS "Admins can update all releases" ON releases;

-- Создаём или обновляем таблицу releases
CREATE TABLE IF NOT EXISTS releases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Информация о пользователе
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_role TEXT CHECK (user_role IN ('basic', 'exclusive')) NOT NULL,
  
  -- Основная информация о релизе
  title TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  cover_url TEXT,
  genre TEXT,
  subgenres TEXT[] DEFAULT '{}',
  release_date DATE,
  collaborators TEXT[] DEFAULT '{}',
  
  -- Треклист (JSONB формат)
  tracks JSONB DEFAULT '[]'::jsonb,
  
  -- Страны распространения
  countries TEXT[] DEFAULT '{}',
  
  -- Договор
  contract_agreed BOOLEAN DEFAULT false,
  contract_agreed_at TIMESTAMPTZ,
  
  -- Платформы
  platforms TEXT[] DEFAULT '{}',
  
  -- Промо
  focus_track TEXT,
  album_description TEXT,
  
  -- Статус модерации
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'published')),
  status_updated_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Информация об оплате (для Basic)
  payment_status TEXT CHECK (payment_status IN ('unpaid', 'pending', 'verified', 'rejected')),
  payment_amount NUMERIC(10, 2),
  payment_receipt_url TEXT,
  payment_verified_at TIMESTAMPTZ,
  payment_verified_by UUID REFERENCES auth.users(id),
  
  -- Метаданные
  admin_notes TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ
);

-- Добавляем отсутствующие столбцы если таблица уже существует
DO $$ 
BEGIN
  -- user_role
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='releases' AND column_name='user_role') THEN
    ALTER TABLE releases ADD COLUMN user_role TEXT CHECK (user_role IN ('basic', 'exclusive'));
  END IF;
  
  -- artist_name
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='releases' AND column_name='artist_name') THEN
    ALTER TABLE releases ADD COLUMN artist_name TEXT;
  END IF;
  
  -- subgenres
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='releases' AND column_name='subgenres') THEN
    ALTER TABLE releases ADD COLUMN subgenres TEXT[] DEFAULT '{}';
  END IF;
  
  -- tracks (JSONB)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='releases' AND column_name='tracks') THEN
    ALTER TABLE releases ADD COLUMN tracks JSONB DEFAULT '[]'::jsonb;
  END IF;
  
  -- countries
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='releases' AND column_name='countries') THEN
    ALTER TABLE releases ADD COLUMN countries TEXT[] DEFAULT '{}';
  END IF;
  
  -- contract_agreed
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='releases' AND column_name='contract_agreed') THEN
    ALTER TABLE releases ADD COLUMN contract_agreed BOOLEAN DEFAULT false;
  END IF;
  
  -- contract_agreed_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='releases' AND column_name='contract_agreed_at') THEN
    ALTER TABLE releases ADD COLUMN contract_agreed_at TIMESTAMPTZ;
  END IF;
  
  -- platforms
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='releases' AND column_name='platforms') THEN
    ALTER TABLE releases ADD COLUMN platforms TEXT[] DEFAULT '{}';
  END IF;
  
  -- focus_track
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='releases' AND column_name='focus_track') THEN
    ALTER TABLE releases ADD COLUMN focus_track TEXT;
  END IF;
  
  -- album_description
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='releases' AND column_name='album_description') THEN
    ALTER TABLE releases ADD COLUMN album_description TEXT;
  END IF;
  
  -- payment_status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='releases' AND column_name='payment_status') THEN
    ALTER TABLE releases ADD COLUMN payment_status TEXT CHECK (payment_status IN ('unpaid', 'pending', 'verified', 'rejected'));
  END IF;
  
  -- payment_amount
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='releases' AND column_name='payment_amount') THEN
    ALTER TABLE releases ADD COLUMN payment_amount NUMERIC(10, 2);
  END IF;
  
  -- payment_receipt_url
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='releases' AND column_name='payment_receipt_url') THEN
    ALTER TABLE releases ADD COLUMN payment_receipt_url TEXT;
  END IF;
  
  -- payment_verified_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='releases' AND column_name='payment_verified_at') THEN
    ALTER TABLE releases ADD COLUMN payment_verified_at TIMESTAMPTZ;
  END IF;
  
  -- payment_verified_by
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='releases' AND column_name='payment_verified_by') THEN
    ALTER TABLE releases ADD COLUMN payment_verified_by UUID REFERENCES auth.users(id);
  END IF;
  
  -- admin_notes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='releases' AND column_name='admin_notes') THEN
    ALTER TABLE releases ADD COLUMN admin_notes TEXT;
  END IF;
  
  -- approved_by
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='releases' AND column_name='approved_by') THEN
    ALTER TABLE releases ADD COLUMN approved_by UUID REFERENCES auth.users(id);
  END IF;
  
  -- approved_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='releases' AND column_name='approved_at') THEN
    ALTER TABLE releases ADD COLUMN approved_at TIMESTAMPTZ;
  END IF;
  
  -- status_updated_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='releases' AND column_name='status_updated_at') THEN
    ALTER TABLE releases ADD COLUMN status_updated_at TIMESTAMPTZ;
  END IF;
  
  -- rejection_reason
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='releases' AND column_name='rejection_reason') THEN
    ALTER TABLE releases ADD COLUMN rejection_reason TEXT;
  END IF;
  
  -- collaborators
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='releases' AND column_name='collaborators') THEN
    ALTER TABLE releases ADD COLUMN collaborators TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- ============================================
-- 2. СОЗДАНИЕ ИНДЕКСОВ
-- ============================================

CREATE INDEX IF NOT EXISTS idx_releases_user_id ON releases(user_id);
CREATE INDEX IF NOT EXISTS idx_releases_status ON releases(status);
CREATE INDEX IF NOT EXISTS idx_releases_user_role ON releases(user_role);
CREATE INDEX IF NOT EXISTS idx_releases_payment_status ON releases(payment_status);
CREATE INDEX IF NOT EXISTS idx_releases_created_at ON releases(created_at DESC);

-- ============================================
-- 3. ФУНКЦИЯ ОБНОВЛЕНИЯ updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для updated_at
DROP TRIGGER IF EXISTS update_releases_updated_at ON releases;
CREATE TRIGGER update_releases_updated_at
    BEFORE UPDATE ON releases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. ПРОВЕРКА И СОЗДАНИЕ ТАБЛИЦЫ PROFILES
-- ============================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Основная информация
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  
  -- Роль пользователя
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'basic', 'exclusive', 'admin', 'owner')),
  
  -- Финансы
  balance NUMERIC(10, 2) DEFAULT 0,
  
  -- Настройки
  theme TEXT DEFAULT 'dark',
  
  -- Метаданные
  last_login TIMESTAMPTZ
);

-- Добавляем отсутствующие столбцы в profiles
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
    ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'basic', 'exclusive', 'admin', 'owner'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='display_name') THEN
    ALTER TABLE profiles ADD COLUMN display_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='balance') THEN
    ALTER TABLE profiles ADD COLUMN balance NUMERIC(10, 2) DEFAULT 0;
  END IF;
END $$;

-- Индексы для profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS) ДЛЯ RELEASES
-- ============================================

-- Включаем RLS
ALTER TABLE releases ENABLE ROW LEVEL SECURITY;

-- Политика: Пользователи могут видеть только свои релизы
CREATE POLICY "Users can view own releases"
  ON releases FOR SELECT
  USING (auth.uid() = user_id);

-- Политика: Пользователи могут создавать свои релизы
CREATE POLICY "Users can create own releases"
  ON releases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Политика: Пользователи могут обновлять свои релизы (только если статус = pending)
CREATE POLICY "Users can update own pending releases"
  ON releases FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Политика: Админы и овнеры видят все релизы
CREATE POLICY "Admins can view all releases"
  ON releases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- Политика: Админы и овнеры могут обновлять любые релизы
CREATE POLICY "Admins can update all releases"
  ON releases FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- ============================================
-- 6. RLS ДЛЯ PROFILES
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Создаем новые политики
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'owner')
    )
  );

-- ============================================
-- 7. ФУНКЦИЯ ДЛЯ АВТОМАТИЧЕСКОГО СОЗДАНИЯ ПРОФИЛЯ
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер для автоматического создания профиля при регистрации
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 8. ПРОВЕРКА РЕЗУЛЬТАТОВ
-- ============================================

-- Вывод структуры таблицы releases
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'releases'
ORDER BY 
    ordinal_position;

-- Вывод политик RLS для releases
SELECT 
    policyname,
    cmd,
    qual
FROM 
    pg_policies
WHERE 
    tablename = 'releases';

-- Вывод структуры таблицы profiles
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'profiles'
ORDER BY 
    ordinal_position;
