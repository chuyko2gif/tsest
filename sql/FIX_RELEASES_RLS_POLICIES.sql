-- ============================================
-- ИСПРАВЛЕНИЕ RLS ПОЛИТИК ДЛЯ RELEASES_BASIC И RELEASES_EXCLUSIVE
-- ============================================

-- Удаляем все старые политики для releases_basic
DROP POLICY IF EXISTS "Users can view own basic releases" ON releases_basic;
DROP POLICY IF EXISTS "Users can create own basic releases" ON releases_basic;
DROP POLICY IF EXISTS "Users can update own pending basic releases" ON releases_basic;
DROP POLICY IF EXISTS "Admins can view all basic releases" ON releases_basic;
DROP POLICY IF EXISTS "Admins can update all basic releases" ON releases_basic;

-- Удаляем все старые политики для releases_exclusive
DROP POLICY IF EXISTS "Users can view own exclusive releases" ON releases_exclusive;
DROP POLICY IF EXISTS "Users can create own exclusive releases" ON releases_exclusive;
DROP POLICY IF EXISTS "Users can update own pending exclusive releases" ON releases_exclusive;
DROP POLICY IF EXISTS "Admins can view all exclusive releases" ON releases_exclusive;
DROP POLICY IF EXISTS "Admins can update all exclusive releases" ON releases_exclusive;

-- ============================================
-- НОВЫЕ ПОЛИТИКИ ДЛЯ RELEASES_BASIC
-- ============================================

-- 1. Просмотр: пользователи видят свои релизы, админы видят все
CREATE POLICY "Enable read access for users and admins"
ON releases_basic FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'owner')
  )
);

-- 2. Создание: пользователи могут создавать свои релизы
CREATE POLICY "Enable insert for authenticated users"
ON releases_basic FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Обновление: пользователи могут обновлять свои pending релизы, админы могут обновлять все
CREATE POLICY "Enable update for users and admins"
ON releases_basic FOR UPDATE
TO authenticated
USING (
  (auth.uid() = user_id AND status = 'pending')
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'owner')
  )
)
WITH CHECK (
  (auth.uid() = user_id AND status = 'pending')
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'owner')
  )
);

-- ============================================
-- НОВЫЕ ПОЛИТИКИ ДЛЯ RELEASES_EXCLUSIVE
-- ============================================

-- 1. Просмотр: пользователи видят свои релизы, админы видят все
CREATE POLICY "Enable read access for users and admins"
ON releases_exclusive FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'owner')
  )
);

-- 2. Создание: пользователи могут создавать свои релизы
CREATE POLICY "Enable insert for authenticated users"
ON releases_exclusive FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Обновление: пользователи могут обновлять свои pending релизы, админы могут обновлять все
CREATE POLICY "Enable update for users and admins"
ON releases_exclusive FOR UPDATE
TO authenticated
USING (
  (auth.uid() = user_id AND status = 'pending')
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'owner')
  )
)
WITH CHECK (
  (auth.uid() = user_id AND status = 'pending')
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'owner')
  )
);

-- ============================================
-- ПРОВЕРКА
-- ============================================

-- Проверить что политики созданы
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('releases_basic', 'releases_exclusive')
ORDER BY tablename, cmd;

-- ============================================
-- ГОТОВО!
-- ============================================
-- RLS политики обновлены и должны работать корректно
