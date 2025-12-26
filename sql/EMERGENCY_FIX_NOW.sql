-- ============================================
-- 🚨 ЭКСТРЕННОЕ ВОССТАНОВЛЕНИЕ - НЕМЕДЛЕННО!
-- ============================================

-- ШАГ 1: Удаляем сломанный триггер
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON public.profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ШАГ 2: Создаём ПРОСТУЮ рабочую функцию БЕЗ generate_member_id
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Просто генерируем member_id прямо здесь без вызова другой функции
  IF NEW.member_id IS NULL OR NEW.member_id = '' THEN
    NEW.member_id := 'THQ-' || LPAD(FLOOR(1000 + RANDOM() * 9000)::TEXT, 4, '0');
  END IF;
  
  -- Устанавливаем роль по умолчанию
  IF NEW.role IS NULL THEN
    NEW.role := 'basic';
  END IF;
  
  RETURN NEW;
END;
$$;

-- ШАГ 3: Создаём триггер заново
-- ============================================

CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ШАГ 4: ПРОВЕРЯЕМ что все пользователи ИМЕЮТ member_id
-- ============================================

-- Показываем кто без member_id
SELECT 
  'Пользователи БЕЗ member_id:' as status,
  id,
  email,
  member_id
FROM public.profiles
WHERE member_id IS NULL OR member_id = '';

-- Генерируем member_id для тех у кого его нет (БЕЗ функции)
UPDATE public.profiles
SET member_id = 'THQ-' || LPAD(FLOOR(1000 + RANDOM() * 9000)::TEXT, 4, '0')
WHERE member_id IS NULL OR member_id = '';

-- Исправляем thq- на THQ- если есть
UPDATE public.profiles
SET member_id = REPLACE(member_id, 'thq-', 'THQ-')
WHERE member_id LIKE 'thq-%';

-- ШАГ 5: ПРОВЕРКА - Все должны иметь member_id
-- ============================================

SELECT 
  '✅ Проверка после исправления' as status,
  COUNT(*) as total,
  COUNT(CASE WHEN member_id IS NOT NULL AND member_id != '' THEN 1 END) as with_member_id,
  COUNT(CASE WHEN member_id LIKE 'THQ-%' THEN 1 END) as correct_format
FROM public.profiles;

-- Показываем всех
SELECT 
  email,
  member_id,
  role,
  created_at
FROM public.profiles
ORDER BY created_at DESC;

-- ШАГ 6: Проверяем RLS политики
-- ============================================

-- Показываем все политики на profiles
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
WHERE tablename = 'profiles';

-- ============================================
-- ✅ ГОТОВО! Теперь перезагрузите страницу
-- ============================================
