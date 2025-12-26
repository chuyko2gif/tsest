-- ИСПРАВЛЕНИЕ КАСКАДНОГО УДАЛЕНИЯ В ОБЕ СТОРОНЫ
-- Проблема: При удалении из profiles, пользователь остается в auth.users
-- Решение: Триггер для удаления из auth.users при удалении из profiles

-- 1. Функция для удаления из auth.users при удалении из profiles
CREATE OR REPLACE FUNCTION delete_auth_user_on_profile_delete()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Удаляем пользователя из auth.users
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

-- 2. Создаем триггер (удаляем старый если есть)
DROP TRIGGER IF EXISTS on_profile_delete_cascade_to_auth ON profiles;

CREATE TRIGGER on_profile_delete_cascade_to_auth
  BEFORE DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION delete_auth_user_on_profile_delete();

-- 3. Убедимся что в обратную сторону тоже работает
-- (auth.users -> profiles должно быть CASCADE)
ALTER TABLE profiles 
  DROP CONSTRAINT IF EXISTS profiles_id_fkey,
  ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;

-- КОММЕНТАРИЙ:
-- Теперь удаление работает в обе стороны:
-- - DELETE FROM auth.users → автоматически удаляет из profiles (CASCADE)
-- - DELETE FROM profiles → автоматически удаляет из auth.users (TRIGGER)
-- 
-- После удаления email и nickname будут полностью свободны для повторной регистрации
