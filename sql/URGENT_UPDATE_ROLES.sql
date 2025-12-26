-- ⚡ СРОЧНОЕ ОБНОВЛЕНИЕ РОЛЕЙ В БД
-- Скопируйте и выполните этот SQL код в Supabase Dashboard → SQL Editor
-- https://supabase.com/dashboard/project/jfbuicudlyiwcrllduai/sql

-- 1. Показать текущее состояние (ДО обновления)
SELECT 'ТЕКУЩЕЕ СОСТОЯНИЕ:' as status;
SELECT email, nickname, role 
FROM profiles 
ORDER BY 
  CASE role 
    WHEN 'admin' THEN 1 
    WHEN 'exclusive' THEN 2 
    WHEN 'basic' THEN 3 
    ELSE 4 
  END;

-- 2. ОБНОВИТЬ роли для админов
UPDATE profiles 
SET role = 'admin'
WHERE email IN ('maksbroska@gmail.com', 'littlehikai@gmail.com');

-- 3. ОБНОВИТЬ роли для exclusive артистов  
UPDATE profiles 
SET role = 'exclusive'
WHERE email IN ('jdsakd@gmail.com');

-- 4. Всем остальным установить basic
UPDATE profiles 
SET role = 'basic'
WHERE email NOT IN ('maksbroska@gmail.com', 'littlehikai@gmail.com', 'jdsakd@gmail.com');

-- 5. Показать результат (ПОСЛЕ обновления)
SELECT 'РЕЗУЛЬТАТ ОБНОВЛЕНИЯ:' as status;
SELECT email, nickname, role 
FROM profiles 
ORDER BY 
  CASE role 
    WHEN 'admin' THEN 1 
    WHEN 'exclusive' THEN 2 
    WHEN 'basic' THEN 3 
    ELSE 4 
  END;

-- 6. Проверка: показать только админов
SELECT 'СПИСОК АДМИНОВ:' as status;
SELECT email, nickname, role 
FROM profiles 
WHERE role = 'admin';
