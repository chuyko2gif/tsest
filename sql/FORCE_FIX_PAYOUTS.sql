-- ==============================================================
-- ПРИНУДИТЕЛЬНОЕ ИСПРАВЛЕНИЕ ТАБЛИЦЫ PAYOUTS
-- ==============================================================
-- Убирает payment_method и другие лишние поля
-- ==============================================================

BEGIN;

-- Удаляем лишнюю колонку если она есть
ALTER TABLE payouts DROP COLUMN IF EXISTS payment_method CASCADE;
ALTER TABLE payouts DROP COLUMN IF EXISTS status CASCADE;
ALTER TABLE payouts DROP COLUMN IF EXISTS method CASCADE;

-- Проверяем результат
SELECT 
  '✅ Таблица payouts очищена от лишних полей' as status;

SELECT 
  'Текущая структура payouts:' as info,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'payouts'
ORDER BY ordinal_position;

COMMIT;
