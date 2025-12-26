-- ============================================
-- СИСТЕМА СОРТИРОВКИ ЧЕРНОВИКОВ С DRAG & DROP
-- Дата: 26.12.2025
-- Описание: Добавляет возможность перетаскивания и сортировки черновиков релизов
-- ============================================

-- ============================================
-- 1. ДОБАВЛЕНИЕ ПОЛЯ ДЛЯ СОРТИРОВКИ
-- ============================================

-- Добавляем поле draft_order для releases_basic
ALTER TABLE public.releases_basic 
ADD COLUMN IF NOT EXISTS draft_order INTEGER;

-- Добавляем поле draft_order для releases_exclusive
ALTER TABLE public.releases_exclusive 
ADD COLUMN IF NOT EXISTS draft_order INTEGER;

-- Создаем индексы для быстрой сортировки черновиков
CREATE INDEX IF NOT EXISTS idx_releases_basic_draft_order 
ON releases_basic(user_id, status, draft_order) 
WHERE status = 'draft';

CREATE INDEX IF NOT EXISTS idx_releases_exclusive_draft_order 
ON releases_exclusive(user_id, status, draft_order) 
WHERE status = 'draft';

-- ============================================
-- 2. ИНИЦИАЛИЗАЦИЯ ПОРЯДКА ДЛЯ СУЩЕСТВУЮЩИХ ЧЕРНОВИКОВ
-- ============================================

-- Для releases_basic: назначаем порядок на основе created_at
WITH ordered_drafts AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as new_order
  FROM releases_basic
  WHERE status = 'draft' AND draft_order IS NULL
)
UPDATE releases_basic rb
SET draft_order = od.new_order
FROM ordered_drafts od
WHERE rb.id = od.id;

-- Для releases_exclusive: назначаем порядок на основе created_at
WITH ordered_drafts AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as new_order
  FROM releases_exclusive
  WHERE status = 'draft' AND draft_order IS NULL
)
UPDATE releases_exclusive re
SET draft_order = od.new_order
FROM ordered_drafts od
WHERE re.id = od.id;

-- ============================================
-- 3. ФУНКЦИЯ ДЛЯ АВТОМАТИЧЕСКОГО НАЗНАЧЕНИЯ ПОРЯДКА НОВЫМ ЧЕРНОВИКАМ
-- ============================================

-- Функция для releases_basic
CREATE OR REPLACE FUNCTION assign_draft_order_basic()
RETURNS TRIGGER AS $$
BEGIN
  -- Только для новых черновиков
  IF NEW.status = 'draft' AND NEW.draft_order IS NULL THEN
    SELECT COALESCE(MAX(draft_order), 0) + 1
    INTO NEW.draft_order
    FROM releases_basic
    WHERE user_id = NEW.user_id AND status = 'draft';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Функция для releases_exclusive
CREATE OR REPLACE FUNCTION assign_draft_order_exclusive()
RETURNS TRIGGER AS $$
BEGIN
  -- Только для новых черновиков
  IF NEW.status = 'draft' AND NEW.draft_order IS NULL THEN
    SELECT COALESCE(MAX(draft_order), 0) + 1
    INTO NEW.draft_order
    FROM releases_exclusive
    WHERE user_id = NEW.user_id AND status = 'draft';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггеры
DROP TRIGGER IF EXISTS set_draft_order_basic ON releases_basic;
CREATE TRIGGER set_draft_order_basic
  BEFORE INSERT ON releases_basic
  FOR EACH ROW
  EXECUTE FUNCTION assign_draft_order_basic();

DROP TRIGGER IF EXISTS set_draft_order_exclusive ON releases_exclusive;
CREATE TRIGGER set_draft_order_exclusive
  BEFORE INSERT ON releases_exclusive
  FOR EACH ROW
  EXECUTE FUNCTION assign_draft_order_exclusive();

-- ============================================
-- 4. ФУНКЦИЯ ДЛЯ ПЕРЕСТАНОВКИ ЧЕРНОВИКОВ (DRAG & DROP)
-- ============================================

-- Функция для перемещения черновика в новую позицию
CREATE OR REPLACE FUNCTION reorder_draft_release(
  p_release_id UUID,
  p_new_position INTEGER,
  p_table_name TEXT
)
RETURNS void AS $$
DECLARE
  v_user_id UUID;
  v_old_position INTEGER;
  v_status TEXT;
