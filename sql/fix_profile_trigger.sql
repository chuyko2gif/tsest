-- Исправляем триггер для автоматического создания профиля при регистрации
-- Этот триггер создаёт профиль с nickname, member_id, telegram и balance

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_member_id TEXT;
BEGIN
  -- Генерируем уникальный member_id
  new_member_id := 'THQ-' || LPAD(FLOOR(1000 + RANDOM() * 9000)::TEXT, 4, '0');
  
  -- Создаём профиль с полными данными
  INSERT INTO public.profiles (id, email, nickname, telegram, member_id, role, balance, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'nickname',
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'telegram',
    new_member_id,
    'basic', -- роль по умолчанию
    0, -- начальный баланс
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nickname = COALESCE(profiles.nickname, EXCLUDED.nickname),
    telegram = COALESCE(profiles.telegram, EXCLUDED.telegram),
    member_id = COALESCE(profiles.member_id, EXCLUDED.member_id),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Пересоздаём триггер
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
