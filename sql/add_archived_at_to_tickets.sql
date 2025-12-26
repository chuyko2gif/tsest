-- Добавление поля archived_at для архивации тикетов
-- Это позволяет скрывать закрытые тикеты у пользователей, но сохранять их в админке

-- 1. Добавить поле archived_at в таблицу tickets
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- 2. Создать индекс для быстрой фильтрации
CREATE INDEX IF NOT EXISTS idx_tickets_archived_at ON tickets(archived_at) WHERE archived_at IS NOT NULL;

-- 3. Обновить существующие закрытые тикеты (опционально - архивировать старые)
-- UPDATE tickets SET archived_at = updated_at WHERE status = 'closed' AND archived_at IS NULL;

-- 4. Создать функцию автоматической архивации при закрытии
CREATE OR REPLACE FUNCTION auto_archive_on_close()
RETURNS TRIGGER AS $$
BEGIN
  -- Если статус изменился на closed и archived_at еще не установлен
  IF NEW.status = 'closed' AND OLD.status != 'closed' AND NEW.archived_at IS NULL THEN
    NEW.archived_at = NOW();
  END IF;
  
  -- Если тикет переоткрывается, сбрасываем archived_at
  IF NEW.status != 'closed' AND OLD.status = 'closed' THEN
    NEW.archived_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Создать триггер
DROP TRIGGER IF EXISTS trigger_auto_archive_on_close ON tickets;
CREATE TRIGGER trigger_auto_archive_on_close
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION auto_archive_on_close();

-- ПРИМЕЧАНИЯ:
-- - archived_at = NULL означает активный тикет (виден пользователю и админу)
-- - archived_at != NULL означает архивный тикет (виден только админу в разделе "Архив")
-- - При закрытии тикета автоматически устанавливается archived_at
-- - При переоткрытии тикета archived_at сбрасывается