BEGIN
  -- Получаем текущую информацию о релизе
  IF p_table_name = 'basic' THEN
    SELECT user_id, draft_order, status INTO v_user_id, v_old_position, v_status
    FROM releases_basic WHERE id = p_release_id;
  ELSE
    SELECT user_id, draft_order, status INTO v_user_id, v_old_position, v_status
    FROM releases_exclusive WHERE id = p_release_id;
  END IF;

  -- Проверяем, что это черновик
  IF v_status != 'draft' THEN
    RAISE EXCEPTION 'Only drafts can be reordered';
  END IF;

  -- Если позиция не изменилась, ничего не делаем
  IF v_old_position = p_new_position THEN
    RETURN;
  END IF;

  -- Перестановка для releases_basic
  IF p_table_name = 'basic' THEN
    IF v_old_position < p_new_position THEN
      -- Перемещение вниз: сдвигаем элементы между старой и новой позицией вверх
      UPDATE releases_basic
      SET draft_order = draft_order - 1
      WHERE user_id = v_user_id 
        AND status = 'draft'
        AND draft_order > v_old_position 
        AND draft_order <= p_new_position;
    ELSE
      -- Перемещение вверх: сдвигаем элементы между новой и старой позицией вниз
      UPDATE releases_basic
      SET draft_order = draft_order + 1
      WHERE user_id = v_user_id 
        AND status = 'draft'
        AND draft_order >= p_new_position 
        AND draft_order < v_old_position;
    END IF;
    
    -- Устанавливаем новую позицию для перемещаемого элемента
    UPDATE releases_basic
    SET draft_order = p_new_position
    WHERE id = p_release_id;
    
  -- Перестановка для releases_exclusive
  ELSE
    IF v_old_position < p_new_position THEN
      -- Перемещение вниз: сдвигаем элементы между старой и новой позицией вверх
      UPDATE releases_exclusive
      SET draft_order = draft_order - 1
      WHERE user_id = v_user_id 
        AND status = 'draft'
        AND draft_order > v_old_position 
        AND draft_order <= p_new_position;
    ELSE
      -- Перемещение вверх: сдвигаем элементы между новой и старой позицией вниз
      UPDATE releases_exclusive
      SET draft_order = draft_order + 1
      WHERE user_id = v_user_id 
        AND status = 'draft'
        AND draft_order >= p_new_position 
        AND draft_order < v_old_position;
    END IF;
    
    -- Устанавливаем новую позицию для перемещаемого элемента
    UPDATE releases_exclusive
    SET draft_order = p_new_position
    WHERE id = p_release_id;
  END IF;

  -- Нормализуем порядок (убираем пропуски)
  IF p_table_name = 'basic' THEN
    WITH ordered_drafts AS (
      SELECT 
        id,
        ROW_NUMBER() OVER (ORDER BY draft_order) as new_order
      FROM releases_basic
      WHERE user_id = v_user_id AND status = 'draft'
    )
    UPDATE releases_basic rb
    SET draft_order = od.new_order
    FROM ordered_drafts od
    WHERE rb.id = od.id;
  ELSE
    WITH ordered_drafts AS (
      SELECT 
        id,
        ROW_NUMBER() OVER (ORDER BY draft_order) as new_order
      FROM releases_exclusive
      WHERE user_id = v_user_id AND status = 'draft'
    )
    UPDATE releases_exclusive re
    SET draft_order = od.new_order
    FROM ordered_drafts od
    WHERE re.id = od.id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Разрешаем использование функции аутентифицированным пользователям
GRANT EXECUTE ON FUNCTION reorder_draft_release TO authenticated;

-- ============================================
-- 5. ФУНКЦИЯ ДЛЯ ОЧИСТКИ ПОРЯДКА ПРИ ИЗМЕНЕНИИ СТАТУСА
-- ============================================

-- При изменении статуса с draft на другой, очищаем draft_order
CREATE OR REPLACE FUNCTION cleanup_draft_order_basic()
RETURNS TRIGGER AS $$
BEGIN
  -- Если статус меняется с draft на что-то другое
  IF OLD.status = 'draft' AND NEW.status != 'draft' THEN
    NEW.draft_order = NULL;
    
    -- Перенумеровываем оставшиеся черновики пользователя
    WITH ordered_drafts AS (
      SELECT 
        id,
        ROW_NUMBER() OVER (ORDER BY draft_order) as new_order
      FROM releases_basic
      WHERE user_id = NEW.user_id AND status = 'draft' AND id != NEW.id
    )
    UPDATE releases_basic rb
    SET draft_order = od.new_order
    FROM ordered_drafts od
    WHERE rb.id = od.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_draft_order_exclusive()
RETURNS TRIGGER AS $$
BEGIN
  -- Если статус меняется с draft на что-то другое
  IF OLD.status = 'draft' AND NEW.status != 'draft' THEN
    NEW.draft_order = NULL;
    
    -- Перенумеровываем оставшиеся черновики пользователя
    WITH ordered_drafts AS (
      SELECT 
        id,
        ROW_NUMBER() OVER (ORDER BY draft_order) as new_order
      FROM releases_exclusive
      WHERE user_id = NEW.user_id AND status = 'draft' AND id != NEW.id
    )
    UPDATE releases_exclusive re
    SET draft_order = od.new_order
    FROM ordered_drafts od
    WHERE re.id = od.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггеры для очистки
