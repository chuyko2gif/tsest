-- ==============================================
-- СИСТЕМА ПОДДЕРЖКИ В РЕАЛЬНОМ ВРЕМЕНИ (POLLING)
-- ==============================================
-- Полная переработка системы тикетов с уведомлениями

-- 1. Удаляем старую таблицу если существует
DROP TABLE IF EXISTS public.ticket_messages CASCADE;
DROP TABLE IF EXISTS public.support_tickets CASCADE;

-- 2. Создаем новую таблицу тикетов
CREATE TABLE public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    priority VARCHAR(20) DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_admin_message_at TIMESTAMP WITH TIME ZONE,
    user_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    admin_read_at TIMESTAMP WITH TIME ZONE,
    has_unread_admin_reply BOOLEAN DEFAULT FALSE,
    
    CONSTRAINT status_check CHECK (status IN ('open', 'in_progress', 'closed', 'pending')),
    CONSTRAINT priority_check CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
);

-- 3. Создаем таблицу сообщений
CREATE TABLE public.ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Массив URL изображений (только изображения!)
    images TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- 4. Создаем таблицу для хранения изображений (bucket будет называться 'support-images')
-- Настройки бакета нужно сделать в Supabase UI:
-- Bucket name: support-images
-- Public: false
-- Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
-- Max file size: 5MB

-- 5. Индексы для быстрого поиска
CREATE INDEX idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_updated_at ON public.support_tickets(updated_at DESC);
CREATE INDEX idx_support_tickets_unread ON public.support_tickets(user_id, has_unread_admin_reply) WHERE has_unread_admin_reply = TRUE;
CREATE INDEX idx_ticket_messages_ticket_id ON public.ticket_messages(ticket_id);
CREATE INDEX idx_ticket_messages_created_at ON public.ticket_messages(created_at DESC);

-- 6. RLS политики для безопасности
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Политики для тикетов
-- Пользователи видят только свои тикеты
CREATE POLICY "Users can view own tickets"
    ON public.support_tickets FOR SELECT
    USING (
        auth.uid() = user_id 
        OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Пользователи могут создавать тикеты
CREATE POLICY "Users can create tickets"
    ON public.support_tickets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Админы могут обновлять тикеты
CREATE POLICY "Admins can update tickets"
    ON public.support_tickets FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Пользователи могут обновлять свои тикеты (только отметку о прочтении)
CREATE POLICY "Users can update own tickets read status"
    ON public.support_tickets FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Политики для сообщений
-- Пользователи видят сообщения своих тикетов
CREATE POLICY "Users can view messages of their tickets"
    ON public.ticket_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.support_tickets 
            WHERE id = ticket_id 
            AND (user_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role = 'admin'
            ))
        )
    );

-- Пользователи могут создавать сообщения в своих тикетах
CREATE POLICY "Users can create messages in their tickets"
    ON public.ticket_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.support_tickets 
            WHERE id = ticket_id AND user_id = auth.uid()
        )
    );

-- Админы могут создавать сообщения в любых тикетах
CREATE POLICY "Admins can create messages"
    ON public.ticket_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 7. Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_support_tickets_timestamp
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_timestamp();

-- 8. Функция для обновления тикета при новом сообщении
CREATE OR REPLACE FUNCTION update_ticket_on_message()
RETURNS TRIGGER AS $$
BEGIN
    -- Обновляем время последнего сообщения
    UPDATE public.support_tickets
    SET 
        last_message_at = NEW.created_at,
        updated_at = NEW.created_at,
        -- Если сообщение от админа, обновляем время последнего сообщения админа
        last_admin_message_at = CASE 
            WHEN NEW.is_admin THEN NEW.created_at 
            ELSE last_admin_message_at 
        END,
        -- Если сообщение от админа, ставим флаг непрочитанного
        has_unread_admin_reply = CASE 
            WHEN NEW.is_admin THEN TRUE 
            ELSE has_unread_admin_reply 
        END,
        -- Если тикет был закрыт и пришло новое сообщение от пользователя, открываем его
        status = CASE 
            WHEN NOT NEW.is_admin AND status = 'closed' THEN 'open'
            ELSE status 
        END
    WHERE id = NEW.ticket_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ticket_on_message
    AFTER INSERT ON public.ticket_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_on_message();

-- 9. Функция для подсчета непрочитанных ответов админа
CREATE OR REPLACE FUNCTION get_unread_admin_replies_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.support_tickets
        WHERE user_id = p_user_id
        AND has_unread_admin_reply = TRUE
        AND status != 'closed'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Функция для отметки тикета как прочитанного пользователем
CREATE OR REPLACE FUNCTION mark_ticket_as_read(p_ticket_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.support_tickets
    SET 
        has_unread_admin_reply = FALSE,
        user_read_at = NOW()
    WHERE id = p_ticket_id
    AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Функция для отметки тикета как прочитанного админом
CREATE OR REPLACE FUNCTION mark_ticket_as_read_by_admin(p_ticket_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.support_tickets
    SET admin_read_at = NOW()
    WHERE id = p_ticket_id
    AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Представление для удобного получения тикетов с последним сообщением
CREATE OR REPLACE VIEW support_tickets_with_latest_message AS
SELECT 
    t.*,
    (
        SELECT json_build_object(
            'id', m.id,
            'message', m.message,
            'is_admin', m.is_admin,
            'created_at', m.created_at,
            'sender_id', m.sender_id
        )
        FROM public.ticket_messages m
        WHERE m.ticket_id = t.id
        ORDER BY m.created_at DESC
        LIMIT 1
    ) as latest_message,
    (
        SELECT COUNT(*)
        FROM public.ticket_messages m
        WHERE m.ticket_id = t.id
    ) as message_count
FROM public.support_tickets t;

-- 13. Создаем storage bucket для изображений (выполнить в Supabase UI или через API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('support-images', 'support-images', false);

-- 14. Политики для storage bucket
-- Пользователи могут загружать изображения в свои папки
CREATE POLICY "Users can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'support-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Пользователи и админы могут просматривать изображения
CREATE POLICY "Users and admins can view images"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'support-images' 
    AND (
        auth.uid()::text = (storage.foldername(name))[1]
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
);

-- Пользователи могут удалять только свои изображения
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'support-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Админы могут удалять любые изображения
CREATE POLICY "Admins can delete any images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'support-images' 
    AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ==============================================
-- ГОТОВО!
-- ==============================================
-- Теперь нужно:
-- 1. Создать bucket 'support-images' в Supabase Storage UI
-- 2. Настроить MIME types: image/jpeg, image/png, image/gif, image/webp
-- 3. Установить max file size: 5MB
-- ==============================================
