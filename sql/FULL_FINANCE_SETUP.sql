-- ==============================================================
-- ПОЛНАЯ НАСТРОЙКА ФИНАНСОВОЙ СИСТЕМЫ THQ LABEL
-- ==============================================================
-- Этот скрипт настраивает:
-- 1. Таблицу транзакций
-- 2. Таблицу заявок на вывод средств (withdrawal_requests)
-- 3. Интеграцию между withdrawal_requests и транзакциями
-- 4. Триггеры для автоматического управления балансами
-- ==============================================================

BEGIN;

-- ==============================================================
-- ЧАСТЬ 1: СОЗДАНИЕ ТАБЛИЦЫ ТРАНЗАКЦИЙ
-- ==============================================================

-- Удаляем старую таблицу если существует
DROP TABLE IF EXISTS transactions CASCADE;

CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('payout', 'withdrawal', 'refund', 'adjustment', 'bonus')),
  amount DECIMAL(10, 2) NOT NULL,
  balance_before DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  description TEXT NOT NULL,
  reference_id UUID, -- ID связанной записи (payout или withdrawal_request) - изменено на UUID
  reference_table TEXT, -- Таблица связанной записи ('payouts' или 'withdrawal_requests')
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_reference ON transactions(reference_table, reference_id);

-- RLS политики
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Пользователи видят только свои транзакции
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Админы видят все транзакции
CREATE POLICY "Admins can view all transactions"
  ON transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- Только система может создавать транзакции (через триггеры)
-- Вручную админы/овнеры могут через adjustment

COMMENT ON TABLE transactions IS 'История всех финансовых операций пользователей';

SELECT '✅ Таблица транзакций создана!' as status;

-- ==============================================================
-- ЧАСТЬ 2: СОЗДАНИЕ ТАБЛИЦЫ WITHDRAWAL_REQUESTS (ЕСЛИ НЕ СУЩЕСТВУЕТ)
-- ==============================================================

-- Создаем таблицу только если её нет
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

-- Создаем индексы если их нет
CREATE INDEX IF NOT EXISTS idx_withdrawal_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_created_at ON withdrawal_requests(created_at DESC);

-- Включаем RLS
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики
DROP POLICY IF EXISTS "Users can view own withdrawal requests" ON withdrawal_requests;
DROP POLICY IF EXISTS "Users can create own withdrawal requests" ON withdrawal_requests;
DROP POLICY IF EXISTS "Admins can view all withdrawal requests" ON withdrawal_requests;
DROP POLICY IF EXISTS "Admins can update withdrawal requests" ON withdrawal_requests;

-- Создаем новые политики
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

SELECT '✅ Таблица withdrawal_requests готова!' as status;

-- ==============================================================
-- ЧАСТЬ 3: ФУНКЦИЯ СОЗДАНИЯ ТРАНЗАКЦИИ
-- ==============================================================

-- Удаляем все старые версии функции
DROP FUNCTION IF EXISTS create_transaction(UUID, TEXT, DECIMAL, INTEGER, TEXT, TEXT, JSONB, UUID);
DROP FUNCTION IF EXISTS create_transaction(UUID, TEXT, DECIMAL, UUID, TEXT, TEXT, JSONB, UUID);

