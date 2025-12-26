-- ============================================
-- 🔗 СИСТЕМА СВЯЗЫВАНИЯ АККАУНТОВ
-- ============================================

-- Эта система позволяет админам и избранным пользователям
-- связывать несколько аккаунтов и переключаться между ними

-- ШАГ 1: Добавляем поле can_link_accounts в profiles
-- ============================================

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS can_link_accounts BOOLEAN DEFAULT false;

-- Даём права на связывание аккаунтов владельцам и админам
UPDATE public.profiles
SET can_link_accounts = true
WHERE role IN ('owner', 'admin');

-- ШАГ 2: Создаём таблицу для связанных аккаунтов
-- ============================================

CREATE TABLE IF NOT EXISTS public.linked_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Основной аккаунт (кто добавляет связку)
  primary_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Связанный аккаунт (к которому можно переключиться)
  linked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Email связанного аккаунта (для быстрого поиска)
  linked_email TEXT NOT NULL,
  
  -- Никнейм связанного аккаунта (для отображения)
  linked_nickname TEXT,
  
  -- Когда была создана связка
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Последнее использование
  last_used_at TIMESTAMPTZ,
  
  -- Уникальная связка (один аккаунт не может быть добавлен дважды)
  UNIQUE(primary_user_id, linked_user_id)
);

-- Создаём индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_linked_accounts_primary 
ON public.linked_accounts(primary_user_id);

CREATE INDEX IF NOT EXISTS idx_linked_accounts_linked 
ON public.linked_accounts(linked_user_id);

-- ШАГ 3: Добавляем поле для отслеживания текущей сессии переключения
-- ============================================

-- Храним ID оригинального пользователя в profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS switched_from_user_id UUID REFERENCES auth.users(id);

-- Когда был выполнен последний переключатель
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS switched_at TIMESTAMPTZ;

-- ШАГ 4: RLS политики для linked_accounts
-- ============================================

-- Включаем RLS
ALTER TABLE public.linked_accounts ENABLE ROW LEVEL SECURITY;

-- Политика на чтение: пользователь видит только свои связанные аккаунты
DROP POLICY IF EXISTS linked_accounts_select_own ON public.linked_accounts;
CREATE POLICY linked_accounts_select_own 
ON public.linked_accounts
FOR SELECT 
USING (
  primary_user_id = auth.uid()
);

-- Политика на вставку: только если у пользователя есть права
DROP POLICY IF EXISTS linked_accounts_insert_own ON public.linked_accounts;
CREATE POLICY linked_accounts_insert_own 
ON public.linked_accounts
FOR INSERT 
WITH CHECK (
  primary_user_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND can_link_accounts = true
  )
);

-- Политика на удаление: только свои связки
DROP POLICY IF EXISTS linked_accounts_delete_own ON public.linked_accounts;
CREATE POLICY linked_accounts_delete_own 
ON public.linked_accounts
FOR DELETE 
USING (
  primary_user_id = auth.uid()
);

-- ШАГ 5: Функция для получения связанных аккаунтов
-- ============================================

CREATE OR REPLACE FUNCTION get_linked_accounts(user_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  nickname TEXT,
  role TEXT,
  avatar TEXT,
  last_used TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    la.linked_user_id as id,
    la.linked_email as email,
    la.linked_nickname as nickname,
    p.role,
    p.avatar,
    la.last_used_at as last_used
  FROM public.linked_accounts la
  LEFT JOIN public.profiles p ON p.id = la.linked_user_id
  WHERE la.primary_user_id = user_id
  ORDER BY la.last_used_at DESC NULLS LAST, la.created_at DESC;
END;
$$;

-- ШАГ 6: Проверяем результат
-- ============================================

SELECT 
  '✅ ТАБЛИЦА СОЗДАНА:' as info;

SELECT 
  table_name,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'linked_accounts'
ORDER BY ordinal_position;

SELECT 
  '✅ ПРАВА НА СВЯЗЫВАНИЕ:' as info;

SELECT 
  email,
  nickname,
  role,
  can_link_accounts,
  CASE 
    WHEN can_link_accounts THEN '✅ Может связывать аккаунты'
    ELSE '❌ Не может связывать'
  END as status
FROM public.profiles
ORDER BY created_at DESC;

-- ============================================
-- ✅ ГОТОВО! ТЕПЕРЬ МОЖНО:
-- 1. Добавлять связанные аккаунты через UI
-- 2. Хранить список связанных аккаунтов
-- 3. Переключаться между ними
-- 4. Отслеживать когда был последний переключение
-- 5. Вернуться к оригинальному аккаунту
-- ============================================
