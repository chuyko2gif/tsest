-- ========================================
-- СОЗДАНИЕ STORAGE BUCKETS В SUPABASE
-- ========================================
-- ВЫПОЛНИТЬ В SQL EDITOR В SUPABASE DASHBOARD
-- https://supabase.com/dashboard/project/[PROJECT_ID]/sql

-- ========================================
-- 1. СОЗДАТЬ BUCKET ДЛЯ АВАТАРОК
-- ========================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars', 
  true,  -- публичный доступ
  5242880,  -- 5MB лимит
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- ========================================
-- 2. СОЗДАТЬ BUCKET ДЛЯ КАРТИНОК НОВОСТЕЙ
-- ========================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'news-images',
  'news-images',
  true,  -- публичный доступ
  10485760,  -- 10MB лимит
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- ========================================
-- 3. СОЗДАТЬ BUCKET ДЛЯ ВЛОЖЕНИЙ ТИКЕТОВ
-- ========================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ticket-attachments',
  'ticket-attachments',
  true,  -- публичный доступ
  10485760,  -- 10MB лимит
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- ========================================
-- 4. СОЗДАТЬ BUCKET ДЛЯ ОБЛОЖЕК РЕЛИЗОВ
-- ========================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'release-covers',
  'release-covers',
  true,  -- публичный доступ
  10485760,  -- 10MB лимит
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- ========================================
-- 5. СОЗДАТЬ BUCKET ДЛЯ ЧЕКОВ ОПЛАТЫ
-- ========================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-receipts',
  'payment-receipts',
  true,  -- публичный доступ
  5242880,  -- 5MB лимит
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- ========================================
-- 3. ПОЛИТИКИ ДЛЯ BUCKET 'avatars'
-- ========================================

-- Удаляем старые политики если есть
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

-- Публичное чтение аватарок
CREATE POLICY "Public read avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Авторизованные пользователи могут загружать аватарки
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Пользователи могут обновлять свои аватарки
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

-- Пользователи могут удалять свои аватарки
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- ========================================
-- 4. ПОЛИТИКИ ДЛЯ BUCKET 'news-images'
-- ========================================

-- Удаляем старые политики если есть
DROP POLICY IF EXISTS "Public read news images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload news images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update news images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete news images" ON storage.objects;

-- Публичное чтение картинок новостей
CREATE POLICY "Public read news images"
ON storage.objects FOR SELECT
USING (bucket_id = 'news-images');

-- Админы и овнеры могут загружать картинки новостей
CREATE POLICY "Admins can upload news images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'news-images' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'admin' OR profiles.role = 'owner')
  )
);

-- Админы и овнеры могут обновлять картинки новостей
CREATE POLICY "Admins can update news images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'news-images' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'admin' OR profiles.role = 'owner')
  )
);

-- Админы и овнеры могут удалять картинки новостей
CREATE POLICY "Admins can delete news images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'news-images' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'admin' OR profiles.role = 'owner')
  )
);

-- ========================================
-- 5. ПОЛИТИКИ ДЛЯ BUCKET 'ticket-attachments'
-- ========================================

-- Удаляем старые политики если есть
DROP POLICY IF EXISTS "Public read ticket attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload ticket attachments" ON storage.objects;

-- Публичное чтение вложений тикетов
CREATE POLICY "Public read ticket attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'ticket-attachments');

-- Авторизованные пользователи могут загружать вложения
CREATE POLICY "Users can upload ticket attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ticket-attachments');

-- ========================================
-- 6. ПОЛИТИКИ ДЛЯ BUCKET 'release-covers'
-- ========================================

-- Удаляем старые политики если есть
DROP POLICY IF EXISTS "Public read release covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload release covers" ON storage.objects;

-- Публичное чтение обложек релизов
CREATE POLICY "Public read release covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'release-covers');

-- Авторизованные пользователи могут загружать обложки
CREATE POLICY "Users can upload release covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'release-covers');

-- ========================================
-- 7. ПОЛИТИКИ ДЛЯ BUCKET 'payment-receipts'
-- ========================================

-- Удаляем старые политики если есть
DROP POLICY IF EXISTS "Admins read payment receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload payment receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users read own payment receipts" ON storage.objects;

-- Админы могут просматривать все чеки
CREATE POLICY "Admins read payment receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-receipts' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'admin' OR profiles.role = 'owner')
  )
);

-- Пользователи могут загружать свои чеки
CREATE POLICY "Users can upload payment receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payment-receipts');

-- Пользователи могут просматривать свои чеки
CREATE POLICY "Users read own payment receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-receipts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ========================================
-- ПРОВЕРКА
-- ========================================
SELECT id, name, public, file_size_limit FROM storage.buckets;

-- ========================================
-- ЕСЛИ ЕСТЬ ОШИБКИ С ПОЛИТИКАМИ:
-- Попробуй создать бакеты вручную через UI:
-- 
-- 1. Перейди: Supabase Dashboard → Storage
-- 2. Нажми "New bucket"
-- 3. Создай bucket "avatars" с галочкой "Public"
-- 4. Создай bucket "news-images" с галочкой "Public"
-- 5. Создай bucket "ticket-attachments" с галочкой "Public"
-- ========================================
