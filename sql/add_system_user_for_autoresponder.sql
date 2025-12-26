-- ==========================================
-- СОЗДАНИЕ СИСТЕМНОГО ПОЛЬЗОВАТЕЛЯ ДЛЯ АВТООТВЕТЧИКА
-- ==========================================
-- Этот скрипт создает специального пользователя для автоматических сообщений
-- поддержки, которые отправляются при создании тикета

-- 1. Создать пользователя в auth.users (если еще не существует)
-- ВАЖНО: Этот UUID должен совпадать с systemUserId в коде API
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  recovery_token,
  email_change_token_new
)
VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'system@thqlabel.com',
  '$2a$10$SYSTEM_USER_NO_PASSWORD',
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"],"is_system":true}'::jsonb,
  '{"name":"THQ Label Support","is_system":true}'::jsonb,
  false,
  '',
  '',
  ''
)
ON CONFLICT (id) DO NOTHING;

-- 2. Создать профиль в таблице profiles
INSERT INTO profiles (
  id,
  username,
  nickname,
  email,
  avatar,
  balance,
  email_confirmed,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'THQ Support',
  'THQ Label Support',
  'support@thqlabel.com',
  '/thqsupp logo.png',
  0,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  username = 'THQ Support',
  nickname = 'THQ Label Support',
  email = 'support@thqlabel.com',
  avatar = '/thqsupp logo.png';

-- 3. Обновить триггер populate_sender_profile чтобы не трогал системного пользователя
CREATE OR REPLACE FUNCTION populate_sender_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Пропускаем системного пользователя - его данные уже правильно заполнены
  IF NEW.sender_id = '00000000-0000-0000-0000-000000000000'::uuid THEN
    RETURN NEW;
  END IF;

  -- Загрузить информацию о профиле отправителя
  SELECT username, nickname, email, avatar
  INTO NEW.sender_username, NEW.sender_nickname, NEW.sender_email, NEW.sender_avatar
  FROM profiles
  WHERE id = NEW.sender_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Проверить что триггер установлен
DROP TRIGGER IF EXISTS trigger_populate_sender_profile ON ticket_messages;
CREATE TRIGGER trigger_populate_sender_profile
  BEFORE INSERT ON ticket_messages
  FOR EACH ROW
  EXECUTE FUNCTION populate_sender_profile();

-- ==========================================
-- ПРОВЕРКА
-- ==========================================
-- Проверить что системный пользователь создан:
-- SELECT * FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000000';
-- SELECT * FROM profiles WHERE id = '00000000-0000-0000-0000-000000000000';

-- Проверить автоответчик:
-- 1. Создайте новый тикет через интерфейс
-- 2. Должно появиться автоматическое сообщение от "THQ Label Support"
-- 3. У сообщения должен быть аватар "/thqsupp logo.png"
