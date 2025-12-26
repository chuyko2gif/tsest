-- ==============================================================
-- ВРЕМЕННОЕ ОТКЛЮЧЕНИЕ RLS ДЛЯ ОТЛАДКИ
-- ==============================================================
-- Используй только для тестирования!
-- ==============================================================

-- Отключаем RLS для withdrawal_requests
ALTER TABLE withdrawal_requests DISABLE ROW LEVEL SECURITY;

SELECT '⚠️ RLS для withdrawal_requests отключен!' as status;

-- Проверяем все записи (теперь должны быть видны)
SELECT 
  id,
  user_id,
  amount,
  status,
  bank_name,
  created_at
FROM withdrawal_requests
ORDER BY created_at DESC;

-- Считаем сколько всего записей
SELECT COUNT(*) as total_withdrawals FROM withdrawal_requests;
