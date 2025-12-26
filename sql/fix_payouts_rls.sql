-- ========================================
-- ИСПРАВЛЕНИЕ RLS ДЛЯ ТАБЛИЦЫ PAYOUTS
-- ========================================

-- Удаляем старые политики
DROP POLICY IF EXISTS "Users can view own payouts" ON payouts;
DROP POLICY IF EXISTS "Admins can view all payouts" ON payouts;
DROP POLICY IF EXISTS "Admins can create payouts" ON payouts;
DROP POLICY IF EXISTS "Admins can update payouts" ON payouts;
DROP POLICY IF EXISTS "Admins can delete payouts" ON payouts;
DROP POLICY IF EXISTS "Users can mark own payouts as read" ON payouts;
DROP POLICY IF EXISTS "Owner can create payouts" ON payouts;
DROP POLICY IF EXISTS "Owner can update payouts" ON payouts;
DROP POLICY IF EXISTS "Owner can delete payouts" ON payouts;

-- Включаем RLS если еще не включено
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- Пользователи могут видеть свои выплаты
CREATE POLICY "Users can view own payouts" ON payouts
FOR SELECT USING (auth.uid() = user_id);

-- Админы и овнеры могут видеть все выплаты
CREATE POLICY "Admins can view all payouts" ON payouts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.role = 'owner')
  )
);

-- ТОЛЬКО овнер может создавать выплаты
CREATE POLICY "Owner can create payouts" ON payouts
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'owner'
  )
);

-- ТОЛЬКО овнер может обновлять выплаты
CREATE POLICY "Owner can update payouts" ON payouts
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'owner'
  )
);

-- ТОЛЬКО овнер может удалять выплаты
CREATE POLICY "Owner can delete payouts" ON payouts
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'owner'
  )
);

-- Пользователи могут обновлять is_read на своих выплатах
CREATE POLICY "Users can mark own payouts as read" ON payouts
FOR UPDATE USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ========================================
-- ПРОВЕРКА
-- ========================================
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'payouts';
