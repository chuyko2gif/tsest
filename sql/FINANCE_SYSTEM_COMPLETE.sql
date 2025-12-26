-- ==============================================================
-- ПОЛНАЯ НАСТРОЙКА ФИНАНСОВОЙ СИСТЕМЫ THQ LABEL
-- ==============================================================
-- Выполните этот скрипт для полной настройки системы финансов
-- ==============================================================

-- 1. УДАЛЯЕМ СТАРЫЕ ТАБЛИЦЫ ЕСЛИ СУЩЕСТВУЮТ
DROP TABLE IF EXISTS withdrawal_requests CASCADE;
DROP TABLE IF EXISTS payouts CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;

-- 2. СОЗДАЕМ ТАБЛИЦУ ВЫПЛАТ (КВАРТАЛЬНЫЕ НАЧИСЛЕНИЯ)
CREATE TABLE IF NOT EXISTS payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  year INTEGER NOT NULL CHECK (year >= 2024),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_payouts_user_id ON payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_quarter_year ON payouts(quarter, year);
CREATE INDEX IF NOT EXISTS idx_payouts_created_at ON payouts(created_at DESC);

-- 3. СОЗДАЕМ ТАБЛИЦУ ЗАЯВОК НА ВЫВОД СРЕДСТВ
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  
  -- Платежные реквизиты
  payment_method TEXT NOT NULL DEFAULT 'bank_card',
  payment_details TEXT NOT NULL,
  bank_name TEXT,
  card_number TEXT,
  recipient_name TEXT,
  additional_info TEXT,
  
  -- Администрирование
  admin_comment TEXT,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ,
  
  -- Временные метки
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON withdrawal_requests(created_at DESC);

-- 4. ДОБАВЛЯЕМ ПОЛЕ BALANCE В PROFILES ЕСЛИ ЕГО НЕТ
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'balance'
  ) THEN
    ALTER TABLE profiles ADD COLUMN balance DECIMAL(10,2) DEFAULT 0 CHECK (balance >= 0);
  END IF;
END $$;

-- Индекс для баланса
CREATE INDEX IF NOT EXISTS idx_profiles_balance ON profiles(balance);

-- 5. ФУНКЦИЯ ДЛЯ АВТОМАТИЧЕСКОГО ОБНОВЛЕНИЯ updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для автообновления
DROP TRIGGER IF EXISTS update_payouts_updated_at ON payouts;
CREATE TRIGGER update_payouts_updated_at
  BEFORE UPDATE ON payouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_withdrawals_updated_at ON withdrawal_requests;
CREATE TRIGGER update_withdrawals_updated_at
  BEFORE UPDATE ON withdrawal_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. ВКЛЮЧАЕМ RLS (ROW LEVEL SECURITY)
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- 7. УДАЛЯЕМ СТАРЫЕ ПОЛИТИКИ
DROP POLICY IF EXISTS "select_payouts" ON payouts;
DROP POLICY IF EXISTS "insert_payouts_admin" ON payouts;
DROP POLICY IF EXISTS "update_payouts_admin" ON payouts;
DROP POLICY IF EXISTS "delete_payouts_admin" ON payouts;
DROP POLICY IF EXISTS "all_payouts_admin" ON payouts;

DROP POLICY IF EXISTS "select_withdrawals" ON withdrawal_requests;
DROP POLICY IF EXISTS "insert_withdrawals" ON withdrawal_requests;
DROP POLICY IF EXISTS "update_withdrawals_admin" ON withdrawal_requests;
DROP POLICY IF EXISTS "delete_withdrawals_admin" ON withdrawal_requests;
DROP POLICY IF EXISTS "update_withdrawals" ON withdrawal_requests;

-- 8. СОЗДАЕМ ПОЛИТИКИ ДЛЯ PAYOUTS
-- Пользователи видят только свои выплаты, админы - все
CREATE POLICY "select_payouts" ON payouts 
  FOR SELECT TO authenticated 
  USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

-- Только админы могут создавать выплаты
CREATE POLICY "insert_payouts_admin" ON payouts 
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

-- Только админы могут обновлять выплаты
CREATE POLICY "update_payouts_admin" ON payouts 
  FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

-- Только админы могут удалять выплаты
CREATE POLICY "delete_payouts_admin" ON payouts 
  FOR DELETE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

-- 9. СОЗДАЕМ ПОЛИТИКИ ДЛЯ WITHDRAWAL_REQUESTS
-- Пользователи видят свои заявки, админы - все
CREATE POLICY "select_withdrawals" ON withdrawal_requests 
  FOR SELECT TO authenticated 
  USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

-- Пользователи могут создавать заявки на вывод
CREATE POLICY "insert_withdrawals" ON withdrawal_requests 
  FOR INSERT TO authenticated 
  WITH CHECK (user_id = auth.uid());

-- Только админы могут обновлять заявки (менять статус)
CREATE POLICY "update_withdrawals_admin" ON withdrawal_requests 
  FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

-- Только админы могут удалять заявки
CREATE POLICY "delete_withdrawals_admin" ON withdrawal_requests 
  FOR DELETE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

-- 10. ВКЛЮЧАЕМ REALTIME ДЛЯ УВЕДОМЛЕНИЙ
ALTER PUBLICATION supabase_realtime ADD TABLE payouts;
ALTER PUBLICATION supabase_realtime ADD TABLE withdrawal_requests;

-- 11. УДАЛЯЕМ ВСЕ ОТКЛОНЕННЫЕ ЗАЯВКИ (ОЧИСТКА)
DELETE FROM withdrawal_requests WHERE status = 'rejected';

-- 12. ПРОВЕРКА И ОТЧЕТ
SELECT 
  '✅ ФИНАНСОВАЯ СИСТЕМА УСТАНОВЛЕНА!' as status,
  (SELECT COUNT(*) FROM payouts) as total_payouts,
  (SELECT COUNT(*) FROM withdrawal_requests) as total_withdrawals,
  (SELECT COUNT(*) FROM withdrawal_requests WHERE status = 'pending') as pending_withdrawals,
  (SELECT SUM(balance) FROM profiles) as total_balance
;

-- 13. ПОКАЗЫВАЕМ СТРУКТУРУ ТАБЛИЦ
SELECT 
  '📊 СТРУКТУРА PAYOUTS:' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'payouts'
ORDER BY ordinal_position;

SELECT 
  '📊 СТРУКТУРА WITHDRAWAL_REQUESTS:' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'withdrawal_requests'
ORDER BY ordinal_position;

-- ГОТОВО! Система настроена и готова к использованию.
