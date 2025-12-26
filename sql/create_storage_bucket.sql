-- Создание Storage Bucket для обложек релизов
-- Дата: 26.12.2025

-- ============================================
-- СОЗДАНИЕ BUCKET 'releases'
-- ============================================

-- Создаем bucket если не существует
INSERT INTO storage.buckets (id, name, public)
VALUES ('releases', 'releases', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- ПОЛИТИКИ ДОСТУПА ДЛЯ STORAGE
-- ============================================

-- Удаляем старые политики
DROP POLICY IF EXISTS "Users can upload to releases bucket" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read releases" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- Политика: Пользователи могут загружать файлы в bucket releases
CREATE POLICY "Users can upload to releases bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'releases');

-- Политика: Все могут читать файлы из bucket
CREATE POLICY "Anyone can read releases"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'releases');

-- Политика: Пользователи могут обновлять свои файлы
CREATE POLICY "Users can update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'releases');

-- Политика: Пользователи могут удалять свои файлы
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'releases');

-- ============================================
-- ПРОВЕРКА
-- ============================================

-- Показываем созданный bucket
SELECT * FROM storage.buckets WHERE id = 'releases';

-- Показываем политики для storage
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
ORDER BY policyname;
