-- ============================================
-- 🎯 ОБНОВЛЕНИЕ РЕЛИЗОВ - Декабрь 2025
-- ============================================
-- 
-- ЧТО ДОБАВЛЯЕТ:
-- 1. Поле is_promo_skipped (пропущен ли промо шаг)
-- 2. Поле draft_order (порядок черновиков для drag & drop)
-- 3. Статус 'draft' в CHECK constraint
-- 4. RLS политики для черновиков (удаление, обновление)
-- 5. Функция reorder_draft_release для сортировки
-- ============================================

-- ============================================
-- ШАГ 1: ДОБАВЛЯЕМ ПОЛЕ is_promo_skipped
-- ============================================

ALTER TABLE public.releases_basic 
ADD COLUMN IF NOT EXISTS is_promo_skipped BOOLEAN DEFAULT false;

ALTER TABLE public.releases_exclusive 
ADD COLUMN IF NOT EXISTS is_promo_skipped BOOLEAN DEFAULT false;

COMMENT ON COLUMN releases_basic.is_promo_skipped IS 'Флаг: пропущен ли шаг промо при создании релиза';
COMMENT ON COLUMN releases_exclusive.is_promo_skipped IS 'Флаг: пропущен ли шаг промо при создании релиза';

-- ============================================
-- ШАГ 2: ДОБАВЛЯЕМ ПОЛЕ draft_order
-- ============================================

ALTER TABLE public.releases_basic 
ADD COLUMN IF NOT EXISTS draft_order INTEGER;

ALTER TABLE public.releases_exclusive 
ADD COLUMN IF NOT EXISTS draft_order INTEGER;

COMMENT ON COLUMN releases_basic.draft_order IS 'Порядок черновиков для drag & drop (1, 2, 3...)';
COMMENT ON COLUMN releases_exclusive.draft_order IS 'Порядок черновиков для drag & drop (1, 2, 3...)';

-- ============================================
-- ШАГ 3: ОБНОВЛЯЕМ CHECK CONSTRAINT ДЛЯ STATUS
-- (добавляем 'draft' и 'distributed')
-- ============================================

-- Для releases_basic
DO $$
BEGIN
  -- Удаляем старый constraint
  ALTER TABLE releases_basic DROP CONSTRAINT IF EXISTS releases_basic_status_check;
  
  -- Создаем новый с draft и distributed
  ALTER TABLE releases_basic 
  ADD CONSTRAINT releases_basic_status_check 
  CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'published', 'distributed'));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Constraint update for releases_basic skipped: %', SQLERRM;
END $$;

-- Для releases_exclusive
DO $$
BEGIN
  ALTER TABLE releases_exclusive DROP CONSTRAINT IF EXISTS releases_exclusive_status_check;
  
  ALTER TABLE releases_exclusive 
  ADD CONSTRAINT releases_exclusive_status_check 
  CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'published', 'distributed'));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Constraint update for releases_exclusive skipped: %', SQLERRM;
END $$;

-- ============================================
-- ШАГ 4: НУМЕРУЕМ СУЩЕСТВУЮЩИЕ ЧЕРНОВИКИ
-- ============================================

-- Для releases_basic
UPDATE releases_basic
SET draft_order = subquery.row_num
FROM (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as row_num
  FROM releases_basic
  WHERE status = 'draft' AND draft_order IS NULL
) as subquery
WHERE releases_basic.id = subquery.id
AND releases_basic.status = 'draft';

-- Для releases_exclusive
UPDATE releases_exclusive
SET draft_order = subquery.row_num
FROM (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as row_num
  FROM releases_exclusive
  WHERE status = 'draft' AND draft_order IS NULL
) as subquery
WHERE releases_exclusive.id = subquery.id
AND releases_exclusive.status = 'draft';

-- ============================================
-- ШАГ 5: ИНДЕКСЫ ДЛЯ БЫСТРОЙ РАБОТЫ
-- ============================================

CREATE INDEX IF NOT EXISTS idx_releases_basic_draft_order 
ON releases_basic(user_id, status, draft_order) 
WHERE status = 'draft';

CREATE INDEX IF NOT EXISTS idx_releases_exclusive_draft_order 
ON releases_exclusive(user_id, status, draft_order) 
WHERE status = 'draft';

