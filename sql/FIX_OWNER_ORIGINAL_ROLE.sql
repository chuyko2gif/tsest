-- ============================================
-- 🔧 ИСПРАВЛЕНИЕ ORIGINAL_ROLE ДЛЯ OWNER
-- ============================================

-- Проблема: у owner в БД стоит original_role = 'admin'
-- Решение: устанавливаем original_role = 'owner' для всех у кого role = 'owner'

-- ==========================================
-- ШАГ 1: ПРОВЕРЯЕМ ТЕКУЩЕЕ СОСТОЯНИЕ
-- ==========================================

SELECT 
  '🔍 ВАШ АККАУНТ СЕЙЧАС:' as info;

SELECT 
  id,
  email,
  nickname,
  member_id,
  role as current_role,
  original_role,
  CASE 
    WHEN role = 'owner' AND original_role = 'owner' THEN '✅ Всё правильно!'
    WHEN role = 'owner' AND original_role = 'admin' THEN '❌ ОШИБКА: Owner с original_role = admin'
    WHEN role = 'owner' AND original_role IS NULL THEN '⚠️ Owner без original_role'
    WHEN role = 'admin' AND original_role = 'owner' THEN '⚠️ Admin был owner (тестирование)'
    ELSE '👤 Обычный пользователь'
  END as status
FROM public.profiles
WHERE role IN ('owner', 'admin') OR original_role IN ('owner', 'admin')
ORDER BY 
  CASE role
    WHEN 'owner' THEN 1
    WHEN 'admin' THEN 2
  END,
  created_at ASC;

-- ==========================================
-- ШАГ 2: ИСПРАВЛЯЕМ ВСЕХ OWNER
-- ==========================================

SELECT 
  '🔧 ИСПРАВЛЕНИЕ НАЧАТО...' as info;

-- Устанавливаем original_role = 'owner' для всех у кого role = 'owner'
UPDATE public.profiles
SET 
  original_role = 'owner',
  can_link_accounts = true
WHERE role = 'owner' 
  AND (original_role IS NULL OR original_role != 'owner');

-- Показываем сколько строк обновили
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN CONCAT('✅ Исправлено записей: ', COUNT(*))
    ELSE '✅ Все owner уже правильные'
  END as result
FROM public.profiles
WHERE role = 'owner';

-- ==========================================
-- ШАГ 3: ПРОВЕРЯЕМ РЕЗУЛЬТАТ
-- ==========================================

SELECT 
  '✅ РЕЗУЛЬТАТ ПОСЛЕ ИСПРАВЛЕНИЯ:' as info;

SELECT 
  id,
  email,
  nickname,
  member_id,
  role as current_role,
  original_role,
  can_link_accounts,
  CASE 
    WHEN role = 'owner' AND original_role = 'owner' THEN '✅ Owner - всё правильно!'
    WHEN role = 'admin' AND original_role = 'admin' THEN '✅ Admin - всё правильно!'
    WHEN role = 'owner' AND original_role IS NULL THEN '❌ Ошибка осталась!'
    ELSE '👤 Другая роль'
  END as status
FROM public.profiles
WHERE role IN ('owner', 'admin') OR original_role IN ('owner', 'admin')
ORDER BY 
  CASE role
    WHEN 'owner' THEN 1
    WHEN 'admin' THEN 2
  END,
  created_at ASC;

-- ==========================================
-- ШАГ 4: ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА
-- ==========================================

SELECT 
  '📊 СТАТИСТИКА ПО РОЛЯМ:' as info;

SELECT 
  role as "Текущая роль",
  original_role as "Истинная роль",
  COUNT(*) as "Количество пользователей"
FROM public.profiles
WHERE role IN ('owner', 'admin') OR original_role IN ('owner', 'admin')
GROUP BY role, original_role
ORDER BY role, original_role;

-- ============================================
-- ✅ ГОТОВО!
-- ============================================

-- ПОСЛЕ ВЫПОЛНЕНИЯ:
-- 1. Обновите страницу (F5)
-- 2. В отладочной панели должно показать:
--    - Текущая роль (role): owner
--    - Истинная роль (originalRole): owner
-- 3. Появятся 3 кнопки: Admin, Exclusive, Basic
-- 4. Текст изменится на "Переключайтесь между всеми ролями для тестирования"
-- ============================================
