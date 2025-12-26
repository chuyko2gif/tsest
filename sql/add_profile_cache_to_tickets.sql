-- Обновление таблицы ticket_messages для хранения информации о профилях отправителей
-- Это улучшает производительность, избегая множественных JOIN при отображении чата

-- 1. Добавить поля для кэширования информации о профиле
ALTER TABLE ticket_messages ADD COLUMN IF NOT EXISTS sender_email TEXT;
ALTER TABLE ticket_messages ADD COLUMN IF NOT EXISTS sender_avatar TEXT;
ALTER TABLE ticket_messages ADD COLUMN IF NOT EXISTS sender_nickname TEXT;

-- 2. Заполнить данные для существующих сообщений
UPDATE ticket_messages tm
SET 
  sender_email = p.email,
  sender_avatar = p.avatar,
  sender_nickname = p.nickname
FROM profiles p
WHERE tm.sender_id = p.id
  AND (tm.sender_email IS NULL OR tm.sender_nickname IS NULL);

-- 3. Создать функцию для автоматического заполнения данных профиля
CREATE OR REPLACE FUNCTION populate_sender_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Загрузить информацию о профиле отправителя
  SELECT email, avatar, nickname
  INTO NEW.sender_email, NEW.sender_avatar, NEW.sender_nickname
  FROM profiles
  WHERE id = NEW.sender_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Создать триггер для автоматического заполнения при вставке
DROP TRIGGER IF EXISTS trigger_populate_sender_profile ON ticket_messages;
CREATE TRIGGER trigger_populate_sender_profile
  BEFORE INSERT ON ticket_messages
  FOR EACH ROW
  EXECUTE FUNCTION populate_sender_profile();

-- 5. Добавить поля в таблицу tickets для кэширования информации о пользователе
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS user_telegram TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS user_avatar TEXT;

-- 6. Заполнить данные для существующих тикетов
UPDATE tickets t
SET 
  user_email = p.email,
  user_telegram = p.telegram,
  user_avatar = p.avatar
FROM profiles p
WHERE t.user_id = p.id
  AND (t.user_email IS NULL);

-- 7. Создать функцию для автоматического заполнения данных пользователя в тикете
CREATE OR REPLACE FUNCTION populate_ticket_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Загрузить информацию о профиле пользователя
  SELECT email, telegram, avatar
  INTO NEW.user_email, NEW.user_telegram, NEW.user_avatar
  FROM profiles
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Создать триггер для автоматического заполнения при вставке тикета
DROP TRIGGER IF EXISTS trigger_populate_ticket_user_profile ON tickets;
CREATE TRIGGER trigger_populate_ticket_user_profile
  BEFORE INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION populate_ticket_user_profile();

-- ПРИМЕЧАНИЯ:
-- - Эти поля кэшируют данные профиля для быстрого отображения
-- - При изменении профиля нужно будет обновлять эти данные (можно добавить триггер на profiles)
-- - Это компромисс между производительностью и нормализацией данных

-- - Удалены поля sender_username и user_username так как в profiles нет колонки username