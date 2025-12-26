-- ============================================
-- СОЗДАНИЕ ОТДЕЛЬНЫХ ТАБЛИЦ ДЛЯ РЕЛИЗОВ
-- Разделение Basic и Exclusive релизов
-- ============================================
-- 
-- БЕЗОПАСНЫЙ СКРИПТ - не затрагивает существующие таблицы!
-- Создает только: releases_basic и releases_exclusive
-- ============================================

-- ============================================
-- 1. ТАБЛИЦА ДЛЯ BASIC РЕЛИЗОВ (ПЛАТНЫЕ)
-- ============================================

CREATE TABLE IF NOT EXISTS releases_basic (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Информация о пользователе
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Основная информация о релизе
  title TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  cover_url TEXT,
  genre TEXT NOT NULL,
  subgenres TEXT[] DEFAULT '{}',
  release_date DATE,
  collaborators TEXT[] DEFAULT '{}',
  
  -- Треклист (JSONB формат)
  -- Формат: [{"title": "...", "link": "...", "hasDrugs": false, "lyrics": "...", "language": "..."}]
  tracks JSONB DEFAULT '[]'::jsonb,
  
  -- Страны распространения
  countries TEXT[] DEFAULT '{}',
  
  -- Договор
  contract_agreed BOOLEAN DEFAULT false NOT NULL,
  contract_agreed_at TIMESTAMPTZ,
  
  -- Платформы
  platforms TEXT[] DEFAULT '{}',
  
  -- Промо
  focus_track TEXT,
  album_description TEXT,
  
  -- Статус модерации
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'published')) NOT NULL,
  status_updated_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- ОБЯЗАТЕЛЬНАЯ ИНФОРМАЦИЯ ОБ ОПЛАТЕ ДЛЯ BASIC
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'verified', 'rejected')) NOT NULL,
  payment_amount NUMERIC(10, 2) DEFAULT 500.00 NOT NULL,
  payment_receipt_url TEXT,
  payment_verified_at TIMESTAMPTZ,
  payment_verified_by UUID REFERENCES auth.users(id),
  
  -- Метаданные
  admin_notes TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  moderated_by UUID REFERENCES auth.users(id),
  moderated_at TIMESTAMPTZ
);

-- Индексы для releases_basic
CREATE INDEX IF NOT EXISTS idx_releases_basic_user_id ON releases_basic(user_id);
CREATE INDEX IF NOT EXISTS idx_releases_basic_status ON releases_basic(status);
CREATE INDEX IF NOT EXISTS idx_releases_basic_payment_status ON releases_basic(payment_status);
CREATE INDEX IF NOT EXISTS idx_releases_basic_created_at ON releases_basic(created_at DESC);

-- ============================================
-- 2. ТАБЛИЦА ДЛЯ EXCLUSIVE РЕЛИЗОВ (БЕСПЛАТНЫЕ)
-- ============================================

CREATE TABLE IF NOT EXISTS releases_exclusive (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Информация о пользователе
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Основная информация о релизе
  title TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  cover_url TEXT,
  genre TEXT NOT NULL,
  subgenres TEXT[] DEFAULT '{}',
  release_date DATE,
  collaborators TEXT[] DEFAULT '{}',
  
  -- Треклист (JSONB формат)
  -- Формат: [{"title": "...", "link": "...", "hasDrugs": false, "lyrics": "...", "language": "..."}]
  tracks JSONB DEFAULT '[]'::jsonb,
  
  -- Страны распространения
  countries TEXT[] DEFAULT '{}',
  
  -- Договор
  contract_agreed BOOLEAN DEFAULT false NOT NULL,
  contract_agreed_at TIMESTAMPTZ,
  
  -- Платформы
  platforms TEXT[] DEFAULT '{}',
  
  -- Промо
  focus_track TEXT,
  album_description TEXT,
  
  -- Статус модерации
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'published')) NOT NULL,
  status_updated_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Метаданные
  admin_notes TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  moderated_by UUID REFERENCES auth.users(id),
  moderated_at TIMESTAMPTZ
);

-- Индексы для releases_exclusive
CREATE INDEX IF NOT EXISTS idx_releases_exclusive_user_id ON releases_exclusive(user_id);
CREATE INDEX IF NOT EXISTS idx_releases_exclusive_status ON releases_exclusive(status);
CREATE INDEX IF NOT EXISTS idx_releases_exclusive_created_at ON releases_exclusive(created_at DESC);

-- ============================================
-- 3. ФУНКЦИЯ ДЛЯ АВТОМАТИЧЕСКОГО ОБНОВЛЕНИЯ updated_at
-- ============================================
-- Создаем только если не существует, чтобы не затронуть другие таблицы

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'update_updated_at_column'
  ) THEN
    CREATE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $func$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
  END IF;
END $$;

