-- Проверка структуры таблицы releases
-- Выполните этот запрос в Supabase SQL Editor

-- 1. Проверка существования таблицы и её столбцов
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'releases'
ORDER BY 
    ordinal_position;

-- 2. Проверка политик RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM 
    pg_policies
WHERE 
    tablename = 'releases';

-- 3. Проверка включения RLS
SELECT 
    tablename,
    rowsecurity
FROM 
    pg_tables
WHERE 
    tablename = 'releases';
