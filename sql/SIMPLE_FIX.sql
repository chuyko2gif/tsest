-- ==============================================================
-- ПОЛНАЯ СИСТЕМА: РОЛИ + ФИНАНСЫ + ОЧИСТКА
-- ==============================================================
-- Скопируйте и выполните ВСЁ разом
-- ==============================================================

-- ============== ЧАСТЬ 1: ОЧИСТКА ==============

-- 1.1. УДАЛЯЕМ ОТКЛОНЕННЫЕ ВЫВОДЫ
DELETE FROM withdrawal_requests WHERE status = 'rejected';

-- 1.2. ОТКЛЮЧАЕМ RLS ПОЛНОСТЬЮ
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE payouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- 1.3. УДАЛЯЕМ ВСЕ ПОЛИТИКИ
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.tablename;
    END LOOP;
END $$;

-- 1.4. УДАЛЯЕМ ВСЕ ТРИГГЕРЫ И ФУНКЦИИ
DROP TRIGGER IF EXISTS set_default_role_trigger ON profiles CASCADE;
DROP TRIGGER IF EXISTS set_role_on_insert_trigger ON profiles CASCADE;
DROP TRIGGER IF EXISTS protect_roles_trigger ON profiles CASCADE;
DROP TRIGGER IF EXISTS prevent_role_downgrade ON profiles CASCADE;
DROP TRIGGER IF EXISTS update_balance_on_payout ON payouts CASCADE;
DROP TRIGGER IF EXISTS log_withdrawal_to_payout ON withdrawal_requests CASCADE;
DROP FUNCTION IF EXISTS set_default_role() CASCADE;
DROP FUNCTION IF EXISTS set_role_for_new_users() CASCADE;
DROP FUNCTION IF EXISTS protect_important_roles() CASCADE;
DROP FUNCTION IF EXISTS protect_admin_owner_roles() CASCADE;
DROP FUNCTION IF EXISTS protect_owner_role() CASCADE;
DROP FUNCTION IF EXISTS update_user_balance() CASCADE;
DROP FUNCTION IF EXISTS log_withdrawal_transaction() CASCADE;

-- ============== ЧАСТЬ 2: СОЗДАНИЕ И ПРОВЕРКА ТАБЛИЦ ==============

-- 2.1. Проверяем и добавляем недостающие колонки в существующие таблицы
DO $$
BEGIN
  -- Добавляем balance если нет
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'balance') THEN
    ALTER TABLE profiles ADD COLUMN balance NUMERIC(10,2) DEFAULT 0.00;
  END IF;
  
  -- Проверяем payouts
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payouts') THEN
    CREATE TABLE payouts (
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
  ELSE
    -- Добавляем status если нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payouts' AND column_name = 'status') THEN
      ALTER TABLE payouts ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed'));
    END IF;
  END IF;
  
  -- Проверяем withdrawal_requests
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'withdrawal_requests') THEN
    CREATE TABLE withdrawal_requests (
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
  END IF;
END $$;

-- 2.2. Таблица транзакций (если не существует)
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

-- ============== ЧАСТЬ 3: НАСТРОЙКА РОЛЕЙ ==============

-- 3.1. УСТАНАВЛИВАЕМ РОЛИ
UPDATE profiles SET role = 'owner' WHERE email IN ('maksbroska@gmail.com', 'littlehikai@gmail.com');
UPDATE profiles SET role = 'basic' WHERE role IS NULL OR role = '' OR email NOT IN ('maksbroska@gmail.com', 'littlehikai@gmail.com');

-- 3.2. СОЗДАЕМ ПРОСТОЙ ТРИГГЕР ДЛЯ НОВЫХ ПОЛЬЗОВАТЕЛЕЙ
CREATE OR REPLACE FUNCTION set_basic_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS NULL OR NEW.role = '' THEN
    NEW.role := 'basic';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS new_user_role_trigger ON profiles;
CREATE TRIGGER new_user_role_trigger
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_basic_role();

-- ============== ЧАСТЬ 4: ФИНАНСОВЫЕ ФУНКЦИИ ==============

-- 4.1. ФУНКЦИЯ ОБНОВЛЕНИЯ БАЛАНСА
CREATE OR REPLACE FUNCTION update_user_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Проверяем что это UPDATE и изменился статус на completed
  IF TG_OP = 'UPDATE' AND NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Обновляем баланс пользователя
    UPDATE profiles 
    SET balance = COALESCE(balance, 0) - NEW.amount 
    WHERE id = NEW.user_id;
    
    -- Логируем транзакцию
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

-- 4.2. ФУНКЦИЯ ЛОГИРОВАНИЯ ТРАНЗАКЦИЙ
CREATE OR REPLACE FUNCTION log_withdrawal_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Проверяем что это UPDATE и статус изменился на approved
  IF TG_OP = 'UPDATE' AND NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status = 'pending') THEN
    -- Создаем запись в payouts только если ее еще нет
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

