-- ============================================
-- 🚨 КРИТИЧНЫЙ ФИКС: ВОССТАНОВЛЕНИЕ ТЕГОВ THQ
-- Дата: 26.12.2025
-- 
-- ПРОБЛЕМА: Ошибочно заменили все THQ- на thq-
-- РЕШЕНИЕ: Возврат всех тегов в формат THQ-
-- ============================================

-- ШАГ 1: ДИАГНОСТИКА - Проверяем текущее состояние
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔍 ДИАГНОСТИКА ТЕКУЩЕГО СОСТОЯНИЯ';
  RAISE NOTICE '========================================';
END $$;

-- Проверяем сколько пользователей с неправильными кодами
SELECT 
  '❌ Найдено пользователей с НЕПРАВИЛЬНЫМИ кодами (thq-)' as status,
  COUNT(*) as count
FROM public.profiles
WHERE member_id LIKE 'thq-%';

-- Проверяем сколько пользователей с правильными кодами
SELECT 
  '✅ Найдено пользователей с ПРАВИЛЬНЫМИ кодами (THQ-)' as status,
  COUNT(*) as count
FROM public.profiles
WHERE member_id LIKE 'THQ-%';

-- Показываем примеры неправильных кодов
SELECT 
  'Примеры НЕПРАВИЛЬНЫХ кодов:' as status,
  member_id,
  nickname,
  email,
  role
FROM public.profiles
WHERE member_id LIKE 'thq-%'
ORDER BY created_at DESC
LIMIT 10;

-- ШАГ 2: СОЗДАНИЕ РЕЗЕРВНОЙ КОПИИ
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '💾 СОЗДАНИЕ РЕЗЕРВНОЙ КОПИИ';
  RAISE NOTICE '========================================';
END $$;

-- Создаем поле для бэкапа если его нет
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS member_id_backup TEXT;

-- Сохраняем текущие значения (даже неправильные)
UPDATE public.profiles
SET member_id_backup = member_id
WHERE member_id_backup IS NULL OR member_id_backup = '';

-- Проверяем что бэкап создан
SELECT 
  '✅ Резервная копия создана' as status,
  COUNT(*) as total_backups
FROM public.profiles
WHERE member_id_backup IS NOT NULL;

-- ШАГ 3: ИСПРАВЛЕНИЕ ДАННЫХ В БАЗЕ
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔧 ИСПРАВЛЕНИЕ ТЕГОВ В БАЗЕ ДАННЫХ';
  RAISE NOTICE '========================================';
END $$;

-- КРИТИЧНО: Меняем все thq- обратно на THQ-
UPDATE public.profiles
SET member_id = REPLACE(member_id, 'thq-', 'THQ-')
WHERE member_id LIKE 'thq-%';

-- Проверяем результат исправления
SELECT 
  '✅ ИСПРАВЛЕНО! Пользователей с правильными кодами:' as status,
  COUNT(*) as count
FROM public.profiles
WHERE member_id LIKE 'THQ-%';

-- Проверяем что не осталось неправильных
SELECT 
  '❌ Осталось пользователей с неправильными кодами:' as status,
  COUNT(*) as count
FROM public.profiles
WHERE member_id LIKE 'thq-%';

-- Показываем исправленные данные
SELECT 
  'Примеры ИСПРАВЛЕННЫХ кодов:' as status,
  member_id,
  nickname,
  email,
  role
FROM public.profiles
WHERE member_id LIKE 'THQ-%'
ORDER BY created_at DESC
LIMIT 10;

-- ШАГ 4: ИСПРАВЛЕНИЕ ФУНКЦИИ ГЕНЕРАЦИИ
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔧 ИСПРАВЛЕНИЕ ФУНКЦИИ ГЕНЕРАЦИИ ID';
  RAISE NOTICE '========================================';
END $$;

-- Удаляем старую функцию с неправильным форматом
DROP FUNCTION IF EXISTS public.generate_member_id();

-- Создаем правильную функцию с THQ- префиксом
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
    
    -- Проверяем уникальность
    SELECT EXISTS(
      SELECT 1 FROM public.profiles WHERE member_id = new_member_id
    ) INTO id_exists;
    
    -- Если ID уникален, выходим из цикла
    EXIT WHEN NOT id_exists;
  END LOOP;
  
  RETURN new_member_id;
END;
$$;

