-- Добавление кеша информации о пользователе в таблицу support_tickets
-- Это ускоряет запросы и избегает JOIN с profiles при каждом получении тикетов

-- Добавляем поля для кеширования данных пользователя
ALTER TABLE public.support_tickets 
ADD COLUMN IF NOT EXISTS user_email TEXT,
ADD COLUMN IF NOT EXISTS user_nickname TEXT,
ADD COLUMN IF NOT EXISTS user_telegram TEXT,
ADD COLUMN IF NOT EXISTS user_avatar TEXT,
ADD COLUMN IF NOT EXISTS user_role TEXT;

-- Функция для обновления кеша пользователя при создании тикета
CREATE OR REPLACE FUNCTION public.cache_user_info_on_ticket_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Получаем данные пользователя из profiles
    SELECT 
        p.email,
        p.nickname,
        p.telegram,
        p.avatar,
        p.role
    INTO 
        NEW.user_email,
        NEW.user_nickname,
        NEW.user_telegram,
        NEW.user_avatar,
        NEW.user_role
    FROM public.profiles p
    WHERE p.id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создаем триггер для автоматического кеширования при вставке
DROP TRIGGER IF EXISTS cache_user_info_trigger ON public.support_tickets;
CREATE TRIGGER cache_user_info_trigger
    BEFORE INSERT ON public.support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION public.cache_user_info_on_ticket_insert();

-- Обновляем существующие тикеты
UPDATE public.support_tickets st
SET 
    user_email = p.email,
    user_nickname = p.nickname,
    user_telegram = p.telegram,
    user_avatar = p.avatar,
    user_role = p.role
FROM public.profiles p
WHERE st.user_id = p.id
AND st.user_email IS NULL;

-- Создаем индекс для быстрого поиска по email и nickname
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_email ON public.support_tickets(user_email);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_nickname ON public.support_tickets(user_nickname);
