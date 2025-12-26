-- =====================================================
-- THQ LABEL - БАЗА ДАННЫХ
-- Запусти ВЕСЬ этот код в Supabase SQL Editor
-- =====================================================

-- УДАЛЯЕМ ВСЁ СТАРОЕ (CASCADE удалит зависимости автоматически)
DROP TABLE IF EXISTS stream_stats CASCADE;
DROP TABLE IF EXISTS ticket_messages CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS tracks CASCADE;
DROP TABLE IF EXISTS releases CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS payouts CASCADE;
DROP TABLE IF EXISTS demos CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS news CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Удаляем функции с CASCADE (удалит триггеры автоматически)
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- =====================================================
-- СОЗДАЁМ ТАБЛИЦЫ
-- =====================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  artist_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  balance DECIMAL(10,2) DEFAULT 0.00,
  total_streams BIGINT DEFAULT 0,
  phone TEXT,
  telegram TEXT,
  country TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  cover_url TEXT,
  release_date DATE,
  upc TEXT,
  isrc TEXT,
  genre TEXT,
  subgenre TEXT,
  label TEXT DEFAULT 'THQ Label',
  description TEXT,
  explicit BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'draft',
  platforms JSONB DEFAULT '[]',
  spotify_url TEXT,
  apple_music_url TEXT,
  yandex_music_url TEXT,
  total_streams BIGINT DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id UUID REFERENCES releases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  duration INTEGER,
  track_number INTEGER,
  isrc TEXT,
  audio_url TEXT,
  preview_url TEXT,
  explicit BOOLEAN DEFAULT FALSE,
  lyrics TEXT,
  composers TEXT,
  producers TEXT,
  streams BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  platform TEXT NOT NULL,
  streams BIGINT DEFAULT 0,
  amount DECIMAL(10,2) DEFAULT 0.00,
  currency TEXT DEFAULT 'RUB',
  report_data JSONB DEFAULT '{}',
  file_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'RUB',
  method TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  admin_comment TEXT,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE demos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist_name TEXT,
  genre TEXT,
  audio_url TEXT NOT NULL,
  cover_url TEXT,
  description TEXT,
  social_links JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  admin_feedback TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE stream_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id UUID REFERENCES releases(id) ON DELETE CASCADE,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  country TEXT,
  streams BIGINT DEFAULT 0,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(release_id, track_id, platform, country, date)
);

CREATE TABLE news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_url TEXT,
  author_id UUID REFERENCES auth.users(id),
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ИНДЕКСЫ
-- =====================================================

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_releases_user_id ON releases(user_id);
CREATE INDEX idx_releases_status ON releases(status);
CREATE INDEX idx_tracks_release_id ON tracks(release_id);
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_payouts_user_id ON payouts(user_id);
CREATE INDEX idx_payouts_status ON payouts(status);
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX idx_demos_user_id ON demos(user_id);
CREATE INDEX idx_demos_status ON demos(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_stream_stats_release_id ON stream_stats(release_id);
CREATE INDEX idx_news_slug ON news(slug);

-- =====================================================
-- ФУНКЦИИ
-- =====================================================

-- Функция проверки админа
CREATE FUNCTION is_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Автосоздание профиля
CREATE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Автообновление updated_at
CREATE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ТРИГГЕРЫ
-- =====================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_releases_updated_at
  BEFORE UPDATE ON releases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_news_updated_at
  BEFORE UPDATE ON news
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS (ROW LEVEL SECURITY)
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE demos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ПОЛИТИКИ БЕЗОПАСНОСТИ
-- =====================================================

-- PROFILES
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_admin_select" ON profiles FOR SELECT USING (is_admin());

-- RELEASES
CREATE POLICY "releases_select_own" ON releases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "releases_insert_own" ON releases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "releases_update_own" ON releases FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "releases_admin_select" ON releases FOR SELECT USING (is_admin());
CREATE POLICY "releases_admin_update" ON releases FOR UPDATE USING (is_admin());

-- TRACKS
CREATE POLICY "tracks_select" ON tracks FOR SELECT USING (
  EXISTS (SELECT 1 FROM releases WHERE releases.id = tracks.release_id AND releases.user_id = auth.uid())
);
CREATE POLICY "tracks_all" ON tracks FOR ALL USING (
  EXISTS (SELECT 1 FROM releases WHERE releases.id = tracks.release_id AND releases.user_id = auth.uid())
);

-- REPORTS
CREATE POLICY "reports_select_own" ON reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reports_admin_all" ON reports FOR ALL USING (is_admin());

-- PAYOUTS
CREATE POLICY "payouts_select_own" ON payouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "payouts_insert_own" ON payouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "payouts_admin_all" ON payouts FOR ALL USING (is_admin());

-- TICKETS
CREATE POLICY "tickets_select_own" ON tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tickets_insert_own" ON tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tickets_admin_all" ON tickets FOR ALL USING (is_admin());

-- TICKET_MESSAGES
CREATE POLICY "ticket_messages_select" ON ticket_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM tickets WHERE tickets.id = ticket_messages.ticket_id AND tickets.user_id = auth.uid())
);
CREATE POLICY "ticket_messages_insert" ON ticket_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM tickets WHERE tickets.id = ticket_messages.ticket_id AND tickets.user_id = auth.uid())
);
CREATE POLICY "ticket_messages_admin_all" ON ticket_messages FOR ALL USING (is_admin());

-- DEMOS
CREATE POLICY "demos_select_own" ON demos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "demos_insert_own" ON demos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "demos_admin_all" ON demos FOR ALL USING (is_admin());

-- NOTIFICATIONS
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- STREAM_STATS
CREATE POLICY "stream_stats_select" ON stream_stats FOR SELECT USING (
  EXISTS (SELECT 1 FROM releases WHERE releases.id = stream_stats.release_id AND releases.user_id = auth.uid())
);

-- NEWS
CREATE POLICY "news_select_published" ON news FOR SELECT USING (is_published = true);
CREATE POLICY "news_admin_all" ON news FOR ALL USING (is_admin());

-- =====================================================
-- ГОТОВО!
-- =====================================================
-- Чтобы сделать себя админом:
-- UPDATE profiles SET role = 'admin' WHERE email = 'твой-email@example.com';
