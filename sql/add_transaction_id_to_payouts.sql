-- Добавляем колонку transaction_id в таблицу payouts
-- Это поле будет хранить UUID транзакции, связанной с выплатой

ALTER TABLE payouts
ADD COLUMN IF NOT EXISTS transaction_id UUID;

-- Добавляем внешний ключ на таблицу transactions
ALTER TABLE payouts
ADD CONSTRAINT fk_payouts_transaction
FOREIGN KEY (transaction_id) 
REFERENCES transactions(id)
ON DELETE SET NULL;

-- Создаём индекс для быстрого поиска по transaction_id
CREATE INDEX IF NOT EXISTS idx_payouts_transaction_id ON payouts(transaction_id);

-- Комментарий к колонке
COMMENT ON COLUMN payouts.transaction_id IS 'UUID транзакции, связанной с этой выплатой';
