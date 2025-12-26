-- ============================================
-- ДОБАВЛЕНИЕ СТАТУСА DRAFT ДЛЯ ЧЕРНОВИКОВ
-- ============================================

-- Шаг 1: Обновляем существующие записи со статусом 'distributed' -> 'published'
-- (distributed больше не используется, вместо него published)
UPDATE releases_basic 
SET status = 'published' 
WHERE status = 'distributed';

UPDATE releases_exclusive 
SET status = 'published' 
WHERE status = 'distributed';

-- Шаг 2: Удаляем старые constraints
ALTER TABLE releases_basic 
DROP CONSTRAINT IF EXISTS releases_basic_status_check;

ALTER TABLE releases_exclusive 
DROP CONSTRAINT IF EXISTS releases_exclusive_status_check;

-- Шаг 3: Добавляем новые constraints с draft
ALTER TABLE releases_basic 
ADD CONSTRAINT releases_basic_status_check 
CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'published'));

ALTER TABLE releases_exclusive 
ADD CONSTRAINT releases_exclusive_status_check 
CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'published'));

-- Шаг 4: Изменяем дефолтное значение статуса на 'draft' для новых релизов
ALTER TABLE releases_basic 
ALTER COLUMN status SET DEFAULT 'draft';

ALTER TABLE releases_exclusive 
ALTER COLUMN status SET DEFAULT 'draft';

-- Шаг 5: Добавляем индексы для быстрого поиска черновиков
CREATE INDEX IF NOT EXISTS idx_releases_basic_user_status ON releases_basic(user_id, status);
CREATE INDEX IF NOT EXISTS idx_releases_exclusive_user_status ON releases_exclusive(user_id, status);

COMMENT ON COLUMN releases_basic.status IS 'Статус релиза: draft (черновик), pending (на модерации), approved (одобрен), rejected (отклонен), published (опубликован)';
COMMENT ON COLUMN releases_exclusive.status IS 'Статус релиза: draft (черновик), pending (на модерации), approved (одобрен), rejected (отклонен), published (опубликован)';
