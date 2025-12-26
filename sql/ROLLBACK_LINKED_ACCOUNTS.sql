-- ============================================
-- 🔙 ОТКАТ СИСТЕМЫ СВЯЗАННЫХ АККАУНТОВ
-- ============================================
-- Полностью удаляет таблицу linked_accounts и все связанные объекты
-- Дата: 26.12.2025
-- ============================================

-- Шаг 1: Удаляем все политики RLS
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'linked_accounts' 
        AND schemaname = 'public'
    ) 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.linked_accounts';
        RAISE NOTICE 'Удалена политика: %', r.policyname;
    END LOOP;
END $$;

-- Шаг 2: Удаляем функции
DROP FUNCTION IF EXISTS public.get_my_linked_accounts();
DROP FUNCTION IF EXISTS public.can_manage_linked_accounts();

RAISE NOTICE 'Функции удалены';

-- Шаг 3: Удаляем таблицу со всеми данными
DROP TABLE IF EXISTS public.linked_accounts CASCADE;

RAISE NOTICE 'Таблица linked_accounts полностью удалена';

-- Шаг 4: Проверка что все удалено
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'linked_accounts'
    ) THEN
        RAISE NOTICE '';
        RAISE NOTICE '========================================';
        RAISE NOTICE '✅ ОТКАТ ЗАВЕРШЕН УСПЕШНО!';
        RAISE NOTICE '========================================';
        RAISE NOTICE 'Таблица linked_accounts удалена';
        RAISE NOTICE 'Все политики RLS удалены';
        RAISE NOTICE 'Все функции удалены';
        RAISE NOTICE '';
    ELSE
        RAISE WARNING 'Таблица все еще существует!';
    END IF;
END $$;
