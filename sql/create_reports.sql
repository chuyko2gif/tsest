-- Таблица отчётов пользователей
-- Запустите этот SQL в Supabase SQL Editor

CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  period VARCHAR(50) NOT NULL, -- Например: "Q4 2024", "Декабрь 2024"
  platform VARCHAR(100), -- Spotify, Apple Music, etc или NULL для всех
  streams INTEGER DEFAULT 0,
  amount DECIMAL(12, 2) DEFAULT 0,
  file_url TEXT, -- Ссылка на файл отчёта если есть
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_period ON reports(period);

-- RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Политики
CREATE POLICY "Users can view own reports" ON reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all reports" ON reports FOR ALL USING (true);

-- Пример вставки тестового отчёта (замените user_id на реальный)
-- INSERT INTO reports (user_id, period, platform, streams, amount) VALUES 
-- ('your-user-id-here', 'Q4 2024', 'Spotify', 15420, 1542.00);
