-- ============================================
-- 🔧 ИСПРАВЛЕНИЕ РЕЖИМА ТЕСТИРОВАНИЯ ДЛЯ OWNER
-- ============================================

-- Эта команда позволит овнеру переключаться между ролями
-- и всегда иметь возможность вернуться обратно

-- ШАГ 1: Проверяем текущую ситуацию
-- ============================================

SELECT 
  '🔍 Текущее состояние ролей:' as info;

SELECT 
  id,
  email,
  nickname,
  role,
  original_role,
  created_at
FROM public.profiles
ORDER BY created_at DESC;

-- ШАГ 2: Устанавливаем original_role для всех владельцев
-- ============================================

-- Для тех кто был овнером но потерял original_role
UPDATE public.profiles
SET original_role = 'owner'
WHERE role = 'owner' 
  AND (original_role IS NULL OR original_role = '');

-- Для тех кто был админом но потерял original_role
UPDATE public.profiles
SET original_role = 'admin'
WHERE role = 'admin' 
  AND (original_role IS NULL OR original_role = '')
  AND id NOT IN (
    SELECT id FROM public.profiles 
    WHERE original_role = 'owner'
  );

-- ШАГ 3: Разблокируем политики для смены ролей
-- ============================================

-- Удаляем старую политику обновления если есть
DROP POLICY IF EXISTS profiles_update_all ON public.profiles;

-- Создаём новую разрешающую политику
CREATE POLICY profiles_update_all 
ON public.profiles
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- ШАГ 4: Проверяем результат
-- ============================================

SELECT 
  '✅ РЕЗУЛЬТАТ ИСПРАВЛЕНИЯ:' as info;

SELECT 
  email,
  nickname,
  member_id,
  role,
  original_role,
  CASE 
    WHEN original_role = 'owner' THEN '✅ Может вернуться к Owner'
    WHEN original_role = 'admin' THEN '✅ Может вернуться к Admin'
    ELSE '⚠️ Нет original_role'
  END as status
FROM public.profiles
ORDER BY created_at DESC;

-- ============================================
-- ✅ ГОТОВО! ТЕПЕРЬ:
-- 1. Owner → Admin → кнопка "Вернуться к Owner" ✅
-- 2. Owner → Basic → кнопка "Вернуться к Owner" ✅
-- 3. Owner → Exclusive → кнопка "Вернуться к Owner" ✅
-- 4. Admin → Basic → кнопка "Вернуться к Admin" ✅
-- 5. Admin → Exclusive → кнопка "Вернуться к Admin" ✅
-- ============================================
