-- АВАРИЙНОЕ ОТКЛЮЧЕНИЕ RLS
-- Используй только если политики не работают!
-- Дата: 26.12.2025

-- ============================================
-- ВАРИАНТ 1: ВРЕМЕННОЕ ОТКЛЮЧЕНИЕ RLS
-- ============================================

-- Отключаем RLS для releases_basic (ОПАСНО - только для тестирования!)
ALTER TABLE public.releases_basic DISABLE ROW LEVEL SECURITY;

-- Отключаем RLS для releases_exclusive (ОПАСНО - только для тестирования!)
ALTER TABLE public.releases_exclusive DISABLE ROW LEVEL SECURITY;

-- ============================================
-- ВАРИАНТ 2: ВКЛЮЧИТЬ RLS ОБРАТНО
-- ============================================

-- Включаем RLS обратно для releases_basic
ALTER TABLE public.releases_basic ENABLE ROW LEVEL SECURITY;

-- Включаем RLS обратно для releases_exclusive
ALTER TABLE public.releases_exclusive ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ВАРИАНТ 3: ПРОВЕРКА ТЕКУЩЕГО СОСТОЯНИЯ RLS
-- ============================================

SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('releases_basic', 'releases_exclusive');

-- ============================================
-- ВАРИАНТ 4: ПОКАЗАТЬ ВСЕ ПОЛИТИКИ
-- ============================================

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
WHERE tablename IN ('releases_basic', 'releases_exclusive')
ORDER BY tablename, policyname;
