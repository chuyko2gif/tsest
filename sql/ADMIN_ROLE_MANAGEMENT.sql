-- ============================================
-- 🔧 УПРАВЛЕНИЕ РОЛЯМИ И АККАУНТАМИ
-- Дата: 26.12.2025
-- 
-- ЧТО ДЕЛАЕТ:
-- 1. ⚠️ ОТМЕНЕНО - Коды остаются в формате THQ- (НЕ thq-)
-- 2. Добавляет поле для сохранения оригинальной роли админа
-- 3. Создает индексы для быстрого поиска пользователей
-- 4. Обновляет функции генерации member_id
-- ============================================

-- ШАГ 1: Проверка текущих кодов профилей
-- ============================================

-- ОТМЕНЕНО: НЕ меняем формат! Оставляем THQ-
-- Проверяем текущее состояние
SELECT 
  member_id,
  nickname,
  role
FROM profiles
WHERE member_id LIKE 'THQ-%'
ORDER BY created_at DESC
LIMIT 10;

-- ШАГ 2: Добавление поля для оригинальной роли
-- ============================================

-- Добавляем поле для сохранения оригинальной роли при тестировании
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS original_role TEXT;

-- Заполняем original_role для админов и овнеров
UPDATE public.profiles
SET original_role = role
WHERE role IN ('admin', 'owner') 
  AND original_role IS NULL;

-- Комментарий к новому полю
COMMENT ON COLUMN public.profiles.original_role IS 'Оригинальная роль админа/овнера при тестировании под другими ролями';

-- ШАГ 3: Обновление триггерной функции для новых пользователей
-- ============================================

-- Функция для автоматической генерации member_id с THQ- префиксом (ПРАВИЛЬНЫЙ ФОРМАТ)
CREATE OR REPLACE FUNCTION public.generate_member_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_member_id TEXT;
  id_exists BOOLEAN;
BEGIN
  LOOP
    -- Генерируем ID формата THQ-XXXX (4 цифры) - ПРАВИЛЬНЫЙ ФОРМАТ
    new_member_id := 'THQ-' || LPAD(FLOOR(1000 + RANDOM() * 9000)::TEXT, 4, '0');
    
    -- Проверяем уникальность
    SELECT EXISTS(
      SELECT 1 FROM public.profiles WHERE member_id = new_member_id
    ) INTO id_exists;
    
    -- Если ID уникален, выходим из цикла
    EXIT WHEN NOT id_exists;
  END LOOP;
  
  RETURN new_member_id;
END;
$$;

-- Обновляем триггер для автоматической генерации member_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Генерируем уникальный member_id
  IF NEW.member_id IS NULL OR NEW.member_id = '' THEN
    NEW.member_id := generate_member_id();
  END IF;
  
  -- Устанавливаем роль по умолчанию
  IF NEW.role IS NULL THEN
    NEW.role := 'basic';
  END IF;
  
  -- Для админов и овнеров сохраняем оригинальную роль
  IF NEW.role IN ('admin', 'owner') AND NEW.original_role IS NULL THEN
    NEW.original_role := NEW.role;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Убеждаемся что триггер существует
DROP TRIGGER IF EXISTS on_auth_user_created ON public.profiles;
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ШАГ 4: Функция для безопасного переключения ролей
-- ============================================

