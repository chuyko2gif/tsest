-- УПРАВЛЕНИЕ РОЛЯМИ ПОЛЬЗОВАТЕЛЕЙ
-- Запустите этот SQL в Supabase Dashboard → SQL Editor
-- 
-- ℹ️ Теперь все роли определяются ТОЛЬКО из базы данных!
-- Никаких жестко закодированных списков в коде.

-- 1. Показать всех пользователей и их текущие роли
SELECT id, email, nickname, role, created_at
FROM profiles
ORDER BY 
  CASE role 
    WHEN 'admin' THEN 1 
    WHEN 'exclusive' THEN 2 
    WHEN 'basic' THEN 3 
    ELSE 4 
  END,
  created_at DESC;

-- 2. Установить роль ADMIN для конкретных email
UPDATE profiles 
SET role = 'admin'
WHERE email IN ('maksbroska@gmail.com', 'littlehikai@gmail.com');

-- 3. Установить роль EXCLUSIVE для артистов
UPDATE profiles 
SET role = 'exclusive'
WHERE email IN ('jdsakd@gmail.com');

-- 4. Установить роль BASIC всем остальным (по умолчанию)
UPDATE profiles 
SET role = 'basic'
WHERE role IS NULL OR role NOT IN ('admin', 'exclusive');

-- 5. Проверить результат - админы
SELECT email, nickname, role 
FROM profiles 
WHERE role = 'admin'
ORDER BY email;

-- 6. Проверить результат - exclusive артисты
SELECT email, nickname, role 
FROM profiles 
WHERE role = 'exclusive'
ORDER BY email;

-- ═══════════════════════════════════════════════════════════════
-- ПРИМЕРЫ УПРАВЛЕНИЯ РОЛЯМИ:
-- ═══════════════════════════════════════════════════════════════

-- Назначить админа по email:
-- UPDATE profiles SET role = 'admin' WHERE email = 'новый_админ@example.com';

-- Назначить exclusive артиста:
-- UPDATE profiles SET role = 'exclusive' WHERE email = 'артист@example.com';

-- Понизить пользователя до basic:
-- UPDATE profiles SET role = 'basic' WHERE email = 'user@example.com';

-- Удалить роль (вернуть к basic):
-- UPDATE profiles SET role = 'basic' WHERE id = 'user-id-here';
