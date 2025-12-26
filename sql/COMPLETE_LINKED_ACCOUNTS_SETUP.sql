-- ============================================
-- 🔗 ПОЛНАЯ НАСТРОЙКА СИСТЕМЫ СВЯЗАННЫХ АККАУНТОВ
-- ============================================
-- Версия: 2.0
-- Дата: 26.12.2025
-- Для: Owner и Admin ролей
-- ============================================

-- ШАГ 0: ОЧИСТКА (удаляем старые объекты если есть)
-- ============================================

DO $$ 
BEGIN
    -- Удаляем старые политики
    DROP POLICY IF EXISTS "linked_accounts_select_policy" ON public.linked_accounts;
    DROP POLICY IF EXISTS "linked_accounts_insert_policy" ON public.linked_accounts;
    DROP POLICY IF EXISTS "linked_accounts_update_policy" ON public.linked_accounts;
    DROP POLICY IF EXISTS "linked_accounts_delete_policy" ON public.linked_accounts;
    DROP POLICY IF EXISTS "linked_accounts_select_own" ON public.linked_accounts;
    DROP POLICY IF EXISTS "linked_accounts_insert_own" ON public.linked_accounts;
    DROP POLICY IF EXISTS "linked_accounts_delete_own" ON public.linked_accounts;
    
    RAISE NOTICE 'Старые политики удалены';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Таблица не существует, пропускаем удаление политик';
END $$;

-- Удаляем старую таблицу
DROP TABLE IF EXISTS public.linked_accounts CASCADE;

-- Удаляем старые функции
DROP FUNCTION IF EXISTS public.get_my_linked_accounts();
DROP FUNCTION IF EXISTS public.get_linked_accounts(UUID);

-- ============================================
-- ШАГ 1: СОЗДАНИЕ ТАБЛИЦЫ
-- ============================================

