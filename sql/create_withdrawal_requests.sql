-- Таблица заявок на вывод средств
CREATE TABLE IF NOT EXISTS withdrawal_requests (
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

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_withdrawal_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_created_at ON withdrawal_requests(created_at DESC);

-- RLS политики
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Пользователи могут видеть только свои заявки
CREATE POLICY "Users can view own withdrawal requests"
  ON withdrawal_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Пользователи могут создавать свои заявки
CREATE POLICY "Users can create own withdrawal requests"
  ON withdrawal_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Админы могут видеть все заявки
CREATE POLICY "Admins can view all withdrawal requests"
  ON withdrawal_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- Админы могут обновлять заявки
CREATE POLICY "Admins can update withdrawal requests"
  ON withdrawal_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- Комментарий к таблице
COMMENT ON TABLE withdrawal_requests IS 'Заявки пользователей на вывод средств';
