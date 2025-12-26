-- ============================================
-- RLS ПОЛИТИКИ ДЛЯ ОБНОВЛЕНИЯ ЧЕРНОВИКОВ
-- ============================================

-- Удаляем старые политики, если они существуют
DROP POLICY IF EXISTS "Users can update own drafts and pending exclusive" ON releases_exclusive;
DROP POLICY IF EXISTS "Users can update own drafts and pending basic" ON releases_basic;

-- Создаем политики заново
CREATE POLICY "Users can update own drafts and pending exclusive" 
ON releases_exclusive 
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid() AND status IN ('draft', 'pending'))
WITH CHECK (user_id = auth.uid() AND status IN ('draft', 'pending'));

CREATE POLICY "Users can update own drafts and pending basic" 
ON releases_basic 
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid() AND status IN ('draft', 'pending'))
WITH CHECK (user_id = auth.uid() AND status IN ('draft', 'pending'));

-- Проверка созданных политик
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('releases_exclusive', 'releases_basic')
ORDER BY tablename, policyname;
