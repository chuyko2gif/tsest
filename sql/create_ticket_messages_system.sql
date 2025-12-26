-- Новая система тикетов с live-чатом и вложениями

-- Таблица для сообщений в тикетах
CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица для вложений (фото, файлы)
CREATE TABLE IF NOT EXISTS ticket_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES ticket_messages(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Добавляем поля в tickets
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_message_preview TEXT,
ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_typing BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS typing_user_id UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS closed_by UUID REFERENCES profiles(id);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created_at ON ticket_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_message_id ON ticket_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_tickets_last_message_at ON tickets(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_archived_at ON tickets(archived_at) WHERE archived_at IS NOT NULL;

-- Функция для обновления last_message_at и превью
CREATE OR REPLACE FUNCTION update_ticket_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tickets 
  SET 
    last_message_at = NEW.created_at,
    last_message_preview = SUBSTRING(NEW.message FROM 1 FOR 100)
  WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автообновления при новом сообщении
DROP TRIGGER IF EXISTS trigger_update_ticket_last_message ON ticket_messages;
CREATE TRIGGER trigger_update_ticket_last_message
  AFTER INSERT ON ticket_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_last_message();

-- Функция для автоархивации закрытых тикетов
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

-- RLS политики для ticket_messages
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- Пользователи видят свои сообщения
CREATE POLICY "Users can view their ticket messages"
  ON ticket_messages FOR SELECT
  USING (
    user_id = auth.uid() 
    OR ticket_id IN (SELECT id FROM tickets WHERE user_id = auth.uid())
  );

-- Пользователи могут отправлять сообщения в свои тикеты
CREATE POLICY "Users can send messages to their tickets"
  ON ticket_messages FOR INSERT
  WITH CHECK (
    ticket_id IN (SELECT id FROM tickets WHERE user_id = auth.uid())
  );

-- Админы видят все сообщения
CREATE POLICY "Admins can view all messages"
  ON ticket_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

-- Админы могут отправлять сообщения во все тикеты
CREATE POLICY "Admins can send messages to any ticket"
  ON ticket_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

-- RLS для вложений
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

-- Storage bucket для вложений тикетов
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ticket-attachments', 'ticket-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage политики
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

COMMENT ON TABLE ticket_messages IS 'Сообщения в тикетах поддержки с real-time обновлениями';
COMMENT ON TABLE ticket_attachments IS 'Файлы и фото прикрепленные к сообщениям тикетов';
COMMENT ON COLUMN tickets.is_typing IS 'Индикатор печати сообщения';
COMMENT ON COLUMN tickets.unread_count IS 'Количество непрочитанных сообщений для пользователя';
