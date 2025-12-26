-- ==============================================================
-- ОЧИСТКА ОТКЛОНЕННЫХ ВЫВОДОВ
-- ==============================================================
-- Быстрое удаление всех отклоненных запросов на вывод
-- ==============================================================

-- Удаляем все отклоненные выводы
DELETE FROM withdrawal_requests WHERE status = 'rejected';

-- Проверка результата
SELECT 
  '✅ ОТКЛОНЕННЫЕ ВЫВОДЫ УДАЛЕНЫ!' as status,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
  COUNT(*) as total_count
FROM withdrawal_requests;

-- Статистика по пользователям
SELECT 
  '📊 СТАТИСТИКА ПО ПОЛЬЗОВАТЕЛЯМ:' as info,
  p.email,
  p.balance,
  COUNT(wr.id) as active_requests,
  COALESCE(SUM(wr.amount), 0) as total_requested_amount
FROM profiles p
LEFT JOIN withdrawal_requests wr ON wr.user_id = p.id
WHERE p.balance > 0 OR EXISTS (SELECT 1 FROM withdrawal_requests WHERE user_id = p.id)
GROUP BY p.id, p.email, p.balance
ORDER BY p.balance DESC;
