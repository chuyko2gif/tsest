-- Таблица тикетов
CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица сообщений в тикетах
CREATE TABLE IF NOT EXISTS ticket_messages (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);

-- RLS (Row Level Security)
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- Политики для tickets
CREATE POLICY "Users can view own tickets" ON tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create tickets" ON tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all tickets" ON tickets FOR SELECT USING (true);
CREATE POLICY "Admins can update tickets" ON tickets FOR UPDATE USING (true);

-- Политики для ticket_messages  
CREATE POLICY "Users can view messages of own tickets" ON ticket_messages FOR SELECT 
  USING (ticket_id IN (SELECT id FROM tickets WHERE user_id = auth.uid()));
CREATE POLICY "Users can send messages to own tickets" ON ticket_messages FOR INSERT 
  WITH CHECK (ticket_id IN (SELECT id FROM tickets WHERE user_id = auth.uid()));
CREATE POLICY "Admins can view all messages" ON ticket_messages FOR SELECT USING (true);
CREATE POLICY "Admins can send messages" ON ticket_messages FOR INSERT WITH CHECK (true);
