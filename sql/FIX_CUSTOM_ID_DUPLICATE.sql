-- =====================================================
-- FIX: Исправление дубликатов custom_id
-- Проблема: race condition при одновременном создании релизов
-- Решение: использование SEQUENCE для гарантированной уникальности
-- =====================================================

-- ШАГ 1: Создаём sequence для генерации уникальных номеров
DROP SEQUENCE IF EXISTS release_custom_id_seq;

-- Находим максимальный существующий номер
DO $$
DECLARE
  max_num INTEGER := 0;
  tmp_num INTEGER;
BEGIN
  -- Ищем макс в releases_basic
  SELECT COALESCE(MAX(NULLIF(regexp_replace(custom_id, '^thqrel-', ''), '')::INTEGER), 0)
  INTO tmp_num
  FROM releases_basic WHERE custom_id ~ '^thqrel-[0-9]+$';
  IF tmp_num > max_num THEN max_num := tmp_num; END IF;
  
  -- Ищем макс в releases_exclusive
  SELECT COALESCE(MAX(NULLIF(regexp_replace(custom_id, '^thqrel-', ''), '')::INTEGER), 0)
  INTO tmp_num
  FROM releases_exclusive WHERE custom_id ~ '^thqrel-[0-9]+$';
  IF tmp_num > max_num THEN max_num := tmp_num; END IF;
  
  -- Создаём sequence начиная с следующего номера
  EXECUTE format('CREATE SEQUENCE release_custom_id_seq START WITH %s', max_num + 1);
  
  RAISE NOTICE 'Created sequence starting from %', max_num + 1;
END $$;

-- ШАГ 2: Новая функция с использованием sequence (атомарная операция)
CREATE OR REPLACE FUNCTION generate_release_custom_id()
RETURNS TEXT AS $$
BEGIN
  RETURN 'thqrel-' || LPAD(nextval('release_custom_id_seq')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ШАГ 3: Триггерная функция - НЕ перезаписываем существующий custom_id
CREATE OR REPLACE FUNCTION auto_generate_release_custom_id()
RETURNS TRIGGER AS $$
BEGIN
  -- ВАЖНО: Если custom_id уже есть - не трогаем его!
  IF NEW.custom_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Генерируем custom_id только при:
  -- 1. INSERT со статусом pending
  -- 2. UPDATE из draft в pending
  IF (TG_OP = 'INSERT' AND NEW.status = 'pending') OR
     (TG_OP = 'UPDATE' AND OLD.status = 'draft' AND NEW.status = 'pending') THEN
    NEW.custom_id := generate_release_custom_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ШАГ 4: Пересоздаём триггеры
DROP TRIGGER IF EXISTS auto_custom_id_basic ON releases_basic;
CREATE TRIGGER auto_custom_id_basic BEFORE INSERT OR UPDATE ON releases_basic
  FOR EACH ROW EXECUTE FUNCTION auto_generate_release_custom_id();

DROP TRIGGER IF EXISTS auto_custom_id_exclusive ON releases_exclusive;
CREATE TRIGGER auto_custom_id_exclusive BEFORE INSERT OR UPDATE ON releases_exclusive
  FOR EACH ROW EXECUTE FUNCTION auto_generate_release_custom_id();

-- ШАГ 5: Проверка
SELECT 'Sequence created. Next value will be: ' || last_value as status 
FROM release_custom_id_seq;
