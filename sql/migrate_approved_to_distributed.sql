-- Миграция старых релизов со статусом 'approved' на 'distributed'
-- Этот скрипт обновляет все утверждённые релизы на статус "на дистрибьюции"

-- Шаг 1: Удаляем старые ограничения на статус
ALTER TABLE releases_basic DROP CONSTRAINT IF EXISTS releases_basic_status_check;
ALTER TABLE releases_exclusive DROP CONSTRAINT IF EXISTS releases_exclusive_status_check;

-- Шаг 2: Добавляем новые ограничения с дополнительными статусами 'distributed' и 'published'
ALTER TABLE releases_basic 
ADD CONSTRAINT releases_basic_status_check 
CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'distributed', 'published'));

ALTER TABLE releases_exclusive 
ADD CONSTRAINT releases_exclusive_status_check 
CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'distributed', 'published'));

-- Шаг 3: Обновляем релизы в таблице releases_basic
UPDATE releases_basic
SET status = 'distributed'
WHERE status = 'approved';

-- Шаг 4: Обновляем релизы в таблице releases_exclusive
UPDATE releases_exclusive
SET status = 'distributed'
WHERE status = 'approved';

-- Шаг 5: Проверка результатов
SELECT 'releases_basic' as table_name, status, COUNT(*) as count
FROM releases_basic
GROUP BY status
UNION ALL
SELECT 'releases_exclusive' as table_name, status, COUNT(*) as count
FROM releases_exclusive
GROUP BY status
ORDER BY table_name, status;
