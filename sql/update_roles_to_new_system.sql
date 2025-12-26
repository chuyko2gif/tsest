-- Обновление системы ролей в таблице profiles
-- Добавляет поддержку новых ролей: basic, exclusive, admin, owner

-- Шаг 1: Удаляем старое ограничение CHECK
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Шаг 2: Обновляем существующие роли на новые
-- Старая 'user' -> новая 'basic'
-- Старая 'admin' -> новая 'admin'
-- Старая 'moderator' -> новая 'admin'
UPDATE profiles SET role = 'basic' WHERE role = 'user';
UPDATE profiles SET role = 'admin' WHERE role = 'moderator';

-- Шаг 3: Добавляем новое ограничение с правильными ролями
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('basic', 'exclusive', 'admin', 'owner'));

-- Шаг 4: Устанавливаем значение по умолчанию
ALTER TABLE profiles 
ALTER COLUMN role SET DEFAULT 'basic';

-- Шаг 5 (опционально): Устанавливаем роль owner для нужного email
-- Раскомментируйте и замените email на ваш
-- UPDATE profiles SET role = 'owner' WHERE email = 'littlehikai@gmail.com';
