-- ============================================
-- 🎯 THQ LABEL - ДОБАВЛЕНИЕ CUSTOM ID РЕЛИЗОВ
-- Формат: thqrel-0001, thqrel-0002, ...
-- ============================================

-- Добавляем колонку custom_id к обеим таблицам релизов
ALTER TABLE releases_basic 
ADD COLUMN IF NOT EXISTS custom_id TEXT UNIQUE;

ALTER TABLE releases_exclusive 
ADD COLUMN IF NOT EXISTS custom_id TEXT UNIQUE;

-- Создаём sequence для автоинкремента
CREATE SEQUENCE IF NOT EXISTS release_custom_id_seq START 1;

-- Функция для генерации следующего custom_id
CREATE OR REPLACE FUNCTION generate_release_custom_id()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  new_id TEXT;
BEGIN
  -- Получаем максимальный номер из обеих таблиц
  SELECT COALESCE(MAX(num), 0) + 1 INTO next_num
  FROM (
    SELECT NULLIF(regexp_replace(custom_id, '^thqrel-', ''), '')::INTEGER AS num
    FROM releases_basic 
    WHERE custom_id ~ '^thqrel-[0-9]+$'
    UNION ALL
    SELECT NULLIF(regexp_replace(custom_id, '^thqrel-', ''), '')::INTEGER AS num
    FROM releases_exclusive 
    WHERE custom_id ~ '^thqrel-[0-9]+$'
  ) combined;
  
  -- Форматируем с ведущими нулями (минимум 4 цифры)
  new_id := 'thqrel-' || LPAD(next_num::TEXT, 4, '0');
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Триггерная функция для автоматической генерации custom_id
CREATE OR REPLACE FUNCTION auto_generate_release_custom_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Генерируем custom_id только при изменении статуса на 'pending' или при создании с pending
  IF (TG_OP = 'INSERT' AND NEW.status = 'pending' AND NEW.custom_id IS NULL) OR
     (TG_OP = 'UPDATE' AND OLD.status = 'draft' AND NEW.status = 'pending' AND NEW.custom_id IS NULL) THEN
    NEW.custom_id := generate_release_custom_id();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Применяем триггеры к обеим таблицам
DROP TRIGGER IF EXISTS auto_custom_id_basic ON releases_basic;
CREATE TRIGGER auto_custom_id_basic
  BEFORE INSERT OR UPDATE ON releases_basic
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_release_custom_id();

DROP TRIGGER IF EXISTS auto_custom_id_exclusive ON releases_exclusive;
CREATE TRIGGER auto_custom_id_exclusive
  BEFORE INSERT OR UPDATE ON releases_exclusive
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_release_custom_id();

-- Обновляем существующие релизы (даём им custom_id)
DO $$
DECLARE
  r RECORD;
  counter INTEGER := 1;
  new_id TEXT;
BEGIN
  -- Обрабатываем Basic релизы
  FOR r IN 
    SELECT id FROM releases_basic 
    WHERE custom_id IS NULL AND status != 'draft'
    ORDER BY created_at ASC
  LOOP
    new_id := 'thqrel-' || LPAD(counter::TEXT, 4, '0');
    UPDATE releases_basic SET custom_id = new_id WHERE id = r.id;
    counter := counter + 1;
  END LOOP;
  
  -- Обрабатываем Exclusive релизы
  FOR r IN 
    SELECT id FROM releases_exclusive 
    WHERE custom_id IS NULL AND status != 'draft'
    ORDER BY created_at ASC
  LOOP
    new_id := 'thqrel-' || LPAD(counter::TEXT, 4, '0');
    UPDATE releases_exclusive SET custom_id = new_id WHERE id = r.id;
    counter := counter + 1;
  END LOOP;
  
  RAISE NOTICE 'Обновлено % релизов с custom_id', counter - 1;
END $$;

-- Индексы для быстрого поиска по custom_id
CREATE INDEX IF NOT EXISTS idx_releases_basic_custom_id ON releases_basic(custom_id);
CREATE INDEX IF NOT EXISTS idx_releases_exclusive_custom_id ON releases_exclusive(custom_id);

-- ============================================
-- РЕЗУЛЬТАТ:
-- ✅ Колонка custom_id добавлена
-- ✅ Формат: thqrel-0001, thqrel-0002, ...
-- ✅ Автоматическая генерация при отправке на модерацию
-- ✅ Существующие релизы обновлены
-- ============================================
