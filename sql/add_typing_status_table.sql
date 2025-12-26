-- Создаем таблицу для хранения статуса печати
-- Эта таблица хранит кратковременную информацию о том, кто сейчас печатает в тикете

CREATE TABLE IF NOT EXISTS public.typing_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL,
  user_id UUID NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Уникальное ограничение: один пользователь = один статус печати в тикете
  UNIQUE(ticket_id, user_id)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_typing_status_ticket_id ON public.typing_status(ticket_id);
CREATE INDEX IF NOT EXISTS idx_typing_status_last_activity ON public.typing_status(last_activity);

-- Комментарий к таблице
COMMENT ON TABLE public.typing_status IS 'Хранит статус печати пользователей в тикетах. Записи автоматически удаляются после 5 секунд неактивности.';

-- Функция для автоматической очистки старых записей
CREATE OR REPLACE FUNCTION clean_old_typing_status()
RETURNS void AS $$
BEGIN
  DELETE FROM public.typing_status
  WHERE last_activity < NOW() - INTERVAL '5 seconds';
END;
$$ LANGUAGE plpgsql;

-- Примечание: в продакшене лучше настроить cron job для периодической очистки
-- или использовать Redis для хранения кратковременных данных
