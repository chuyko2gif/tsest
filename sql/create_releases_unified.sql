-- Единая таблица релизов для Basic и Exclusive пользователей
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
  subgenres TEXT[], -- массив поджанров
  release_date DATE,
  collaborators TEXT[], -- массив соавторов
  
  -- Треклист
  tracks JSONB DEFAULT '[]'::jsonb,
  -- Формат: [{"title": "...", "link": "...", "hasDrugs": false, "lyrics": "...", "language": "..."}]
  
  -- Страны распространения
  countries TEXT[], -- массив стран
  
  -- Договор
  contract_agreed BOOLEAN DEFAULT false,
  contract_agreed_at TIMESTAMPTZ,
  
  -- Платформы
  platforms TEXT[], -- массив выбранных платформ
  
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

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_releases_user_id ON releases(user_id);
CREATE INDEX IF NOT EXISTS idx_releases_status ON releases(status);
CREATE INDEX IF NOT EXISTS idx_releases_user_role ON releases(user_role);
CREATE INDEX IF NOT EXISTS idx_releases_payment_status ON releases(payment_status);
CREATE INDEX IF NOT EXISTS idx_releases_created_at ON releases(created_at DESC);

-- Функция для автоматического обновления updated_at
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

-- RLS политики
ALTER TABLE releases ENABLE ROW LEVEL SECURITY;

-- Пользователи могут видеть только свои релизы
CREATE POLICY "Users can view own releases"
  ON releases FOR SELECT
  USING (auth.uid() = user_id);

-- Пользователи могут создавать свои релизы
CREATE POLICY "Users can create own releases"
  ON releases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Пользователи могут обновлять свои релизы (только если статус = pending)
CREATE POLICY "Users can update own pending releases"
  ON releases FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Админы и овнеры видят все релизы
CREATE POLICY "Admins can view all releases"
  ON releases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- Админы и овнеры могут обновлять любые релизы
CREATE POLICY "Admins can update all releases"
  ON releases FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- Функция для получения релизов на модерации
CREATE OR REPLACE FUNCTION get_pending_releases()
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMPTZ,
  user_role TEXT,
  title TEXT,
  artist_name TEXT,
  cover_url TEXT,
  genre TEXT,
  status TEXT,
  payment_status TEXT,
  payment_receipt_url TEXT,
  tracks_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.created_at,
    r.user_role,
    r.title,
    r.artist_name,
    r.cover_url,
    r.genre,
    r.status,
    r.payment_status,
    r.payment_receipt_url,
    jsonb_array_length(r.tracks) as tracks_count
  FROM releases r
  WHERE r.status = 'pending'
  ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для утверждения релиза
CREATE OR REPLACE FUNCTION approve_release(release_id UUID, admin_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE releases
  SET 
    status = 'approved',
    status_updated_at = NOW(),
    approved_by = admin_id,
    approved_at = NOW()
  WHERE id = release_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для отклонения релиза
CREATE OR REPLACE FUNCTION reject_release(release_id UUID, admin_id UUID, reason TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE releases
  SET 
    status = 'rejected',
    status_updated_at = NOW(),
    rejection_reason = reason,
    approved_by = admin_id,
    approved_at = NOW()
  WHERE id = release_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для проверки платежа (для Basic)
CREATE OR REPLACE FUNCTION verify_payment(release_id UUID, admin_id UUID, is_verified BOOLEAN)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE releases
  SET 
    payment_status = CASE WHEN is_verified THEN 'verified' ELSE 'rejected' END,
    payment_verified_at = NOW(),
    payment_verified_by = admin_id
  WHERE id = release_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Комментарий к таблице
COMMENT ON TABLE releases IS 'Единая таблица для релизов Basic и Exclusive пользователей';
