-- ПОЛНАЯ ЗАМЕНА СИСТЕМЫ ТИКЕТОВ
-- Удаляем старое и создаем новое с live-чатом

-- 1. Удаляем старые таблицы и политики
DROP POLICY IF EXISTS "Users can view own tickets" ON tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON tickets;
DROP POLICY IF EXISTS "Users can update own tickets" ON tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON tickets;
DROP POLICY IF EXISTS "Admins can update any ticket" ON tickets;

DROP TABLE IF EXISTS ticket_attachments CASCADE;
DROP TABLE IF EXISTS ticket_messages CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;

-- 2. Создаем новую таблицу tickets
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'answered', 'closed')),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_preview TEXT,
  unread_count INTEGER DEFAULT 0,
  is_typing BOOLEAN DEFAULT false,
  typing_user_id UUID REFERENCES profiles(id),
  archived_at TIMESTAMPTZ,
  closed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Создаем таблицу для сообщений
CREATE TABLE ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Создаем таблицу для вложений
CREATE TABLE ticket_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES ticket_messages(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Индексы для производительности
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_last_message_at ON tickets(last_message_at DESC);
CREATE INDEX idx_tickets_archived_at ON tickets(archived_at) WHERE archived_at IS NOT NULL;
CREATE INDEX idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX idx_ticket_messages_created_at ON ticket_messages(created_at DESC);
CREATE INDEX idx_ticket_attachments_message_id ON ticket_attachments(message_id);

-- 6. Функция обновления last_message
CREATE OR REPLACE FUNCTION update_ticket_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tickets 
  SET 
    last_message_at = NEW.created_at,
    last_message_preview = SUBSTRING(NEW.message FROM 1 FOR 100),
    updated_at = NOW()
  WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Триггер для автообновления
DROP TRIGGER IF EXISTS trigger_update_ticket_last_message ON ticket_messages;
CREATE TRIGGER trigger_update_ticket_last_message
  AFTER INSERT ON ticket_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_last_message();

-- 8. Функция автоархивации
CREATE OR REPLACE FUNCTION auto_archive_closed_tickets()
RETURNS void AS $$
BEGIN
  UPDATE tickets
  SET archived_at = NOW()
  WHERE status = 'closed'
    AND archived_at IS NULL
    AND updated_at < NOW() - INTERVAL '1 minute';
END;
$$ LANGUAGE plpgsql;

-- 9. RLS для tickets
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tickets"
  ON tickets FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create tickets"
  ON tickets FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tickets"
  ON tickets FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all tickets"
  ON tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Admins can update any ticket"
  ON tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

-- 10. RLS для ticket_messages
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their tickets"
  ON ticket_messages FOR SELECT
  USING (
    ticket_id IN (SELECT id FROM tickets WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can send messages to their tickets"
  ON ticket_messages FOR INSERT
  WITH CHECK (
    ticket_id IN (SELECT id FROM tickets WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can view all messages"
  ON ticket_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Admins can send messages to any ticket"
  ON ticket_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Admins can update messages"
  ON ticket_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

-- 11. RLS для ticket_attachments
ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attachments in their tickets"
  ON ticket_attachments FOR SELECT
  USING (
    message_id IN (
      SELECT tm.id FROM ticket_messages tm
      JOIN tickets t ON tm.ticket_id = t.id
      WHERE t.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all attachments"
  ON ticket_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Users can upload attachments to their tickets"
  ON ticket_attachments FOR INSERT
  WITH CHECK (
    message_id IN (
      SELECT tm.id FROM ticket_messages tm
      JOIN tickets t ON tm.ticket_id = t.id
      WHERE t.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can upload attachments"
  ON ticket_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

-- 12. Storage bucket для вложений
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ticket-attachments', 'ticket-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- 13. Storage политики
DROP POLICY IF EXISTS "Users can upload to their tickets" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their ticket attachments" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all ticket attachments" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload attachments" ON storage.objects;

CREATE POLICY "Users can upload to their tickets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'ticket-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their ticket attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'ticket-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all ticket attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'ticket-attachments'
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Admins can upload attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'ticket-attachments'
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

-- Комментарии
COMMENT ON TABLE tickets IS 'Тикеты поддержки с live-чатом';
COMMENT ON TABLE ticket_messages IS 'Сообщения в тикетах с real-time обновлениями';
COMMENT ON TABLE ticket_attachments IS 'Файлы и фото прикрепленные к сообщениям';
COMMENT ON COLUMN tickets.is_typing IS 'Индикатор печати сообщения';
COMMENT ON COLUMN tickets.unread_count IS 'Количество непрочитанных сообщений';

-- Готово!
SELECT 'Система тикетов полностью обновлена!' as status;
