-- ==============================================================
-- ОЧИСТКА ОТКЛОНЕННЫХ ЗАЯВОК НА ВЫВОД
-- ==============================================================
-- Этот скрипт удалит все отклоненные заявки на вывод средств
-- Выполните его в SQL Editor Supabase
-- ==============================================================

-- 1. ПОКАЗЫВАЕМ СКОЛЬКО ЗАЯВОК БУДЕТ УДАЛЕНО
SELECT 
  '⚠️ БУДЕТ УДАЛЕНО:' as status,
  COUNT(*) as rejected_count,
  SUM(amount) as total_amount
FROM withdrawal_requests
WHERE status = 'rejected';

-- 2. УДАЛЯЕМ ВСЕ ОТКЛОНЕННЫЕ ЗАЯВКИ
DELETE FROM withdrawal_requests 
WHERE status = 'rejected';

-- 3. ПРОВЕРКА - ПОКАЗЫВАЕМ ОСТАВШИЕСЯ ЗАЯВКИ
SELECT 
  '✅ ОЧИСТКА ЗАВЕРШЕНА!' as status,
  COUNT(*) as total_remaining,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count
FROM withdrawal_requests;

-- 4. ПОКАЗЫВАЕМ СТАТИСТИКУ ПО ВСЕМ ЗАЯВКАМ
SELECT 
  status,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM withdrawal_requests
GROUP BY status
ORDER BY 
  CASE status
    WHEN 'pending' THEN 1
    WHEN 'approved' THEN 2
    WHEN 'completed' THEN 3
    ELSE 4
  END;
