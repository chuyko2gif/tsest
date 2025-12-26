-- ВАЖНО: Этот скрипт удалит существующую таблицу withdrawal_requests и создаст новую
-- Если у вас есть данные в таблице, они будут потеряны!

-- Шаг 1: Удаляем старую таблицу если существует
DROP TABLE IF EXISTS withdrawal_requests CASCADE;

-- Шаг 2: Создаем новую таблицу с правильными связями
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

-- Шаг 3: Создаем индексы
CREATE INDEX idx_withdrawal_user_id ON withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_status ON withdrawal_requests(status);
CREATE INDEX idx_withdrawal_created_at ON withdrawal_requests(created_at DESC);

-- Шаг 4: Включаем RLS
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Шаг 5: Создаем политики RLS
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

-- Шаг 6: Добавляем комментарий к таблице
COMMENT ON TABLE withdrawal_requests IS 'Заявки пользователей на вывод средств';

-- Готово!
SELECT 'Таблица withdrawal_requests успешно создана!' as status;
