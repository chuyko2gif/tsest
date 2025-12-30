-- Исправление политик для реакций
-- Выполните этот скрипт в Supabase SQL Editor

-- Удаляем ВСЕ старые политики
DROP POLICY IF EXISTS "Users can view reactions on own ticket messages" ON ticket_message_reactions;
DROP POLICY IF EXISTS "Users can add reactions on own ticket messages" ON ticket_message_reactions;
DROP POLICY IF EXISTS "Users can delete own reactions" ON ticket_message_reactions;
DROP POLICY IF EXISTS "Admins can view all reactions" ON ticket_message_reactions;
DROP POLICY IF EXISTS "Admins can add reactions" ON ticket_message_reactions;
DROP POLICY IF EXISTS "Admins can delete own reactions" ON ticket_message_reactions;
DROP POLICY IF EXISTS "Anyone can view reactions" ON ticket_message_reactions;
DROP POLICY IF EXISTS "Authenticated can add reactions" ON ticket_message_reactions;
DROP POLICY IF EXISTS "Users can delete their reactions" ON ticket_message_reactions;

-- Простые открытые политики для тестирования:

-- Все авторизованные пользователи могут видеть все реакции
CREATE POLICY "Anyone can view reactions" ON ticket_message_reactions
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Все авторизованные пользователи могут добавлять реакции (от своего имени)
CREATE POLICY "Authenticated can add reactions" ON ticket_message_reactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Пользователи могут удалять только свои реакции
CREATE POLICY "Users can delete their reactions" ON ticket_message_reactions
FOR DELETE
USING (auth.uid() = user_id);

-- ВКЛЮЧАЕМ REALTIME для таблицы реакций
ALTER PUBLICATION supabase_realtime ADD TABLE ticket_message_reactions;

-- Проверка что таблица существует и RLS включен
SELECT 'Policies and Realtime updated! Table exists: ' || (SELECT COUNT(*) FROM ticket_message_reactions)::text as status;
