-- ============================================
-- 🎯 DRAG & DROP ДЛЯ ЧЕРНОВИКОВ РЕЛИЗОВ
-- Дата: 26.12.2025
-- 
-- ЧТО ДЕЛАЕТ:
-- 1. Добавляет поле draft_order (порядок черновиков)
-- 2. Нумерует все существующие черновики
-- 3. Создает функцию для перестановки
-- 4. Обновляет права доступа
-- ============================================

-- ШАГ 1: Добавляем поле draft_order
-- ============================================

ALTER TABLE public.releases_basic 
ADD COLUMN IF NOT EXISTS draft_order INTEGER;

ALTER TABLE public.releases_exclusive 
ADD COLUMN IF NOT EXISTS draft_order INTEGER;

-- ШАГ 2: Даем всем существующим черновикам порядковые номера
-- ============================================

-- Для releases_basic
UPDATE releases_basic
SET draft_order = subquery.row_num
FROM (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as row_num
  FROM releases_basic
  WHERE status = 'draft'
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
  WHERE status = 'draft'
) as subquery
WHERE releases_exclusive.id = subquery.id
AND releases_exclusive.status = 'draft';

-- ШАГ 3: Главная функция для перестановки
-- ============================================

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
  IF v_old_position = p_new_position THEN
    RETURN;
  END IF;

  -- Перестановка для releases_basic
  IF p_table_name = 'basic' THEN
    -- Временно ставим отрицательное значение
    UPDATE releases_basic
    SET draft_order = -1
    WHERE id = p_release_id;

    -- Сдвигаем элементы
    IF v_old_position < p_new_position THEN
      -- Двигаем вниз
      UPDATE releases_basic
      SET draft_order = draft_order - 1
      WHERE user_id = v_user_id 
        AND status = 'draft'
        AND draft_order > v_old_position 
        AND draft_order <= p_new_position
        AND id != p_release_id;
    ELSE
      -- Двигаем вверх
      UPDATE releases_basic
      SET draft_order = draft_order + 1
      WHERE user_id = v_user_id 
        AND status = 'draft'
        AND draft_order >= p_new_position 
        AND draft_order < v_old_position
        AND id != p_release_id;
    END IF;
    
    -- Ставим элемент на новую позицию
    UPDATE releases_basic
    SET draft_order = p_new_position
    WHERE id = p_release_id;

  -- Перестановка для releases_exclusive
  ELSE
    -- Временно ставим отрицательное значение
    UPDATE releases_exclusive
    SET draft_order = -1
    WHERE id = p_release_id;

    -- Сдвигаем элементы
    IF v_old_position < p_new_position THEN
      UPDATE releases_exclusive
      SET draft_order = draft_order - 1
      WHERE user_id = v_user_id 
        AND status = 'draft'
        AND draft_order > v_old_position 
        AND draft_order <= p_new_position
        AND id != p_release_id;
    ELSE
      UPDATE releases_exclusive
      SET draft_order = draft_order + 1
      WHERE user_id = v_user_id 
        AND status = 'draft'
        AND draft_order >= p_new_position 
        AND draft_order < v_old_position
        AND id != p_release_id;
    END IF;
    
    -- Ставим элемент на новую позицию
    UPDATE releases_exclusive
    SET draft_order = p_new_position
    WHERE id = p_release_id;
  END IF;

  -- Нормализуем (убираем пропуски)
  IF p_table_name = 'basic' THEN
    UPDATE releases_basic
    SET draft_order = subquery.new_order
    FROM (
      SELECT 
        id,
        ROW_NUMBER() OVER (ORDER BY draft_order) as new_order
      FROM releases_basic
      WHERE user_id = v_user_id AND status = 'draft'
    ) as subquery
    WHERE releases_basic.id = subquery.id;
  ELSE
    UPDATE releases_exclusive
    SET draft_order = subquery.new_order
    FROM (
      SELECT 
        id,
        ROW_NUMBER() OVER (ORDER BY draft_order) as new_order
      FROM releases_exclusive
      WHERE user_id = v_user_id AND status = 'draft'
    ) as subquery
    WHERE releases_exclusive.id = subquery.id;
  END IF;
END;
$$;

-- Даем права на выполнение
GRANT EXECUTE ON FUNCTION reorder_draft_release TO authenticated;

-- ШАГ 4: Индексы для быстрой работы
-- ============================================

CREATE INDEX IF NOT EXISTS idx_releases_basic_draft_order 
ON releases_basic(user_id, status, draft_order) 
WHERE status = 'draft';

CREATE INDEX IF NOT EXISTS idx_releases_exclusive_draft_order 
ON releases_exclusive(user_id, status, draft_order) 
WHERE status = 'draft';

-- ШАГ 5: Обновляем RLS политики
-- ============================================

-- Для releases_basic
DROP POLICY IF EXISTS "Users can update own draft releases basic" ON public.releases_basic;

CREATE POLICY "Users can update own draft releases basic"
ON public.releases_basic
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'draft')
WITH CHECK (auth.uid() = user_id AND status = 'draft');

-- Для releases_exclusive
DROP POLICY IF EXISTS "Users can update own draft releases exclusive" ON public.releases_exclusive;

CREATE POLICY "Users can update own draft releases exclusive"
ON public.releases_exclusive
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'draft')
WITH CHECK (auth.uid() = user_id AND status = 'draft');

-- ============================================
-- ПРОВЕРКА РАБОТЫ
-- ============================================

-- Смотрим черновики с порядком
SELECT 
  'releases_basic' as table_name,
  id,
  title,
  draft_order,
  status,
  created_at
FROM releases_basic
WHERE status = 'draft'
ORDER BY draft_order
LIMIT 5;

-- Комментарии
COMMENT ON COLUMN releases_basic.draft_order IS 'Порядок черновиков для drag & drop (1, 2, 3...)';
COMMENT ON COLUMN releases_exclusive.draft_order IS 'Порядок черновиков для drag & drop (1, 2, 3...)';
COMMENT ON FUNCTION reorder_draft_release IS 'Перемещает черновик на новую позицию';

-- ============================================
-- ГОТОВО! ✅
-- ============================================
-- 
-- Теперь выполните:
-- 1. npm run dev
-- 2. Откройте "Архив (Черновики)"
-- 3. Перетащите черновик
-- 4. Обновите страницу - порядок сохранен!
