-- Добавляем поле email в таблицу profiles (если его нет)
-- Это нужно для поиска по никнейму при восстановлении пароля

DO $$ 
BEGIN
    -- Проверяем, существует ли уже колонка email
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'email'
    ) THEN
        -- Добавляем колонку email
        ALTER TABLE profiles ADD COLUMN email TEXT;
        
        -- Создаем индекс для быстрого поиска
        CREATE INDEX idx_profiles_email ON profiles(email);
        
        -- Обновляем существующие профили, заполняя email из auth.users
        UPDATE profiles p
        SET email = u.email
        FROM auth.users u
        WHERE p.id = u.id AND p.email IS NULL;
        
        RAISE NOTICE 'Колонка email успешно добавлена в таблицу profiles';
    ELSE
        RAISE NOTICE 'Колонка email уже существует в таблице profiles';
    END IF;
END $$;

-- Создаем триггер для автоматического заполнения email при создании профиля
CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
    -- Если email не заполнен, берем его из auth.users
    IF NEW.email IS NULL THEN
        SELECT email INTO NEW.email
        FROM auth.users
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Удаляем старый триггер если существует
DROP TRIGGER IF EXISTS sync_profile_email_trigger ON profiles;

-- Создаем новый триггер
CREATE TRIGGER sync_profile_email_trigger
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_profile_email();

-- Обновляем handle_new_user для заполнения email
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_member_id TEXT;
  random_num INTEGER;
BEGIN
  -- Генерируем уникальный member_id
  LOOP
    random_num := floor(random() * 10000)::INTEGER;
    new_member_id := 'THQ-' || LPAD(random_num::TEXT, 4, '0');
    
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM profiles WHERE member_id = new_member_id
    );
  END LOOP;

  -- Создаем профиль с email
  INSERT INTO profiles (id, nickname, member_id, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(NEW.email, '@', 1)),
    new_member_id,
    NEW.email,  -- Добавляем email из auth.users
    'basic'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    member_id = COALESCE(profiles.member_id, EXCLUDED.member_id),
    nickname = COALESCE(profiles.nickname, EXCLUDED.nickname);

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Ошибка при создании профиля: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON COLUMN profiles.email IS 'Email пользователя для восстановления пароля по никнейму';
