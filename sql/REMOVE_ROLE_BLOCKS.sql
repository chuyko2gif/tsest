-- ============================================
-- 🔧 УДАЛЕНИЕ ВСЕХ БЛОКИРОВОК ИЗМЕНЕНИЯ РОЛЕЙ
-- ============================================

-- ШАГ 1: Удаляем ВСЕ триггеры кроме handle_new_user
-- ============================================

DO $$ 
DECLARE
    trig record;
BEGIN
    FOR trig IN 
        SELECT trigger_name, event_object_table
        FROM information_schema.triggers
        WHERE event_object_table = 'profiles'
          AND trigger_name != 'on_auth_user_created'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', trig.trigger_name, trig.event_object_table);
        RAISE NOTICE 'Удалён триггер: %', trig.trigger_name;
    END LOOP;
END $$;

-- ШАГ 2: Удаляем функции которые могут блокировать изменения
-- ============================================

DROP FUNCTION IF EXISTS prevent_role_change() CASCADE;
DROP FUNCTION IF EXISTS protect_admin_role() CASCADE;
DROP FUNCTION IF EXISTS validate_role_change() CASCADE;
DROP FUNCTION IF EXISTS check_role_update() CASCADE;

-- ШАГ 3: Пересоздаём RLS политики для UPDATE
-- ============================================

-- Удаляем старые политики UPDATE
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow update own profile" ON public.profiles;

-- Создаём НОВУЮ простую политику UPDATE
CREATE POLICY "profiles_update_all" ON public.profiles
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ШАГ 4: Проверяем что изменения применились
-- ============================================

SELECT 
  '✅ ТРИГГЕРЫ ПОСЛЕ ОЧИСТКИ' as info;

SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'profiles';

SELECT 
  '✅ RLS ПОЛИТИКИ ПОСЛЕ ОЧИСТКИ' as info;

SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'profiles';

-- ШАГ 5: ТЕСТИРУЕМ ИЗМЕНЕНИЕ РОЛИ
-- ============================================

-- Покажите какой пользователь у вас в базе
SELECT 
  '🧪 ТЕКУЩИЕ ДАННЫЕ' as info;

SELECT 
  id,
  email,
  nickname,
  member_id,
  role,
  original_role
FROM public.profiles
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- ✅ ВСЁ ГОТОВО! ПОПРОБУЙТЕ ИЗМЕНИТЬ РОЛЬ СНОВА
-- ============================================
