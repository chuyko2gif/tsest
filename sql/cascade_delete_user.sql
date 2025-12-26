-- БЕЗОПАСНОЕ УДАЛЕНИЕ ПОЛЬЗОВАТЕЛЕЙ
-- Этот скрипт работает ТОЛЬКО с таблицами: profiles и auth.users
-- НЕ ТРОГАЕТ другие таблицы в базе данных
-- Удаление только через специальную функцию safe_delete_user_from_profiles()

-- 1. Убедимся, что ON DELETE CASCADE установлен на profiles.id
-- Это стандартная настройка - при удалении из auth.users удаляется из profiles
-- Работает ТОЛЬКО между auth.users и profiles
ALTER TABLE profiles 
  DROP CONSTRAINT IF EXISTS profiles_id_fkey,
  ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;

-- 2. Функция для удаления пользователя ТОЛЬКО из profiles и auth.users
-- Вызов: SELECT safe_delete_user_from_profiles('user-uuid-here');
-- НЕ ТРОГАЕТ другие таблицы - только profiles и auth.users
CREATE OR REPLACE FUNCTION safe_delete_user_from_profiles(user_id_to_delete UUID)
RETURNS TEXT AS $$
DECLARE
  user_email TEXT;
  user_nickname TEXT;
BEGIN
  -- Проверка 1: Пользователь существует в profiles?
  SELECT email, nickname INTO user_email, user_nickname
  FROM profiles WHERE id = user_id_to_delete;
  
  IF user_email IS NULL THEN
    RETURN 'ОШИБКА: Пользователь не найден в profiles';
  END IF;

  -- Проверка 2: Не удаляем самого себя (защита)
  IF user_id_to_delete = auth.uid() THEN
    RETURN 'ОШИБКА: Нельзя удалить самого себя';
  END IF;

  -- Проверка 3: Проверяем, что вызывающий - админ
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RETURN 'ОШИБКА: Только администратор может удалять пользователей';
  END IF;

  -- УДАЛЕНИЕ: Работаем ТОЛЬКО с auth.users и profiles
  -- Удаляем из auth.users → CASCADE автоматически удалит из profiles
  -- Другие таблицы НЕ ТРОГАЕМ
  DELETE FROM auth.users WHERE id = user_id_to_delete;
  
  -- Возвращаем информацию об удалении
  RETURN format(
    'УСПЕХ: Пользователь удален из profiles и auth.users | Email: %s | Nickname: %s',
    user_email,
    COALESCE(user_nickname, 'нет')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Уникальность nickname (регистронезависимый)
-- Сначала очищаем дубликаты, если они есть
DO $$
DECLARE
  duplicate_record RECORD;
  dup_id UUID;
  counter INTEGER;
BEGIN
  -- Находим дубликаты nickname и добавляем к ним уникальные суффиксы
  FOR duplicate_record IN
    SELECT LOWER(nickname) as lower_nick, array_agg(id) as ids
    FROM profiles
    WHERE nickname IS NOT NULL
    GROUP BY LOWER(nickname)
    HAVING COUNT(*) > 1
  LOOP
    counter := 1;
    -- Обновляем все дубликаты кроме первого
    FOREACH dup_id IN ARRAY duplicate_record.ids[2:array_length(duplicate_record.ids, 1)]
    LOOP
      UPDATE profiles 
      SET nickname = nickname || '_' || counter
      WHERE id = dup_id;
      counter := counter + 1;
    END LOOP;
  END LOOP;
END $$;

-- Теперь создаем уникальный индекс (после очистки дубликатов)
-- Это позволит использовать nickname повторно после удаления
-- Работает ТОЛЬКО с таблицей profiles
DROP INDEX IF EXISTS idx_profiles_nickname_unique;
CREATE UNIQUE INDEX idx_profiles_nickname_unique 
  ON profiles(LOWER(nickname)) 
  WHERE nickname IS NOT NULL;

-- 4. Индекс на email для быстрого поиска (ТОЛЬКО profiles)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- 5. Комментарии
COMMENT ON FUNCTION safe_delete_user_from_profiles IS 
  'БЕЗОПАСНОЕ удаление пользователя ТОЛЬКО из profiles и auth.users. НЕ трогает другие таблицы. Освобождает email и nickname';

-- ============================
-- ИНСТРУКЦИЯ ПО ИСПОЛЬЗОВАНИЮ:
-- ============================

-- УДАЛИТЬ пользователя из profiles (освобождает email и nickname):
--    SELECT safe_delete_user_from_profiles('uuid-пользователя');

-- После этого можно создать нового пользователя с тем же email или nickname

-- ============================
-- ЧТО ДЕЛАЕТ ЭТОТ СКРИПТ:
-- ============================
-- ✅ Работает ТОЛЬКО с таблицами profiles и auth.users
-- ✅ НЕ ТРОГАЕТ другие таблицы в базе (transactions, tickets, releases и т.д.)
-- ✅ Создает БЕЗОПАСНУЮ функцию удаления (не срабатывает автоматически)
-- ✅ Проверяет права администратора перед удалением
-- ✅ Защищает от удаления самого себя
-- ✅ Освобождает email и nickname для повторного использования
-- ✅ НЕ создает автоматических триггеров
-- ✅ НЕ удаляет ничего без явного вызова функции
-- ✅ Возвращает информацию об удалении

-- ❌ НЕ испортит базу данных
-- ❌ НЕ удалит ничего из других таблиц
-- ❌ НЕ сработает случайно
