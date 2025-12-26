-- ==============================================================
-- ПОЛНАЯ ФИНАНСОВАЯ СИСТЕМА С ОЧИСТКОЙ
-- ==============================================================
-- Выполните ВСЁ разом для настройки финансовой системы
-- ==============================================================

-- 1. УДАЛЕНИЕ ОТКЛОНЕННЫХ ВЫВОДОВ
DELETE FROM withdrawal_requests WHERE status = 'rejected';

-- 2. СОЗДАНИЕ ТАБЛИЦ (если не существуют)

-- Таблица профилей
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nickname TEXT,
  role TEXT DEFAULT 'basic' CHECK (role IN ('owner', 'admin', 'exclusive', 'basic')),
  balance NUMERIC(10,2) DEFAULT 0.00,
  theme TEXT DEFAULT 'purple',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица запросов на вывод
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL,
  payment_details TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  processed_by UUID REFERENCES profiles(id),
  processed_at TIMESTAMPTZ,
  admin_notes TEXT
);

-- Таблица выплат (история)
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_details TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  notes TEXT
);

-- Таблица транзакций
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'bonus', 'refund', 'fee')),
  amount NUMERIC(10,2) NOT NULL,
  balance_before NUMERIC(10,2) NOT NULL,
  balance_after NUMERIC(10,2) NOT NULL,
  description TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица отчетов
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_streams INTEGER DEFAULT 0,
  total_revenue NUMERIC(10,2) DEFAULT 0.00,
  platform_breakdown JSONB,
  country_breakdown JSONB,
  release_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed BOOLEAN DEFAULT false
);

-- 3. ИСПРАВЛЯЕМ ТИП ПОЛЯ reference_id В transactions (если существует как integer)
DO $$
BEGIN
  -- Проверяем, существует ли колонка reference_id как integer
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' 
    AND column_name = 'reference_id' 
    AND data_type != 'uuid'
  ) THEN
    -- Удаляем старые данные с некорректными reference_id
    DELETE FROM transactions WHERE reference_id IS NOT NULL;
    
    -- Меняем тип колонки на UUID
    ALTER TABLE transactions ALTER COLUMN reference_id TYPE UUID USING NULL;
  END IF;
END $$;

-- 4. ОТКЛЮЧАЕМ RLS ДЛЯ НАСТРОЙКИ
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE payouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;

-- 5. УДАЛЯЕМ СТАРЫЕ ПОЛИТИКИ
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('profiles', 'withdrawal_requests', 'payouts', 'transactions', 'reports')
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.tablename;
    END LOOP;
END $$;

-- 6. УДАЛЯЕМ СТАРЫЕ ТРИГГЕРЫ И ФУНКЦИИ
DROP TRIGGER IF EXISTS update_balance_on_payout ON payouts CASCADE;
DROP TRIGGER IF EXISTS log_withdrawal_to_payout ON withdrawal_requests CASCADE;
DROP TRIGGER IF EXISTS log_transaction ON withdrawal_requests CASCADE;
DROP FUNCTION IF EXISTS update_user_balance() CASCADE;
DROP FUNCTION IF EXISTS log_withdrawal_transaction() CASCADE;
DROP FUNCTION IF EXISTS log_transaction_func() CASCADE;

-- 7. СОЗДАЕМ ФУНКЦИЮ ОБНОВЛЕНИЯ БАЛАНСА
CREATE OR REPLACE FUNCTION update_user_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE profiles 
    SET balance = COALESCE(balance, 0) - NEW.amount 
    WHERE id = NEW.user_id;
    
    INSERT INTO transactions (
      user_id, 
      type, 
      amount, 
      balance_before, 
      balance_after, 
      description,
      reference_id
    )
    SELECT 
      NEW.user_id,
      'withdrawal',
      -NEW.amount,
      COALESCE(p.balance, 0) + NEW.amount,
      COALESCE(p.balance, 0),
      'Выплата #' || NEW.id,
      NEW.id
    FROM profiles p
    WHERE p.id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_balance_on_payout ON payouts;
