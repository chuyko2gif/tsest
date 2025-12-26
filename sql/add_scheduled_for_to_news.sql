-- ==============================================================
-- ДОБАВЛЕНИЕ ПОЛЯ scheduled_for В ТАБЛИЦУ news
-- ==============================================================

-- Добавляем поле для запланированной публикации
ALTER TABLE news 
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ;

-- Добавляем индекс для быстрого поиска запланированных новостей
CREATE INDEX IF NOT EXISTS idx_news_scheduled_for 
ON news(scheduled_for) 
WHERE scheduled_for IS NOT NULL;

-- Комментарий к полю
COMMENT ON COLUMN news.scheduled_for IS 'Дата и время запланированной публикации. NULL = опубликовано немедленно';

-- Проверяем результат
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'news'
ORDER BY ordinal_position;

SELECT '✅ Поле scheduled_for добавлено в таблицу news!' as status;
