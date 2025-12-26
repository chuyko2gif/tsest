-- ========================================
-- ИСПРАВЛЕНИЕ RLS ДЛЯ ТИКЕТОВ
-- ========================================

-- Удаляем старые политики для tickets
DROP POLICY IF EXISTS "Users can view own tickets" ON tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON tickets;
DROP POLICY IF EXISTS "Admins can update tickets" ON tickets;

-- Удаляем старые политики для ticket_messages
DROP POLICY IF EXISTS "Users can view messages of own tickets" ON ticket_messages;
DROP POLICY IF EXISTS "Users can send messages to own tickets" ON ticket_messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON ticket_messages;
DROP POLICY IF EXISTS "Admins can send messages" ON ticket_messages;

-- Включаем RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- ========================================
-- ПОЛИТИКИ ДЛЯ TICKETS
-- ========================================

-- Пользователи видят свои тикеты
CREATE POLICY "Users can view own tickets" ON tickets
FOR SELECT USING (auth.uid() = user_id);

-- Админы и овнеры видят ВСЕ тикеты
CREATE POLICY "Admins can view all tickets" ON tickets
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.role = 'owner')
  )
);

-- Пользователи могут создавать тикеты
CREATE POLICY "Users can create tickets" ON tickets
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Админы и овнеры могут обновлять тикеты (менять статус)
CREATE POLICY "Admins can update tickets" ON tickets
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.role = 'owner')
  )
);

-- ========================================
-- ПОЛИТИКИ ДЛЯ TICKET_MESSAGES
-- ========================================

-- Пользователи видят сообщения своих тикетов
CREATE POLICY "Users can view messages of own tickets" ON ticket_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tickets 
    WHERE tickets.id = ticket_messages.ticket_id 
    AND tickets.user_id = auth.uid()
  )
);

-- Админы и овнеры видят ВСЕ сообщения
CREATE POLICY "Admins can view all messages" ON ticket_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.role = 'owner')
  )
);

-- Пользователи могут отправлять сообщения в свои тикеты
CREATE POLICY "Users can send messages to own tickets" ON ticket_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM tickets 
    WHERE tickets.id = ticket_messages.ticket_id 
    AND tickets.user_id = auth.uid()
  )
);

-- Админы и овнеры могут отправлять сообщения в любые тикеты
CREATE POLICY "Admins can send messages" ON ticket_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.role = 'owner')
  )
);

-- ========================================
-- ВКЛЮЧАЕМ REALTIME ДЛЯ ТИКЕТОВ
-- ========================================
-- Если ошибка "already member" - это нормально
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE ticket_messages;

-- ========================================
-- ПРОВЕРКА
-- ========================================
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('tickets', 'ticket_messages');
