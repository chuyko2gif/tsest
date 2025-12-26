-- Добавить внешние ключи для таблицы support_tickets (если не существуют)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'support_tickets_user_id_fkey'
    ) THEN
        ALTER TABLE support_tickets 
        ADD CONSTRAINT support_tickets_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Добавить внешний ключ для таблицы ticket_messages (если не существует)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ticket_messages_sender_id_fkey'
    ) THEN
        ALTER TABLE ticket_messages 
        ADD CONSTRAINT ticket_messages_sender_id_fkey 
        FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Проверить создание ключей
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table
FROM pg_constraint
WHERE conname LIKE '%support%' OR conname LIKE '%ticket%';

-- ВАЖНО: После выполнения этого SQL перейди в Supabase Dashboard:
-- API Settings -> Schema Cache -> Reload Schema
-- Или подожди 1-2 минуты для автоматического обновления кэша
