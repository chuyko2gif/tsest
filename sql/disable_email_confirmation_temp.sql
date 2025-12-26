-- Временно отключаем подтверждение email через SQL
-- ВНИМАНИЕ: Это НЕ рекомендуется для продакшена!

-- Обновляем настройки auth через SQL (работает не всегда)
-- Лучше отключить через Dashboard, но если не находите:

-- 1. Политики уже разрешают создание профиля
-- 2. Убираем проверку email в коде (уже сделано)
-- 3. Пользователи смогут входить без подтверждения

-- Проверьте текущих пользователей:
SELECT 
  id, 
  email, 
  email_confirmed_at,
  confirmed_at,
  created_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- Если нужно вручную подтвердить email для тестового пользователя:
-- UPDATE auth.users 
-- SET email_confirmed_at = NOW(), confirmed_at = NOW() 
-- WHERE email = 'ваш_email@test.com';
