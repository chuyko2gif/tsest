-- ==============================================================
-- ЭКСТРЕННОЕ ИСПРАВЛЕНИЕ СИСТЕМЫ РОЛЕЙ
-- ==============================================================
-- Этот скрипт ПОЛНОСТЬЮ исправляет проблему со сбросом ролей
-- ==============================================================

-- ШАГ 1: УДАЛЯЕМ ВСЕ ТРИГГЕРЫ КОТОРЫЕ МОГУТ СБРАСЫВАТЬ РОЛИ
DROP TRIGGER IF EXISTS set_default_role_trigger ON profiles;
DROP FUNCTION IF EXISTS set_default_role();

-- ШАГ 2: УДАЛЯЕМ DEFAULT КОТОРЫЙ СБРАСЫВАЕТ РОЛИ
ALTER TABLE profiles ALTER COLUMN role DROP DEFAULT;

-- ШАГ 2.5: СОЗДАЕМ ПРАВИЛЬНЫЙ ТРИГГЕР ДЛЯ НОВЫХ ПОЛЬЗОВАТЕЛЕЙ
-- Этот триггер устанавливает 'basic' ТОЛЬКО если роль NULL или пустая
CREATE OR REPLACE FUNCTION set_role_for_new_users()
RETURNS TRIGGER AS $$
BEGIN
  -- Устанавливаем basic ТОЛЬКО если роль не указана
  IF NEW.role IS NULL OR NEW.role = '' THEN
    NEW.role := 'basic';
  END IF;
  -- Если роль уже установлена - НЕ ТРОГАЕМ её!
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер BEFORE INSERT (не UPDATE!)
DROP TRIGGER IF EXISTS set_role_on_insert_trigger ON profiles;
CREATE TRIGGER set_role_on_insert_trigger
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_role_for_new_users();

-- ШАГ 3: ПРОВЕРЯЕМ ТЕКУЩЕЕ СОСТОЯНИЕ
SELECT 
  '⚠️ ВНИМАНИЕ! Текущие роли в БД:' as status;
  
SELECT 
  email,
  role,
  nickname,
  created_at
FROM profiles
ORDER BY created_at DESC;

-- ШАГ 4: ВОССТАНАВЛИВАЕМ ВАШУ OWNER РОЛЬ (ЗАМЕНИТЕ EMAIL НА СВОЙ!)
UPDATE profiles 
SET role = 'owner' 
WHERE email = 'maksbroska@gmail.com';

-- Также на всякий случай для другого email
UPDATE profiles 
SET role = 'owner' 
WHERE email = 'littlehikai@gmail.com';

-- ШАГ 5: ЕСЛИ ЕСТЬ ДРУГИЕ АДМИНЫ/МОДЕРАТОРЫ - ВОССТАНАВЛИВАЕМ ИХ
-- Раскомментируйте и добавьте нужные email:
-- UPDATE profiles SET role = 'admin' WHERE email = 'admin@example.com';
-- UPDATE profiles SET role = 'exclusive' WHERE email = 'artist@example.com';

-- ШАГ 6: СОЗДАЕМ ЗАЩИТУ ОТ ИЗМЕНЕНИЯ РОЛЕЙ OWNER И ADMIN
CREATE OR REPLACE FUNCTION protect_important_roles()
RETURNS TRIGGER AS $$
BEGIN
  -- Если старая роль была owner - ЗАПРЕЩАЕМ любое изменение
  IF OLD.role = 'owner' AND NEW.role != 'owner' THEN
    RAISE EXCEPTION '🚫 Нельзя изменить роль OWNER!';
  END IF;
  
  -- Если старая роль была admin и пытаются понизить до basic/exclusive
  IF OLD.role = 'admin' AND NEW.role IN ('basic', 'exclusive') THEN
    RAISE EXCEPTION '🚫 Нельзя понизить ADMIN до basic/exclusive!';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Удаляем старый триггер если есть
DROP TRIGGER IF EXISTS protect_roles_trigger ON profiles;
DROP TRIGGER IF EXISTS prevent_role_downgrade ON profiles;

-- Создаем новый триггер защиты
CREATE TRIGGER protect_roles_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION protect_important_roles();

-- ШАГ 7: ПРОВЕРЯЕМ CONSTRAINT
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('basic', 'exclusive', 'admin', 'owner'));

-- ШАГ 8: ФИНАЛЬНАЯ ПРОВЕРКА
SELECT 
  '✅ СИСТЕМА РОЛЕЙ ИСПРАВЛЕНА!' as status;

SELECT 
  '📊 Текущее распределение ролей:' as info,
  role,
  COUNT(*) as count
FROM profiles
GROUP BY role
ORDER BY 
  CASE role
    WHEN 'owner' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'exclusive' THEN 3
    WHEN 'basic' THEN 4
    ELSE 5
  END;

SELECT 
  '👥 Список всех пользователей:' as info;

SELECT 
  email,
  role,
  nickname,
  member_id,
  balance,
  created_at
FROM profiles
ORDER BY 
  CASE role
    WHEN 'owner' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'exclusive' THEN 3
    WHEN 'basic' THEN 4
    ELSE 5
  END,
  created_at DESC;

-- ШАГ 9: ПОКАЗЫВАЕМ ВАШ ПРОФИЛЬ
SELECT 
  '🎯 ВАШ ПРОФИЛЬ (maksbroska):' as info,
  email,
  role,
  nickname,
  balance
FROM profiles
WHERE email = 'maksbroska@gmail.com';

SELECT 
  '🎯 ВАШ ПРОФИЛЬ (littlehikai):' as info,
  email,
  role,
  nickname,
  balance
FROM profiles
WHERE email = 'littlehikai@gmail.com';
