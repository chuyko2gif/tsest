-- Добавляем поля для промо-материалов в таблицу releases_exclusive
ALTER TABLE releases_exclusive 
ADD COLUMN IF NOT EXISTS promo_photos TEXT[] DEFAULT '{}';

-- Добавляем поля для промо-материалов в таблицу releases_basic
ALTER TABLE releases_basic 
ADD COLUMN IF NOT EXISTS promo_photos TEXT[] DEFAULT '{}';

-- Проверяем, что колонка focus_track_promo существует в обеих таблицах
ALTER TABLE releases_exclusive 
ADD COLUMN IF NOT EXISTS focus_track_promo TEXT;

ALTER TABLE releases_basic 
ADD COLUMN IF NOT EXISTS focus_track_promo TEXT;

-- Комментарии для документации
COMMENT ON COLUMN releases_exclusive.promo_photos IS 'Массив URL ссылок на промо-фотографии (до 5 штук)';
COMMENT ON COLUMN releases_basic.promo_photos IS 'Массив URL ссылок на промо-фотографии (до 5 штук)';
COMMENT ON COLUMN releases_exclusive.focus_track_promo IS 'Промо-текст для фокус-трека';
COMMENT ON COLUMN releases_basic.focus_track_promo IS 'Промо-текст для фокус-трека';
