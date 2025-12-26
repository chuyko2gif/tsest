-- ============================================
-- 🔧 ПОЛНОЕ ВОССТАНОВЛЕНИЕ ТАБЛИЦЫ PROFILES
-- Восстанавливаем всё с нуля
-- ============================================

-- ШАГ 1: ОТКЛЮЧАЕМ RLS НА ВСЕХ ТАБЛИЦАХ
-- ============================================

ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.withdrawal_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.releases_basic DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.releases_exclusive DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.support_tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ticket_messages DISABLE ROW LEVEL SECURITY;

-- ШАГ 2: УДАЛЯЕМ ВСЕ ТРИГГЕРЫ
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON public.profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ШАГ 3: УДАЛЯЕМ ВСЕ ПОЛИТИКИ
-- ============================================

DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
END $$;

-- ШАГ 4: УБЕЖДАЕМСЯ ЧТО ВСЕ НУЖНЫЕ КОЛОНКИ СУЩЕСТВУЮТ
-- ============================================

-- Добавляем member_id если его нет
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'member_id'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN member_id TEXT;
    END IF;
END $$;

-- Добавляем member_id_backup если его нет
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'member_id_backup'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN member_id_backup TEXT;
    END IF;
END $$;

-- Добавляем role если его нет
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'basic';
    END IF;
END $$;

-- Добавляем balance если его нет
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'balance'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN balance DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$;

-- Добавляем nickname если его нет
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'nickname'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN nickname TEXT;
    END IF;
END $$;

-- Добавляем avatar если его нет
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'avatar'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN avatar TEXT;
    END IF;
END $$;

-- Добавляем email если его нет
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'email'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
    END IF;
END $$;

-- Добавляем created_at если его нет
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Добавляем updated_at если его нет
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Добавляем original_role если его нет
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'original_role'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN original_role TEXT;
    END IF;
END $$;

-- ШАГ 5: ЗАПОЛНЯЕМ ПУСТЫЕ member_id
-- ============================================

-- Генерируем member_id для всех у кого его нет
UPDATE public.profiles
SET member_id = 'THQ-' || LPAD(FLOOR(1000 + RANDOM() * 9000)::TEXT, 4, '0')
WHERE member_id IS NULL OR member_id = '';

-- Сохраняем бэкап
UPDATE public.profiles
SET member_id_backup = member_id
WHERE member_id_backup IS NULL OR member_id_backup = '';

-- Исправляем thq- на THQ-
UPDATE public.profiles
SET member_id = REPLACE(member_id, 'thq-', 'THQ-')
WHERE member_id LIKE 'thq-%';

-- ШАГ 6: УСТАНАВЛИВАЕМ ДЕФОЛТНЫЕ ЗНАЧЕНИЯ
-- ============================================

-- Устанавливаем роль basic если пусто (НО НЕ ТРОГАЕМ ADMIN И OWNER!)
UPDATE public.profiles
SET role = 'basic'
WHERE (role IS NULL OR role = '')
  AND role NOT IN ('admin', 'owner');

-- Устанавливаем баланс 0 если пусто
UPDATE public.profiles
SET balance = 0
WHERE balance IS NULL;

-- Сохраняем original_role для админов и овнеров
UPDATE public.profiles
SET original_role = role
WHERE role IN ('admin', 'owner')
  AND (original_role IS NULL OR original_role = '');

-- ШАГ 7: СОЗДАЁМ ПРОСТУЮ ФУНКЦИЮ handle_new_user
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Генерируем member_id если его нет
  IF NEW.member_id IS NULL OR NEW.member_id = '' THEN
    NEW.member_id := 'THQ-' || LPAD(FLOOR(1000 + RANDOM() * 9000)::TEXT, 4, '0');
  END IF;
  
  -- Устанавливаем роль basic если нет (НЕ ТРОГАЕМ ADMIN/OWNER!)
  IF (NEW.role IS NULL OR NEW.role = '') AND NEW.role NOT IN ('admin', 'owner') THEN
    NEW.role := 'basic';
  END IF;
  
  -- Устанавливаем баланс 0 если нет
  IF NEW.balance IS NULL THEN
    NEW.balance := 0;
  END IF;
  
  -- Для админов и овнеров сохраняем оригинальную роль
  IF NEW.role IN ('admin', 'owner') AND (NEW.original_role IS NULL OR NEW.original_role = '') THEN
    NEW.original_role := NEW.role;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ШАГ 8: СОЗДАЁМ ТРИГГЕР
-- ============================================

CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ШАГ 9: СОЗДАЁМ ПРОСТЫЕ RLS ПОЛИТИКИ
-- ============================================

-- Включаем RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Политика 1: Все могут читать все профили (для админки и списков)
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT
  USING (true);

-- Политика 2: Пользователи могут вставлять свой профиль
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Политика 3: Пользователи могут обновлять свой профиль
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ШАГ 10: ФИНАЛЬНАЯ ПРОВЕРКА
-- ============================================

SELECT 
  '✅ ВОССТАНОВЛЕНИЕ ЗАВЕРШЕНО' as status,
  COUNT(*) as total_users,
  COUNT(CASE WHEN member_id IS NOT NULL AND member_id != '' THEN 1 END) as with_member_id,
  COUNT(CASE WHEN member_id LIKE 'THQ-%' THEN 1 END) as correct_format,
  COUNT(CASE WHEN role IS NOT NULL THEN 1 END) as with_role,
  COUNT(CASE WHEN balance IS NOT NULL THEN 1 END) as with_balance
FROM public.profiles;

-- Показываем всех пользователей
SELECT 
  email,
  nickname,
  member_id,
  role,
  balance,
  avatar,
  created_at
FROM public.profiles
ORDER BY created_at DESC;

-- Показываем политики
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'profiles';

-- Показываем триггеры
SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'profiles';

-- ============================================
-- ✅ ВСЁ ГОТОВО! ОБНОВИТЕ СТРАНИЦУ (F5)
-- ============================================
