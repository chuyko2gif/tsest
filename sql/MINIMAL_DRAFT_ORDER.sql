-- ============================================
-- МИНИМАЛЬНАЯ ВЕРСИЯ DRAG & DROP
-- Если основная не работает - используй эту!
-- ============================================

-- Шаг 1: Добавляем поле
ALTER TABLE releases_basic ADD COLUMN IF NOT EXISTS draft_order INTEGER;
ALTER TABLE releases_exclusive ADD COLUMN IF NOT EXISTS draft_order INTEGER;

-- Шаг 2: Нумеруем черновики (basic)
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as num
  FROM releases_basic WHERE status = 'draft'
)
UPDATE releases_basic SET draft_order = numbered.num
FROM numbered WHERE releases_basic.id = numbered.id;

-- Шаг 3: Нумеруем черновики (exclusive)
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as num
  FROM releases_exclusive WHERE status = 'draft'
)
UPDATE releases_exclusive SET draft_order = numbered.num
FROM numbered WHERE releases_exclusive.id = numbered.id;

-- Шаг 4: Функция перестановки (УПРОЩЕННАЯ)
CREATE OR REPLACE FUNCTION reorder_draft_release(
  p_release_id UUID,
  p_new_position INTEGER,
  p_table_name TEXT
)
RETURNS void AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Получаем user_id
  IF p_table_name = 'basic' THEN
    SELECT user_id INTO v_user_id FROM releases_basic WHERE id = p_release_id;
    
    -- Временно ставим большое число
    UPDATE releases_basic SET draft_order = 99999 WHERE id = p_release_id;
    
    -- Перенумеровываем остальные
    WITH numbered AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY 
        CASE WHEN id = p_release_id THEN p_new_position ELSE draft_order END
      ) as num
      FROM releases_basic WHERE user_id = v_user_id AND status = 'draft'
    )
    UPDATE releases_basic SET draft_order = numbered.num
    FROM numbered WHERE releases_basic.id = numbered.id;
    
  ELSE
    SELECT user_id INTO v_user_id FROM releases_exclusive WHERE id = p_release_id;
    
    UPDATE releases_exclusive SET draft_order = 99999 WHERE id = p_release_id;
    
    WITH numbered AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY 
        CASE WHEN id = p_release_id THEN p_new_position ELSE draft_order END
      ) as num
      FROM releases_exclusive WHERE user_id = v_user_id AND status = 'draft'
    )
    UPDATE releases_exclusive SET draft_order = numbered.num
    FROM numbered WHERE releases_exclusive.id = numbered.id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Права
GRANT EXECUTE ON FUNCTION reorder_draft_release TO authenticated;

-- Индексы
CREATE INDEX IF NOT EXISTS idx_rb_draft ON releases_basic(user_id, draft_order) WHERE status = 'draft';
CREATE INDEX IF NOT EXISTS idx_re_draft ON releases_exclusive(user_id, draft_order) WHERE status = 'draft';

-- Проверка
SELECT 'ГОТОВО!' as status, COUNT(*) as drafts_with_order 
FROM releases_basic WHERE draft_order IS NOT NULL;