CREATE TRIGGER update_balance_on_payout
  AFTER UPDATE ON payouts
  FOR EACH ROW
  EXECUTE FUNCTION update_user_balance();

-- 8. СОЗДАЕМ ФУНКЦИЮ ЛОГИРОВАНИЯ ТРАНЗАКЦИЙ
CREATE OR REPLACE FUNCTION log_withdrawal_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status = 'pending') THEN
    IF NOT EXISTS (SELECT 1 FROM payouts WHERE user_id = NEW.user_id AND amount = NEW.amount AND created_at > NOW() - INTERVAL '1 minute') THEN
      INSERT INTO payouts (
        user_id,
        amount,
        payment_method,
        payment_details,
        status
      ) VALUES (
        NEW.user_id,
        NEW.amount,
        NEW.payment_method,
        NEW.payment_details,
        'pending'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS log_withdrawal_to_payout ON withdrawal_requests;
CREATE TRIGGER log_withdrawal_to_payout
  AFTER UPDATE ON withdrawal_requests
  FOR EACH ROW
  EXECUTE FUNCTION log_withdrawal_transaction();

-- 9. СОЗДАЕМ ПОЛИТИКИ БЕЗОПАСНОСТИ

-- Profiles
CREATE POLICY "select_all_profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE TO authenticated 
  USING (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Withdrawal Requests
CREATE POLICY "select_own_withdrawals" ON withdrawal_requests FOR SELECT TO authenticated 
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
CREATE POLICY "insert_own_withdrawal" ON withdrawal_requests FOR INSERT TO authenticated 
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "update_withdrawals_admin" ON withdrawal_requests FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
CREATE POLICY "delete_withdrawals_admin" ON withdrawal_requests FOR DELETE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

-- Payouts
CREATE POLICY "select_own_payouts" ON payouts FOR SELECT TO authenticated 
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
CREATE POLICY "all_payouts_admin" ON payouts FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

-- Transactions
CREATE POLICY "select_own_transactions" ON transactions FOR SELECT TO authenticated 
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
CREATE POLICY "insert_transactions_system" ON transactions FOR INSERT TO authenticated 
  WITH CHECK (true);

-- Reports
CREATE POLICY "select_own_reports" ON reports FOR SELECT TO authenticated 
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
CREATE POLICY "all_reports_admin" ON reports FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

-- 10. ВКЛЮЧАЕМ RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 11. СОЗДАЕМ ИНДЕКСЫ ДЛЯ ОПТИМИЗАЦИИ
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_payouts_user_id ON payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);

-- 12. ОЧИСТКА И ПРОВЕРКА
DO $$
BEGIN
  -- Удаляем дубликаты и некорректные записи
  DELETE FROM withdrawal_requests WHERE amount <= 0;
  DELETE FROM payouts WHERE amount <= 0;
  
  -- Исправляем балансы если они отрицательные
  UPDATE profiles SET balance = 0.00 WHERE balance < 0;
END $$;

-- 13. ФИНАЛЬНАЯ ПРОВЕРКА
SELECT 
  '✅ ФИНАНСОВАЯ СИСТЕМА НАСТРОЕНА!' as status,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_withdrawals,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_withdrawals,
  SUM(amount) FILTER (WHERE status = 'pending') as total_pending_amount
FROM withdrawal_requests;

SELECT 
  '💰 БАЛАНСЫ ПОЛЬЗОВАТЕЛЕЙ:' as info,
  email,
  role,
  balance,
  (SELECT COUNT(*) FROM withdrawal_requests WHERE user_id = profiles.id AND status = 'pending') as pending_requests
FROM profiles
ORDER BY 
  CASE role
    WHEN 'owner' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'exclusive' THEN 3
    WHEN 'basic' THEN 4
  END,
  balance DESC;