-- Функция для переключения роли с сохранением оригинальной
CREATE OR REPLACE FUNCTION switch_user_role(
  p_user_id UUID,
  p_new_role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_role TEXT;
  v_original_role TEXT;
BEGIN
  -- Получаем текущую и оригинальную роль
  SELECT role, original_role 
  INTO v_current_role, v_original_role
  FROM public.profiles 
  WHERE id = p_user_id;
  
  -- Проверяем что пользователь найден
  IF v_current_role IS NULL THEN
    RAISE EXCEPTION 'Пользователь не найден';
  END IF;
  
  -- Сохраняем оригинальную роль при первом переключении
  IF v_original_role IS NULL AND v_current_role IN ('admin', 'owner') THEN
    UPDATE public.profiles
    SET original_role = v_current_role
    WHERE id = p_user_id;
    v_original_role := v_current_role;
  END IF;
  
  -- Если оригинальная роль не admin/owner, запрещаем переключение
  IF v_original_role NOT IN ('admin', 'owner') THEN
    RAISE EXCEPTION 'Только админы и овнеры могут переключать роли';
  END IF;
  
  -- Обновляем роль
  UPDATE public.profiles
  SET role = p_new_role
  WHERE id = p_user_id;
  
  RETURN TRUE;
END;
$$;

-- Функция для восстановления оригинальной роли
CREATE OR REPLACE FUNCTION restore_original_role(
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_original_role TEXT;
BEGIN
  -- Получаем оригинальную роль
  SELECT original_role 
  INTO v_original_role
  FROM public.profiles 
  WHERE id = p_user_id;
  
  -- Если нет оригинальной роли, ничего не делаем
  IF v_original_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Восстанавливаем оригинальную роль
  UPDATE public.profiles
  SET role = v_original_role
  WHERE id = p_user_id;
  
  RETURN TRUE;
END;
$$;

-- Даем права на выполнение функций
GRANT EXECUTE ON FUNCTION generate_member_id TO authenticated;
GRANT EXECUTE ON FUNCTION switch_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION restore_original_role TO authenticated;

-- ШАГ 5: Индексы для быстрого поиска
-- ============================================

-- Включаем расширение для поиска по подстроке (если еще не включено)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Индекс для поиска по email (для функции управления аккаунтами)
CREATE INDEX IF NOT EXISTS idx_profiles_email_search 
ON public.profiles USING gin (email gin_trgm_ops);

-- Индекс для поиска по member_id
CREATE INDEX IF NOT EXISTS idx_profiles_member_id 
ON public.profiles(member_id);

-- Индекс для фильтрации по ролям
CREATE INDEX IF NOT EXISTS idx_profiles_role 
ON public.profiles(role);

-- ШАГ 6: RLS политики для управления ролями
-- ============================================

-- Политика: только админы и овнеры могут видеть все профили
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id 
  OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND original_role IN ('admin', 'owner')
  )
);

-- Политика: админы и овнеры могут изменять роли (только для тестирования)
DROP POLICY IF EXISTS "Admins can switch roles" ON public.profiles;
CREATE POLICY "Admins can switch roles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id 
  AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND original_role IN ('admin', 'owner')
  )
)
WITH CHECK (
  auth.uid() = id 
  AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND original_role IN ('admin', 'owner')
  )
);

-- ШАГ 7: Представление для админской панели (с RLS защитой)
-- ============================================

-- Удаляем небезопасное представление если существует
DROP VIEW IF EXISTS admin_users_view;

