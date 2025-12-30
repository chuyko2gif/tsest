-- Миграция: добавляем информацию о печатающем и реакции на сообщения
-- Выполните этот скрипт в Supabase SQL Editor

-- 1. Добавляем поля для информации о печатающем
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS typing_nickname TEXT,
ADD COLUMN IF NOT EXISTS typing_is_admin BOOLEAN DEFAULT false;

-- 2. Создаем таблицу реакций на сообщения
CREATE TABLE IF NOT EXISTS ticket_message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES ticket_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL DEFAULT '❤️',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- 3. Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_ticket_message_reactions_message_id ON ticket_message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_ticket_message_reactions_user_id ON ticket_message_reactions(user_id);

-- 4. RLS для реакций
ALTER TABLE ticket_message_reactions ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики если существуют
DROP POLICY IF EXISTS "Users can view reactions on own ticket messages" ON ticket_message_reactions;
DROP POLICY IF EXISTS "Users can add reactions on own ticket messages" ON ticket_message_reactions;
DROP POLICY IF EXISTS "Users can delete own reactions" ON ticket_message_reactions;
DROP POLICY IF EXISTS "Admins can view all reactions" ON ticket_message_reactions;
DROP POLICY IF EXISTS "Admins can add reactions" ON ticket_message_reactions;
DROP POLICY IF EXISTS "Admins can delete own reactions" ON ticket_message_reactions;

-- Политика: пользователи могут видеть реакции на сообщения в своих тикетах
CREATE POLICY "Users can view reactions on own ticket messages" ON ticket_message_reactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM ticket_messages tm
    JOIN tickets t ON t.id = tm.ticket_id
    WHERE tm.id = ticket_message_reactions.message_id
    AND t.user_id = auth.uid()
  )
);

-- Политика: пользователи могут добавлять реакции на сообщения в своих тикетах
CREATE POLICY "Users can add reactions on own ticket messages" ON ticket_message_reactions
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM ticket_messages tm
    JOIN tickets t ON t.id = tm.ticket_id
    WHERE tm.id = message_id
    AND t.user_id = auth.uid()
  )
);

-- Политика: пользователи могут удалять свои реакции
CREATE POLICY "Users can delete own reactions" ON ticket_message_reactions
FOR DELETE
USING (auth.uid() = user_id);

-- Политика: админы видят все реакции
CREATE POLICY "Admins can view all reactions" ON ticket_message_reactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Политика: админы могут добавлять реакции
CREATE POLICY "Admins can add reactions" ON ticket_message_reactions
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Политика: админы могут удалять свои реакции
CREATE POLICY "Admins can delete own reactions" ON ticket_message_reactions
FOR DELETE
USING (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- 5. Включаем realtime для реакций (игнорируем ошибку если уже добавлено)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE ticket_message_reactions;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- Готово!
SELECT 'Migration complete: typing info and reactions added' as status;
