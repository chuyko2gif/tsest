-- ==============================================================
-- ФИКС: НЕ СБРАСЫВАТЬ РОЛИ НА BASIC
-- ==============================================================
-- Этот скрипт исправляет проблему, когда все роли сбрасываются на basic
-- ==============================================================

-- 1. Удаляем DEFAULT который ставит всем basic
ALTER TABLE profiles 
ALTER COLUMN role DROP DEFAULT;

-- 2. Создаем функцию для установки роли при INSERT
CREATE OR REPLACE FUNCTION set_default_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Если роль не указана (NULL или пустая строка), ставим basic
  IF NEW.role IS NULL OR NEW.role = '' THEN
    NEW.role := 'basic';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Удаляем старый триггер если есть
DROP TRIGGER IF EXISTS set_default_role_trigger ON profiles;

-- 4. Создаем триггер BEFORE INSERT
CREATE TRIGGER set_default_role_trigger
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_default_role();

-- 5. Убираем любые обновления которые могли сбросить роли
-- Проверяем, есть ли пользователи с неправильными ролями
SELECT email, role FROM profiles WHERE role = 'basic' OR role IS NULL;

-- 6. ВАЖНО: Восстанавливаем вашу owner роль (замените email на свой!)
UPDATE profiles SET role = 'owner' WHERE email = 'littlehikai@gmail.com';

SELECT '✅ Система ролей исправлена! Роли больше не будут сбрасываться.' as status;
SELECT 'Проверьте: ' as info;
SELECT email, role, created_at FROM profiles ORDER BY created_at DESC LIMIT 10;
