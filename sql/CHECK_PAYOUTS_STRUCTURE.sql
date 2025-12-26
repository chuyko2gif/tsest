-- Проверка структуры таблицы payouts
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'payouts'
ORDER BY ordinal_position;
