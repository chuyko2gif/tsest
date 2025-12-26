-- ==============================================================
-- ТОЧНАЯ ПРОВЕРКА И ИСПРАВЛЕНИЕ РОЛЕЙ
-- ==============================================================

-- 1. ПОКАЗЫВАЕМ ПОЛНУЮ ИНФОРМАЦИЮ О ВСЕХ ПОЛЬЗОВАТЕЛЯХ
SELECT 
  '📊 ВСЕ ПОЛЬЗОВАТЕЛИ В БД:' as info;

SELECT 
  id,
  email,
  role,
  nickname,
  member_id,
  balance,
  created_at,
  LENGTH(role) as role_length,
  ASCII(role) as role_ascii
FROM profiles
ORDER BY created_at DESC;

-- 2. ИЩЕМ КОНКРЕТНЫХ ПОЛЬЗОВАТЕЛЕЙ
SELECT 
  '🔍 ПОИСК maksbroska@gmail.com:' as info;

SELECT 
  id,
  email,
  role,
  nickname,
  member_id,
  balance,
  '|||' || role || '|||' as role_with_markers,
  LENGTH(role) as role_length,
  CASE 
    WHEN role IS NULL THEN 'NULL'
    WHEN role = '' THEN 'EMPTY STRING'
    WHEN role = 'owner' THEN 'OWNER'
    WHEN role = 'admin' THEN 'ADMIN'
    WHEN role = 'exclusive' THEN 'EXCLUSIVE'
    WHEN role = 'basic' THEN 'BASIC'
    ELSE 'UNKNOWN: ' || role
  END as role_check
FROM profiles
WHERE email = 'maksbroska@gmail.com';

-- 3. ПРОВЕРЯЕМ littlehikai
SELECT 
  '🔍 ПОИСК littlehikai@gmail.com:' as info;

SELECT 
  id,
  email,
  role,
  nickname,
  '|||' || role || '|||' as role_with_markers
FROM profiles
WHERE email = 'littlehikai@gmail.com';

-- 4. ПРИНУДИТЕЛЬНО УСТАНАВЛИВАЕМ OWNER ДЛЯ ОБОИХ
UPDATE profiles 
SET role = 'owner' 
WHERE email IN ('maksbroska@gmail.com', 'littlehikai@gmail.com');

-- 5. ПРОВЕРЯЕМ ЧТО ИЗМЕНИЛОСЬ
SELECT 
  '✅ ПОСЛЕ ОБНОВЛЕНИЯ:' as status;

SELECT 
  email,
  role,
  nickname,
  CASE 
    WHEN role = 'owner' THEN '✅ OWNER'
    WHEN role = 'admin' THEN '👤 ADMIN'
    WHEN role = 'exclusive' THEN '⭐ EXCLUSIVE'
    WHEN role = 'basic' THEN '○ BASIC'
    ELSE '⚠️ НЕИЗВЕСТНО: ' || role
  END as status
FROM profiles
WHERE email IN ('maksbroska@gmail.com', 'littlehikai@gmail.com');

-- 6. ПРОВЕРЯЕМ CONSTRAINTS
SELECT 
  '🔒 ПРОВЕРКА CONSTRAINTS:' as info;

SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass
AND conname LIKE '%role%';

-- 7. ПРОВЕРЯЕМ TRIGGERS
SELECT 
  '⚙️ ПРОВЕРКА TRIGGERS:' as info;

SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles';

-- 8. ФИНАЛЬНАЯ ПРОВЕРКА - ВЫБИРАЕМ ИМЕННО ТЕ ПОЛЯ КОТОРЫЕ ИСПОЛЬЗУЕТ КОД
SELECT 
  '🎯 ФИНАЛЬНАЯ ПРОВЕРКА (как в коде):' as info;

SELECT 
  email,
  role,
  nickname,
  balance,
  member_id,
  avatar
FROM profiles
WHERE email = 'maksbroska@gmail.com';
