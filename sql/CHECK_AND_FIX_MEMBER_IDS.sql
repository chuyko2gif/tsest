-- ============================================
-- 🔍 ПРОВЕРКА И ВОССТАНОВЛЕНИЕ MEMBER_ID
-- ============================================

-- ШАГ 1: Проверяем текущее состояние
-- ============================================

SELECT 
  'Всего пользователей:' as check_type,
  COUNT(*) as count
FROM public.profiles;

SELECT 
  'Пользователей С member_id:' as check_type,
  COUNT(*) as count
FROM public.profiles
WHERE member_id IS NOT NULL AND member_id != '';

SELECT 
  'Пользователей БЕЗ member_id:' as check_type,
  COUNT(*) as count
FROM public.profiles
WHERE member_id IS NULL OR member_id = '';

SELECT 
  'Пользователей с правильными кодами (THQ-):' as check_type,
  COUNT(*) as count
FROM public.profiles
WHERE member_id LIKE 'THQ-%';

SELECT 
  'Пользователей с неправильными кодами (thq-):' as check_type,
  COUNT(*) as count
FROM public.profiles
WHERE member_id LIKE 'thq-%';

-- ШАГ 2: Показываем всех пользователей
-- ============================================

SELECT 
  id,
  email,
  nickname,
  member_id,
  role,
  balance,
  created_at
FROM public.profiles
ORDER BY created_at DESC;

-- ШАГ 3: ИСПРАВЛЕНИЕ - Генерируем member_id для тех, у кого его нет
-- ============================================

-- Функция генерации (если её нет)
CREATE OR REPLACE FUNCTION public.generate_member_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_member_id TEXT;
  id_exists BOOLEAN;
BEGIN
  LOOP
    -- ПРАВИЛЬНЫЙ ФОРМАТ: THQ-XXXX (4 цифры)
    new_member_id := 'THQ-' || LPAD(FLOOR(1000 + RANDOM() * 9000)::TEXT, 4, '0');
    
    SELECT EXISTS(
      SELECT 1 FROM public.profiles WHERE member_id = new_member_id
    ) INTO id_exists;
    
    EXIT WHEN NOT id_exists;
  END LOOP;
  
  RETURN new_member_id;
END;
$$;

-- Обновляем пользователей БЕЗ member_id
DO $$
DECLARE
  profile_record RECORD;
  new_id TEXT;
BEGIN
  FOR profile_record IN 
    SELECT id FROM public.profiles WHERE member_id IS NULL OR member_id = ''
  LOOP
    new_id := generate_member_id();
    UPDATE public.profiles 
    SET member_id = new_id
    WHERE id = profile_record.id;
    
    RAISE NOTICE 'Создан member_id % для пользователя %', new_id, profile_record.id;
  END LOOP;
END $$;

-- Меняем thq- на THQ- если есть неправильные
UPDATE public.profiles
SET member_id = REPLACE(member_id, 'thq-', 'THQ-')
WHERE member_id LIKE 'thq-%';

-- ШАГ 4: ФИНАЛЬНАЯ ПРОВЕРКА
-- ============================================

SELECT 
  '✅ ФИНАЛЬНАЯ ПРОВЕРКА' as status,
  COUNT(*) as total_users,
  COUNT(CASE WHEN member_id IS NOT NULL AND member_id != '' THEN 1 END) as with_member_id,
  COUNT(CASE WHEN member_id LIKE 'THQ-%' THEN 1 END) as correct_format,
  COUNT(CASE WHEN member_id IS NULL OR member_id = '' THEN 1 END) as without_member_id
FROM public.profiles;

-- Показываем все профили после исправления
SELECT 
  email,
  nickname,
  member_id,
  role,
  created_at
FROM public.profiles
ORDER BY created_at DESC;
