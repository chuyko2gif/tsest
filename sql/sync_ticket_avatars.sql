-- ============================================
-- СИНХРОНИЗАЦИЯ АВАТАРОК В ТИКЕТАХ
-- Запустите этот скрипт в Supabase SQL Editor
-- ============================================

-- Шаг 1: Обновляем ВСЕ данные отправителей в сообщениях (не только NULL)
UPDATE ticket_messages tm
SET 
  sender_email = p.email,
  sender_nickname = COALESCE(p.nickname, p.email),
  sender_avatar = p.avatar
FROM profiles p
WHERE tm.sender_id = p.id
  AND tm.sender_id != '00000000-0000-0000-0000-000000000000'; -- Исключаем системного пользователя

-- Шаг 2: Обновляем данные пользователей в тикетах
UPDATE support_tickets st
SET 
  user_email = p.email,
  user_nickname = COALESCE(p.nickname, p.email),
  user_telegram = p.telegram,
  user_avatar = p.avatar,
  user_role = p.role
FROM profiles p
WHERE st.user_id = p.id;

-- Шаг 3: Пересоздаём триггерную функцию с исправлениями
CREATE OR REPLACE FUNCTION populate_sender_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Не трогаем системного пользователя
  IF NEW.sender_id = '00000000-0000-0000-0000-000000000000' THEN
    RETURN NEW;
  END IF;
  
  -- Загружаем информацию о профиле отправителя
  SELECT 
    email, 
    COALESCE(nickname, email),
    avatar
  INTO 
    NEW.sender_email, 
    NEW.sender_nickname,
    NEW.sender_avatar
  FROM profiles
  WHERE id = NEW.sender_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Шаг 4: Убеждаемся, что триггер существует
DROP TRIGGER IF EXISTS trigger_populate_sender_profile ON ticket_messages;
CREATE TRIGGER trigger_populate_sender_profile
  BEFORE INSERT ON ticket_messages
  FOR EACH ROW
  EXECUTE FUNCTION populate_sender_profile();

-- Шаг 5: Также обновляем функцию для тикетов
CREATE OR REPLACE FUNCTION populate_ticket_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  SELECT 
    email, 
    COALESCE(nickname, email),
    telegram, 
    avatar,
    role
  INTO 
    NEW.user_email, 
    NEW.user_nickname, 
    NEW.user_telegram, 
    NEW.user_avatar,
    NEW.user_role
  FROM profiles
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Шаг 6: Убеждаемся, что триггер для тикетов существует
DROP TRIGGER IF EXISTS trigger_populate_ticket_user_profile ON support_tickets;
CREATE TRIGGER trigger_populate_ticket_user_profile
  BEFORE INSERT ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION populate_ticket_user_profile();

-- Проверка результата:
SELECT 
  'Сообщений с аватарками: ' || COUNT(*) FILTER (WHERE sender_avatar IS NOT NULL) || 
  ', без аватарок: ' || COUNT(*) FILTER (WHERE sender_avatar IS NULL) AS messages_status
FROM ticket_messages
WHERE sender_id != '00000000-0000-0000-0000-000000000000';

SELECT 
  'Тикетов с аватарками пользователей: ' || COUNT(*) FILTER (WHERE user_avatar IS NOT NULL) || 
  ', без аватарок: ' || COUNT(*) FILTER (WHERE user_avatar IS NULL) AS tickets_status
FROM support_tickets;

-- Показать профили админов/овнеров с аватарками:
SELECT id, email, nickname, role, 
  CASE WHEN avatar IS NOT NULL THEN 'Есть' ELSE 'Нет' END as avatar_status,
  LEFT(avatar, 50) as avatar_preview
FROM profiles 
WHERE role IN ('admin', 'owner')
ORDER BY role, email;
