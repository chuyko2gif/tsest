-- ==============================================================
-- ИСПРАВЛЕНИЕ ПОЛИТИКИ UPDATE ДЛЯ АДМИНОВ И ОВНЕРОВ
-- ==============================================================
-- Проблема: админы и овнеры не могут обновлять роли пользователей
-- Решение: обновляем политику чтобы включить admin и owner
-- ==============================================================

-- Удаляем старую политику
DROP POLICY IF EXISTS "Enable update for admins" ON profiles;

-- Создаем новую политику для админов и овнеров
CREATE POLICY "Enable update for admins and owners" ON profiles
  FOR UPDATE TO authenticated
  USING (
    -- Разрешаем пользователям обновлять свой профиль
    auth.uid() = id
    OR
    -- Разрешаем админам и овнерам обновлять любые профили
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

COMMENT ON POLICY "Enable update for admins and owners" ON profiles IS 'Пользователи могут обновлять свой профиль, админы и овнеры - любые профили';

SELECT '✅ Политика UPDATE исправлена!' as status;

-- Проверяем существующие политики
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;
