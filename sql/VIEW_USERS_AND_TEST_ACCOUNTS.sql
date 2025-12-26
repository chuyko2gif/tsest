-- ============================================
-- 🔍 ПРОСМОТР ПОЛЬЗОВАТЕЛЕЙ И АККАУНТОВ
-- ============================================

-- ⚠️ ВАЖНО: Пароли в Supabase хранятся в зашифрованном виде!
-- Пароли недоступны для чтения, это сделано для безопасности.
-- Можно только сбросить пароль через email.

-- ==========================================
-- ПРОСМОТР ВСЕХ ПОЛЬЗОВАТЕЛЕЙ
-- ==========================================

SELECT 
  '🔍 ВСЕ ПОЛЬЗОВАТЕЛИ В СИСТЕМЕ:' as info;

-- Информация из auth.users (системная таблица Supabase)
SELECT 
  au.id,
  au.email,
  au.created_at as registered_at,
  au.last_sign_in_at,
  au.email_confirmed_at,
  CASE 
    WHEN au.email_confirmed_at IS NOT NULL THEN '✅ Подтверждён'
    ELSE '❌ Не подтверждён'
  END as email_status
FROM auth.users au
ORDER BY au.created_at DESC;

-- Информация из profiles (наша таблица)
SELECT 
  p.id,
  p.email,
  p.nickname,
  p.member_id,
  p.role,
  p.original_role,
  p.can_link_accounts,
  p.balance,
  p.avatar,
  p.created_at
FROM public.profiles p
ORDER BY p.created_at DESC;

-- ==========================================
-- СОЗДАНИЕ ТЕСТОВОЙ ТАБЛИЦЫ ДЛЯ АДМИНОВ/ОВНЕРОВ
-- ==========================================

-- Таблица для быстрого тестирования (хранит тестовые логины)
CREATE TABLE IF NOT EXISTS public.test_admin_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Email для входа
  test_email TEXT NOT NULL UNIQUE,
  
  -- Тестовый пароль (только для разработки!)
  test_password TEXT NOT NULL,
  
  -- Связанный профиль
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Роль тестового аккаунта
  test_role TEXT NOT NULL CHECK (test_role IN ('owner', 'admin', 'exclusive', 'basic')),
  
  -- Описание
  description TEXT,
  
  -- Активен ли
  is_active BOOLEAN DEFAULT true,
  
  -- Когда создан
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_test_admin_accounts_email 
ON public.test_admin_accounts(test_email);

-- ==========================================
-- ДОБАВЛЕНИЕ ТЕСТОВЫХ АККАУНТОВ
-- ==========================================

-- Вставляем тестовый Owner аккаунт
INSERT INTO public.test_admin_accounts (test_email, test_password, test_role, description)
VALUES 
  ('owner@test.local', 'TestOwner123!', 'owner', 'Тестовый аккаунт владельца'),
  ('admin@test.local', 'TestAdmin123!', 'admin', 'Тестовый аккаунт администратора'),
  ('exclusive@test.local', 'TestExclusive123!', 'exclusive', 'Тестовый аккаунт Exclusive'),
  ('basic@test.local', 'TestBasic123!', 'basic', 'Тестовый аккаунт Basic')
ON CONFLICT (test_email) DO NOTHING;

-- ==========================================
-- ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ ТЕСТОВЫХ АККАУНТОВ
-- ==========================================

