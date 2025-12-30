-- ============================================
-- 🎯 THQ LABEL - FIX ADMIN DELETE RELEASES
-- Добавляет политику удаления релизов для админов
-- ============================================

-- Удаляем существующие политики delete для админов (если есть)
DROP POLICY IF EXISTS "releases_basic_delete_admin" ON releases_basic;
DROP POLICY IF EXISTS "releases_exclusive_delete_admin" ON releases_exclusive;

-- Политика удаления для администраторов (Basic)
CREATE POLICY "releases_basic_delete_admin" ON releases_basic FOR DELETE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

-- Политика удаления для администраторов (Exclusive)
CREATE POLICY "releases_exclusive_delete_admin" ON releases_exclusive FOR DELETE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

-- ============================================
-- РЕЗУЛЬТАТ:
-- ✅ Админы и владельцы теперь могут удалять любые релизы
-- ✅ Обычные пользователи по-прежнему могут удалять только свои черновики
-- ============================================