CREATE INDEX IF NOT EXISTS idx_releases_basic_promo_skipped 
ON releases_basic(is_promo_skipped) 
WHERE is_promo_skipped = true;

CREATE INDEX IF NOT EXISTS idx_releases_exclusive_promo_skipped 
ON releases_exclusive(is_promo_skipped) 
WHERE is_promo_skipped = true;

-- ============================================
-- ШАГ 6: ФУНКЦИЯ ДЛЯ СОРТИРОВКИ ЧЕРНОВИКОВ
-- ============================================

-- Удаляем старую функцию если существует
DROP FUNCTION IF EXISTS reorder_draft_release(UUID, INTEGER, TEXT);

CREATE OR REPLACE FUNCTION reorder_draft_release(
  p_release_id UUID,
  p_new_position INTEGER,
  p_table_name TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_old_position INTEGER;
BEGIN
  -- Получаем информацию о релизе
  IF p_table_name = 'basic' THEN
    SELECT user_id, draft_order INTO v_user_id, v_old_position
    FROM releases_basic WHERE id = p_release_id;
  ELSE
    SELECT user_id, draft_order INTO v_user_id, v_old_position
    FROM releases_exclusive WHERE id = p_release_id;
  END IF;

  -- Если позиция не изменилась - выходим
  IF v_old_position = p_new_position OR v_old_position IS NULL THEN
    RETURN;
  END IF;

  -- Перестановка для releases_basic
  IF p_table_name = 'basic' THEN
    UPDATE releases_basic SET draft_order = -1 WHERE id = p_release_id;
    
    IF v_old_position < p_new_position THEN
      UPDATE releases_basic SET draft_order = draft_order - 1
      WHERE user_id = v_user_id AND status = 'draft'
        AND draft_order > v_old_position AND draft_order <= p_new_position
        AND id != p_release_id;
    ELSE
      UPDATE releases_basic SET draft_order = draft_order + 1
      WHERE user_id = v_user_id AND status = 'draft'
        AND draft_order >= p_new_position AND draft_order < v_old_position
        AND id != p_release_id;
    END IF;
    
    UPDATE releases_basic SET draft_order = p_new_position WHERE id = p_release_id;
    
    -- Нормализуем порядок
    UPDATE releases_basic SET draft_order = subquery.new_order
    FROM (
      SELECT id, ROW_NUMBER() OVER (ORDER BY draft_order) as new_order
      FROM releases_basic WHERE user_id = v_user_id AND status = 'draft'
    ) as subquery
    WHERE releases_basic.id = subquery.id;

  -- Перестановка для releases_exclusive
  ELSE
    UPDATE releases_exclusive SET draft_order = -1 WHERE id = p_release_id;
    
    IF v_old_position < p_new_position THEN
      UPDATE releases_exclusive SET draft_order = draft_order - 1
      WHERE user_id = v_user_id AND status = 'draft'
        AND draft_order > v_old_position AND draft_order <= p_new_position
        AND id != p_release_id;
    ELSE
      UPDATE releases_exclusive SET draft_order = draft_order + 1
      WHERE user_id = v_user_id AND status = 'draft'
        AND draft_order >= p_new_position AND draft_order < v_old_position
        AND id != p_release_id;
    END IF;
    
    UPDATE releases_exclusive SET draft_order = p_new_position WHERE id = p_release_id;
    
    -- Нормализуем порядок
    UPDATE releases_exclusive SET draft_order = subquery.new_order
    FROM (
      SELECT id, ROW_NUMBER() OVER (ORDER BY draft_order) as new_order
      FROM releases_exclusive WHERE user_id = v_user_id AND status = 'draft'
    ) as subquery
    WHERE releases_exclusive.id = subquery.id;
  END IF;
END;
$$;

-- Даем права на выполнение функции
GRANT EXECUTE ON FUNCTION reorder_draft_release TO authenticated;

-- ============================================
-- ШАГ 7: RLS ПОЛИТИКИ ДЛЯ ЧЕРНОВИКОВ
-- ============================================

-- Включаем RLS
ALTER TABLE releases_basic ENABLE ROW LEVEL SECURITY;
ALTER TABLE releases_exclusive ENABLE ROW LEVEL SECURITY;

-- --- RELEASES_BASIC ---

-- Удаляем старые политики для черновиков
DROP POLICY IF EXISTS "Users can view own basic releases" ON releases_basic;
DROP POLICY IF EXISTS "Users can create own basic releases" ON releases_basic;
DROP POLICY IF EXISTS "Users can update own draft releases basic" ON releases_basic;
DROP POLICY IF EXISTS "Users can update own pending basic releases" ON releases_basic;
DROP POLICY IF EXISTS "Users can delete own draft basic releases" ON releases_basic;
DROP POLICY IF EXISTS "Admins can view all basic releases" ON releases_basic;
DROP POLICY IF EXISTS "Admins can update all basic releases" ON releases_basic;

-- Политики SELECT
CREATE POLICY "Users can view own basic releases"
  ON releases_basic FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all basic releases"
  ON releases_basic FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

-- Политика INSERT
CREATE POLICY "Users can create own basic releases"
  ON releases_basic FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Политики UPDATE (раздельные для черновиков и pending)
CREATE POLICY "Users can update own draft releases basic"
  ON releases_basic FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status = 'draft')
  WITH CHECK (auth.uid() = user_id AND status = 'draft');

