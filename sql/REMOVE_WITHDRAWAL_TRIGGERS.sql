-- ==============================================================
-- УДАЛЕНИЕ ТРИГГЕРОВ WITHDRAWAL_REQUESTS
-- ==============================================================
-- Убирает автоматическое списание при создании заявки
-- Теперь списание делается в коде приложения
-- ==============================================================

DROP TRIGGER IF EXISTS trg_withdrawal_request_created ON withdrawal_requests;
DROP TRIGGER IF EXISTS trg_withdrawal_request_updated ON withdrawal_requests;
DROP TRIGGER IF EXISTS log_withdrawal_to_payout ON withdrawal_requests;
DROP TRIGGER IF EXISTS update_balance_on_payout ON payouts;

DROP FUNCTION IF EXISTS on_withdrawal_request_created CASCADE;
DROP FUNCTION IF EXISTS on_withdrawal_request_updated CASCADE;
DROP FUNCTION IF EXISTS log_withdrawal_transaction CASCADE;
DROP FUNCTION IF EXISTS update_user_balance CASCADE;

SELECT '✅ Все триггеры withdrawal_requests и payouts удалены' as status;
SELECT '✅ Теперь списание баланса контролируется только кодом приложения' as note;
