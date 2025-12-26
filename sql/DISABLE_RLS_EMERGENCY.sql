-- ============================================
-- 🚨 ЭКСТРЕННОЕ ОТКЛЮЧЕНИЕ RLS - ВОССТАНОВЛЕНИЕ ДОСТУПА
-- ============================================

-- ШАГ 1: ОТКЛЮЧАЕМ RLS на всех проблемных таблицах
-- ============================================

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.releases_basic DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.releases_exclusive DISABLE ROW LEVEL SECURITY;

-- ШАГ 2: Удаляем ВСЕ политики на profiles
-- ============================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for own profile" ON public.profiles;

-- ШАГ 3: Проверяем структуру таблицы profiles
-- ============================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ШАГ 4: Проверяем данные
-- ============================================

SELECT 
  id,
  email,
  nickname,
  member_id,
  role,
  balance
FROM public.profiles
LIMIT 10;

-- ШАГ 5: Включаем RLS обратно с ПРОСТЫМИ политиками
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Политика 1: Все могут читать все профили
CREATE POLICY "Allow read access to all" ON public.profiles
  FOR SELECT
  USING (true);

-- Политика 2: Пользователи могут создавать свой профиль
CREATE POLICY "Allow insert own profile" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Политика 3: Пользователи могут обновлять свой профиль
CREATE POLICY "Allow update own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ШАГ 6: ФИНАЛЬНАЯ ПРОВЕРКА
-- ============================================

SELECT 
  '✅ RLS политики пересозданы' as status;

-- Показываем активные политики
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'profiles';

-- ============================================
-- ✅ ГОТОВО! Обновите страницу (F5)
-- ============================================
