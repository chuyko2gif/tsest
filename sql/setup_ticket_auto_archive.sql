-- Настройка автоматической архивации закрытых тикетов через 1 минуту

-- Расширение pg_cron для планирования задач (требует установки в Supabase)
-- В Supabase Dashboard -> Database -> Extensions включите pg_cron

-- Альтернативный вариант: Edge Function для автоархивации
-- Создайте Edge Function которая будет вызываться каждую минуту

-- Функция для архивации
CREATE OR REPLACE FUNCTION archive_closed_tickets()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Архивируем тикеты которые закрыты больше 1 минуты назад
  UPDATE tickets
  SET archived_at = NOW()
  WHERE status = 'closed'
    AND archived_at IS NULL
    AND updated_at < NOW() - INTERVAL '1 minute';
END;
$$;

-- Если pg_cron доступен, создаем задание (раскомментируйте если pg_cron установлен):
-- SELECT cron.schedule(
--   'archive-closed-tickets',
--   '* * * * *',  -- каждую минуту
--   $$SELECT archive_closed_tickets()$$
-- );

-- Альтернатива: создайте Supabase Edge Function
-- Файл: supabase/functions/archive-tickets/index.ts
-- 
-- import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
-- 
-- Deno.serve(async () => {
--   const supabase = createClient(
--     Deno.env.get('SUPABASE_URL')!,
--     Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
--   )
--   
--   const { data, error } = await supabase.rpc('archive_closed_tickets')
--   
--   return new Response(
--     JSON.stringify({ success: !error, data, error }),
--     { headers: { 'Content-Type': 'application/json' } }
--   )
-- })
-- 
-- Затем настройте cron в Supabase Dashboard:
-- Project Settings -> Edge Functions -> Add Cron Job
-- Функция: archive-tickets
-- Расписание: * * * * * (каждую минуту)

COMMENT ON FUNCTION archive_closed_tickets IS 'Архивирует закрытые тикеты через 1 минуту после закрытия';
