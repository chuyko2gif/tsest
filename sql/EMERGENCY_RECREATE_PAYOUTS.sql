-- АВАРИЙНОЕ ПЕРЕСОЗДАНИЕ PAYOUTS БЕЗ PAYMENT_METHOD
BEGIN;

-- Сохраняем данные
CREATE TEMP TABLE payouts_backup AS 
SELECT id, user_id, year, quarter, amount, note, paid_by, is_read, created_at 
FROM payouts;

-- Удаляем таблицу полностью
DROP TABLE payouts CASCADE;

-- Создаём заново
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

-- Восстанавливаем данные
INSERT INTO payouts SELECT * FROM payouts_backup;

-- Индексы
CREATE INDEX idx_payouts_user_id ON payouts(user_id);
CREATE INDEX idx_payouts_created_at ON payouts(created_at DESC);

-- RLS
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

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE payouts;

COMMIT;

SELECT '✅ Таблица payouts пересоздана без payment_method' as status;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'payouts' ORDER BY ordinal_position;
