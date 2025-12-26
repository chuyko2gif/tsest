-- ==============================================================
-- ПРОВЕРКА И ВОССТАНОВЛЕНИЕ WITHDRAWAL_REQUESTS
-- ==============================================================

-- Проверяем существует ли таблица
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'withdrawal_requests'
) as table_exists;

-- Показываем структуру если существует
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'withdrawal_requests'
ORDER BY ordinal_position;

-- Проверяем RLS
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'withdrawal_requests';

-- Если таблица существует но пуста, просто включаем RLS правильно
-- Если таблицы нет - нужно пересоздать

-- Включаем RLS обратно (если отключили)
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Удаляем все политики
DROP POLICY IF EXISTS "Users can view own withdrawal requests" ON withdrawal_requests;
DROP POLICY IF EXISTS "Users can create own withdrawal requests" ON withdrawal_requests;
DROP POLICY IF EXISTS "Admins can view all withdrawal requests" ON withdrawal_requests;
DROP POLICY IF EXISTS "Admins can update withdrawal requests" ON withdrawal_requests;

-- Создаем правильные политики
CREATE POLICY "Users can view own withdrawals"
  ON withdrawal_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create withdrawals"
  ON withdrawal_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all withdrawals"
  ON withdrawal_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Admins update withdrawals"
  ON withdrawal_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

SELECT '✅ Политики настроены!' as status;

-- Проверяем политики
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'withdrawal_requests';
