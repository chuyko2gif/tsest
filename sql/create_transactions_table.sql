-- ==============================================================
-- СОЗДАНИЕ ТАБЛИЦЫ ТРАНЗАКЦИЙ ДЛЯ ФИНАНСОВОЙ СИСТЕМЫ
-- ==============================================================

-- Создаем таблицу для всех финансовых операций
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('payout', 'withdrawal', 'refund', 'correction')),
  amount DECIMAL(10,2) NOT NULL,
  balance_before DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'failed')),
  reference_id INTEGER, -- ID связанной записи (payout_id или withdrawal_id)
  reference_table TEXT, -- Таблица связанной записи ('payouts' или 'withdrawal_requests')
  description TEXT,
  metadata JSONB, -- Дополнительные данные (квартал, год, админ и т.д.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES profiles(id),
  cancellation_reason TEXT
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions(reference_table, reference_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- Комментарии
COMMENT ON TABLE transactions IS 'Все финансовые транзакции пользователей для полного аудита';
COMMENT ON COLUMN transactions.type IS 'Тип транзакции: payout (начисление), withdrawal (вывод), refund (возврат), correction (коррекция)';
COMMENT ON COLUMN transactions.balance_before IS 'Баланс ДО транзакции';
COMMENT ON COLUMN transactions.balance_after IS 'Баланс ПОСЛЕ транзакции';
COMMENT ON COLUMN transactions.reference_id IS 'ID связанной записи в другой таблице';
COMMENT ON COLUMN transactions.reference_table IS 'Название таблицы связанной записи';

-- Включаем RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики если существуют
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Admins view all transactions" ON transactions;
DROP POLICY IF EXISTS "Admins create transactions" ON transactions;
DROP POLICY IF EXISTS "Owners cancel transactions" ON transactions;

-- Политики доступа
-- Пользователи видят только свои транзакции
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Админы и овнеры видят все транзакции
CREATE POLICY "Admins view all transactions"
  ON transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- Только админы и овнеры могут создавать транзакции
CREATE POLICY "Admins create transactions"
  ON transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- Только овнеры могут отменять транзакции
CREATE POLICY "Owners cancel transactions"
  ON transactions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'owner'
    )
  );

-- Функция для создания транзакции с проверкой баланса
CREATE OR REPLACE FUNCTION create_transaction(
  p_user_id UUID,
  p_type TEXT,
  p_amount DECIMAL(10,2),
  p_reference_id UUID DEFAULT NULL,
  p_reference_table TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_current_balance DECIMAL(10,2);
  v_new_balance DECIMAL(10,2);
  v_transaction_id UUID;
BEGIN
  -- Получаем текущий баланс с блокировкой строки
  SELECT balance INTO v_current_balance
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  -- Проверяем существование пользователя
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Пользователь не найден: %', p_user_id;
  END IF;

  -- Вычисляем новый баланс
  IF p_type IN ('payout', 'refund') THEN
    v_new_balance := v_current_balance + p_amount;
  ELSIF p_type IN ('withdrawal', 'correction') THEN
    v_new_balance := v_current_balance - p_amount;
    -- Проверяем достаточность средств
    IF v_new_balance < 0 THEN
      RAISE EXCEPTION 'Недостаточно средств. Баланс: %, Требуется: %', v_current_balance, p_amount;
    END IF;
  ELSE
    RAISE EXCEPTION 'Неизвестный тип транзакции: %', p_type;
  END IF;

  -- Создаем транзакцию
  INSERT INTO transactions (
    user_id, type, amount, balance_before, balance_after,
    reference_id, reference_table, description, metadata, created_by
  ) VALUES (
    p_user_id, p_type, p_amount, v_current_balance, v_new_balance,
    p_reference_id, p_reference_table, p_description, p_metadata, p_created_by
  ) RETURNING id INTO v_transaction_id;

  -- Обновляем баланс пользователя
  UPDATE profiles
  SET balance = v_new_balance
  WHERE id = p_user_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Функция для отмены транзакции
CREATE OR REPLACE FUNCTION cancel_transaction(
  p_transaction_id UUID,
  p_cancelled_by UUID,
  p_reason TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_transaction RECORD;
  v_reverse_amount DECIMAL(10,2);
BEGIN
  -- Получаем транзакцию с блокировкой
  SELECT * INTO v_transaction
  FROM transactions
  WHERE id = p_transaction_id
  FOR UPDATE;

  -- Проверки
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Транзакция не найдена: %', p_transaction_id;
  END IF;

  IF v_transaction.status = 'cancelled' THEN
    RAISE EXCEPTION 'Транзакция уже отменена';
  END IF;

  IF v_transaction.status != 'completed' THEN
    RAISE EXCEPTION 'Можно отменить только завершенные транзакции';
  END IF;

  -- Проверяем, не было ли выводов после этой транзакции
  IF v_transaction.type = 'payout' THEN
    IF EXISTS (
      SELECT 1 FROM transactions
      WHERE user_id = v_transaction.user_id
        AND type = 'withdrawal'
        AND status = 'completed'
        AND created_at > v_transaction.created_at
    ) THEN
      RAISE EXCEPTION 'Нельзя отменить: пользователь уже выводил средства после этой транзакции';
    END IF;
  END IF;

  -- Создаем обратную транзакцию
  IF v_transaction.type IN ('payout', 'refund') THEN
    -- Если было начисление - списываем
    PERFORM create_transaction(
      v_transaction.user_id,
      'correction',
      v_transaction.amount,
      NULL,
      NULL,
      'Отмена транзакции: ' || v_transaction.id,
      jsonb_build_object('cancelled_transaction_id', p_transaction_id, 'reason', p_reason),
      p_cancelled_by
    );
  ELSIF v_transaction.type IN ('withdrawal', 'correction') THEN
    -- Если было списание - возвращаем
    PERFORM create_transaction(
      v_transaction.user_id,
      'refund',
      v_transaction.amount,
      NULL,
      NULL,
      'Возврат средств: ' || v_transaction.id,
      jsonb_build_object('cancelled_transaction_id', p_transaction_id, 'reason', p_reason),
      p_cancelled_by
    );
  END IF;

  -- Помечаем транзакцию как отмененную
  UPDATE transactions
  SET 
    status = 'cancelled',
    cancelled_at = NOW(),
    cancelled_by = p_cancelled_by,
    cancellation_reason = p_reason
  WHERE id = p_transaction_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

SELECT '✅ Таблица transactions создана и настроена!' as status;

-- ==============================================================
-- ИНТЕГРАЦИЯ С WITHDRAWAL_REQUESTS
-- ==============================================================

-- Функция для обработки создания заявки на вывод
CREATE OR REPLACE FUNCTION on_withdrawal_request_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Списываем средства с баланса при создании заявки
  PERFORM create_transaction(
    NEW.user_id,
    'withdrawal',
    NEW.amount,
    NEW.id::INTEGER,
    'withdrawal_requests',
    'Заявка на вывод средств #' || NEW.id,
    jsonb_build_object(
      'bank_name', NEW.bank_name,
      'card_number', NEW.card_number
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
      NEW.id::INTEGER,
      'withdrawal_requests',
      'Возврат средств - заявка отклонена #' || NEW.id,
      jsonb_build_object(
        'admin_comment', NEW.admin_comment,
        'reason', 'withdrawal_rejected'
      ),
      NULL
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
