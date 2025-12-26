-- Добавление поля release_id в таблицу support_tickets
-- Позволяет привязывать тикеты к релизам из обеих таблиц (releases_basic и releases_exclusive)

-- Сначала удаляем старый constraint если он существует
ALTER TABLE public.support_tickets 
DROP CONSTRAINT IF EXISTS support_tickets_release_id_fkey;

-- Добавляем поле для ID релиза (без foreign key, так как релизы в двух таблицах)
ALTER TABLE public.support_tickets 
ADD COLUMN IF NOT EXISTS release_id UUID;

-- Создаем индекс для быстрого поиска тикетов по релизу
CREATE INDEX IF NOT EXISTS idx_support_tickets_release_id ON public.support_tickets(release_id);

-- Добавляем комментарий
COMMENT ON COLUMN support_tickets.release_id IS 'Связь с релизом (из releases_basic или releases_exclusive)';

-- Готово!
SELECT 'release_id успешно добавлен в support_tickets' as result;
