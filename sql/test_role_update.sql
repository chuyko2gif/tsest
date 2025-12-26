-- Тестовый скрипт для проверки изменения ролей
-- Запустите этот SQL в Supabase SQL Editor

-- 1. Проверяем текущие роли
SELECT email, nickname, role FROM profiles ORDER BY role;

-- 2. Тестируем изменение роли (замените email на нужный)
-- UPDATE profiles SET role = 'exclusive' WHERE email = 'test@example.com';

-- 3. Проверяем политики RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'profiles';
