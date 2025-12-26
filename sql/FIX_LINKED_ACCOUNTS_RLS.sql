-- ============================================
-- 🔧 ЭКСТРЕННОЕ ИСПРАВЛЕНИЕ RLS ДЛЯ LINKED_ACCOUNTS
-- ============================================
-- Используйте этот скрипт если основной не помог

-- ==========================================
-- ВАРИАНТ 1: ПОЛНАЯ ПЕРЕУСТАНОВКА ПОЛИТИК
-- ==========================================

-- Отключаем RLS временно
ALTER TABLE public.linked_accounts DISABLE ROW LEVEL SECURITY;

-- Удаляем ВСЕ существующие политики
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'linked_accounts' AND schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.linked_accounts';
    END LOOP;
END $$;

-- Включаем RLS снова
ALTER TABLE public.linked_accounts ENABLE ROW LEVEL SECURITY;

-- Создаем НОВЫЕ политики с явным указанием роли
CREATE POLICY "linked_accounts_select_policy"
ON public.linked_accounts
FOR SELECT
TO authenticated
USING (
  auth.uid() = primary_user_id OR auth.uid() = linked_user_id
);

CREATE POLICY "linked_accounts_insert_policy"
ON public.linked_accounts
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = primary_user_id
);

CREATE POLICY "linked_accounts_delete_policy"
ON public.linked_accounts
FOR DELETE
TO authenticated
USING (
  auth.uid() = primary_user_id
);

CREATE POLICY "linked_accounts_update_policy"
ON public.linked_accounts
FOR UPDATE
TO authenticated
USING (
  auth.uid() = primary_user_id
)
WITH CHECK (
  auth.uid() = primary_user_id
);

-- Проверка
SELECT 
  '✅ Политики переустановлены' as status,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'linked_accounts' AND schemaname = 'public';

-- ==========================================
-- ВАРИАНТ 2: ВРЕМЕННОЕ ОТКЛЮЧЕНИЕ RLS (НЕ РЕКОМЕНДУЕТСЯ ДЛЯ ПРОДАКШНА)
-- ==========================================
-- Раскомментируйте только если Вариант 1 не помог и это dev-окружение

-- ALTER TABLE public.linked_accounts DISABLE ROW LEVEL SECURITY;
-- SELECT '⚠️ RLS ОТКЛЮЧЕН! Используйте только в dev-окружении!' as warning;

-- ==========================================
-- ВАРИАНТ 3: УПРОЩЕННЫЕ ПОЛИТИКИ (МЕНЕЕ БЕЗОПАСНО)
-- ==========================================
-- Раскомментируйте если нужны максимально простые политики

/*
-- Удаляем все политики
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'linked_accounts' AND schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.linked_accounts';
    END LOOP;
END $$;

-- Создаем одну permissive политику для всех операций
CREATE POLICY "linked_accounts_all_operations"
ON public.linked_accounts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (auth.uid() = primary_user_id);
*/

-- ==========================================
-- ДИАГНОСТИКА: ПРОВЕРКА ТЕКУЩЕГО СОСТОЯНИЯ
-- ==========================================

SELECT 
  '📋 ТЕКУЩИЕ ПОЛИТИКИ:' as info;

SELECT 
  policyname as "Название политики",
  cmd as "Команда",
  roles as "Роли",
  qual as "Условие USING",
  with_check as "Условие WITH CHECK"
FROM pg_policies
WHERE tablename = 'linked_accounts' AND schemaname = 'public'
ORDER BY policyname;

-- Проверка структуры таблицы
SELECT 
  '📊 СТРУКТУРА ТАБЛИЦЫ:' as info;

SELECT 
  column_name as "Поле",
  data_type as "Тип",
  is_nullable as "NULL?"
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'linked_accounts'
ORDER BY ordinal_position;

-- Проверка включен ли RLS
SELECT 
  '🔒 СТАТУС RLS:' as info;

SELECT 
  schemaname as "Схема",
  tablename as "Таблица",
  rowsecurity as "RLS включен?"
FROM pg_tables
WHERE tablename = 'linked_accounts' AND schemaname = 'public';

-- ============================================
-- ✅ ГОТОВО!
-- ============================================

SELECT 
  '🎉 Скрипт исправления выполнен!' as message,
  'Проверьте вывод выше и попробуйте добавить аккаунт снова' as next_step;
