-- Добавление полей UPC для релизов и ISRC для треков
-- UPC (Universal Product Code) - для релизов
-- ISRC (International Standard Recording Code) - для треков

-- Добавляем поле UPC в таблицу releases_basic (если не существует)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'releases_basic' AND column_name = 'upc'
  ) THEN
    ALTER TABLE releases_basic ADD COLUMN upc TEXT;
    COMMENT ON COLUMN releases_basic.upc IS 'Universal Product Code - уникальный код релиза';
  END IF;
END $$;

-- Добавляем поле UPC в таблицу releases_exclusive (если не существует)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'releases_exclusive' AND column_name = 'upc'
  ) THEN
    ALTER TABLE releases_exclusive ADD COLUMN upc TEXT;
    COMMENT ON COLUMN releases_exclusive.upc IS 'Universal Product Code - уникальный код релиза';
  END IF;
END $$;

-- Проверяем текущую структуру поля tracks
-- Треки хранятся как JSONB массив, ISRC будет добавляться в объект каждого трека
-- Пример структуры трека с ISRC:
-- {
--   "title": "Track Name",
--   "link": "https://...",
--   "lyrics": "...",
--   "language": "Russian",
--   "hasDrugs": false,
--   "version": "Original Mix",
--   "producers": ["Producer Name"],
--   "featuring": ["Artist Name"],
--   "isrc": "USRC17607839"
-- }

-- Информация для разработчиков
COMMENT ON COLUMN releases_basic.tracks IS 'JSONB массив треков. Каждый трек может содержать: title, link, lyrics, language, hasDrugs, version, producers, featuring, isrc (ISRC код трека)';
COMMENT ON COLUMN releases_exclusive.tracks IS 'JSONB массив треков. Каждый трек может содержать: title, link, lyrics, language, hasDrugs, version, producers, featuring, isrc (ISRC код трека)';

-- Добавляем индексы для быстрого поиска по UPC кодам
CREATE INDEX IF NOT EXISTS idx_releases_basic_upc ON releases_basic(upc) WHERE upc IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_releases_exclusive_upc ON releases_exclusive(upc) WHERE upc IS NOT NULL;

-- Проверяем результат
SELECT 
  'releases_basic' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'releases_basic' AND column_name = 'upc'
UNION ALL
SELECT 
  'releases_exclusive' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'releases_exclusive' AND column_name = 'upc';

-- Инструкция по использованию:
-- 
-- 1. UPC код релиза:
--    UPDATE releases_basic SET upc = 'UPC_CODE' WHERE id = 'release_id';
--    UPDATE releases_exclusive SET upc = 'UPC_CODE' WHERE id = 'release_id';
--
-- 2. ISRC код трека (обновление конкретного трека в массиве):
--    -- Получаем текущие треки
--    SELECT tracks FROM releases_basic WHERE id = 'release_id';
--    
--    -- Обновляем трек с индексом 0 (первый трек)
--    UPDATE releases_basic 
--    SET tracks = jsonb_set(
--      tracks, 
--      '{0,isrc}', 
--      '"USRC17607839"'
--    )
--    WHERE id = 'release_id';
--
-- 3. Поиск релиза по UPC:
--    SELECT * FROM releases_basic WHERE upc = 'UPC_CODE';
--    SELECT * FROM releases_exclusive WHERE upc = 'UPC_CODE';
--
-- 4. Поиск трека по ISRC (поиск внутри JSONB):
--    SELECT * FROM releases_basic 
--    WHERE tracks @> '[{"isrc": "USRC17607839"}]';