CREATE OR REPLACE FUNCTION create_transaction(
  p_user_id UUID,
  p_type TEXT,
  p_amount DECIMAL,
  p_reference_id UUID DEFAULT NULL,
  p_reference_table TEXT DEFAULT NULL,
  p_description TEXT DEFAULT '',
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_created_by UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_balance_before DECIMAL(10, 2);
  v_balance_after DECIMAL(10, 2);
  v_transaction_id INTEGER;
  v_amount_delta DECIMAL(10, 2);
BEGIN
  -- Получаем текущий баланс
  SELECT COALESCE(balance, 0) INTO v_balance_before
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  -- Проверяем существование пользователя
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Пользователь с ID % не найден', p_user_id;
  END IF;

  -- Определяем изменение баланса
  CASE p_type
    WHEN 'payout' THEN v_amount_delta := p_amount;      -- Начисление
    WHEN 'bonus' THEN v_amount_delta := p_amount;       -- Бонус
    WHEN 'refund' THEN v_amount_delta := p_amount;      -- Возврат
    WHEN 'adjustment' THEN v_amount_delta := p_amount;  -- Корректировка (может быть + или -)
    WHEN 'withdrawal' THEN v_amount_delta := -p_amount; -- Вывод (списание)
    ELSE RAISE EXCEPTION 'Неизвестный тип транзакции: %', p_type;
  END CASE;

  -- Рассчитываем новый баланс
  v_balance_after := v_balance_before + v_amount_delta;

  -- Проверяем, что баланс не уходит в минус (только для списаний)
  IF v_balance_after < 0 AND p_type = 'withdrawal' THEN
    RAISE EXCEPTION 'Недостаточно средств. Баланс: %, попытка списать: %', 
      v_balance_before, ABS(v_amount_delta);
  END IF;

  -- Создаем транзакцию
  INSERT INTO transactions (
    user_id,
    type,
    amount,
    balance_before,
    balance_after,
    description,
    reference_id,
    reference_table,
    metadata,
    created_by
  ) VALUES (
    p_user_id,
    p_type,
    p_amount,
    v_balance_before,
    v_balance_after,
    p_description,
    p_reference_id,
    p_reference_table,
    p_metadata,
    COALESCE(p_created_by, auth.uid())
  ) RETURNING id INTO v_transaction_id;

  -- Обновляем баланс пользователя
  UPDATE profiles
  SET balance = v_balance_after
  WHERE id = p_user_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT '✅ Функция create_transaction создана!' as status;

-- ==============================================================
-- ЧАСТЬ 4: ИНТЕГРАЦИЯ С PAYOUTS (ОТКЛЮЧЕНА)
-- ==============================================================

-- Удаляем триггеры для payouts (транзакции создаются вручную из админки)
DROP TRIGGER IF EXISTS trg_payout_created ON payouts;
DROP FUNCTION IF EXISTS on_payout_created();

SELECT '✅ Интеграция с payouts отключена (транзакции создаются через admin panel)' as status;

-- ==============================================================
-- ЧАСТЬ 5: ИНТЕГРАЦИЯ С WITHDRAWAL_REQUESTS
-- ==============================================================

-- Функция для обработки создания заявки на вывод
CREATE OR REPLACE FUNCTION on_withdrawal_request_created()
RETURNS TRIGGER AS $$
DECLARE
  v_current_balance DECIMAL(10, 2);
BEGIN
  -- Проверяем баланс пользователя
  SELECT balance INTO v_current_balance
  FROM profiles
  WHERE id = NEW.user_id;

  -- Проверяем достаточность средств
  IF v_current_balance < NEW.amount THEN
    RAISE EXCEPTION 'Недостаточно средств для вывода. Баланс: %, запрошено: %', 
      v_current_balance, NEW.amount;
  END IF;

  -- Списываем средства с баланса при создании заявки
  PERFORM create_transaction(
    NEW.user_id,
    'withdrawal',
    NEW.amount,
    NEW.id,
    'withdrawal_requests',
    'Заявка на вывод средств #' || NEW.id,
    jsonb_build_object(
      'bank_name', NEW.bank_name,
      'card_number', NEW.card_number,
      'recipient_name', NEW.recipient_name
    ),
    NEW.user_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Функция для обработки изменения статуса заявки
CREATE OR REPLACE FUNCTION on_withdrawal_request_updated()
RETURNS TRIGGER AS $$
BEGIN
  -- Если заявка отклонена - возвращаем деньги
  IF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
    PERFORM create_transaction(
      NEW.user_id,
      'refund',
      NEW.amount,
      NEW.id,
      'withdrawal_requests',
      'Возврат средств - заявка отклонена #' || NEW.id,
      jsonb_build_object(
        'admin_comment', NEW.admin_comment,
        'reason', 'withdrawal_rejected'
      ),
      NEW.admin_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Удаляем старые триггеры если есть
DROP TRIGGER IF EXISTS trg_withdrawal_request_created ON withdrawal_requests;
DROP TRIGGER IF EXISTS trg_withdrawal_request_updated ON withdrawal_requests;

-- Создаем триггеры
CREATE TRIGGER trg_withdrawal_request_created
  AFTER INSERT ON withdrawal_requests
  FOR EACH ROW
  EXECUTE FUNCTION on_withdrawal_request_created();

CREATE TRIGGER trg_withdrawal_request_updated
  AFTER UPDATE ON withdrawal_requests
  FOR EACH ROW
  WHEN (NEW.status != OLD.status)
  EXECUTE FUNCTION on_withdrawal_request_updated();

SELECT '✅ Интеграция с withdrawal_requests настроена!' as status;

-- ==============================================================
-- ЧАСТЬ 6: ВКЛЮЧЕНИЕ REALTIME
-- ==============================================================

DO $$
BEGIN
  -- Добавляем transactions в realtime
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
    RAISE NOTICE 'Realtime для transactions включен';
  END IF;

  -- Добавляем withdrawal_requests в realtime
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'withdrawal_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE withdrawal_requests;
    RAISE NOTICE 'Realtime для withdrawal_requests включен';
  END IF;
END $$;

SELECT '✅ Realtime настроен!' as status;

COMMIT;

-- ==============================================================
-- ЧАСТЬ 7: ПРОВЕРКА НАСТРОЙКИ
-- ==============================================================

-- Проверяем таблицы
SELECT 
  'transactions' as table_name,
  COUNT(*) as record_count
FROM transactions
UNION ALL
SELECT 
  'withdrawal_requests' as table_name,
  COUNT(*) as record_count
FROM withdrawal_requests;

-- Проверяем триггеры
SELECT 
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name IN (
  'trg_payout_created',
  'trg_withdrawal_request_created',
  'trg_withdrawal_request_updated'
)
ORDER BY event_object_table, trigger_name;

-- Проверяем функции
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name IN (
  'create_transaction',
  'on_payout_created',
  'on_withdrawal_request_created',
  'on_withdrawal_request_updated'
)
ORDER BY routine_name;

-- ==============================================================
-- ГОТОВО!
-- ==============================================================
SELECT '🎉 ФИНАНСОВАЯ СИСТЕМА ПОЛНОСТЬЮ НАСТРОЕНА!' as final_status;
