-- ============================================
-- 🔍 ПОИСК БЛОКИРОВКИ ИЗМЕНЕНИЯ РОЛЕЙ
-- ============================================

-- 1. Проверяем все триггеры на profiles
-- ============================================
SELECT 
  '📊 ВСЕ ТРИГГЕРЫ НА PROFILES' as info;

SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles'
ORDER BY event_manipulation, action_timing;

-- 2. Проверяем все функции связанные с profiles
-- ============================================
SELECT 
  '📊 ФУНКЦИИ' as info;

SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (routine_name LIKE '%profile%' OR routine_name LIKE '%role%' OR routine_name LIKE '%user%')
ORDER BY routine_name;

-- 3. Проверяем RLS политики для UPDATE
-- ============================================
SELECT 
  '📊 RLS ПОЛИТИКИ ДЛЯ UPDATE' as info;

SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
  AND cmd = 'UPDATE';

-- 4. Проверяем есть ли CHECK constraints
-- ============================================
SELECT 
  '📊 CHECK CONSTRAINTS' as info;

SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_schema = 'public';

-- ============================================
-- ✅ ДИАГНОСТИКА ЗАВЕРШЕНА
-- ============================================
