-- ============================================
-- 🚀 ФИНАЛЬНАЯ НАСТРОЙКА СИСТЕМЫ РОЛЕЙ И АККАУНТОВ
-- ============================================

-- Этот скрипт объединяет все исправления:
-- 1. Режим тестирования ролей (Owner/Admin/Basic/Exclusive)
-- 2. Система связывания аккаунтов
-- 3. Разблокировка политик для переключения

-- ==========================================
-- ЧАСТЬ 1: ИСПРАВЛЕНИЕ ORIGINAL_ROLE
-- ==========================================

-- Устанавливаем original_role для всех владельцев
UPDATE public.profiles
SET original_role = 'owner'
WHERE role = 'owner' 
  AND (original_role IS NULL OR original_role = '');

-- Устанавливаем original_role для всех админов
UPDATE public.profiles
SET original_role = 'admin'
WHERE role = 'admin' 
  AND (original_role IS NULL OR original_role = '')
  AND id NOT IN (
    SELECT id FROM public.profiles 
    WHERE original_role = 'owner'
  );

-- ==========================================
-- ЧАСТЬ 2: РАЗБЛОКИРОВКА RLS ПОЛИТИК
-- ==========================================

-- Удаляем старую политику обновления
DROP POLICY IF EXISTS profiles_update_all ON public.profiles;

-- Создаём новую разрешающую политику
CREATE POLICY profiles_update_all 
ON public.profiles
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- ==========================================
-- ЧАСТЬ 3: СИСТЕМА СВЯЗЫВАНИЯ АККАУНТОВ
-- ==========================================

-- Добавляем поле can_link_accounts
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS can_link_accounts BOOLEAN DEFAULT false;

-- Даём права владельцам и админам
UPDATE public.profiles
SET can_link_accounts = true
WHERE role IN ('owner', 'admin');

-- Создаём таблицу для связанных аккаунтов
CREATE TABLE IF NOT EXISTS public.linked_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  linked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  linked_email TEXT NOT NULL,
  linked_nickname TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  UNIQUE(primary_user_id, linked_user_id)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_linked_accounts_primary 
ON public.linked_accounts(primary_user_id);

CREATE INDEX IF NOT EXISTS idx_linked_accounts_linked 
ON public.linked_accounts(linked_user_id);

-- Поля для отслеживания переключений
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS switched_from_user_id UUID REFERENCES auth.users(id);

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS switched_at TIMESTAMPTZ;

-- ==========================================
-- ЧАСТЬ 4: RLS ПОЛИТИКИ ДЛЯ LINKED_ACCOUNTS
-- ==========================================

ALTER TABLE public.linked_accounts ENABLE ROW LEVEL SECURITY;

-- Политика на чтение
DROP POLICY IF EXISTS linked_accounts_select_own ON public.linked_accounts;
CREATE POLICY linked_accounts_select_own 
ON public.linked_accounts
FOR SELECT 
USING (primary_user_id = auth.uid());

-- Политика на вставку
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

-- Политика на удаление
DROP POLICY IF EXISTS linked_accounts_delete_own ON public.linked_accounts;
CREATE POLICY linked_accounts_delete_own 
ON public.linked_accounts
FOR DELETE 
USING (primary_user_id = auth.uid());

-- ==========================================
-- ЧАСТЬ 5: ФУНКЦИЯ ПОЛУЧЕНИЯ СВЯЗАННЫХ АККАУНТОВ
-- ==========================================

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

-- ==========================================
-- ЧАСТЬ 6: ПРОВЕРКА РЕЗУЛЬТАТА
-- ==========================================

SELECT '✅ ПРОВЕРКА РОЛЕЙ:' as info;

SELECT 
  email,
  nickname,
  member_id,
  role,
  original_role,
  can_link_accounts,
  CASE 
    WHEN original_role = 'owner' THEN '✅ Owner - может переключаться: Owner/Admin/Basic/Exclusive'
    WHEN original_role = 'admin' THEN '✅ Admin - может переключаться: Basic/Exclusive'
    WHEN role = 'owner' THEN '⚠️ Owner без original_role'
    WHEN role = 'admin' THEN '⚠️ Admin без original_role'
    ELSE '👤 Обычный пользователь'
  END as status,
  CASE 
    WHEN can_link_accounts THEN '🔗 Может связывать аккаунты'
    ELSE '❌ Не может связывать'
  END as linking_status
FROM public.profiles
ORDER BY created_at DESC;

SELECT '✅ ТАБЛИЦА СВЯЗАННЫХ АККАУНТОВ:' as info;

SELECT COUNT(*) as total_linked_accounts
FROM public.linked_accounts;

-- ============================================
-- ✅ ГОТОВО! ОБНОВИТЕ СТРАНИЦУ (F5)
-- ============================================

-- ТЕПЕРЬ ДОСТУПНО:

-- 🎭 РЕЖИМ ТЕСТИРОВАНИЯ:
-- Owner: может переключаться Owner → Admin → Basic → Exclusive
-- Admin: может переключаться Admin → Basic → Exclusive
-- Всегда есть кнопка возврата к original_role

-- 👥 УПРАВЛЕНИЕ АККАУНТАМИ:
-- Админы и овнеры могут добавлять связанные аккаунты
-- Форма входа: Email + Пароль
-- Список связанных аккаунтов
-- Быстрое переключение между профилями
-- Возврат к исходному аккаунту

-- 🎨 ДИЗАЙН:
-- Режим тестирования: фиолетово-синий градиент
-- Управление аккаунтами: голубо-синий градиент
-- Разные цвета для разных ролей в кнопках

-- ============================================
