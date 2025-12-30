-- Исправление проблемы с непрочитанными уведомлениями
-- Выполните этот скрипт в Supabase SQL Editor

-- 1. СНАЧАЛА СБРОСИМ ВСЕ НЕПРОЧИТАННЫЕ УВЕДОМЛЕНИЯ
UPDATE public.support_tickets SET has_unread_admin_reply = FALSE;

-- 2. Обновляем функцию mark_ticket_as_read
CREATE OR REPLACE FUNCTION mark_ticket_as_read(p_ticket_id UUID)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    -- Обновляем статус только для тикетов этого пользователя
    UPDATE public.support_tickets
    SET 
        has_unread_admin_reply = FALSE,
        user_read_at = NOW()
    WHERE id = p_ticket_id
    AND user_id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Исправляем функцию подсчёта непрочитанных
CREATE OR REPLACE FUNCTION get_unread_admin_replies_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*)::INTEGER INTO v_count
    FROM public.support_tickets
    WHERE user_id = p_user_id
    AND has_unread_admin_reply = TRUE
    AND status != 'closed';
    
    RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Обновляем триггер для автоматической установки has_unread_admin_reply
CREATE OR REPLACE FUNCTION update_ticket_on_message()
RETURNS TRIGGER AS $$
BEGIN
    -- Обновляем last_message_at
    UPDATE public.support_tickets
    SET 
        last_message_at = NEW.created_at,
        updated_at = NEW.created_at,
        -- Если это сообщение от админа - устанавливаем флаг для пользователя
        has_unread_admin_reply = CASE 
            WHEN NEW.is_admin = TRUE THEN TRUE 
            ELSE has_unread_admin_reply 
        END
    WHERE id = NEW.ticket_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Пересоздаём триггер
DROP TRIGGER IF EXISTS trigger_update_ticket_on_message ON public.ticket_messages;

CREATE TRIGGER trigger_update_ticket_on_message
    AFTER INSERT ON public.ticket_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_on_message();

-- 6. Проверка
SELECT 'All notifications cleared and functions updated!' as status;

-- Проверяем что непрочитанных больше нет
SELECT 
    COUNT(*) as total_unread
FROM public.support_tickets
WHERE has_unread_admin_reply = TRUE;