CREATE OR REPLACE FUNCTION get_test_accounts()
RETURNS TABLE (
  email TEXT,
  password TEXT,
  role TEXT,
  description TEXT,
  is_active BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    test_email as email,
    test_password as password,
    test_role as role,
    t.description,  -- Явно указываем таблицу
    t.is_active     -- Явно указываем таблицу
  FROM public.test_admin_accounts t
  WHERE t.is_active = true
  ORDER BY 
    CASE t.test_role
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'exclusive' THEN 3
      WHEN 'basic' THEN 4
    END;
END;
$$;

-- ==========================================
-- ПРОВЕРКА ТЕКУЩЕГО СОСТОЯНИЯ
-- ==========================================

SELECT 
  '👑 ВСЕ ОВНЕРЫ И АДМИНЫ В СИСТЕМЕ:' as info;

-- Все Owner и Admin в базе
SELECT 
  p.id,
  p.email,
  p.nickname,
  p.member_id,
  p.role as current_role,
  p.original_role,
  p.can_link_accounts,
  p.created_at,
  CASE 
    WHEN p.original_role = 'owner' THEN '👑 Owner (истинная роль)'
    WHEN p.role = 'owner' THEN '👑 Owner'
    WHEN p.original_role = 'admin' THEN '⚡ Admin (истинная роль)'
    WHEN p.role = 'admin' THEN '⚡ Admin'
  END as status
FROM public.profiles p
WHERE p.role IN ('owner', 'admin') OR p.original_role IN ('owner', 'admin')
ORDER BY 
  CASE p.role
    WHEN 'owner' THEN 1
    WHEN 'admin' THEN 2
  END,
  p.created_at ASC;

SELECT 
  '✅ ТЕКУЩИЙ ПОЛЬЗОВАТЕЛЬ (вы):' as info;

-- Ваш аккаунт
SELECT 
  p.email,
  p.nickname,
  p.member_id,
  p.role as current_role,
  p.original_role,
  p.can_link_accounts,
  CASE 
    WHEN p.original_role = 'owner' THEN '✅ Вы Owner - можете переключаться на все роли'
    WHEN p.original_role = 'admin' THEN '✅ Вы Admin - можете переключаться на Basic/Exclusive'
    WHEN p.role = 'owner' THEN '⚠️ Вы Owner но без original_role'
    WHEN p.role = 'admin' THEN '⚠️ Вы Admin но без original_role'
    ELSE '👤 Обычный пользователь'
  END as your_status
FROM public.profiles p
ORDER BY p.created_at ASC
LIMIT 1;

SELECT 
  '✅ ТЕСТОВЫЕ АККАУНТЫ:' as info;

-- Список тестовых аккаунтов
SELECT * FROM get_test_accounts();

-- ==========================================
-- ИСПРАВЛЕНИЕ ВАШЕГО АККАУНТА
-- ==========================================

-- Если вы Owner но не можете переключаться - выполните это:
-- Исправляем ВСЕХ владельцев и админов
UPDATE public.profiles
SET 
  original_role = role,
  can_link_accounts = true
WHERE role IN ('owner', 'admin') 
  AND (original_role IS NULL OR original_role = '');

-- Дополнительно - если вы застряли в другой роли, возвращаем к owner
UPDATE public.profiles
SET role = 'owner'
WHERE id = (
  SELECT id FROM public.profiles 
  WHERE original_role = 'owner'
  ORDER BY created_at ASC 
  LIMIT 1
);

-- Проверяем результат
SELECT 
  '✅ ПОСЛЕ ИСПРАВЛЕНИЯ - ВСЕ ОВНЕРЫ И АДМИНЫ:' as info;

SELECT 
  email,
  nickname,
  member_id,
  role,
  original_role,
  can_link_accounts,
  CASE 
    WHEN original_role = 'owner' AND role = 'owner' THEN '✅ Owner - все настроено!'
    WHEN original_role = 'owner' THEN '✅ Owner - можете вернуться!'
    WHEN original_role = 'admin' AND role = 'admin' THEN '✅ Admin - все настроено!'
    WHEN original_role = 'admin' THEN '✅ Admin - можете вернуться!'
    WHEN role = 'owner' THEN '⚠️ Owner без original_role'
    WHEN role = 'admin' THEN '⚠️ Admin без original_role'
  END as status
FROM public.profiles
WHERE role IN ('owner', 'admin') OR original_role IN ('owner', 'admin')
ORDER BY 
  CASE role
    WHEN 'owner' THEN 1
    WHEN 'admin' THEN 2
  END,
  created_at ASC;

-- ============================================
-- ✅ ГОТОВО!
-- ============================================

-- ТЕПЕРЬ У ВАС ЕСТЬ:
-- 1. Просмотр всех пользователей
-- 2. Таблица тестовых аккаунтов с паролями
-- 3. Функция для получения тестовых данных
-- 4. Исправление вашего Owner аккаунта

-- ⚠️ О ПАРОЛЯХ:
-- Пароли реальных пользователей НЕ ДОСТУПНЫ для просмотра
-- Они хранятся в зашифрованном виде в auth.users
-- Только тестовые пароли хранятся в открытом виде

-- 🔄 ОБНОВИТЕ СТРАНИЦУ (F5) ПОСЛЕ ВЫПОЛНЕНИЯ
-- ============================================
