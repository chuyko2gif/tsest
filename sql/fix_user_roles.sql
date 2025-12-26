-- Скрипт для установки ролей всем пользователям
-- Запустите этот SQL в Supabase SQL Editor

-- 1. Сначала устанавливаем всем пользователям роль basic
UPDATE profiles 
SET role = 'basic';

-- 2. Устанавливаем роль admin конкретным пользователям
UPDATE profiles 
SET role = 'admin'
WHERE email IN ('maksbroska@gmail.com', 'littlehikai@gmail.com');

-- 3. Устанавливаем роль exclusive конкретным пользователям
UPDATE profiles 
SET role = 'exclusive'
WHERE email IN ('jdsakd@gmail.com');

-- 4. Проверяем результат
SELECT email, nickname, role 
FROM profiles 
ORDER BY 
  CASE role 
    WHEN 'admin' THEN 1 
    WHEN 'exclusive' THEN 2 
    WHEN 'basic' THEN 3 
    ELSE 4 
  END;
