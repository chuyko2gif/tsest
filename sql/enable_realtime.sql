-- ========================================
-- ВКЛЮЧЕНИЕ SUPABASE REALTIME
-- ========================================
-- Выполните этот SQL в Supabase SQL Editor
-- Dashboard → SQL Editor → New query

-- Включаем Realtime для таблицы payouts
ALTER PUBLICATION supabase_realtime ADD TABLE payouts;

-- Включаем Realtime для таблицы ticket_messages  
ALTER PUBLICATION supabase_realtime ADD TABLE ticket_messages;

-- Включаем Realtime для таблицы tickets
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;

-- ========================================
-- ПРОВЕРКА
-- ========================================
-- Проверяем какие таблицы включены в Realtime:
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- ========================================
-- ЕСЛИ ОШИБКА "relation already exists":
-- Это нормально - таблица уже добавлена в Realtime
-- ========================================
