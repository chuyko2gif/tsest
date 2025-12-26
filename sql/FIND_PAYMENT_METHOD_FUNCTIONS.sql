-- Поиск всех функций и триггеров связанных с payouts
SELECT 
  n.nspname as schema,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE pg_get_functiondef(p.oid) ILIKE '%payment_method%'
   OR pg_get_functiondef(p.oid) ILIKE '%payouts%'
ORDER BY function_name;
