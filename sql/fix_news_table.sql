-- ========================================
-- ВОССТАНОВЛЕНИЕ ТАБЛИЦЫ НОВОСТЕЙ
-- ========================================
-- Этот скрипт проверит и восстановит таблицу news если нужно

-- Создаём таблицу (если не существует)
CREATE TABLE IF NOT EXISTS news (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT DEFAULT 'Новость',
  image TEXT,
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Создаём индекс (если не существует)
CREATE INDEX IF NOT EXISTS idx_news_created_at ON news(created_at DESC);

-- Включаем RLS
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики если существуют
DROP POLICY IF EXISTS "Enable read for all" ON news;
DROP POLICY IF EXISTS "Enable insert for admins" ON news;
DROP POLICY IF EXISTS "Enable update for admins" ON news;
DROP POLICY IF EXISTS "Enable delete for admins" ON news;

-- Политика чтения для всех
CREATE POLICY "Enable read for all"
  ON news FOR SELECT
  USING (true);

-- Политика создания для админов
CREATE POLICY "Enable insert for admins"
  ON news FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- Политика обновления для админов
CREATE POLICY "Enable update for admins"
  ON news FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- Политика удаления для админов
CREATE POLICY "Enable delete for admins"
  ON news FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- Функция автообновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Удаляем старый триггер если существует
DROP TRIGGER IF EXISTS update_news_updated_at ON news;

-- Триггер для автообновления
CREATE TRIGGER update_news_updated_at
  BEFORE UPDATE ON news
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Показываем структуру таблицы
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'news'
ORDER BY ordinal_position;

-- Показываем политики безопасности
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'news';

-- Показываем количество новостей
SELECT COUNT(*) as total_news FROM news;