-- Триггеры для updated_at (только для новых таблиц)
DROP TRIGGER IF EXISTS update_releases_basic_updated_at ON releases_basic;
CREATE TRIGGER update_releases_basic_updated_at
    BEFORE UPDATE ON releases_basic
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_releases_exclusive_updated_at ON releases_exclusive;
CREATE TRIGGER update_releases_exclusive_updated_at
    BEFORE UPDATE ON releases_exclusive
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. RLS ПОЛИТИКИ ДЛЯ RELEASES_BASIC
-- ============================================

ALTER TABLE releases_basic ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики если есть
DROP POLICY IF EXISTS "Users can view own basic releases" ON releases_basic;
DROP POLICY IF EXISTS "Users can create own basic releases" ON releases_basic;
DROP POLICY IF EXISTS "Users can update own pending basic releases" ON releases_basic;
DROP POLICY IF EXISTS "Admins can view all basic releases" ON releases_basic;
DROP POLICY IF EXISTS "Admins can update all basic releases" ON releases_basic;

-- Пользователи могут видеть только свои релизы
CREATE POLICY "Users can view own basic releases"
  ON releases_basic FOR SELECT
  USING (auth.uid() = user_id);

-- Пользователи могут создавать свои релизы
CREATE POLICY "Users can create own basic releases"
  ON releases_basic FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Пользователи могут обновлять свои релизы (только если статус = pending)
CREATE POLICY "Users can update own pending basic releases"
  ON releases_basic FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Админы и овнеры видят все релизы
CREATE POLICY "Admins can view all basic releases"
  ON releases_basic FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- Админы и овнеры могут обновлять все релизы
CREATE POLICY "Admins can update all basic releases"
  ON releases_basic FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- ============================================
-- 5. RLS ПОЛИТИКИ ДЛЯ RELEASES_EXCLUSIVE
-- ============================================

ALTER TABLE releases_exclusive ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики если есть
DROP POLICY IF EXISTS "Users can view own exclusive releases" ON releases_exclusive;
DROP POLICY IF EXISTS "Users can create own exclusive releases" ON releases_exclusive;
DROP POLICY IF EXISTS "Users can update own pending exclusive releases" ON releases_exclusive;
DROP POLICY IF EXISTS "Admins can view all exclusive releases" ON releases_exclusive;
DROP POLICY IF EXISTS "Admins can update all exclusive releases" ON releases_exclusive;

-- Пользователи могут видеть только свои релизы
CREATE POLICY "Users can view own exclusive releases"
  ON releases_exclusive FOR SELECT
  USING (auth.uid() = user_id);

-- Пользователи могут создавать свои релизы
CREATE POLICY "Users can create own exclusive releases"
  ON releases_exclusive FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Пользователи могут обновлять свои релизы (только если статус = pending)
CREATE POLICY "Users can update own pending exclusive releases"
  ON releases_exclusive FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Админы и овнеры видят все релизы
CREATE POLICY "Admins can view all exclusive releases"
  ON releases_exclusive FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- Админы и овнеры могут обновлять все релизы
CREATE POLICY "Admins can update all exclusive releases"
  ON releases_exclusive FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- ============================================
-- 6. ФУНКЦИИ ДЛЯ МОДЕРАЦИИ BASIC РЕЛИЗОВ
-- ============================================

-- Получение BASIC релизов на модерации
CREATE OR REPLACE FUNCTION get_pending_basic_releases()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  artist_name TEXT,
  cover_url TEXT,
  status TEXT,
  payment_status TEXT,
  payment_receipt_url TEXT,
  payment_amount NUMERIC,
  created_at TIMESTAMPTZ,
  user_email TEXT,
  user_name TEXT
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.user_id,
    r.title,
    r.artist_name,
    r.cover_url,
    r.status,
    r.payment_status,
    r.payment_receipt_url,
    r.payment_amount,
    r.created_at,
    au.email as user_email,
    p.display_name as user_name
  FROM releases_basic r
  LEFT JOIN auth.users au ON r.user_id = au.id
  LEFT JOIN profiles p ON r.user_id = p.id
  WHERE r.status = 'pending'
  ORDER BY r.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Утверждение BASIC релиза
CREATE OR REPLACE FUNCTION approve_basic_release(
  release_id UUID,
  admin_id UUID
)
RETURNS void
SECURITY DEFINER
AS $$
BEGIN
  UPDATE releases_basic
  SET 
    status = 'approved',
    status_updated_at = NOW(),
    approved_by = admin_id,
    approved_at = NOW(),
    moderated_by = admin_id,
    moderated_at = NOW()
  WHERE id = release_id;
END;
$$ LANGUAGE plpgsql;

-- Отклонение BASIC релиза
CREATE OR REPLACE FUNCTION reject_basic_release(
  release_id UUID,
  admin_id UUID,
  reason TEXT
)
RETURNS void
SECURITY DEFINER
AS $$
BEGIN
  UPDATE releases_basic
  SET 
    status = 'rejected',
    status_updated_at = NOW(),
    rejection_reason = reason,
    moderated_by = admin_id,
    moderated_at = NOW()
  WHERE id = release_id;
END;
$$ LANGUAGE plpgsql;

