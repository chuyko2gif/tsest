-- ⚡ КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Триггер не должен перезаписывать роли
-- Выполните этот SQL в Supabase Dashboard → SQL Editor

-- 1. УДАЛИТЬ старый триггер и функцию
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Создать НОВУЮ функцию которая НЕ трогает существующие профили
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Создаем профиль только если его еще нет
  INSERT INTO public.profiles (id, email, nickname, member_id, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nickname', SPLIT_PART(NEW.email, '@', 1)),
    'THQ-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
    'basic'  -- Новые пользователи получают basic по умолчанию
  )
  ON CONFLICT (id) DO NOTHING;  -- НЕ обновлять если профиль уже есть!
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Создать триггер заново
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Проверка: показать всех пользователей
SELECT email, nickname, role FROM profiles ORDER BY created_at DESC;

-- ✅ Теперь роли НЕ будут перезаписываться!
