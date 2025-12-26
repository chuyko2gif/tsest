-- Создание таблицы релизов
CREATE TABLE IF NOT EXISTS releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  cover_url TEXT,
  genre TEXT NOT NULL,
  subgenres TEXT[] DEFAULT '{}',
  release_date DATE,
  collaborators TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'published')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы треков
CREATE TABLE IF NOT EXISTS tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id UUID NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  title TEXT NOT NULL,
  link TEXT NOT NULL,
  has_explicit_content BOOLEAN DEFAULT FALSE,
  lyrics TEXT,
  language TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(release_id, position)
);

-- Создание индексов для производительности
CREATE INDEX IF NOT EXISTS idx_releases_user_id ON releases(user_id);
CREATE INDEX IF NOT EXISTS idx_releases_status ON releases(status);
CREATE INDEX IF NOT EXISTS idx_tracks_release_id ON tracks(release_id);

-- Создание функции для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Создание триггеров для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_releases_updated_at ON releases;
CREATE TRIGGER update_releases_updated_at
  BEFORE UPDATE ON releases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tracks_updated_at ON tracks;
CREATE TRIGGER update_tracks_updated_at
  BEFORE UPDATE ON tracks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Включение Row Level Security (RLS)
ALTER TABLE releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

-- Политики доступа для releases
-- Пользователи могут видеть только свои релизы
CREATE POLICY "Users can view own releases"
  ON releases FOR SELECT
  USING (auth.uid() = user_id);

-- Пользователи могут создавать свои релизы
CREATE POLICY "Users can create own releases"
  ON releases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Пользователи могут обновлять свои релизы
CREATE POLICY "Users can update own releases"
  ON releases FOR UPDATE
  USING (auth.uid() = user_id);

-- Пользователи могут удалять свои релизы
CREATE POLICY "Users can delete own releases"
  ON releases FOR DELETE
  USING (auth.uid() = user_id);

-- Политики доступа для tracks
-- Пользователи могут видеть треки своих релизов
CREATE POLICY "Users can view own tracks"
  ON tracks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM releases
      WHERE releases.id = tracks.release_id
      AND releases.user_id = auth.uid()
    )
  );

-- Пользователи могут создавать треки для своих релизов
CREATE POLICY "Users can create own tracks"
  ON tracks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM releases
      WHERE releases.id = tracks.release_id
      AND releases.user_id = auth.uid()
    )
  );

-- Пользователи могут обновлять треки своих релизов
CREATE POLICY "Users can update own tracks"
  ON tracks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM releases
      WHERE releases.id = tracks.release_id
      AND releases.user_id = auth.uid()
    )
  );

-- Пользователи могут удалять треки своих релизов
CREATE POLICY "Users can delete own tracks"
  ON tracks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM releases
      WHERE releases.id = tracks.release_id
      AND releases.user_id = auth.uid()
    )
  );

-- Создание бакета для обложек релизов в Supabase Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('release-covers', 'release-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Политики доступа для storage.objects (обложки релизов)
CREATE POLICY "Users can upload own release covers"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'release-covers'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Public can view release covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'release-covers');

CREATE POLICY "Users can update own release covers"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'release-covers'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own release covers"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'release-covers'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
