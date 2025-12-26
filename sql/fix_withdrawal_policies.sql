-- ==============================================================
-- ИСПРАВЛЕНИЕ ПОЛИТИК ДЛЯ WITHDRAWAL_REQUESTS
-- ==============================================================
-- Проблема: выводы не видны пользователям и админам
-- Решение: пересоздаем все политики для withdrawal_requests
-- ==============================================================

-- Отключаем RLS временно
ALTER TABLE withdrawal_requests DISABLE ROW LEVEL SECURITY;

-- Удаляем все старые политики
DROP POLICY IF EXISTS "Users can view own withdrawal requests" ON withdrawal_requests;
DROP POLICY IF EXISTS "Users can create own withdrawal requests" ON withdrawal_requests;
DROP POLICY IF EXISTS "Admins can view all withdrawal requests" ON withdrawal_requests;
DROP POLICY IF EXISTS "Admins can update withdrawal requests" ON withdrawal_requests;

-- Включаем RLS обратно
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Создаем политику SELECT для пользователей (свои заявки)
CREATE POLICY "Users can view own withdrawal requests"
  ON withdrawal_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Создаем политику INSERT для пользователей
CREATE POLICY "Users can create own withdrawal requests"
  ON withdrawal_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Создаем политику SELECT для админов и овнеров (все заявки)
CREATE POLICY "Admins can view all withdrawal requests"
  ON withdrawal_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- Создаем политику UPDATE для админов и овнеров
CREATE POLICY "Admins can update withdrawal requests"
  ON withdrawal_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

SELECT '✅ Политики withdrawal_requests исправлены!' as status;

-- Проверяем политики
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'withdrawal_requests'
ORDER BY policyname;

-- Проверяем данные (должны быть видны)
SELECT 
  id,
  user_id,
  amount,
  status,
  created_at
FROM withdrawal_requests
ORDER BY created_at DESC
LIMIT 5;