DROP TRIGGER IF EXISTS cleanup_draft_order_basic_trigger ON releases_basic;
CREATE TRIGGER cleanup_draft_order_basic_trigger
  BEFORE UPDATE ON releases_basic
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION cleanup_draft_order_basic();

DROP TRIGGER IF EXISTS cleanup_draft_order_exclusive_trigger ON releases_exclusive;
CREATE TRIGGER cleanup_draft_order_exclusive_trigger
  BEFORE UPDATE ON releases_exclusive
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION cleanup_draft_order_exclusive();

-- ============================================
-- 6. ФУНКЦИЯ ДЛЯ ОЧИСТКИ ПОРЯДКА ПРИ УДАЛЕНИИ ЧЕРНОВИКА
-- ============================================

CREATE OR REPLACE FUNCTION reorder_after_delete_basic()
RETURNS TRIGGER AS $$
BEGIN
  -- Если удален черновик, перенумеровываем оставшиеся
  IF OLD.status = 'draft' THEN
    WITH ordered_drafts AS (
      SELECT 
        id,
        ROW_NUMBER() OVER (ORDER BY draft_order) as new_order
      FROM releases_basic
      WHERE user_id = OLD.user_id AND status = 'draft'
    )
    UPDATE releases_basic rb
    SET draft_order = od.new_order
    FROM ordered_drafts od
    WHERE rb.id = od.id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION reorder_after_delete_exclusive()
RETURNS TRIGGER AS $$
BEGIN
  -- Если удален черновик, перенумеровываем оставшиеся
  IF OLD.status = 'draft' THEN
    WITH ordered_drafts AS (
      SELECT 
        id,
        ROW_NUMBER() OVER (ORDER BY draft_order) as new_order
      FROM releases_exclusive
      WHERE user_id = OLD.user_id AND status = 'draft'
    )
    UPDATE releases_exclusive re
    SET draft_order = od.new_order
    FROM ordered_drafts od
    WHERE re.id = od.id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггеры на удаление
DROP TRIGGER IF EXISTS reorder_after_delete_basic_trigger ON releases_basic;
CREATE TRIGGER reorder_after_delete_basic_trigger
  AFTER DELETE ON releases_basic
  FOR EACH ROW
  EXECUTE FUNCTION reorder_after_delete_basic();

DROP TRIGGER IF EXISTS reorder_after_delete_exclusive_trigger ON releases_exclusive;
CREATE TRIGGER reorder_after_delete_exclusive_trigger
  AFTER DELETE ON releases_exclusive
  FOR EACH ROW
  EXECUTE FUNCTION reorder_after_delete_exclusive();

-- ============================================
-- 7. ОБНОВЛЕНИЕ RLS ПОЛИТИК ДЛЯ DRAFT_ORDER
-- ============================================

-- Пересоздаем политики для обновления, разрешая изменение draft_order
DROP POLICY IF EXISTS "Users can update own draft releases basic" ON public.releases_basic;

CREATE POLICY "Users can update own draft releases basic"
ON public.releases_basic
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id 
  AND status = 'draft'
)
WITH CHECK (
  auth.uid() = user_id 
  AND status = 'draft'
);

DROP POLICY IF EXISTS "Users can update own draft releases exclusive" ON public.releases_exclusive;

CREATE POLICY "Users can update own draft releases exclusive"
ON public.releases_exclusive
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id 
  AND status = 'draft'
)
WITH CHECK (
  auth.uid() = user_id 
  AND status = 'draft'
);

-- ============================================
-- ГОТОВО!
-- ============================================

-- Комментарии
COMMENT ON COLUMN releases_basic.draft_order IS 'Порядок сортировки черновиков для drag & drop';
COMMENT ON COLUMN releases_exclusive.draft_order IS 'Порядок сортировки черновиков для drag & drop';
COMMENT ON FUNCTION reorder_draft_release IS 'Перемещает черновик релиза на новую позицию с автоматической перенумерацией';

-- Проверка работы
SELECT 
  'Basic Drafts' as table_name,
  COUNT(*) as total_drafts,
  COUNT(DISTINCT user_id) as users_with_drafts
FROM releases_basic 
WHERE status = 'draft'
UNION ALL
SELECT 
  'Exclusive Drafts' as table_name,
  COUNT(*) as total_drafts,
  COUNT(DISTINCT user_id) as users_with_drafts
FROM releases_exclusive 
WHERE status = 'draft';
