-- ПРОВЕРКА RLS (Row Level Security) ПОЛИТИК

-- 1. Проверить включен ли RLS на таблицах
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('support_tickets', 'ticket_messages', 'profiles');

-- 2. Показать все политики на support_tickets
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('support_tickets', 'ticket_messages')
ORDER BY tablename, policyname;

-- 3. ВРЕМЕННОЕ РЕШЕНИЕ: Отключить RLS для тестирования
ALTER TABLE support_tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages DISABLE ROW LEVEL SECURITY;

-- ВАЖНО: После проверки включи обратно:
-- ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
