-- =============================================
-- ДОБАВЛЕНИЕ ПОЛЯ cover_url_original
-- Для хранения оригинальной (несжатой) обложки
-- Админ может скачать оригинал, а везде показывается сжатая версия
-- =============================================

-- 1. Добавляем колонку cover_url_original в releases_basic
ALTER TABLE public.releases_basic 
ADD COLUMN IF NOT EXISTS cover_url_original TEXT;

-- 2. Добавляем колонку cover_url_original в releases
ALTER TABLE public.releases 
ADD COLUMN IF NOT EXISTS cover_url_original TEXT;

-- 3. Добавляем колонку cover_url_original в releases_exclusive
ALTER TABLE public.releases_exclusive 
ADD COLUMN IF NOT EXISTS cover_url_original TEXT;

-- 4. Комментарии для документации
COMMENT ON COLUMN releases_basic.cover_url_original IS 'URL оригинальной обложки (без сжатия) для скачивания админом';
COMMENT ON COLUMN releases.cover_url_original IS 'URL оригинальной обложки (без сжатия) для скачивания админом';
COMMENT ON COLUMN releases_exclusive.cover_url_original IS 'URL оригинальной обложки (без сжатия) для скачивания админом';

-- 5. Копируем существующие cover_url в cover_url_original (для старых релизов)
UPDATE releases_basic 
SET cover_url_original = cover_url 
WHERE cover_url IS NOT NULL AND cover_url_original IS NULL;

UPDATE releases 
SET cover_url_original = cover_url 
WHERE cover_url IS NOT NULL AND cover_url_original IS NULL;

UPDATE releases_exclusive 
SET cover_url_original = cover_url 
WHERE cover_url IS NOT NULL AND cover_url_original IS NULL;

-- 6. Проверка
SELECT 
  'releases_basic' as table_name,
  COUNT(*) as total,
  COUNT(cover_url) as with_cover,
  COUNT(cover_url_original) as with_original
FROM releases_basic
UNION ALL
SELECT 
  'releases' as table_name,
  COUNT(*) as total,
  COUNT(cover_url) as with_cover,
  COUNT(cover_url_original) as with_original
FROM releases
UNION ALL
SELECT 
  'releases_exclusive' as table_name,
  COUNT(*) as total,
  COUNT(cover_url) as with_cover,
  COUNT(cover_url_original) as with_original
FROM releases_exclusive;
