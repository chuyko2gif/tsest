-- ============================================
-- STORAGE ПОЛИТИКИ ДЛЯ ОБЛОЖЕК ЧЕРНОВИКОВ
-- ============================================

-- Политика для загрузки обложек черновиков
-- Пользователи могут загружать файлы в свою папку drafts/
CREATE POLICY "Users can upload draft covers"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'release-covers' 
  AND (storage.foldername(name))[1] = 'drafts'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Политика для обновления обложек черновиков
-- Пользователи могут обновлять файлы в своей папке drafts/
CREATE POLICY "Users can update draft covers"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'release-covers' 
  AND (storage.foldername(name))[1] = 'drafts'
  AND (storage.foldername(name))[2] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'release-covers' 
  AND (storage.foldername(name))[1] = 'drafts'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Политика для чтения обложек черновиков
-- Пользователи могут читать файлы из своей папки drafts/
CREATE POLICY "Users can read own draft covers"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'release-covers' 
  AND (
    (storage.foldername(name))[1] = 'drafts'
    AND (storage.foldername(name))[2] = auth.uid()::text
  )
);

-- Политика для удаления обложек черновиков
-- Пользователи могут удалять файлы из своей папки drafts/
CREATE POLICY "Users can delete draft covers"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'release-covers' 
  AND (storage.foldername(name))[1] = 'drafts'
  AND (storage.foldername(name))[2] = auth.uid()::text
);
