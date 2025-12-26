-- ============================================
-- СОЗДАНИЕ STORAGE BUCKET ДЛЯ ОБЛОЖЕК РЕЛИЗОВ
-- ============================================

-- 1. Создание bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'release-covers',
  'release-covers',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Политика для загрузки обложек (только авторизованные пользователи)
CREATE POLICY "Users can upload own covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'release-covers' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Политика для просмотра обложек (все могут видеть)
CREATE POLICY "Anyone can view covers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'release-covers');

-- 4. Политика для обновления своих обложек
CREATE POLICY "Users can update own covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'release-covers' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Политика для удаления своих обложек
CREATE POLICY "Users can delete own covers"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'release-covers' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- ГОТОВО!
-- ============================================
-- Bucket 'release-covers' создан и настроен
-- Теперь можно загружать обложки релизов
