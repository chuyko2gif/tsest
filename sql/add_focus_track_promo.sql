-- Добавление поля focus_track_promo для промо-текста фокус-трека
-- Запустите этот SQL в Supabase Dashboard → SQL Editor

-- Добавить колонку в releases_exclusive
ALTER TABLE releases_exclusive 
ADD COLUMN IF NOT EXISTS focus_track_promo TEXT;

-- Добавить колонку в releases_basic
ALTER TABLE releases_basic 
ADD COLUMN IF NOT EXISTS focus_track_promo TEXT;

-- Проверить результат
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'releases_exclusive' 
  AND column_name = 'focus_track_promo';

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'releases_basic' 
  AND column_name = 'focus_track_promo';
