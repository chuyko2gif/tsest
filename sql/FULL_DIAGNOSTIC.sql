-- ============================================
-- 🔍 ПОЛНАЯ ДИАГНОСТИКА БАЗЫ ДАННЫХ
-- ============================================

-- 1. Проверяем структуру таблицы profiles
-- ============================================
SELECT 
  '📊 СТРУКТУРА ТАБЛИЦЫ PROFILES' as info;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Проверяем данные в profiles
-- ============================================
SELECT 
  '📊 ДАННЫЕ В PROFILES' as info;

SELECT 
  id,
  email,
  nickname,
  member_id,
  member_id_backup,
  role,
  balance,
  avatar
FROM public.profiles
ORDER BY created_at DESC
LIMIT 5;

-- 3. Проверяем триггеры
-- ============================================
SELECT 
  '📊 ТРИГГЕРЫ НА PROFILES' as info;

SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'profiles';

-- 4. Проверяем функции
-- ============================================
SELECT 
  '📊 ФУНКЦИИ' as info;

SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('handle_new_user', 'generate_member_id')
ORDER BY routine_name;

-- 5. Проверяем RLS политики
-- ============================================
SELECT 
  '📊 RLS ПОЛИТИКИ НА PROFILES' as info;

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- 6. Проверяем RLS статус
-- ============================================
SELECT 
  '📊 RLS СТАТУС' as info;

SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('profiles', 'withdrawal_requests', 'payouts', 'releases_basic', 'releases_exclusive')
ORDER BY tablename;

-- 7. Проверяем внешние ключи
-- ============================================
SELECT 
  '📊 ВНЕШНИЕ КЛЮЧИ' as info;

SELECT
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'profiles';

-- ============================================
-- ✅ ДИАГНОСТИКА ЗАВЕРШЕНА
-- ============================================
