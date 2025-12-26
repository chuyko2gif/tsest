-- Добавление полей для модерации релизов и оплаты

-- 1. Добавляем новые поля в таблицу releases
ALTER TABLE releases 
ADD COLUMN IF NOT EXISTS user_role TEXT CHECK (user_role IN ('basic', 'exclusive')),
ADD COLUMN IF NOT EXISTS payment_status TEXT CHECK (payment_status IN ('pending', 'verified', 'rejected')),
ADD COLUMN IF NOT EXISTS payment_receipt_url TEXT,
ADD COLUMN IF NOT EXISTS payment_amount NUMERIC,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;

-- 2. Обновляем существующие релизы (если есть) - ставим user_role = 'exclusive' по умолчанию
UPDATE releases 
SET user_role = 'exclusive' 
WHERE user_role IS NULL;

-- 3. Создаем функцию для получения релизов на модерации
CREATE OR REPLACE FUNCTION get_pending_releases()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_role TEXT,
  title TEXT,
  artist TEXT,
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
    r.user_role,
    r.title,
    r.artist,
    r.cover_url,
    r.status,
    r.payment_status,
    r.payment_receipt_url,
    r.payment_amount,
    r.created_at,
    p.email as user_email,
    p.name as user_name
  FROM releases r
  LEFT JOIN profiles p ON r.user_id = p.id
  WHERE r.status = 'pending'
  ORDER BY r.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- 4. Функция для утверждения релиза
CREATE OR REPLACE FUNCTION approve_release(
  release_id UUID,
  admin_id UUID
)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
DECLARE
  admin_role TEXT;
BEGIN
  -- Проверяем роль админа
  SELECT role INTO admin_role FROM profiles WHERE id = admin_id;
  
  IF admin_role NOT IN ('admin', 'owner') THEN
    RAISE EXCEPTION 'У вас нет прав для утверждения релизов';
  END IF;
  
  -- Обновляем статус релиза
  UPDATE releases
  SET 
    status = 'distributed',
    moderated_by = admin_id,
    moderated_at = NOW()
  WHERE id = release_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 5. Функция для отклонения релиза
CREATE OR REPLACE FUNCTION reject_release(
  release_id UUID,
  admin_id UUID,
  reason TEXT
)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
DECLARE
  admin_role TEXT;
BEGIN
  -- Проверяем роль админа
  SELECT role INTO admin_role FROM profiles WHERE id = admin_id;
  
  IF admin_role NOT IN ('admin', 'owner') THEN
    RAISE EXCEPTION 'У вас нет прав для отклонения релизов';
  END IF;
  
  -- Обновляем статус релиза
  UPDATE releases
  SET 
    status = 'rejected',
    rejection_reason = reason,
    moderated_by = admin_id,
    moderated_at = NOW()
  WHERE id = release_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 6. Функция для подтверждения оплаты (для basic)
CREATE OR REPLACE FUNCTION verify_payment(
  release_id UUID,
  admin_id UUID
)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
DECLARE
  admin_role TEXT;
BEGIN
  -- Проверяем роль админа
  SELECT role INTO admin_role FROM profiles WHERE id = admin_id;
  
  IF admin_role NOT IN ('admin', 'owner') THEN
    RAISE EXCEPTION 'У вас нет прав для подтверждения оплаты';
  END IF;
  
  -- Обновляем статус оплаты
  UPDATE releases
  SET payment_status = 'verified'
  WHERE id = release_id AND user_role = 'basic';
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 7. Обновляем RLS политики для админов
DROP POLICY IF EXISTS "Админы могут просматривать все релизы" ON releases;
CREATE POLICY "Админы могут просматривать все релизы"
ON releases FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'owner')
  )
);

-- 8. Создаем индекс для быстрого поиска релизов на модерации
CREATE INDEX IF NOT EXISTS idx_releases_pending ON releases(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_releases_user_role ON releases(user_role);
CREATE INDEX IF NOT EXISTS idx_releases_payment_status ON releases(payment_status);
