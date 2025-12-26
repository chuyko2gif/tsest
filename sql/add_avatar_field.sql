-- ========================================
-- ДОБАВЛЕНИЕ АВАТАРОК ПОЛЬЗОВАТЕЛЕЙ
-- ========================================
-- Этот скрипт добавляет возможность загружать аватарки для пользователей

-- ШАГ 1: Добавляем колонку avatar в таблицу profiles
-- Здесь будет храниться ссылка на аватарку пользователя
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'avatar'
  ) THEN
    ALTER TABLE profiles ADD COLUMN avatar TEXT;
    RAISE NOTICE 'Колонка avatar добавлена в таблицу profiles';
  ELSE
    RAISE NOTICE 'Колонка avatar уже существует';
  END IF;
END $$;

-- ШАГ 2: Создаём bucket для хранения аватарок в Supabase Storage
-- Выполните эту команду в Supabase Dashboard:
-- Storage → Create bucket → Name: "avatars" → Public bucket: Yes

-- ШАГ 3: Настраиваем политики для bucket avatars
-- После создания bucket вставьте эти политики в Storage Policies:

-- Политика 1: Все могут читать аватарки
-- CREATE POLICY "Public avatars read"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'avatars');

-- Политика 2: Авторизованные пользователи могут загружать свои аватарки
-- CREATE POLICY "Users can upload own avatar"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Политика 3: Пользователи могут удалять свои аватарки
-- CREATE POLICY "Users can delete own avatar"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Политика 4: Админы могут загружать любые аватарки
-- CREATE POLICY "Admins can upload any avatar"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (
--   bucket_id = 'avatars' AND
--   EXISTS (
--     SELECT 1 FROM profiles
--     WHERE profiles.id = auth.uid()
--     AND profiles.role = 'admin'
--   )
-- );

-- ========================================
-- ПРОВЕРКА
-- ========================================

-- Проверяем что колонка avatar добавлена
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'avatar';

-- Показываем всех пользователей с их аватарками
SELECT 
  email,
  nickname,
  role,
  avatar,
  CASE 
    WHEN avatar IS NOT NULL THEN '✓ Есть аватарка'
    ELSE '✗ Нет аватарки'
  END as avatar_status
FROM profiles
ORDER BY created_at DESC;
