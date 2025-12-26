-- ==============================================================
-- ОБНУЛЕНИЕ ВСЕХ БАЛАНСОВ И ОЧИСТКА ФИНАНСОВОЙ ИСТОРИИ
-- ==============================================================

-- ⚠️ ВНИМАНИЕ: Этот скрипт УДАЛИТ ВСЕ финансовые данные!
-- Используйте только в случае необходимости полного сброса системы

BEGIN;

-- 1. Отключаем триггеры временно, чтобы избежать конфликтов
ALTER TABLE withdrawal_requests DISABLE TRIGGER ALL;
ALTER TABLE payouts DISABLE TRIGGER ALL;

-- 2. Удаляем все транзакции (если таблица существует)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transactions') THEN
    DELETE FROM transactions;
    RAISE NOTICE '✓ Транзакции удалены';
  END IF;
END $$;

-- 3. Удаляем все заявки на вывод
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'withdrawal_requests') THEN
    DELETE FROM withdrawal_requests;
    RAISE NOTICE '✓ Заявки на вывод удалены';
  END IF;
END $$;

-- 4. Удаляем все выплаты
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payouts') THEN
    DELETE FROM payouts;
    RAISE NOTICE '✓ Выплаты удалены';
  END IF;
END $$;

-- 5. Обнуляем балансы всех пользователей
DO $$
BEGIN
  UPDATE profiles 
  SET balance = 0;
  RAISE NOTICE '✓ Балансы обнулены';
END $$;

-- 6. Включаем триггеры обратно
ALTER TABLE withdrawal_requests ENABLE TRIGGER ALL;
ALTER TABLE payouts ENABLE TRIGGER ALL;

-- 6. Включаем триггеры обратно
ALTER TABLE withdrawal_requests ENABLE TRIGGER ALL;
ALTER TABLE payouts ENABLE TRIGGER ALL;

-- 7. Показываем результат
SELECT 
  COUNT(*) as total_users,
  SUM(balance) as total_balance,
  AVG(balance) as avg_balance
FROM profiles;

-- 8. Статистика по очистке
SELECT 
  '✅ Система финансов успешно сброшена!' as status,
  (SELECT COUNT(*) FROM profiles) as users_reset,
  (SELECT COUNT(*) FROM payouts) as payouts_remaining,
  (SELECT COUNT(*) FROM withdrawal_requests) as withdrawals_remaining,
  (SELECT COUNT(*) FROM transactions) as transactions_remaining;

COMMIT;

-- Проверка: все балансы должны быть 0
SELECT 
  email,
  nickname,
  balance,
  role
FROM profiles
WHERE balance != 0
ORDER BY balance DESC;

-- Если запрос выше вернул строки - есть проблема!
