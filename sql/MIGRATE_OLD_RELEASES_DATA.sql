-- ============================================
-- МИГРАЦИЯ ДАННЫХ ИЗ СТАРОЙ ТАБЛИЦЫ RELEASES
-- ============================================
-- 
-- ИСПОЛЬЗУЙТЕ ЭТОТ СКРИПТ ТОЛЬКО ЕСЛИ:
-- 1. У вас уже есть данные в таблице "releases"
-- 2. Вы уже выполнили CREATE_SEPARATE_RELEASES_TABLES.sql
-- 3. Вы хотите перенести старые данные в новые таблицы
-- ============================================

-- Проверка существования старой таблицы
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'releases') THEN
    RAISE EXCEPTION 'Таблица "releases" не найдена. Миграция невозможна.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'releases_basic') THEN
    RAISE EXCEPTION 'Таблица "releases_basic" не найдена. Сначала выполните CREATE_SEPARATE_RELEASES_TABLES.sql';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'releases_exclusive') THEN
    RAISE EXCEPTION 'Таблица "releases_exclusive" не найдена. Сначала выполните CREATE_SEPARATE_RELEASES_TABLES.sql';
  END IF;
END $$;

-- ============================================
-- 1. МИГРАЦИЯ BASIC РЕЛИЗОВ
-- ============================================

INSERT INTO releases_basic (
  id, 
  created_at, 
  updated_at, 
  user_id, 
  title, 
  artist_name, 
  cover_url,
  genre, 
  subgenres, 
  release_date, 
  collaborators, 
  tracks, 
  countries,
  contract_agreed, 
  contract_agreed_at, 
  platforms, 
  focus_track, 
  album_description,
  status, 
  status_updated_at, 
  rejection_reason,
  payment_status, 
  payment_amount, 
  payment_receipt_url,
  payment_verified_at, 
  payment_verified_by,
  admin_notes, 
  approved_by, 
  approved_at,
  moderated_by,
  moderated_at
)
SELECT 
  id, 
  created_at, 
  updated_at, 
  user_id, 
  title, 
  COALESCE(artist_name, artist, 'Unknown Artist') as artist_name, 
  cover_url,
  genre, 
  COALESCE(subgenres, '{}') as subgenres, 
  release_date, 
  COALESCE(collaborators, '{}') as collaborators, 
  COALESCE(tracks, '[]'::jsonb) as tracks, 
  COALESCE(countries, '{}') as countries,
  COALESCE(contract_agreed, false) as contract_agreed, 
  contract_agreed_at, 
  COALESCE(platforms, '{}') as platforms, 
  focus_track, 
  album_description,
  COALESCE(status, 'pending') as status, 
  status_updated_at, 
  rejection_reason,
  COALESCE(payment_status, 'pending')::TEXT as payment_status, 
  COALESCE(payment_amount, 500) as payment_amount, 
  payment_receipt_url,
  payment_verified_at, 
  payment_verified_by,
  admin_notes, 
  approved_by, 
  approved_at,
  moderated_by,
  moderated_at
FROM releases
WHERE user_role = 'basic'
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. МИГРАЦИЯ EXCLUSIVE РЕЛИЗОВ
-- ============================================

INSERT INTO releases_exclusive (
  id, 
  created_at, 
  updated_at, 
  user_id, 
  title, 
  artist_name, 
  cover_url,
  genre, 
  subgenres, 
  release_date, 
  collaborators, 
  tracks, 
  countries,
  contract_agreed, 
  contract_agreed_at, 
  platforms, 
  focus_track, 
  album_description,
  status, 
  status_updated_at, 
  rejection_reason,
  admin_notes, 
  approved_by, 
  approved_at,
  moderated_by,
  moderated_at
)
SELECT 
  id, 
  created_at, 
  updated_at, 
  user_id, 
  title, 
  COALESCE(artist_name, artist, 'Unknown Artist') as artist_name, 
  cover_url,
  genre, 
  COALESCE(subgenres, '{}') as subgenres, 
  release_date, 
  COALESCE(collaborators, '{}') as collaborators, 
  COALESCE(tracks, '[]'::jsonb) as tracks, 
  COALESCE(countries, '{}') as countries,
  COALESCE(contract_agreed, false) as contract_agreed, 
  contract_agreed_at, 
  COALESCE(platforms, '{}') as platforms, 
  focus_track, 
  album_description,
  COALESCE(status, 'pending') as status, 
  status_updated_at, 
  rejection_reason,
  admin_notes, 
  approved_by, 
  approved_at,
  moderated_by,
  moderated_at
FROM releases
WHERE user_role = 'exclusive'
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. ПРОВЕРКА РЕЗУЛЬТАТОВ
-- ============================================

-- Подсчет записей
DO $$ 
DECLARE
  old_basic_count INT;
  old_exclusive_count INT;
  new_basic_count INT;
  new_exclusive_count INT;
BEGIN
  -- Считаем старые записи
  SELECT COUNT(*) INTO old_basic_count FROM releases WHERE user_role = 'basic';
  SELECT COUNT(*) INTO old_exclusive_count FROM releases WHERE user_role = 'exclusive';
  
  -- Считаем новые записи
  SELECT COUNT(*) INTO new_basic_count FROM releases_basic;
  SELECT COUNT(*) INTO new_exclusive_count FROM releases_exclusive;
  
  -- Выводим результаты
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'РЕЗУЛЬТАТЫ МИГРАЦИИ:';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Basic релизов в старой таблице: %', old_basic_count;
  RAISE NOTICE 'Basic релизов в новой таблице:  %', new_basic_count;
  RAISE NOTICE '----------------------------------------------';
  RAISE NOTICE 'Exclusive релизов в старой таблице: %', old_exclusive_count;
  RAISE NOTICE 'Exclusive релизов в новой таблице:  %', new_exclusive_count;
  RAISE NOTICE '==============================================';
  
  -- Проверка на несоответствие
  IF old_basic_count != new_basic_count THEN
    RAISE WARNING 'Количество Basic релизов не совпадает! Проверьте данные.';
  END IF;
  
  IF old_exclusive_count != new_exclusive_count THEN
    RAISE WARNING 'Количество Exclusive релизов не совпадает! Проверьте данные.';
  END IF;
END $$;

-- ============================================
-- 4. РЕЗЕРВНОЕ КОПИРОВАНИЕ СТАРОЙ ТАБЛИЦЫ
-- ============================================
-- Переименуем старую таблицу вместо удаления (для безопасности)

-- РАСКОММЕНТИРУЙТЕ ПОСЛЕ ПРОВЕРКИ МИГРАЦИИ:
-- ALTER TABLE releases RENAME TO releases_old_backup;

-- ВНИМАНИЕ! Полное удаление старой таблицы (используйте с осторожностью):
-- DROP TABLE releases CASCADE;

-- ============================================
-- ГОТОВО!
-- ============================================
-- Данные мигрированы в новые таблицы
-- Старая таблица сохранена как резервная копия
