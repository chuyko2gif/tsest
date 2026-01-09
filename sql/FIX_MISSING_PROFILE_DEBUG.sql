-- =====================================================
-- ДИАГНОСТИКА И ИСПРАВЛЕНИЕ ПРОБЛЕМЫ С РЕГИСТРАЦИЕЙ
-- Выполни этот SQL в Supabase Dashboard -> SQL Editor
-- =====================================================

-- 1. Проверяем есть ли пользователь в auth.users (с email который регистрировал)
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  raw_user_meta_data
FROM auth.users
WHERE email LIKE '%ВАШ_EMAIL%'  -- Замени на email пользователя
ORDER BY created_at DESC;

-- 2. Проверяем есть ли профиль для этого пользователя
SELECT 
  id,
  email,
  nickname,
  telegram,
  member_id,
  role,
  created_at
FROM profiles
WHERE email LIKE '%ВАШ_EMAIL%';  -- Замени на email пользователя

-- 3. Если пользователь есть в auth.users но нет в profiles - создаём профиль вручную
-- РАСКОММЕНТИРУЙ И ВЫПОЛНИ ТОЛЬКО ЕСЛИ ПРОФИЛЯ НЕТ:
/*
INSERT INTO profiles (id, email, nickname, telegram, member_id, role, balance, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'nickname', SPLIT_PART(u.email, '@', 1)),
  u.raw_user_meta_data->>'telegram',
  'THQ-' || LPAD(FLOOR(1000 + RANDOM() * 9000)::TEXT, 4, '0'),
  'basic',
  0,
  NOW(),
  NOW()
FROM auth.users u
WHERE u.email = 'ВАШ_EMAIL'  -- Замени на email
  AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id);
*/

-- 4. Проверяем работает ли триггер
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 5. Проверяем функцию handle_new_user
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- 6. Проверяем токены в email_tokens
SELECT 
  id,
  token,
  token_type,
  email,
  nickname,
  telegram,
  used,
  expires_at,
  created_at
FROM email_tokens
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- ЕСЛИ ТРИГГЕР НЕ РАБОТАЕТ, ПЕРЕСОЗДАЙ ЕГО:
-- =====================================================

-- Обновленная функция с поддержкой telegram
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_member_id TEXT;
BEGIN
  -- Генерируем уникальный member_id
  new_member_id := 'THQ-' || LPAD(FLOOR(1000 + RANDOM() * 9000)::TEXT, 4, '0');
  
  -- Создаём профиль с полными данными включая telegram
  INSERT INTO public.profiles (id, email, nickname, telegram, member_id, role, balance, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'nickname',
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'telegram',
    new_member_id,
    'basic',
    0,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nickname = COALESCE(profiles.nickname, EXCLUDED.nickname),
    telegram = COALESCE(profiles.telegram, EXCLUDED.telegram),
    member_id = COALESCE(profiles.member_id, EXCLUDED.member_id),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Пересоздаём триггер
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Добавляем колонку telegram в email_tokens если её нет
ALTER TABLE email_tokens ADD COLUMN IF NOT EXISTS telegram TEXT;

-- =====================================================
-- ГОТОВО! Проверь профиль пользователя ещё раз
-- =====================================================
