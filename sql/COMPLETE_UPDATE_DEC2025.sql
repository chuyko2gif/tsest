-- ============================================
-- 🎯 THQ LABEL - ПОЛНОЕ ОБНОВЛЕНИЕ БД (ДЕКАБРЬ 2025)
-- Единый скрипт для всех обновлений
-- Выполните этот скрипт в Supabase SQL Editor
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
-- 3. ПОЛИТИКИ УДАЛЕНИЯ ДЛЯ РЕЛИЗОВ (АДМИНЫ)
-- ============================================

DROP POLICY IF EXISTS "releases_basic_delete_admin" ON releases_basic;
CREATE POLICY "releases_basic_delete_admin" ON releases_basic FOR DELETE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

DROP POLICY IF EXISTS "releases_exclusive_delete_admin" ON releases_exclusive;
CREATE POLICY "releases_exclusive_delete_admin" ON releases_exclusive FOR DELETE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));


-- ============================================
-- 4. ПОЛИТИКИ ДЛЯ РЕАКЦИЙ НА СООБЩЕНИЯ
-- ============================================

-- Удаляем все старые политики
DROP POLICY IF EXISTS "Users can view reactions on own ticket messages" ON ticket_message_reactions;
DROP POLICY IF EXISTS "Users can add reactions on own ticket messages" ON ticket_message_reactions;
DROP POLICY IF EXISTS "Users can delete own reactions" ON ticket_message_reactions;
DROP POLICY IF EXISTS "Admins can view all reactions" ON ticket_message_reactions;
DROP POLICY IF EXISTS "Admins can add reactions" ON ticket_message_reactions;
DROP POLICY IF EXISTS "Admins can delete own reactions" ON ticket_message_reactions;
DROP POLICY IF EXISTS "Anyone can view reactions" ON ticket_message_reactions;
DROP POLICY IF EXISTS "Authenticated can add reactions" ON ticket_message_reactions;
DROP POLICY IF EXISTS "Users can delete their reactions" ON ticket_message_reactions;

-- Все авторизованные пользователи могут видеть все реакции
CREATE POLICY "Anyone can view reactions" ON ticket_message_reactions
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Все авторизованные пользователи могут добавлять реакции (от своего имени)
CREATE POLICY "Authenticated can add reactions" ON ticket_message_reactions
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Пользователи могут удалять только свои реакции
CREATE POLICY "Users can delete their reactions" ON ticket_message_reactions
FOR DELETE USING (auth.uid() = user_id);


-- ============================================
-- 5. ОБНОВЛЕНИЕ СУЩЕСТВУЮЩИХ РЕЛИЗОВ (CUSTOM_ID)
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
-- 6. RLS ПОЛИТИКИ ДЛЯ RELEASES (ОСНОВНЫЕ)
-- ============================================

-- Убеждаемся что RLS включен
ALTER TABLE releases_basic ENABLE ROW LEVEL SECURITY;
ALTER TABLE releases_exclusive ENABLE ROW LEVEL SECURITY;

-- Политики для releases_basic
DROP POLICY IF EXISTS "releases_basic_select" ON releases_basic;
CREATE POLICY "releases_basic_select" ON releases_basic FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
  );

DROP POLICY IF EXISTS "releases_basic_insert" ON releases_basic;
CREATE POLICY "releases_basic_insert" ON releases_basic FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "releases_basic_update" ON releases_basic;
CREATE POLICY "releases_basic_update" ON releases_basic FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
  );

DROP POLICY IF EXISTS "releases_basic_delete_own" ON releases_basic;
CREATE POLICY "releases_basic_delete_own" ON releases_basic FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND status = 'draft');

-- Политики для releases_exclusive
DROP POLICY IF EXISTS "releases_exclusive_select" ON releases_exclusive;
CREATE POLICY "releases_exclusive_select" ON releases_exclusive FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
  );

DROP POLICY IF EXISTS "releases_exclusive_insert" ON releases_exclusive;
CREATE POLICY "releases_exclusive_insert" ON releases_exclusive FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "releases_exclusive_update" ON releases_exclusive;
CREATE POLICY "releases_exclusive_update" ON releases_exclusive FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
  );

DROP POLICY IF EXISTS "releases_exclusive_delete_own" ON releases_exclusive;
CREATE POLICY "releases_exclusive_delete_own" ON releases_exclusive FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND status = 'draft');


-- ============================================
-- 7. ПРОВЕРКА РЕЗУЛЬТАТОВ
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ ОБНОВЛЕНИЕ БАЗЫ ДАННЫХ ЗАВЕРШЕНО';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Что было сделано:';
  RAISE NOTICE '  • custom_id (thqrel-XXXX) - автоматическая генерация';
  RAISE NOTICE '  • is_promo_skipped - флаг пропуска промо';
  RAISE NOTICE '  • Политики удаления для админов';
  RAISE NOTICE '  • Политики для реакций на сообщения';
  RAISE NOTICE '  • Полные RLS политики для релизов';
  RAISE NOTICE '  • Существующие релизы обновлены';
  RAISE NOTICE '';
END $$;

-- Выводим статистику
SELECT 
  'releases_basic' as table_name,
  COUNT(*) as total,
  COUNT(custom_id) as with_custom_id
FROM releases_basic
UNION ALL
SELECT 
  'releases_exclusive',
  COUNT(*),
  COUNT(custom_id)
FROM releases_exclusive;