-- Обновляем триггер
DROP TRIGGER IF EXISTS on_auth_user_created ON public.profiles;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Генерируем уникальный member_id в формате THQ-XXXX
  IF NEW.member_id IS NULL OR NEW.member_id = '' THEN
    NEW.member_id := generate_member_id();
  END IF;
  
  -- Устанавливаем роль по умолчанию
  IF NEW.role IS NULL THEN
    NEW.role := 'basic';
  END IF;
  
  -- Для админов и овнеров сохраняем оригинальную роль
  IF NEW.role IN ('admin', 'owner') AND NEW.original_role IS NULL THEN
    NEW.original_role := NEW.role;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Добавляем комментарий к функции
COMMENT ON FUNCTION generate_member_id IS 'Генерирует уникальный member_id формата THQ-XXXX (ПРАВИЛЬНЫЙ ФОРМАТ)';

-- ШАГ 5: ПРИНУДИТЕЛЬНЫЙ ВЫХОД ПОЛЬЗОВАТЕЛЕЙ
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '🚪 ПРИНУДИТЕЛЬНЫЙ ВЫХОД ВСЕХ ПОЛЬЗОВАТЕЛЕЙ';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Все пользователи будут выкинуты из системы';
  RAISE NOTICE 'При следующем входе они получат обновленные коды';
END $$;

-- Удаляем все сессии чтобы пользователи перезашли
-- и получили обновленные данные из БД
-- Используем DELETE вместо TRUNCATE чтобы избежать проблем с правами
DELETE FROM auth.sessions;

SELECT 
  '✅ Все сессии удалены. Пользователи должны войти заново' as status;

-- ШАГ 6: ФИНАЛЬНАЯ ПРОВЕРКА
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ ФИНАЛЬНАЯ ПРОВЕРКА';
  RAISE NOTICE '========================================';
END $$;

-- Итоговая статистика
SELECT 
  '📊 ИТОГОВАЯ СТАТИСТИКА' as report,
  COUNT(*) as total_users,
  COUNT(CASE WHEN member_id LIKE 'THQ-%' THEN 1 END) as correct_tags,
  COUNT(CASE WHEN member_id LIKE 'thq-%' THEN 1 END) as incorrect_tags,
  COUNT(CASE WHEN member_id_backup IS NOT NULL THEN 1 END) as have_backup
FROM public.profiles;

-- Проверяем работу функции генерации
SELECT 
  '🧪 ТЕСТ ФУНКЦИИ ГЕНЕРАЦИИ' as test,
  generate_member_id() as generated_id_1,
  generate_member_id() as generated_id_2,
  generate_member_id() as generated_id_3;

-- Показываем всех пользователей
SELECT 
  'Все пользователи с ПРАВИЛЬНЫМИ кодами:' as status,
  member_id,
  nickname,
  email,
  role,
  created_at
FROM public.profiles
ORDER BY created_at DESC;

-- ============================================
-- ✅ ИНСТРУКЦИЯ ПО ПРИМЕНЕНИЮ
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '📝 ИНСТРУКЦИЯ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '1. ✅ База данных исправлена';
  RAISE NOTICE '2. ✅ Все теги изменены с thq- на THQ-';
  RAISE NOTICE '3. ✅ Функция генерации обновлена';
  RAISE NOTICE '4. ✅ Все сессии удалены';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 ЧТО НУЖНО СДЕЛАТЬ:';
  RAISE NOTICE '';
  RAISE NOTICE '   А) НА СЕРВЕРЕ:';
  RAISE NOTICE '      - Исправить код в файлах проекта';
  RAISE NOTICE '      - Перезапустить сервер Next.js';
  RAISE NOTICE '';
  RAISE NOTICE '   Б) ПОЛЬЗОВАТЕЛЯМ:';
  RAISE NOTICE '      - Выйти из аккаунта';
  RAISE NOTICE '      - Войти заново';
  RAISE NOTICE '      - Теги будут правильные THQ-XXXX';
  RAISE NOTICE '';
  RAISE NOTICE '   В) ЕСЛИ ТЕГИ ВСЕ ЕЩЕ НЕПРАВИЛЬНЫЕ:';
  RAISE NOTICE '      - Очистить кеш браузера (Ctrl+Shift+Delete)';
  RAISE NOTICE '      - Или в консоли браузера (F12):';
  RAISE NOTICE '        localStorage.clear();';
  RAISE NOTICE '        sessionStorage.clear();';
  RAISE NOTICE '        location.reload();';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ ФИКС ЗАВЕРШЕН!';
  RAISE NOTICE '========================================';
END $$;
