-- ============================================
-- 🔗 СОЗДАНИЕ ТАБЛИЦЫ СВЯЗАННЫХ АККАУНТОВ
-- ============================================
-- Система для управления несколькими аккаунтами
-- Позволяет админам и владельцам быстро переключаться между аккаунтами

-- ==========================================
-- ШАГ 1: СОЗДАНИЕ ТАБЛИЦЫ
-- ==========================================

-- Удаляем таблицу если существует (только для чистой установки)
DROP TABLE IF EXISTS public.linked_accounts CASCADE;

-- Создаем таблицу связанных аккаунтов
CREATE TABLE IF NOT EXISTS public.linked_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Основной пользователь (admin/owner, который связывает аккаунты)
  primary_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Связанный аккаунт (аккаунт, к которому получен доступ)
  linked_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Email связанного аккаунта (для удобства отображения)
  linked_email TEXT NOT NULL,
  
  -- Когда была создана связь
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Последнее использование этой связи
  last_used_at TIMESTAMPTZ,
  
  -- Уникальная комбинация: один пользователь не может дважды добавить один аккаунт
  UNIQUE(primary_user_id, linked_user_id),
  
  -- Проверка: нельзя связать аккаунт сам с собой
  CHECK (primary_user_id != linked_user_id)
);

-- ==========================================
-- ШАГ 2: СОЗДАНИЕ ИНДЕКСОВ
-- ==========================================

-- Быстрый поиск всех связанных аккаунтов пользователя
CREATE INDEX IF NOT EXISTS idx_linked_accounts_primary_user 
ON public.linked_accounts(primary_user_id);

-- Быстрый поиск кто связал конкретный аккаунт
CREATE INDEX IF NOT EXISTS idx_linked_accounts_linked_user 
ON public.linked_accounts(linked_user_id);

-- Поиск по email
CREATE INDEX IF NOT EXISTS idx_linked_accounts_email 
ON public.linked_accounts(linked_email);

-- ==========================================
-- ШАГ 3: ВКЛЮЧЕНИЕ RLS (Row Level Security)
-- ==========================================

-- Включаем RLS
ALTER TABLE public.linked_accounts ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики если существуют
DROP POLICY IF EXISTS "Users can view their own linked accounts" ON public.linked_accounts;
DROP POLICY IF EXISTS "Users can create their own linked accounts" ON public.linked_accounts;
DROP POLICY IF EXISTS "Users can delete their own linked accounts" ON public.linked_accounts;
DROP POLICY IF EXISTS "Users can update their linked accounts" ON public.linked_accounts;
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON public.linked_accounts;
DROP POLICY IF EXISTS "Allow users to view their links" ON public.linked_accounts;
DROP POLICY IF EXISTS "Allow users to delete their links" ON public.linked_accounts;
DROP POLICY IF EXISTS "Allow users to update their links" ON public.linked_accounts;

-- Политика SELECT: пользователи видят связи где они участвуют
CREATE POLICY "Allow users to view their links"
ON public.linked_accounts
FOR SELECT
TO authenticated
USING (
  auth.uid() = primary_user_id OR auth.uid() = linked_user_id
);

-- Политика INSERT: любой аутентифицированный пользователь может создать связь где он primary_user
CREATE POLICY "Allow authenticated users to insert"
ON public.linked_accounts
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = primary_user_id
);

-- Политика DELETE: только primary_user может удалять свои связи
CREATE POLICY "Allow users to delete their links"
ON public.linked_accounts
FOR DELETE
TO authenticated
USING (
  auth.uid() = primary_user_id
);

-- Политика UPDATE: только primary_user может обновлять свои связи
CREATE POLICY "Allow users to update their links"
ON public.linked_accounts
FOR UPDATE
TO authenticated
USING (
  auth.uid() = primary_user_id
)
WITH CHECK (
  auth.uid() = primary_user_id
);

-- ==========================================
-- ШАГ 4: СОЗДАНИЕ ФУНКЦИЙ
-- ==========================================

-- Функция для получения всех связанных аккаунтов пользователя с деталями
CREATE OR REPLACE FUNCTION get_linked_accounts_with_details(p_user_id UUID)
RETURNS TABLE (
  link_id UUID,
  linked_user_id UUID,
  linked_email TEXT,
  linked_nickname TEXT,
  linked_role TEXT,
  linked_avatar TEXT,
  created_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    la.id as link_id,
    la.linked_user_id,
    la.linked_email,
    p.nickname as linked_nickname,
    p.role as linked_role,
    p.avatar as linked_avatar,
    la.created_at,
    la.last_used_at
  FROM public.linked_accounts la
  JOIN public.profiles p ON p.id = la.linked_user_id
  WHERE la.primary_user_id = p_user_id
  ORDER BY la.last_used_at DESC NULLS LAST, la.created_at DESC;
END;
$$;

-- Функция для обновления времени последнего использования
CREATE OR REPLACE FUNCTION update_linked_account_usage(p_link_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.linked_accounts
  SET last_used_at = NOW()
  WHERE id = p_link_id;
END;
$$;

-- ==========================================
-- ШАГ 5: ПРОВЕРКА СОЗДАНИЯ
-- ==========================================

SELECT 
  '✅ ТАБЛИЦА СОЗДАНА УСПЕШНО' as status;

-- Проверяем структуру таблицы
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'linked_accounts'
ORDER BY ordinal_position;

-- Проверяем индексы
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'linked_accounts'
  AND schemaname = 'public';

-- Проверяем политики RLS
SELECT 
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'linked_accounts'
  AND schemaname = 'public';

-- ==========================================
-- ШАГ 6: ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ
-- ==========================================

-- Пример 1: Добавить связанный аккаунт
-- INSERT INTO public.linked_accounts (primary_user_id, linked_user_id, linked_email)
-- VALUES (
--   'YOUR_USER_ID',
--   'LINKED_USER_ID',
--   'linked@example.com'
-- );

-- Пример 2: Получить все связанные аккаунты с деталями
-- SELECT * FROM get_linked_accounts_with_details('YOUR_USER_ID');

-- Пример 3: Удалить связанный аккаунт
-- DELETE FROM public.linked_accounts 
-- WHERE id = 'LINK_ID' AND primary_user_id = 'YOUR_USER_ID';

-- ============================================
-- ✅ ГОТОВО!
-- ============================================

SELECT 
  '🎉 Система связанных аккаунтов установлена!' as message,
  'Теперь админы и owner могут добавлять аккаунты для быстрого переключения' as description;
