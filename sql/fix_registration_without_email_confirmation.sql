-- Исправляем регистрацию для работы БЕЗ подтверждения email
-- Этот скрипт убирает все блокировки для создания профиля

-- 1. Обновляем RLS политики для profiles - разрешаем создание профиля
DROP POLICY IF EXISTS "Enable insert for own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;

CREATE POLICY "Allow profile creation" ON profiles
  FOR INSERT
  WITH CHECK (true);  -- Разрешаем всем создавать профиль

-- 2. Обновляем триггер для автоматического создания профиля
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_member_id TEXT;
BEGIN
  -- Генерируем уникальный member_id
  new_member_id := 'THQ-' || LPAD(FLOOR(1000 + RANDOM() * 9000)::TEXT, 4, '0');
  
  -- Создаём профиль с полными данными
  INSERT INTO public.profiles (id, email, nickname, member_id, role, balance, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'nickname',
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    new_member_id,
    'basic',
    0,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nickname = COALESCE(profiles.nickname, EXCLUDED.nickname),
    member_id = COALESCE(profiles.member_id, EXCLUDED.member_id),
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Логируем ошибку но не прерываем регистрацию
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Пересоздаём триггер
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Проверяем что таблица profiles имеет правильную структуру
DO $$ 
BEGIN
  -- Проверяем существование столбцов
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='nickname') THEN
    ALTER TABLE profiles ADD COLUMN nickname TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='member_id') THEN
    ALTER TABLE profiles ADD COLUMN member_id TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='balance') THEN
    ALTER TABLE profiles ADD COLUMN balance DECIMAL(12, 2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
    ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'basic';
  END IF;
END $$;

-- 5. Убеждаемся что RLS включен
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 6. Оставляем остальные политики для SELECT и UPDATE
DROP POLICY IF EXISTS "Enable read for all authenticated users" ON profiles;
CREATE POLICY "Enable read for all authenticated users" ON profiles 
  FOR SELECT TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Enable update for own profile" ON profiles;
CREATE POLICY "Enable update for own profile" ON profiles 
  FOR UPDATE TO authenticated 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Enable read for anon users" ON profiles;
CREATE POLICY "Enable read for anon users" ON profiles 
  FOR SELECT TO anon 
  USING (true);

-- Готово! Теперь регистрация должна работать без подтверждения email
