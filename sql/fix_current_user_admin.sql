-- Исправить роль для текущего пользователя
-- ID пользователя из консоли: 2f19d2e9-656e-4027-bc99-4c3db795dae7

-- 1. Проверить текущую роль
SELECT id, email, role 
FROM profiles 
WHERE id = '2f19d2e9-656e-4027-bc99-4c3db795dae7';

-- 2. Установить роль admin
UPDATE profiles 
SET role = 'admin' 
WHERE id = '2f19d2e9-656e-4027-bc99-4c3db795dae7';

-- 3. Проверить результат
SELECT id, email, role 
FROM profiles 
WHERE id = '2f19d2e9-656e-4027-bc99-4c3db795dae7';
