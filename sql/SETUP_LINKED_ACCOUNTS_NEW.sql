-- ============================================
-- 🔗 НОВАЯ СИСТЕМА ПЕРЕКЛЮЧЕНИЯ АККАУНТОВ
-- ============================================
-- Для владельцев (owner) и администраторов (admin)
-- Возможность привязать аккаунты и переключаться между ними

-- ШАГ 1: Удаляем старую таблицу если существует
-- ============================================
DROP TABLE IF EXISTS public.linked_accounts CASCADE;

-- ШАГ 2: Создаем новую таблицу для связанных аккаунтов
-- ============================================
CREATE TABLE public.linked_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Основной аккаунт (кто создал связь) - только owner/admin
  primary_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Связанный аккаунт (к которому можно переключиться)
  linked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Email связанного аккаунта (для быстрого поиска)
  linked_email TEXT NOT NULL,
  
  -- Никнейм связанного аккаунта (для отображения)
  linked_nickname TEXT,
  
  -- Когда была создана связка
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Последнее использование (когда переключались)
  last_used_at TIMESTAMPTZ,
  
  -- Уникальная связка (один аккаунт не может быть добавлен дважды)
  UNIQUE(primary_user_id, linked_user_id),
  
  -- Проверка: нельзя связать сам с собой
  CHECK (primary_user_id != linked_user_id)
);

-- ШАГ 3: Создаём индексы для быстрого поиска
-- ============================================
CREATE INDEX idx_linked_accounts_primary ON public.linked_accounts(primary_user_id);
CREATE INDEX idx_linked_accounts_linked ON public.linked_accounts(linked_user_id);
CREATE INDEX idx_linked_accounts_email ON public.linked_accounts(linked_email);

-- ШАГ 4: Включаем RLS (Row Level Security)
-- ============================================
ALTER TABLE public.linked_accounts ENABLE ROW LEVEL SECURITY;

-- ШАГ 5: Создаем политики RLS
-- ============================================

-- Политика SELECT: видеть только свои связи
DROP POLICY IF EXISTS "linked_accounts_select_policy" ON public.linked_accounts;
CREATE POLICY "linked_accounts_select_policy"
ON public.linked_accounts
FOR SELECT
USING (
  primary_user_id = auth.uid()
);

-- Политика INSERT: создавать связи могут только owner и admin
DROP POLICY IF EXISTS "linked_accounts_insert_policy" ON public.linked_accounts;
CREATE POLICY "linked_accounts_insert_policy"
ON public.linked_accounts
FOR INSERT
WITH CHECK (
  primary_user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- Политика UPDATE: обновлять могут только владельцы связей (для last_used_at)
DROP POLICY IF EXISTS "linked_accounts_update_policy" ON public.linked_accounts;
CREATE POLICY "linked_accounts_update_policy"
ON public.linked_accounts
FOR UPDATE
USING (
  primary_user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- Политика DELETE: удалять могут только владельцы связей
DROP POLICY IF EXISTS "linked_accounts_delete_policy" ON public.linked_accounts;
CREATE POLICY "linked_accounts_delete_policy"
ON public.linked_accounts
FOR DELETE
USING (
  primary_user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- ШАГ 6: Комментарии для документации
-- ============================================
COMMENT ON TABLE public.linked_accounts IS 'Связанные аккаунты для владельцев и администраторов. Позволяет переключаться между аккаунтами.';
COMMENT ON COLUMN public.linked_accounts.primary_user_id IS 'ID основного пользователя (owner/admin), который создал связь';
COMMENT ON COLUMN public.linked_accounts.linked_user_id IS 'ID связанного аккаунта, на который можно переключиться';
COMMENT ON COLUMN public.linked_accounts.linked_email IS 'Email связанного аккаунта';
COMMENT ON COLUMN public.linked_accounts.linked_nickname IS 'Никнейм связанного аккаунта для отображения';
COMMENT ON COLUMN public.linked_accounts.last_used_at IS 'Когда в последний раз переключались на этот аккаунт';

-- ШАГ 7: Функция для получения связанных аккаунтов (опционально)
-- ============================================
CREATE OR REPLACE FUNCTION get_my_linked_accounts()
RETURNS TABLE (
  id UUID,
  linked_user_id UUID,
  linked_email TEXT,
  linked_nickname TEXT,
  profile JSONB,
  last_used_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Проверяем права
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Access denied. Only owners and admins can view linked accounts.';
  END IF;

  -- Возвращаем связанные аккаунты с профилями
  RETURN QUERY
  SELECT 
    la.id,
    la.linked_user_id,
    la.linked_email,
    la.linked_nickname,
    jsonb_build_object(
      'id', p.id,
      'nickname', p.nickname,
      'email', p.email,
      'avatar', p.avatar,
      'role', p.role,
      'member_id', p.member_id
    ) as profile,
    la.last_used_at
  FROM public.linked_accounts la
  LEFT JOIN public.profiles p ON p.id = la.linked_user_id
  WHERE la.primary_user_id = auth.uid()
  ORDER BY la.created_at DESC;
END;
$$;

-- ============================================
-- ✅ ГОТОВО!
-- ============================================

-- Проверка структуры таблицы:
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'linked_accounts' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Проверка политик RLS:
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'linked_accounts' 
  AND schemaname = 'public';
