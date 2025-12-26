-- ==============================================================
-- ПОЛНАЯ НАСТРОЙКА СИСТЕМЫ THQ LABEL
-- ==============================================================
-- Этот скрипт настраивает:
-- 1. Систему ролей (basic, exclusive, admin, owner)
-- 2. Таблицу заявок на вывод средств
-- 3. Realtime подписки для уведомлений
-- ==============================================================

-- ============== ЧАСТЬ 1: ОБНОВЛЕНИЕ РОЛЕЙ ==============

-- Удаляем старое ограничение CHECK
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Обновляем существующие роли
UPDATE profiles SET role = 'basic' WHERE role = 'user';
UPDATE profiles SET role = 'admin' WHERE role = 'moderator';

-- Добавляем новое ограничение
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('basic', 'exclusive', 'admin', 'owner'));

-- Устанавливаем значение по умолчанию
ALTER TABLE profiles 
ALTER COLUMN role SET DEFAULT 'basic';

-- Устанавливаем owner (замените email на свой!)
UPDATE profiles SET role = 'owner' WHERE email = 'littlehikai@gmail.com';

SELECT 'Роли обновлены!' as status;

-- ============== ЧАСТЬ 1.5: ПОЛИТИКИ UPDATE ДЛЯ АДМИНОВ ==============

-- Удаляем старую политику
DROP POLICY IF EXISTS "Enable update for admins" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable update for own profile" ON profiles;

-- Создаем новую политику для админов и овнеров
CREATE POLICY "Enable update for admins and owners" ON profiles
  FOR UPDATE TO authenticated
  USING (
    -- Разрешаем пользователям обновлять свой профиль
    auth.uid() = id
    OR
    -- Разрешаем админам и овнерам обновлять любые профили
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

SELECT 'Политики UPDATE настроены!' as status;

-- ============== ЧАСТЬ 2: СОЗДАНИЕ WITHDRAWAL_REQUESTS ==============

-- Удаляем старую таблицу если существует
DROP TABLE IF EXISTS withdrawal_requests CASCADE;

-- Создаем новую таблицу
CREATE TABLE withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 1000),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  
  -- Реквизиты для вывода
  bank_name TEXT NOT NULL,
  card_number TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  additional_info TEXT,
  
  -- Комментарии админа
  admin_comment TEXT,
  admin_id UUID REFERENCES profiles(id),
  
  -- Временные метки
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  
  -- Метаданные
  is_read BOOLEAN DEFAULT FALSE
);

-- Создаем индексы
CREATE INDEX idx_withdrawal_user_id ON withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_status ON withdrawal_requests(status);
CREATE INDEX idx_withdrawal_created_at ON withdrawal_requests(created_at DESC);

-- Включаем RLS
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Создаем политики RLS
CREATE POLICY "Users can view own withdrawal requests"
  ON withdrawal_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own withdrawal requests"
  ON withdrawal_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all withdrawal requests"
  ON withdrawal_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Admins can update withdrawal requests"
  ON withdrawal_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

COMMENT ON TABLE withdrawal_requests IS 'Заявки пользователей на вывод средств';

SELECT 'Таблица withdrawal_requests создана!' as status;

-- ============== ЧАСТЬ 3: ВКЛЮЧЕНИЕ REALTIME ==============

-- Включаем Realtime для withdrawal_requests (если ещё не включено)
DO $$
BEGIN
  -- Проверяем и добавляем withdrawal_requests
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'withdrawal_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE withdrawal_requests;
    RAISE NOTICE 'Realtime для withdrawal_requests включен';
  ELSE
    RAISE NOTICE 'Realtime для withdrawal_requests уже включен';
  END IF;
  
  -- Проверяем и добавляем payouts (обычно уже добавлено)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'payouts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE payouts;
    RAISE NOTICE 'Realtime для payouts включен';
  ELSE
    RAISE NOTICE 'Realtime для payouts уже включен';
  END IF;
  
  -- Проверяем и добавляем profiles (обычно уже добавлено)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
    RAISE NOTICE 'Realtime для profiles включен';
  ELSE
    RAISE NOTICE 'Realtime для profiles уже включен';
  END IF;
END $$;

SELECT 'Realtime проверен и настроен!' as status;

-- ============== ЧАСТЬ 4: ПРОВЕРКА ==============

-- Проверяем роли
SELECT 
  role, 
  COUNT(*) as count 
FROM profiles 
GROUP BY role;

-- Проверяем структуру withdrawal_requests
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'withdrawal_requests';

-- ============== ГОТОВО! ==============
SELECT '✅ Полная настройка завершена!' as final_status;