-- Подтверждение оплаты BASIC релиза
CREATE OR REPLACE FUNCTION verify_basic_payment(
  release_id UUID,
  admin_id UUID
)
RETURNS void
SECURITY DEFINER
AS $$
BEGIN
  UPDATE releases_basic
  SET 
    payment_status = 'verified',
    payment_verified_at = NOW(),
    payment_verified_by = admin_id
  WHERE id = release_id;
END;
$$ LANGUAGE plpgsql;

-- Отклонение оплаты BASIC релиза
CREATE OR REPLACE FUNCTION reject_basic_payment(
  release_id UUID,
  admin_id UUID,
  reason TEXT
)
RETURNS void
SECURITY DEFINER
AS $$
BEGIN
  UPDATE releases_basic
  SET 
    payment_status = 'rejected',
    rejection_reason = reason,
    status = 'rejected',
    status_updated_at = NOW(),
    moderated_by = admin_id,
    moderated_at = NOW()
  WHERE id = release_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. ФУНКЦИИ ДЛЯ МОДЕРАЦИИ EXCLUSIVE РЕЛИЗОВ
-- ============================================

-- Получение EXCLUSIVE релизов на модерации
CREATE OR REPLACE FUNCTION get_pending_exclusive_releases()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  artist_name TEXT,
  cover_url TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  user_email TEXT,
  user_name TEXT
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.user_id,
    r.title,
    r.artist_name,
    r.cover_url,
    r.status,
    r.created_at,
    au.email as user_email,
    p.display_name as user_name
  FROM releases_exclusive r
  LEFT JOIN auth.users au ON r.user_id = au.id
  LEFT JOIN profiles p ON r.user_id = p.id
  WHERE r.status = 'pending'
  ORDER BY r.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Утверждение EXCLUSIVE релиза
CREATE OR REPLACE FUNCTION approve_exclusive_release(
  release_id UUID,
  admin_id UUID
)
RETURNS void
SECURITY DEFINER
AS $$
BEGIN
  UPDATE releases_exclusive
  SET 
    status = 'approved',
    status_updated_at = NOW(),
    approved_by = admin_id,
    approved_at = NOW(),
    moderated_by = admin_id,
    moderated_at = NOW()
  WHERE id = release_id;
END;
$$ LANGUAGE plpgsql;

-- Отклонение EXCLUSIVE релиза
CREATE OR REPLACE FUNCTION reject_exclusive_release(
  release_id UUID,
  admin_id UUID,
  reason TEXT
)
RETURNS void
SECURITY DEFINER
AS $$
BEGIN
  UPDATE releases_exclusive
  SET 
    status = 'rejected',
    status_updated_at = NOW(),
    rejection_reason = reason,
    moderated_by = admin_id,
    moderated_at = NOW()
  WHERE id = release_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. ОБЩАЯ ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ ВСЕХ РЕЛИЗОВ (ДЛЯ АДМИНОВ)
-- ============================================

CREATE OR REPLACE FUNCTION get_all_pending_releases()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  artist_name TEXT,
  cover_url TEXT,
  status TEXT,
  release_type TEXT,
  payment_status TEXT,
  payment_receipt_url TEXT,
  payment_amount NUMERIC,
  created_at TIMESTAMPTZ,
  user_email TEXT,
  user_name TEXT
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  -- Basic релизы
  SELECT 
    r.id,
    r.user_id,
    r.title,
    r.artist_name,
    r.cover_url,
    r.status,
    'basic'::TEXT as release_type,
    r.payment_status,
    r.payment_receipt_url,
    r.payment_amount,
    r.created_at,
    au.email as user_email,
    p.display_name as user_name
  FROM releases_basic r
  LEFT JOIN auth.users au ON r.user_id = au.id
  LEFT JOIN profiles p ON r.user_id = p.id
  WHERE r.status = 'pending'
  
  UNION ALL
  
  -- Exclusive релизы
  SELECT 
    r.id,
    r.user_id,
    r.title,
    r.artist_name,
    r.cover_url,
    r.status,
    'exclusive'::TEXT as release_type,
    NULL::TEXT as payment_status,
    NULL::TEXT as payment_receipt_url,
    NULL::NUMERIC as payment_amount,
    r.created_at,
    au.email as user_email,
    p.display_name as user_name
  FROM releases_exclusive r
  LEFT JOIN auth.users au ON r.user_id = au.id
  LEFT JOIN profiles p ON r.user_id = p.id
  WHERE r.status = 'pending'
  
  ORDER BY created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ГОТОВО! 
-- ============================================
-- ✅ Созданы две отдельные таблицы:
--    - releases_basic (для платных Basic релизов)
--    - releases_exclusive (для бесплатных Exclusive релизов)
--
-- ✅ Настроены RLS политики для безопасного доступа
-- ✅ Созданы функции модерации для админов
-- ✅ Существующие таблицы НЕ ЗАТРОНУТЫ
--
-- Следующие шаги:
-- 1. Обновите код приложения (см. CODE_UPDATES_FOR_SEPARATE_TABLES.md)
-- 2. Протестируйте создание релизов
-- 3. Если нужна миграция старых данных - используйте отдельный скрипт