-- Создаем функцию вместо представления для безопасного доступа
CREATE OR REPLACE FUNCTION get_admin_users_list()
RETURNS TABLE (
  user_id UUID,
  nickname TEXT,
  email TEXT,
  member_id TEXT,
  role TEXT,
  original_role TEXT,
  avatar TEXT,
  created_at TIMESTAMPTZ,
  balance NUMERIC,
  total_releases BIGINT,
  total_tickets BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_caller_role TEXT;
  v_caller_original_role TEXT;
BEGIN
  -- Проверяем роль вызывающего пользователя
  SELECT p.role, p.original_role 
  INTO v_caller_role, v_caller_original_role
  FROM public.profiles p
  WHERE p.id = auth.uid();
  
  -- Только админы и овнеры могут видеть список всех пользователей
  IF v_caller_original_role NOT IN ('admin', 'owner') AND v_caller_role NOT IN ('admin', 'owner') THEN
    RAISE EXCEPTION 'Доступ запрещен: требуются права админа или овнера';
  END IF;
  
  -- Возвращаем список пользователей
  RETURN QUERY
  SELECT 
    p.id,
    p.nickname,
    p.email,
    p.member_id,
    p.role,
    p.original_role,
    p.avatar,
    p.created_at,
    p.balance,
    COUNT(DISTINCT rb.id) + COUNT(DISTINCT re.id) as total_releases,
    COUNT(DISTINCT t.id) as total_tickets
  FROM public.profiles p
  LEFT JOIN public.releases_basic rb ON rb.user_id = p.id
  LEFT JOIN public.releases_exclusive re ON re.user_id = p.id
  LEFT JOIN public.tickets t ON t.user_id = p.id
  GROUP BY p.id, p.nickname, p.email, p.member_id, p.role, p.original_role, p.avatar, p.created_at, p.balance;
END;
$$;

-- Права на выполнение функции
GRANT EXECUTE ON FUNCTION get_admin_users_list TO authenticated;

-- ============================================
-- ПРОВЕРКА РАБОТЫ
-- ============================================

-- Проверяем обновленные коды профилей
SELECT 
  'Обновленные коды профилей' as check_name,
  COUNT(*) as count,
  MIN(member_id) as min_id,
  MAX(member_id) as max_id
FROM public.profiles
WHERE member_id LIKE 'THQ-%';

-- Проверяем админов с оригинальными ролями
SELECT 
  'Админы с оригинальными ролями' as check_name,
  nickname,
  role as current_role,
  original_role,
  member_id
FROM public.profiles
WHERE original_role IN ('admin', 'owner')
ORDER BY created_at DESC
LIMIT 5;

-- Проверяем индексы
SELECT 
  'Созданные индексы' as check_name,
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE tablename = 'profiles'
  AND schemaname = 'public'
  AND (
    indexname LIKE '%email%' 
    OR indexname LIKE '%member_id%'
    OR indexname LIKE '%role%'
  );

-- Тестируем генерацию member_id
SELECT 
  'Тест генерации ID' as check_name,
  generate_member_id() as generated_id_1,
  generate_member_id() as generated_id_2,
  generate_member_id() as generated_id_3;

-- Комментарии к функциям
COMMENT ON FUNCTION generate_member_id IS 'Генерирует уникальный member_id формата THQ-XXXX (ПРАВИЛЬНЫЙ ФОРМАТ)';
COMMENT ON FUNCTION switch_user_role IS 'Безопасное переключение роли для админов/овнеров (только для тестирования)';
COMMENT ON FUNCTION restore_original_role IS 'Восстанавливает оригинальную роль админа/овнера';
COMMENT ON FUNCTION get_admin_users_list IS 'Безопасный список всех пользователей (только для админов/овнеров)';

-- ============================================
-- ГОТОВО! ✅
-- ============================================
-- 
-- Что сделано:
-- 1. ⚠️ ОТМЕНЕНО - Коды остаются в формате THQ- (НЕ thq-)
-- 2. ✅ Добавлено поле original_role для админов
-- 3. ✅ Созданы функции для безопасного переключения ролей
-- 4. ✅ Добавлены индексы для быстрого поиска
-- 5. ✅ Настроены RLS политики
-- 6. ✅ Создана защищенная функция для админской панели
-- 7. ✅ Автоматическое сохранение original_role при первом переключении
-- 
-- Использование:
-- 
-- -- Переключить роль админа на basic для тестирования:
-- SELECT switch_user_role('your-user-id', 'basic');
-- 
-- -- Вернуться к оригинальной роли:
-- SELECT restore_original_role('your-user-id');
-- 
-- -- Поиск пользователей по email:
-- SELECT * FROM public.profiles 
-- WHERE email ILIKE '%search%'
-- LIMIT 10;
--
-- -- Получить список всех пользователей (только для админов):
-- SELECT * FROM get_admin_users_list();

-- ============================================
-- 🔧 ИСПРАВЛЕНИЕ: Восстановление роли owner
-- ============================================

-- Если вы застряли в роли basic, выполните этот запрос:
-- Замените 'your-email@example.com' на ваш реальный email

-- Проверяем текущую роль
SELECT 
  id,
  email,
  nickname,
  role as current_role,
  original_role,
  member_id
FROM public.profiles
WHERE email = 'your-email@example.com'; -- ЗАМЕНИТЕ НА ВАШ EMAIL

-- Восстанавливаем роль owner напрямую
UPDATE public.profiles
SET 
  role = 'owner',
  original_role = 'owner'
WHERE email = 'your-email@example.com' -- ЗАМЕНИТЕ НА ВАШ EMAIL
  AND role != 'owner';

-- Проверяем что роль обновилась
SELECT 
  email,
  role,
  original_role
FROM public.profiles
WHERE email = 'your-email@example.com'; -- ЗАМЕНИТЕ НА ВАШ EMAIL

-- ============================================
-- 🔄 ОТКАТ: Возврат кодов с thq- на THQ-
-- ============================================

-- ДИАГНОСТИКА: Проверяем структуру таблицы profiles
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name LIKE '%member%' OR column_name LIKE '%id%'
ORDER BY ordinal_position;

-- Проверяем все данные по кодам пользователей
SELECT 
  id,
  email,
  nickname,
  member_id,
  created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;

-- Если есть старое поле со старыми кодами, используйте этот запрос:
-- (Замените old_member_id на название поля со старыми кодами, если оно существует)
/*
UPDATE public.profiles
SET member_id = old_member_id
WHERE old_member_id IS NOT NULL;
*/

-- ЕСЛИ ДАННЫЕ ПОТЕРЯНЫ: Создаем новое поле для резервной копии
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS member_id_backup TEXT;

-- Сохраняем текущие коды в резервную копию перед любыми изменениями
UPDATE public.profiles
SET member_id_backup = member_id
WHERE member_id_backup IS NULL;

-- ============================================
-- 🔄 ОБНОВЛЕНИЕ ДАННЫХ НА САЙТЕ
-- ============================================

-- Проблема: Коды обновились в БД, но не отображаются на сайте
-- Причина: Данные кешируются на клиенте при входе

-- РЕШЕНИЕ 1: Выйдите из аккаунта и войдите заново
-- После входа данные загрузятся из обновленной БД

-- РЕШЕНИЕ 2: Принудительная очистка кеша (выполните в консоли браузера)
-- Откройте DevTools (F12) -> Console -> вставьте и выполните:
/*
localStorage.clear();
sessionStorage.clear();
location.reload();
*/

-- РЕШЕНИЕ 3: Проверьте текущие данные в БД
SELECT 
  id,
  email,
  nickname,
  member_id,
  role,
  original_role
FROM public.profiles
WHERE email = 'your-email@example.com'; -- ЗАМЕНИТЕ НА ВАШ EMAIL

-- РЕШЕНИЕ 4: Если нужно вернуть THQ- формат в функции генерации
DROP FUNCTION IF EXISTS public.generate_member_id();

CREATE OR REPLACE FUNCTION public.generate_member_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_member_id TEXT;
  id_exists BOOLEAN;
BEGIN
  LOOP
    -- Генерируем ID формата THQ-XXXX (4 цифры) - старый формат
    new_member_id := 'THQ-' || LPAD(FLOOR(1000 + RANDOM() * 9000)::TEXT, 4, '0');
    
    -- Проверяем уникальность
    SELECT EXISTS(
      SELECT 1 FROM public.profiles WHERE member_id = new_member_id
    ) INTO id_exists;
    
    -- Если ID уникален, выходим из цикла
    EXIT WHEN NOT id_exists;
  END LOOP;
  
  RETURN new_member_id;
END;
$$;

-- ============================================
-- 🔥 КРИТИЧНО: Принудительное обновление кодов на сайте
-- ============================================

-- Проблема: Коды берутся из БД правильно (строка 155 в cabinet/page.tsx),
-- но загружаются только при первом входе и кешируются в React состоянии

-- РЕШЕНИЕ 1: Массовый выход всех пользователей (удаление сессий)
-- ВНИМАНИЕ: Это выкинет всех из аккаунтов, они должны будут войти заново
/*
TRUNCATE TABLE auth.sessions RESTART IDENTITY CASCADE;
*/

-- РЕШЕНИЕ 2: Проверьте, что коды РЕАЛЬНО обновились в БД
SELECT 
  'Проверка кодов в БД' as status,
  id,
  email,
  nickname,
  member_id,
  role
FROM public.profiles
ORDER BY created_at DESC
LIMIT 20;

-- РЕШЕНИЕ 3: Если коды в БД неправильные, найдите резервную копию
-- Проверяем есть ли бэкап
SELECT 
  'Проверка бэкапа' as status,
  COUNT(*) as has_backup,
  COUNT(CASE WHEN member_id_backup IS NOT NULL THEN 1 END) as backup_count
FROM public.profiles;

-- РЕШЕНИЕ 4: Если есть бэкап, восстановите из него
-- Раскомментируйте и выполните если нужно:
/*
UPDATE public.profiles
SET member_id = member_id_backup
WHERE member_id_backup IS NOT NULL
  AND member_id_backup != member_id;
*/
