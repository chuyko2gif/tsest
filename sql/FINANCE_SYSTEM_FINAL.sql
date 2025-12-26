-- ==============================================================
-- ФИНАНСОВАЯ СИСТЕМА THQ LABEL - ПОЛНАЯ ВЕРСИЯ
-- ==============================================================
-- ⚠️ ВНИМАНИЕ: Этот скрипт УДАЛЯЕТ ВСЕ финансовые данные!
-- Он удаляет таблицы: transactions, payouts
-- НЕ ТРОГАЕТ: profiles, releases, news, tickets, withdrawal_requests
-- ==============================================================

BEGIN;

-- ==============================================================
-- ШАГ 1: УДАЛЯЕМ ТОЛЬКО ФИНАНСОВЫЕ ТАБЛИЦЫ И ФУНКЦИИ
-- ==============================================================

-- Удаляем триггеры
DROP TRIGGER IF EXISTS trg_payout_created ON payouts CASCADE;

-- Удаляем ВСЕ версии функций
DROP FUNCTION IF EXISTS create_transaction CASCADE;
DROP FUNCTION IF EXISTS on_payout_created CASCADE;
DROP FUNCTION IF EXISTS cancel_transaction CASCADE;

-- Удаляем финансовые таблицы
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS payouts CASCADE;

SELECT '✅ Старые финансовые таблицы удалены' as status;

-- ==============================================================
-- ШАГ 2: СОЗДАЕМ ТАБЛИЦУ ТРАНЗАКЦИЙ
-- ==============================================================

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('payout', 'withdrawal', 'refund', 'adjustment', 'bonus')),
  amount DECIMAL(10, 2) NOT NULL,
  balance_before DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  description TEXT NOT NULL,
  reference_id UUID,
  reference_table TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_reference ON transactions(reference_id);

-- RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all transactions"
  ON transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

SELECT '✅ Таблица transactions создана' as status;

-- ==============================================================
-- ШАГ 3: СОЗДАЕМ ТАБЛИЦУ PAYOUTS
-- ==============================================================

CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  quarter INTEGER NOT NULL CHECK (quarter IN (1, 2, 3, 4)),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  note TEXT,
  paid_by TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payouts_user_id ON payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_created_at ON payouts(created_at DESC);

ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own payouts" ON payouts;
DROP POLICY IF EXISTS "Admins view all payouts" ON payouts;
DROP POLICY IF EXISTS "Admins insert payouts" ON payouts;

CREATE POLICY "Users view own payouts"
  ON payouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all payouts"
  ON payouts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Admins insert payouts"
  ON payouts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Admins delete payouts"
  ON payouts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

SELECT '✅ Таблица payouts создана' as status;

-- ==============================================================
-- ШАГ 4: ФУНКЦИЯ СОЗДАНИЯ ТРАНЗАКЦИИ
-- ==============================================================

CREATE OR REPLACE FUNCTION create_transaction(
  p_user_id UUID,
  p_type TEXT,
  p_amount DECIMAL,
  p_reference_id UUID DEFAULT NULL,
  p_reference_table TEXT DEFAULT NULL,
  p_description TEXT DEFAULT '',
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_created_by UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_balance_before DECIMAL(10, 2);
  v_balance_after DECIMAL(10, 2);
  v_transaction_id UUID;
  v_amount_delta DECIMAL(10, 2);
BEGIN
  -- Получаем текущий баланс с блокировкой
  SELECT COALESCE(balance, 0) INTO v_balance_before
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Пользователь не найден: %', p_user_id;
  END IF;

  -- Определяем изменение баланса
  CASE p_type
    WHEN 'payout' THEN v_amount_delta := p_amount;
    WHEN 'bonus' THEN v_amount_delta := p_amount;
    WHEN 'refund' THEN v_amount_delta := p_amount;
    WHEN 'adjustment' THEN v_amount_delta := p_amount;
    WHEN 'withdrawal' THEN v_amount_delta := -p_amount;
    ELSE RAISE EXCEPTION 'Неизвестный тип транзакции: %', p_type;
  END CASE;

  v_balance_after := v_balance_before + v_amount_delta;

  -- Проверка баланса только для списаний
  IF v_balance_after < 0 AND p_type = 'withdrawal' THEN
    RAISE EXCEPTION 'Недостаточно средств. Баланс: %, запрошено: %', 
      v_balance_before, ABS(v_amount_delta);
  END IF;

  -- Создаем транзакцию
  INSERT INTO transactions (
    user_id, type, amount, balance_before, balance_after,
    description, reference_id, reference_table, metadata, created_by
  ) VALUES (
    p_user_id, p_type, p_amount, v_balance_before, v_balance_after,
    p_description, p_reference_id, p_reference_table, p_metadata,
    COALESCE(p_created_by, auth.uid())
  ) RETURNING id INTO v_transaction_id;

  -- Обновляем баланс
  UPDATE profiles
  SET balance = v_balance_after
  WHERE id = p_user_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT '✅ Функция create_transaction создана' as status;

-- ==============================================================
-- ШАГ 5: ФУНКЦИЯ ОТМЕНЫ ТРАНЗАКЦИИ
-- ==============================================================

CREATE OR REPLACE FUNCTION cancel_transaction(
  p_transaction_id UUID,
  p_cancelled_by UUID,
  p_reason TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_transaction RECORD;
BEGIN
  -- Получаем транзакцию
  SELECT * INTO v_transaction
  FROM transactions
  WHERE id = p_transaction_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Транзакция не найдена: %', p_transaction_id;
  END IF;

  -- Создаем обратную транзакцию
  IF v_transaction.type = 'payout' THEN
    PERFORM create_transaction(
      v_transaction.user_id,
      'adjustment',
      -v_transaction.amount,
      NULL,
      NULL,
      'Отмена: ' || v_transaction.description || ' - ' || p_reason,
      jsonb_build_object('cancelled_transaction_id', p_transaction_id, 'reason', p_reason),
      p_cancelled_by
    );
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT '✅ Функция cancel_transaction создана' as status;

-- ==============================================================
-- ШАГ 6: ВКЛЮЧАЕМ REALTIME
-- ==============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'payouts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE payouts;
  END IF;
END $$;

SELECT '✅ Realtime включен' as status;

COMMIT;

-- ==============================================================
-- ПРОВЕРКА
-- ==============================================================

SELECT 
  '🎉 ФИНАНСОВАЯ СИСТЕМА НАСТРОЕНА!' as status,
  (SELECT COUNT(*) FROM transactions) as transactions_count,
  (SELECT COUNT(*) FROM payouts) as payouts_count,
  (SELECT SUM(balance) FROM profiles) as total_balance;

SELECT 
  'Таблица: transactions' as info,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'transactions'
  AND column_name IN ('id', 'reference_id')
ORDER BY ordinal_position;

SELECT 
  'Таблица: payouts' as info,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'payouts'
  AND column_name = 'id'
ORDER BY ordinal_position;
