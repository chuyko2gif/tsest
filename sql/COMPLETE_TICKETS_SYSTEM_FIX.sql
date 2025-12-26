-- ============================================
-- ПОЛНАЯ НАСТРОЙКА СИСТЕМЫ ТИКЕТОВ
-- ============================================
-- Этот скрипт создает полную инфраструктуру для системы поддержки:
-- 1. Таблицы tickets и ticket_messages с необходимыми полями
-- 2. Автоматическое кеширование информации о пользователях
-- 3. Систему архивации тикетов
-- 4. Триггеры для автоматического заполнения данных

-- ============================================
-- ШАГ 1: ОБНОВЛЯЕМ ТАБЛИЦУ SUPPORT_TICKETS
-- ============================================

-- Добавляем поля для кеширования информации о пользователе
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS user_nickname TEXT;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS user_telegram TEXT;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS user_avatar TEXT;

-- Добавляем систему архивации
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Добавляем поля для отслеживания непрочитанных сообщений
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS admin_read_at TIMESTAMPTZ;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS last_admin_message_at TIMESTAMPTZ;

-- Создаем индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_support_tickets_archived_at ON support_tickets(archived_at);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);

-- ============================================
-- ШАГ 2: ОБНОВЛЯЕМ ТАБЛИЦУ TICKET_MESSAGES
-- ============================================

-- Добавляем поля для кеширования информации об отправителе
ALTER TABLE ticket_messages ADD COLUMN IF NOT EXISTS sender_email TEXT;
ALTER TABLE ticket_messages ADD COLUMN IF NOT EXISTS sender_nickname TEXT;
ALTER TABLE ticket_messages ADD COLUMN IF NOT EXISTS sender_avatar TEXT;

-- Создаем индексы
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_sender_id ON ticket_messages(sender_id);

-- ============================================
-- ШАГ 3: ЗАПОЛНЯЕМ СУЩЕСТВУЮЩИЕ ДАННЫЕ
-- ============================================

-- Заполняем данные пользователей в существующих тикетах
UPDATE support_tickets t
SET 
  user_email = p.email,
  user_nickname = p.nickname,
  user_telegram = p.telegram,
  user_avatar = p.avatar
FROM profiles p
WHERE t.user_id = p.id
  AND t.user_email IS NULL;

-- Заполняем данные отправителей в существующих сообщениях
UPDATE ticket_messages tm
SET 
  sender_email = p.email,
  sender_nickname = p.nickname,
  sender_avatar = p.avatar
FROM profiles p
WHERE tm.sender_id = p.id
  AND tm.sender_email IS NULL;

-- ============================================
-- ШАГ 4: СОЗДАЕМ ФУНКЦИИ ДЛЯ АВТОЗАПОЛНЕНИЯ
-- ============================================

-- Функция для автоматического заполнения данных пользователя при создании тикета
CREATE OR REPLACE FUNCTION populate_ticket_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Загружаем информацию о профиле пользователя
  SELECT email, nickname, telegram, avatar
  INTO NEW.user_email, NEW.user_nickname, NEW.user_telegram, NEW.user_avatar
  FROM profiles
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для автоматического заполнения данных отправителя при создании сообщения
CREATE OR REPLACE FUNCTION populate_sender_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Загружаем информацию о профиле отправителя
  SELECT email, nickname, avatar
  INTO NEW.sender_email, NEW.sender_nickname, NEW.sender_avatar
  FROM profiles
  WHERE id = NEW.sender_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для автоматической архивации при закрытии тикета
CREATE OR REPLACE FUNCTION auto_archive_on_close()
RETURNS TRIGGER AS $$
BEGIN
  -- Если тикет закрывается, автоматически архивируем его
  IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
    NEW.archived_at = NOW();
  END IF;
  
  -- Если тикет открывается снова, убираем из архива
  IF NEW.status != 'closed' AND OLD.status = 'closed' THEN
    NEW.archived_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ШАГ 5: СОЗДАЕМ ТРИГГЕРЫ
-- ============================================

-- Триггер для автозаполнения профиля пользователя при создании тикета
DROP TRIGGER IF EXISTS trigger_populate_ticket_user_profile ON support_tickets;
CREATE TRIGGER trigger_populate_ticket_user_profile
  BEFORE INSERT ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION populate_ticket_user_profile();

-- Триггер для автозаполнения профиля отправителя при создании сообщения
DROP TRIGGER IF EXISTS trigger_populate_sender_profile ON ticket_messages;
CREATE TRIGGER trigger_populate_sender_profile
  BEFORE INSERT ON ticket_messages
  FOR EACH ROW
  EXECUTE FUNCTION populate_sender_profile();

-- Триггер для автоматической архивации при закрытии
DROP TRIGGER IF EXISTS trigger_auto_archive_on_close ON support_tickets;
CREATE TRIGGER trigger_auto_archive_on_close
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION auto_archive_on_close();

-- ============================================
-- ШАГ 6: ОБНОВЛЯЕМ ПОЛИТИКИ RLS (ЕСЛИ НУЖНО)
-- ============================================

-- Политики для тикетов (пользователи видят только свои, админы видят все)
DROP POLICY IF EXISTS "Users can view own tickets" ON support_tickets;
CREATE POLICY "Users can view own tickets" ON support_tickets
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- Политики для сообщений (видны если есть доступ к тикету)
DROP POLICY IF EXISTS "Users can view messages for their tickets" ON ticket_messages;
CREATE POLICY "Users can view messages for their tickets" ON ticket_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = ticket_messages.ticket_id
      AND (
        support_tickets.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'owner')
        )
      )
    )
  );

-- ============================================
-- ПРОВЕРКА
-- ============================================

-- Проверяем структуру таблиц
SELECT 
  'support_tickets' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'support_tickets'
AND column_name IN ('user_email', 'user_nickname', 'user_telegram', 'user_avatar', 'archived_at')
ORDER BY column_name;

SELECT 
  'ticket_messages' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'ticket_messages'
AND column_name IN ('sender_email', 'sender_nickname', 'sender_avatar')
ORDER BY column_name;

-- Проверяем триггеры
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('support_tickets', 'ticket_messages')
ORDER BY event_object_table, trigger_name;

-- ============================================
-- ПРИМЕЧАНИЯ
-- ============================================
-- ✅ После выполнения этого скрипта:
-- 1. Все новые тикеты будут автоматически получать информацию о пользователе
-- 2. Все новые сообщения будут автоматически получать информацию об отправителе
-- 3. При закрытии тикета он автоматически архивируется
-- 4. При повторном открытии тикет убирается из архива
-- 5. Существующие тикеты и сообщения получили недостающие данные

-- ⚠️ Важно: Убедитесь что таблицы support_tickets и ticket_messages существуют
-- ⚠️ Убедитесь что таблица profiles имеет поля: email, nickname, telegram, avatar