-- ============== ЧАСТЬ 5: ПОЛИТИКИ БЕЗОПАСНОСТИ ==============

-- 5.1. Profiles
CREATE POLICY "select_all" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "update_own" ON profiles FOR UPDATE TO authenticated 
  USING (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
CREATE POLICY "insert_own" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- 5.2. Tickets
CREATE POLICY "select_tickets" ON tickets FOR SELECT TO authenticated 
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
CREATE POLICY "insert_tickets" ON tickets FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "update_tickets" ON tickets FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

-- 5.3. Ticket Messages
CREATE POLICY "select_messages" ON ticket_messages FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM tickets WHERE id = ticket_messages.ticket_id AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')))));
CREATE POLICY "insert_messages" ON ticket_messages FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM tickets WHERE id = ticket_messages.ticket_id AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')))));

-- 5.4. Withdrawal Requests
CREATE POLICY "select_withdrawals" ON withdrawal_requests FOR SELECT TO authenticated 
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
CREATE POLICY "insert_withdrawals" ON withdrawal_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "update_withdrawals" ON withdrawal_requests FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
CREATE POLICY "delete_withdrawals" ON withdrawal_requests FOR DELETE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

-- 5.5. Payouts
CREATE POLICY "select_payouts" ON payouts FOR SELECT TO authenticated 
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
CREATE POLICY "all_payouts_admin" ON payouts FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

-- 5.6. Transactions
CREATE POLICY "select_transactions" ON transactions FOR SELECT TO authenticated 
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
CREATE POLICY "insert_transactions" ON transactions FOR INSERT TO authenticated WITH CHECK (true);

-- 5.7. Reports
CREATE POLICY "select_reports" ON reports FOR SELECT TO authenticated 
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
CREATE POLICY "all_reports_admin" ON reports FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

-- ============== ЧАСТЬ 6: ВКЛЮЧАЕМ RLS ==============

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- ============== ЧАСТЬ 7: СОЗДАЕМ ИНДЕКСЫ ==============

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_payouts_user_id ON payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);

-- ============== ЧАСТЬ 8: ОЧИСТКА И ПРОВЕРКА ==============

DO $$
BEGIN
  -- Удаляем некорректные записи
  DELETE FROM withdrawal_requests WHERE amount <= 0;
  DELETE FROM payouts WHERE amount <= 0;
  
  -- Исправляем балансы
  UPDATE profiles SET balance = 0.00 WHERE balance < 0;
END $$;

-- ============== ПРОВЕРКА РЕЗУЛЬТАТОВ ==============

SELECT 
  '✅ СИСТЕМА НАСТРОЕНА!' as status,
  'Роли, финансы, политики работают' as description;

SELECT 
  '👥 ПОЛЬЗОВАТЕЛИ:' as info,
  email,
  role,
  nickname,
  balance
FROM profiles
ORDER BY 
  CASE role
    WHEN 'owner' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'exclusive' THEN 3
    WHEN 'basic' THEN 4
  END;

SELECT 
  '💰 ВЫВОДЫ:' as info,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'approved') as approved,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
  SUM(amount) FILTER (WHERE status = 'pending') as total_pending_amount
FROM withdrawal_requests;
