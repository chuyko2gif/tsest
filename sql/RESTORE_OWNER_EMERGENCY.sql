-- ============================================
-- 🚨 СРОЧНОЕ ВОССТАНОВЛЕНИЕ РОЛИ OWNER
-- ============================================

-- ШАГ 1: Находим вашего пользователя
-- ============================================

SELECT 
  '🔍 Все пользователи в базе:' as info;

SELECT 
  id,
  email,
  nickname,
  member_id,
  role,
  original_role,
  created_at
FROM public.profiles
ORDER BY created_at DESC;

-- ШАГ 2: ВОССТАНАВЛИВАЕМ РОЛЬ OWNER
-- ============================================

-- ВАРИАНТ 1: Если у вас есть original_role = 'owner'
UPDATE public.profiles
SET role = original_role
WHERE original_role = 'owner'
  AND role != 'owner';

-- ВАРИАНТ 2: Если вы знаете свой email (ЗАМЕНИТЕ на свой!)
-- UPDATE public.profiles
-- SET role = 'owner', original_role = 'owner'
-- WHERE email = 'ВАШ_EMAIL@example.com';

-- ВАРИАНТ 3: Если вы первый созданный пользователь
-- UPDATE public.profiles
-- SET role = 'owner', original_role = 'owner'
-- WHERE id = (SELECT id FROM public.profiles ORDER BY created_at ASC LIMIT 1);

-- ШАГ 3: Проверяем результат
-- ============================================

SELECT 
  '✅ РЕЗУЛЬТАТ ВОССТАНОВЛЕНИЯ:' as info;

SELECT 
  email,
  nickname,
  member_id,
  role,
  original_role
FROM public.profiles
ORDER BY created_at DESC;

-- ============================================
-- ✅ ГОТОВО! ОБНОВИТЕ СТРАНИЦУ (F5)
-- ============================================