CREATE TABLE public.linked_accounts (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Основной пользователь (кто создал связь) - должен быть owner или admin
  primary_user_id UUID NOT NULL,
  
  -- Связанный аккаунт (к которому можно переключиться)
  linked_user_id UUID NOT NULL,
  
  -- Email связанного аккаунта (для быстрого поиска и отображения)
  linked_email TEXT NOT NULL,
  
  -- Никнейм связанного аккаунта (кэшируется для производительности)
  linked_nickname TEXT,
  
  -- Временные метки
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT linked_accounts_primary_fk 
    FOREIGN KEY (primary_user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE,
  
  CONSTRAINT linked_accounts_linked_fk 
    FOREIGN KEY (linked_user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE,
  
  -- Уникальная пара: один пользователь не может добавить один аккаунт дважды
  CONSTRAINT linked_accounts_unique 
    UNIQUE(primary_user_id, linked_user_id),
  
  -- Нельзя связать аккаунт сам с собой
  CONSTRAINT linked_accounts_no_self_link 
    CHECK (primary_user_id != linked_user_id),
  
  -- Email должен быть валидным
  CONSTRAINT linked_accounts_valid_email 
    CHECK (linked_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- ============================================
-- ШАГ 2: СОЗДАНИЕ ИНДЕКСОВ
-- ============================================

-- Индекс для быстрого поиска по primary_user_id
CREATE INDEX idx_linked_accounts_primary_user 
ON public.linked_accounts(primary_user_id);

-- Индекс для быстрого поиска по linked_user_id
CREATE INDEX idx_linked_accounts_linked_user 
ON public.linked_accounts(linked_user_id);

-- Индекс для поиска по email
CREATE INDEX idx_linked_accounts_email 
ON public.linked_accounts(linked_email);

-- Составной индекс для проверки уникальности
CREATE INDEX idx_linked_accounts_pair 
ON public.linked_accounts(primary_user_id, linked_user_id);

-- Индекс для сортировки по дате создания
CREATE INDEX idx_linked_accounts_created 
ON public.linked_accounts(created_at DESC);

-- ============================================
-- ШАГ 3: ВКЛЮЧЕНИЕ RLS (Row Level Security)
-- ============================================

ALTER TABLE public.linked_accounts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ШАГ 4: СОЗДАНИЕ RLS ПОЛИТИК
-- ============================================

-- Политика SELECT: пользователь видит только свои связи
CREATE POLICY "linked_accounts_select_policy"
ON public.linked_accounts
FOR SELECT
TO authenticated
USING (
  primary_user_id = auth.uid()
);

-- Политика INSERT: только owner и admin могут создавать связи
CREATE POLICY "linked_accounts_insert_policy"
ON public.linked_accounts
FOR INSERT
TO authenticated
WITH CHECK (
  -- Проверяем что создатель - это текущий пользователь
  primary_user_id = auth.uid()
  AND
  -- И что у него роль owner или admin
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('owner', 'admin')
  )
);

-- Политика UPDATE: только owner и admin могут обновлять (для last_used_at)
CREATE POLICY "linked_accounts_update_policy"
ON public.linked_accounts
FOR UPDATE
TO authenticated
USING (
  primary_user_id = auth.uid()
  AND
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('owner', 'admin')
  )
)
WITH CHECK (
  primary_user_id = auth.uid()
);

-- Политика DELETE: только владелец связи может удалить
CREATE POLICY "linked_accounts_delete_policy"
ON public.linked_accounts
FOR DELETE
TO authenticated
USING (
  primary_user_id = auth.uid()
  AND
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('owner', 'admin')
  )
);

-- ============================================
-- ШАГ 5: СОЗДАНИЕ ФУНКЦИЙ
-- ============================================

-- Функция для получения связанных аккаунтов с профилями
CREATE OR REPLACE FUNCTION public.get_my_linked_accounts()
RETURNS TABLE (
  id UUID,
  linked_user_id UUID,
  linked_email TEXT,
  linked_nickname TEXT,
  created_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  profile JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Проверяем права доступа
  IF NOT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Access denied. Only owners and admins can view linked accounts.'
      USING HINT = 'Contact administrator for access';
  END IF;

  -- Возвращаем связанные аккаунты с полной информацией о профилях
  RETURN QUERY
  SELECT 
    la.id,
    la.linked_user_id,
    la.linked_email,
    la.linked_nickname,
    la.created_at,
    la.last_used_at,
    CASE 
      WHEN p.id IS NOT NULL THEN
        jsonb_build_object(
          'id', p.id,
          'nickname', p.nickname,
          'email', COALESCE(p.email, la.linked_email),
          'avatar', p.avatar,
          'role', p.role,
          'member_id', p.member_id,
          'balance', p.balance
        )
      ELSE
        NULL
    END as profile
  FROM public.linked_accounts la
  LEFT JOIN public.profiles p ON p.id = la.linked_user_id
  WHERE la.primary_user_id = auth.uid()
  ORDER BY la.created_at DESC;
END;
$$;

-- Функция для проверки прав доступа к функциям связанных аккаунтов
CREATE OR REPLACE FUNCTION public.can_manage_linked_accounts()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('owner', 'admin')
  );
END;
$$;

-- ============================================
-- ШАГ 6: КОММЕНТАРИИ ДЛЯ ДОКУМЕНТАЦИИ
-- ============================================

COMMENT ON TABLE public.linked_accounts IS 
  'Таблица связанных аккаунтов для переключения между учетными записями. Доступна только для owner и admin ролей.';

COMMENT ON COLUMN public.linked_accounts.id IS 
  'Уникальный идентификатор связи';

COMMENT ON COLUMN public.linked_accounts.primary_user_id IS 
  'ID основного пользователя (owner/admin), который создал связь';

COMMENT ON COLUMN public.linked_accounts.linked_user_id IS 
  'ID связанного аккаунта, на который можно переключиться';

COMMENT ON COLUMN public.linked_accounts.linked_email IS 
  'Email связанного аккаунта (кэшируется для производительности)';

COMMENT ON COLUMN public.linked_accounts.linked_nickname IS 
  'Никнейм связанного аккаунта (кэшируется для производительности)';

COMMENT ON COLUMN public.linked_accounts.created_at IS 
  'Дата и время создания связи';

COMMENT ON COLUMN public.linked_accounts.last_used_at IS 
  'Дата и время последнего переключения на этот аккаунт';

COMMENT ON FUNCTION public.get_my_linked_accounts() IS 
  'Возвращает все связанные аккаунты текущего пользователя с полной информацией о профилях';

COMMENT ON FUNCTION public.can_manage_linked_accounts() IS 
  'Проверяет, имеет ли текущий пользователь права на управление связанными аккаунтами';

-- ============================================
-- ШАГ 7: ПРЕДОСТАВЛЕНИЕ ПРАВ ДОСТУПА
-- ============================================

-- Даем права на таблицу authenticated пользователям
GRANT SELECT, INSERT, UPDATE, DELETE ON public.linked_accounts TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Даем права на функции
GRANT EXECUTE ON FUNCTION public.get_my_linked_accounts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_linked_accounts() TO authenticated;

-- ============================================
-- ✅ ПРОВЕРКА УСТАНОВКИ
-- ============================================

DO $$ 
DECLARE
  table_exists BOOLEAN;
  policies_count INTEGER;
  indexes_count INTEGER;
  functions_count INTEGER;
BEGIN
  -- Проверяем существование таблицы
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'linked_accounts'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '✓ Таблица linked_accounts создана успешно';
  ELSE
    RAISE EXCEPTION '✗ ОШИБКА: Таблица linked_accounts не создана!';
  END IF;
  
  -- Проверяем политики RLS
  SELECT COUNT(*) INTO policies_count
  FROM pg_policies 
  WHERE tablename = 'linked_accounts' 
  AND schemaname = 'public';
  
  IF policies_count >= 4 THEN
    RAISE NOTICE '✓ RLS политики созданы: % шт.', policies_count;
  ELSE
    RAISE WARNING '⚠ Создано только % RLS политик (ожидается 4)', policies_count;
  END IF;
  
  -- Проверяем индексы
  SELECT COUNT(*) INTO indexes_count
  FROM pg_indexes 
  WHERE tablename = 'linked_accounts' 
  AND schemaname = 'public';
  
  IF indexes_count >= 5 THEN
    RAISE NOTICE '✓ Индексы созданы: % шт.', indexes_count;
  ELSE
    RAISE WARNING '⚠ Создано только % индексов (ожидается 5+)', indexes_count;
  END IF;
  
  -- Проверяем функции
  SELECT COUNT(*) INTO functions_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.proname IN ('get_my_linked_accounts', 'can_manage_linked_accounts');
  
  IF functions_count >= 2 THEN
    RAISE NOTICE '✓ Функции созданы: % шт.', functions_count;
  ELSE
    RAISE WARNING '⚠ Создано только % функций (ожидается 2)', functions_count;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ УСТАНОВКА ЗАВЕРШЕНА УСПЕШНО!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Теперь вы можете использовать систему связанных аккаунтов';
  RAISE NOTICE '';
END $$;

-- ============================================
-- 📊 ДЕТАЛЬНАЯ ИНФОРМАЦИЯ О СТРУКТУРЕ
-- ============================================

-- Показать структуру таблицы
SELECT 
  '=== СТРУКТУРА ТАБЛИЦЫ linked_accounts ===' as info;

SELECT 
  column_name AS "Колонка",
  data_type AS "Тип",
  is_nullable AS "NULL?",
  column_default AS "По умолчанию"
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'linked_accounts'
ORDER BY ordinal_position;

-- Показать политики RLS
SELECT 
  '=== RLS ПОЛИТИКИ ===' as info;

SELECT 
  policyname AS "Политика",
  cmd AS "Команда",
  roles AS "Роли",
  CASE 
    WHEN qual IS NOT NULL THEN 'USING'
    ELSE 'WITH CHECK'
  END AS "Тип"
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'linked_accounts'
ORDER BY policyname;

-- Показать индексы
SELECT 
  '=== ИНДЕКСЫ ===' as info;

SELECT 
  indexname AS "Индекс",
  indexdef AS "Определение"
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename = 'linked_accounts'
ORDER BY indexname;

-- Показать ограничения (constraints)
SELECT 
  '=== ОГРАНИЧЕНИЯ ===' as info;

SELECT 
  conname AS "Ограничение",
  contype AS "Тип",
  pg_get_constraintdef(oid) AS "Определение"
FROM pg_constraint
WHERE conrelid = 'public.linked_accounts'::regclass
ORDER BY conname;

-- ============================================
-- 🧪 ТЕСТОВЫЕ ЗАПРОСЫ (закомментированы)
-- ============================================

-- Раскомментируйте для тестирования после установки:

/*
-- Проверить, может ли текущий пользователь управлять связанными аккаунтами
SELECT public.can_manage_linked_accounts();

-- Получить список связанных аккаунтов
SELECT * FROM public.get_my_linked_accounts();

-- Проверить количество записей
SELECT COUNT(*) as total_links FROM public.linked_accounts;

-- Посмотреть все связи с деталями профилей
SELECT 
  la.*,
  p.nickname,
  p.role,
  p.email
FROM public.linked_accounts la
LEFT JOIN public.profiles p ON p.id = la.linked_user_id;
*/

-- ============================================
-- 📝 ПРИМЕЧАНИЯ
-- ============================================

/*
ВАЖНО:
1. Этот скрипт создает НОВУЮ таблицу, удаляя старую
2. Все данные из старой таблицы будут ПОТЕРЯНЫ
3. RLS политики настроены только для owner и admin ролей
4. Функции используют SECURITY DEFINER для обхода RLS при необходимости
5. Все внешние ключи настроены на CASCADE DELETE

ИСПОЛЬЗОВАНИЕ:
1. Откройте Supabase Dashboard
2. Перейдите в SQL Editor
3. Создайте новый запрос
4. Скопируйте и вставьте весь этот файл
5. Нажмите Run/Execute
6. Проверьте вывод на наличие ошибок

ТРЕБОВАНИЯ:
- База данных Supabase
- Существующая таблица profiles с полем role
- Существующая таблица auth.users
- Роли: 'owner', 'admin', 'basic' и т.д.

ПОСЛЕ УСТАНОВКИ:
- Перезапустите приложение: npm run dev
- Проверьте API endpoints: /api/linked-accounts
- Войдите как owner или admin
- Откройте Настройки → Связанные аккаунты
*/
