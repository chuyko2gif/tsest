-- Добавить категорию в тикеты
ALTER TABLE support_tickets 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

-- Добавить комментарий
COMMENT ON COLUMN support_tickets.category IS 'Категория тикета: general, problem, payout, account, releases, other';

-- Обновить существующие тикеты
UPDATE support_tickets 
SET category = 'general' 
WHERE category IS NULL;
