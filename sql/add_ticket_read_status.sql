-- Добавляем поле is_read_by_user в ticket_messages
-- Это поле отслеживает, прочитано ли сообщение пользователем
ALTER TABLE ticket_messages ADD COLUMN IF NOT EXISTS is_read_by_user BOOLEAN DEFAULT TRUE;

-- По умолчанию все сообщения от админа будут непрочитанными для пользователя
-- Обновляем существующие сообщения от админов как непрочитанные
UPDATE ticket_messages SET is_read_by_user = FALSE WHERE is_admin = TRUE;

-- Создаем индекс для быстрого поиска непрочитанных сообщений
CREATE INDEX IF NOT EXISTS idx_ticket_messages_unread ON ticket_messages(is_admin, is_read_by_user);

-- Добавляем поле unread_count в tickets для быстрого подсчета
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0;

-- Обновляем unread_count для существующих тикетов
UPDATE tickets t SET unread_count = (
  SELECT COUNT(*) FROM ticket_messages tm 
  WHERE tm.ticket_id = t.id 
  AND tm.is_admin = TRUE 
  AND tm.is_read_by_user = FALSE
);

-- Включаем Realtime для таблиц (если еще не включено)
-- Нужно выполнить в SQL Editor Supabase:
ALTER PUBLICATION supabase_realtime ADD TABLE ticket_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE payouts;