CREATE POLICY "Users can update own pending basic releases"
  ON releases_basic FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can update all basic releases"
  ON releases_basic FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

-- Политика DELETE (только черновики)
CREATE POLICY "Users can delete own draft basic releases"
  ON releases_basic FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND status = 'draft');

-- --- RELEASES_EXCLUSIVE ---

-- Удаляем старые политики
DROP POLICY IF EXISTS "Users can view own exclusive releases" ON releases_exclusive;
DROP POLICY IF EXISTS "Users can create own exclusive releases" ON releases_exclusive;
DROP POLICY IF EXISTS "Users can update own draft releases exclusive" ON releases_exclusive;
DROP POLICY IF EXISTS "Users can update own pending exclusive releases" ON releases_exclusive;
DROP POLICY IF EXISTS "Users can delete own draft exclusive releases" ON releases_exclusive;
DROP POLICY IF EXISTS "Admins can view all exclusive releases" ON releases_exclusive;
DROP POLICY IF EXISTS "Admins can update all exclusive releases" ON releases_exclusive;

-- Политики SELECT
CREATE POLICY "Users can view own exclusive releases"
  ON releases_exclusive FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all exclusive releases"
  ON releases_exclusive FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

-- Политика INSERT
CREATE POLICY "Users can create own exclusive releases"
  ON releases_exclusive FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Политики UPDATE
CREATE POLICY "Users can update own draft releases exclusive"
  ON releases_exclusive FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status = 'draft')
  WITH CHECK (auth.uid() = user_id AND status = 'draft');

CREATE POLICY "Users can update own pending exclusive releases"
  ON releases_exclusive FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can update all exclusive releases"
  ON releases_exclusive FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

-- Политика DELETE (только черновики)
CREATE POLICY "Users can delete own draft exclusive releases"
  ON releases_exclusive FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND status = 'draft');

-- ============================================
-- ШАГ 8: ПРОВЕРКА
-- ============================================

-- Проверяем что поля добавлены
SELECT 
  'releases_basic' as table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'releases_basic' 
  AND column_name IN ('is_promo_skipped', 'draft_order', 'status')
UNION ALL
SELECT 
  'releases_exclusive' as table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'releases_exclusive' 
  AND column_name IN ('is_promo_skipped', 'draft_order', 'status');

-- Проверяем политики
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename IN ('releases_basic', 'releases_exclusive')
ORDER BY tablename, policyname;

-- ============================================
-- ✅ ГОТОВО!
-- ============================================
-- 
-- Добавлены:
-- ✓ is_promo_skipped - отслеживание пропуска промо шага
-- ✓ draft_order - порядок черновиков для drag & drop
-- ✓ Статусы: draft, pending, approved, rejected, published, distributed
-- ✓ Функция reorder_draft_release() для сортировки
-- ✓ RLS политики для UPDATE/DELETE черновиков
-- ✓ Индексы для быстрой работы
-- ============================================
