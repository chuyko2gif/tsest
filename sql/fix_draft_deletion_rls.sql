-- Фикс RLS политик для черновиков - УПРОЩЕННАЯ ВЕРСИЯ ДЛЯ ВСЕХ
-- Дата: 26.12.2025
-- Описание: Максимально простые политики - любой пользователь может создавать, читать, обновлять и удалять свои релизы

-- ============================================
-- ПОЛНОЕ УДАЛЕНИЕ ВСЕХ СТАРЫХ ПОЛИТИК
-- ============================================

-- Удаляем ВСЕ существующие политики для releases_basic
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'releases_basic') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.releases_basic';
    END LOOP;
END $$;

-- Удаляем ВСЕ существующие политики для releases_exclusive
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'releases_exclusive') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.releases_exclusive';
    END LOOP;
END $$;

-- ============================================
-- RELEASES_BASIC - НОВЫЕ ПРОСТЫЕ ПОЛИТИКИ
-- ============================================

-- Пользователи могут делать ВСЁ со своими релизами
CREATE POLICY "Users full access to own releases basic"
ON public.releases_basic
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Админы и овнеры могут делать ВСЁ со всеми релизами
CREATE POLICY "Admins full access basic"
ON public.releases_basic
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'owner')
  )
);

-- ============================================
-- RELEASES_EXCLUSIVE - НОВЫЕ ПРОСТЫЕ ПОЛИТИКИ
-- ============================================

-- Пользователи могут делать ВСЁ со своими релизами
CREATE POLICY "Users full access to own releases exclusive"
ON public.releases_exclusive
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Админы и овнеры могут делать ВСЁ со всеми релизами
CREATE POLICY "Admins full access exclusive"
ON public.releases_exclusive
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'owner')
  )
);

-- ============================================
-- ПРОВЕРКА ПОЛИТИК
-- ============================================

SELECT 
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename IN ('releases_basic', 'releases_exclusive')
ORDER BY tablename, policyname;

-- ============================================
-- ГОТОВО!
-- ============================================

COMMENT ON POLICY "Users full access to own releases basic" ON public.releases_basic 
IS 'Пользователи имеют полный доступ к своим релизам (включая черновики)';

COMMENT ON POLICY "Admins full access basic" ON public.releases_basic 
IS 'Админы и овнеры имеют полный доступ ко всем релизам';

COMMENT ON POLICY "Users full access to own releases exclusive" ON public.releases_exclusive 
IS 'Пользователи имеют полный доступ к своим релизам (включая черновики)';

COMMENT ON POLICY "Admins full access exclusive" ON public.releases_exclusive 
IS 'Админы и овнеры имеют полный доступ ко всем релизам';
