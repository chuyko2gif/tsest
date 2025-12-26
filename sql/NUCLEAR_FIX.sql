-- ==============================================================
-- ЯДЕРНОЕ ИСПРАВЛЕНИЕ - ПОЛНОЕ УДАЛЕНИЕ И ПЕРЕСОЗДАНИЕ
-- ==============================================================
-- Удаляет ВСЁ связанное с финансами и создаёт заново
-- ==============================================================

-- Отключаем все ограничения временно
SET session_replication_role = 'replica';

-- Удаляем realtime подписки
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS payouts;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS transactions;

-- Удаляем все политики
DROP POLICY IF EXISTS "Users view own payouts" ON payouts;
DROP POLICY IF EXISTS "Admins view all payouts" ON payouts;
DROP POLICY IF EXISTS "Admins insert payouts" ON payouts;
DROP POLICY IF EXISTS "Admins delete payouts" ON payouts;
DROP POLICY IF EXISTS "Users view own transactions" ON transactions;
DROP POLICY IF EXISTS "Admins view all transactions" ON transactions;

-- Удаляем все триггеры
DROP TRIGGER IF EXISTS trg_payout_created ON payouts;

-- Удаляем все функции
DROP FUNCTION IF EXISTS create_transaction(UUID, TEXT, DECIMAL, UUID, TEXT, TEXT, JSONB, UUID) CASCADE;
DROP FUNCTION IF EXISTS create_transaction(UUID, TEXT, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS create_transaction CASCADE;
DROP FUNCTION IF EXISTS on_payout_created CASCADE;
DROP FUNCTION IF EXISTS cancel_transaction CASCADE;

-- ПРИНУДИТЕЛЬНО удаляем таблицы
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS payouts CASCADE;

SELECT '💥 Всё удалено принудительно' as status;

-- Включаем обратно ограничения
SET session_replication_role = 'origin';

-- ==============================================================
-- СОЗДАЁМ ЗАНОВО
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

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_reference ON transactions(reference_id);

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
-- PAYOUTS БЕЗ PAYMENT_METHOD!!!
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

CREATE INDEX idx_payouts_user_id ON payouts(user_id);
CREATE INDEX idx_payouts_created_at ON payouts(created_at DESC);

ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

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

SELECT '✅ Таблица payouts создана (БЕЗ payment_method!)' as status;

-- ==============================================================
-- ФУНКЦИИ
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
  SELECT COALESCE(balance, 0) INTO v_balance_before
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Пользователь не найден: %', p_user_id;
  END IF;

  CASE p_type
    WHEN 'payout' THEN v_amount_delta := p_amount;
    WHEN 'bonus' THEN v_amount_delta := p_amount;
    WHEN 'refund' THEN v_amount_delta := p_amount;
    WHEN 'adjustment' THEN v_amount_delta := p_amount;
    WHEN 'withdrawal' THEN v_amount_delta := -p_amount;
    ELSE RAISE EXCEPTION 'Неизвестный тип транзакции: %', p_type;
  END CASE;

  v_balance_after := v_balance_before + v_amount_delta;

  IF v_balance_after < 0 AND p_type = 'withdrawal' THEN
    RAISE EXCEPTION 'Недостаточно средств. Баланс: %, запрошено: %', 
      v_balance_before, ABS(v_amount_delta);
  END IF;

  INSERT INTO transactions (
    user_id, type, amount, balance_before, balance_after,
    description, reference_id, reference_table, metadata, created_by
  ) VALUES (
    p_user_id, p_type, p_amount, v_balance_before, v_balance_after,
    p_description, p_reference_id, p_reference_table, p_metadata,
    COALESCE(p_created_by, auth.uid())
  ) RETURNING id INTO v_transaction_id;

  UPDATE profiles
  SET balance = v_balance_after
  WHERE id = p_user_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT '✅ Функция create_transaction создана' as status;

-- ==============================================================
-- REALTIME
-- ==============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE payouts;

SELECT '✅ Realtime включен' as status;

-- ==============================================================
-- ПРОВЕРКА
-- ==============================================================

SELECT 
  '🎉 ФИНАНСОВАЯ СИСТЕМА ПОЛНОСТЬЮ ПЕРЕСОЗДАНА!' as status;

SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'payouts'
ORDER BY ordinal_position;
