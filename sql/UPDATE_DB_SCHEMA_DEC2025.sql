-- ============================================
-- 🎯 THQ LABEL - ОБНОВЛЕНИЕ СХЕМЫ БД (ДЕКАБРЬ 2025)
-- Объединённый скрипт для всех обновлений
-- ============================================

-- ============================================
-- 1. CUSTOM_ID ДЛЯ РЕЛИЗОВ (thqrel-XXXX)
-- ============================================

-- Добавляем колонку custom_id к обеим таблицам релизов
ALTER TABLE releases_basic ADD COLUMN IF NOT EXISTS custom_id TEXT UNIQUE;
ALTER TABLE releases_exclusive ADD COLUMN IF NOT EXISTS custom_id TEXT UNIQUE;

-- Функция для генерации следующего custom_id
CREATE OR REPLACE FUNCTION generate_release_custom_id()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  new_id TEXT;
BEGIN
  SELECT COALESCE(MAX(num), 0) + 1 INTO next_num
  FROM (
    SELECT NULLIF(regexp_replace(custom_id, '^thqrel-', ''), '')::INTEGER AS num
    FROM releases_basic WHERE custom_id ~ '^thqrel-[0-9]+$'
    UNION ALL
    SELECT NULLIF(regexp_replace(custom_id, '^thqrel-', ''), '')::INTEGER AS num
    FROM releases_exclusive WHERE custom_id ~ '^thqrel-[0-9]+$'
  ) combined;
  
  new_id := 'thqrel-' || LPAD(next_num::TEXT, 4, '0');
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Триггерная функция для автоматической генерации custom_id
CREATE OR REPLACE FUNCTION auto_generate_release_custom_id()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'pending' AND NEW.custom_id IS NULL) OR
     (TG_OP = 'UPDATE' AND OLD.status = 'draft' AND NEW.status = 'pending' AND NEW.custom_id IS NULL) THEN
    NEW.custom_id := generate_release_custom_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для автогенерации custom_id
DROP TRIGGER IF EXISTS auto_custom_id_basic ON releases_basic;
CREATE TRIGGER auto_custom_id_basic BEFORE INSERT OR UPDATE ON releases_basic
  FOR EACH ROW EXECUTE FUNCTION auto_generate_release_custom_id();

DROP TRIGGER IF EXISTS auto_custom_id_exclusive ON releases_exclusive;
CREATE TRIGGER auto_custom_id_exclusive BEFORE INSERT OR UPDATE ON releases_exclusive
  FOR EACH ROW EXECUTE FUNCTION auto_generate_release_custom_id();

-- Индексы для custom_id
CREATE INDEX IF NOT EXISTS idx_releases_basic_custom_id ON releases_basic(custom_id);
CREATE INDEX IF NOT EXISTS idx_releases_exclusive_custom_id ON releases_exclusive(custom_id);

-- ============================================
-- 2. IS_PROMO_SKIPPED КОЛОНКА
-- ============================================

ALTER TABLE releases_basic ADD COLUMN IF NOT EXISTS is_promo_skipped BOOLEAN DEFAULT false;
ALTER TABLE releases_exclusive ADD COLUMN IF NOT EXISTS is_promo_skipped BOOLEAN DEFAULT false;

-- ============================================
-- 3. ПОЛИТИКИ УДАЛЕНИЯ ДЛЯ АДМИНОВ
-- ============================================

DROP POLICY IF EXISTS "releases_basic_delete_admin" ON releases_basic;
CREATE POLICY "releases_basic_delete_admin" ON releases_basic FOR DELETE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

DROP POLICY IF EXISTS "releases_exclusive_delete_admin" ON releases_exclusive;
CREATE POLICY "releases_exclusive_delete_admin" ON releases_exclusive FOR DELETE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

-- ============================================
-- 4. ОБНОВЛЕНИЕ СУЩЕСТВУЮЩИХ РЕЛИЗОВ (CUSTOM_ID)
-- ============================================

DO $$
DECLARE
  r RECORD;
  counter INTEGER := 1;
  new_id TEXT;
BEGIN
  FOR r IN 
    SELECT id FROM releases_basic WHERE custom_id IS NULL AND status != 'draft'
    ORDER BY created_at ASC
  LOOP
    new_id := 'thqrel-' || LPAD(counter::TEXT, 4, '0');
    UPDATE releases_basic SET custom_id = new_id WHERE id = r.id;
    counter := counter + 1;
  END LOOP;
  
  FOR r IN 
    SELECT id FROM releases_exclusive WHERE custom_id IS NULL AND status != 'draft'
    ORDER BY created_at ASC
  LOOP
    new_id := 'thqrel-' || LPAD(counter::TEXT, 4, '0');
    UPDATE releases_exclusive SET custom_id = new_id WHERE id = r.id;
    counter := counter + 1;
  END LOOP;
  
  RAISE NOTICE 'Обновлено % релизов с custom_id', counter - 1;
END $$;

-- ============================================
-- ИТОГ:
-- ✅ custom_id (thqrel-XXXX) - автоматическая генерация
-- ✅ is_promo_skipped - флаг пропуска промо
-- ✅ Политики удаления для админов
-- ✅ Существующие релизы обновлены
-- ============================================
