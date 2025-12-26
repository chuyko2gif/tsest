-- ==============================================================
-- ПРОВЕРКА РОЛИ В БАЗЕ ДАННЫХ
-- ==============================================================

-- Показываем все профили с ролями
SELECT 
  email,
  role,
  nickname,
  member_id,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

-- Проверяем конкретно ваш email (замените на свой!)
SELECT 
  'Проверка вашего профиля:' as info,
  email,
  role,
  nickname,
  balance
FROM profiles
WHERE email = 'littlehikai@gmail.com';

-- Если роль не owner - исправляем
DO $$
BEGIN
  UPDATE profiles 
  SET role = 'owner' 
  WHERE email = 'littlehikai@gmail.com' 
  AND role != 'owner';
  
  IF FOUND THEN
    RAISE NOTICE '✅ Роль исправлена на owner';
  ELSE
    RAISE NOTICE 'ℹ️ Роль уже owner или профиль не найден';
  END IF;
END $$;

-- Проверяем еще раз
SELECT 
  '✅ Финальная проверка:' as status,
  email,
  role,
  nickname
FROM profiles
WHERE email = 'littlehikai@gmail.com';
