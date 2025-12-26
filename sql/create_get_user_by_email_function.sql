-- Функция для проверки существования пользователя по email в auth.users
-- Это нужно для обработки случая, когда email был ранее использован, но аккаунт удален

-- Удаляем функцию если существует
DROP FUNCTION IF EXISTS get_user_by_email(text);

-- Создаем функцию
CREATE OR REPLACE FUNCTION get_user_by_email(user_email text)
RETURNS TABLE (
  id uuid,
  email text,
  email_confirmed_at timestamptz,
  created_at timestamptz
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
  SELECT 
    id::uuid,
    email::text,
    email_confirmed_at,
    created_at
  FROM auth.users
  WHERE auth.users.email = user_email;
$$;

-- Предоставляем права на выполнение
GRANT EXECUTE ON FUNCTION get_user_by_email(text) TO anon;
GRANT EXECUTE ON FUNCTION get_user_by_email(text) TO authenticated;
