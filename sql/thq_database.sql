-- =====================================================
-- THQ LABEL - ПОЛНАЯ НАСТРОЙКА БАЗЫ ДАННЫХ
-- Скопируй ВЕСЬ этот код и вставь в Supabase SQL Editor
-- =====================================================

-- =====================================================
-- ЧАСТЬ 1: СОЗДАЁМ ВСЕ ТАБЛИЦЫ
-- =====================================================

-- 1. ПРОФИЛИ ПОЛЬЗОВАТЕЛЕЙ
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  artist_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  balance DECIMAL(10,2) DEFAULT 0.00,
  total_streams BIGINT DEFAULT 0,
  phone TEXT,
  telegram TEXT,
  country TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. РЕЛИЗЫ
CREATE TABLE IF NOT EXISTS releases (
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
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'published')),
  platforms JSONB DEFAULT '[]',
  spotify_url TEXT,
  apple_music_url TEXT,
  yandex_music_url TEXT,
  total_streams BIGINT DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ТРЕКИ
CREATE TABLE IF NOT EXISTS tracks (
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ФИНАНСОВЫЕ ОТЧЁТЫ
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  platform TEXT NOT NULL,
  streams BIGINT DEFAULT 0,
  amount DECIMAL(10,2) DEFAULT 0.00,
  currency TEXT DEFAULT 'RUB',
  report_data JSONB DEFAULT '{}',
  file_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'paid')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. ВЫПЛАТЫ
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'RUB',
  method TEXT NOT NULL CHECK (method IN ('bank_card', 'bank_account', 'paypal', 'crypto')),
  details JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected', 'cancelled')),
  admin_comment TEXT,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. ТИКЕТЫ (ПОДДЕРЖКА)
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'technical', 'financial', 'release', 'account')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- 7. СООБЩЕНИЯ ТИКЕТОВ
CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. ДЕМО-ЗАПИСИ
CREATE TABLE IF NOT EXISTS demos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist_name TEXT,
  genre TEXT,
  audio_url TEXT NOT NULL,
  cover_url TEXT,
  description TEXT,
  social_links JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
  admin_feedback TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. УВЕДОМЛЕНИЯ
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. СТАТИСТИКА СТРИМОВ
CREATE TABLE IF NOT EXISTS stream_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id UUID REFERENCES releases(id) ON DELETE CASCADE,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  country TEXT,
  streams BIGINT DEFAULT 0,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(release_id, track_id, platform, country, date)
);

-- 11. НОВОСТИ
CREATE TABLE IF NOT EXISTS news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_url TEXT,
  author_id UUID REFERENCES auth.users(id),
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- =====================================================
-- ЧАСТЬ 2: ВКЛЮЧАЕМ RLS
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
-- ЧАСТЬ 3: ФУНКЦИЯ ПРОВЕРКИ АДМИНА
-- =====================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- =====================================================
-- ЧАСТЬ 4: ПОЛИТИКИ БЕЗОПАСНОСТИ
-- =====================================================

-- PROFILES
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (is_admin());

-- RELEASES
DROP POLICY IF EXISTS "Users can view own releases" ON releases;
DROP POLICY IF EXISTS "Users can insert own releases" ON releases;
DROP POLICY IF EXISTS "Users can update own releases" ON releases;
DROP POLICY IF EXISTS "Admins can view all releases" ON releases;
DROP POLICY IF EXISTS "Admins can update all releases" ON releases;

CREATE POLICY "Users can view own releases" ON releases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own releases" ON releases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own releases" ON releases FOR UPDATE USING (auth.uid() = user_id AND status IN ('draft', 'rejected'));
CREATE POLICY "Admins can view all releases" ON releases FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update all releases" ON releases FOR UPDATE USING (is_admin());

-- TRACKS
DROP POLICY IF EXISTS "Users can view tracks of own releases" ON tracks;
DROP POLICY IF EXISTS "Users can manage tracks of own releases" ON tracks;

CREATE POLICY "Users can view tracks of own releases" ON tracks FOR SELECT USING (
  EXISTS (SELECT 1 FROM releases WHERE releases.id = tracks.release_id AND releases.user_id = auth.uid())
);
CREATE POLICY "Users can manage tracks of own releases" ON tracks FOR ALL USING (
  EXISTS (SELECT 1 FROM releases WHERE releases.id = tracks.release_id AND releases.user_id = auth.uid())
);

-- REPORTS
DROP POLICY IF EXISTS "Users can view own reports" ON reports;
DROP POLICY IF EXISTS "Admins can manage all reports" ON reports;

CREATE POLICY "Users can view own reports" ON reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all reports" ON reports FOR ALL USING (is_admin());

-- PAYOUTS
DROP POLICY IF EXISTS "Users can view own payouts" ON payouts;
DROP POLICY IF EXISTS "Users can create payouts" ON payouts;
DROP POLICY IF EXISTS "Admins can manage all payouts" ON payouts;

CREATE POLICY "Users can view own payouts" ON payouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create payouts" ON payouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all payouts" ON payouts FOR ALL USING (is_admin());

-- TICKETS
DROP POLICY IF EXISTS "Users can view own tickets" ON tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON tickets;
DROP POLICY IF EXISTS "Admins can manage all tickets" ON tickets;

CREATE POLICY "Users can view own tickets" ON tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create tickets" ON tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all tickets" ON tickets FOR ALL USING (is_admin());

-- TICKET_MESSAGES
DROP POLICY IF EXISTS "Users can view messages of own tickets" ON ticket_messages;
DROP POLICY IF EXISTS "Users can send messages to own tickets" ON ticket_messages;
DROP POLICY IF EXISTS "Admins can manage all messages" ON ticket_messages;

CREATE POLICY "Users can view messages of own tickets" ON ticket_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM tickets WHERE tickets.id = ticket_messages.ticket_id AND tickets.user_id = auth.uid())
);
CREATE POLICY "Users can send messages to own tickets" ON ticket_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM tickets WHERE tickets.id = ticket_messages.ticket_id AND tickets.user_id = auth.uid())
);
CREATE POLICY "Admins can manage all messages" ON ticket_messages FOR ALL USING (is_admin());

-- DEMOS
DROP POLICY IF EXISTS "Users can view own demos" ON demos;
DROP POLICY IF EXISTS "Users can create demos" ON demos;
DROP POLICY IF EXISTS "Admins can manage all demos" ON demos;

CREATE POLICY "Users can view own demos" ON demos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create demos" ON demos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all demos" ON demos FOR ALL USING (is_admin());

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- STREAM_STATS
DROP POLICY IF EXISTS "Users can view stats of own releases" ON stream_stats;

CREATE POLICY "Users can view stats of own releases" ON stream_stats FOR SELECT USING (
  EXISTS (SELECT 1 FROM releases WHERE releases.id = stream_stats.release_id AND releases.user_id = auth.uid())
);

-- NEWS
DROP POLICY IF EXISTS "Anyone can view published news" ON news;
DROP POLICY IF EXISTS "Admins can manage news" ON news;

CREATE POLICY "Anyone can view published news" ON news FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage news" ON news FOR ALL USING (is_admin());


-- =====================================================
-- ЧАСТЬ 5: ИНДЕКСЫ
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_releases_user_id ON releases(user_id);
CREATE INDEX IF NOT EXISTS idx_releases_status ON releases(status);
CREATE INDEX IF NOT EXISTS idx_tracks_release_id ON tracks(release_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_user_id ON payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_demos_user_id ON demos(user_id);
CREATE INDEX IF NOT EXISTS idx_demos_status ON demos(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_stream_stats_release_id ON stream_stats(release_id);
CREATE INDEX IF NOT EXISTS idx_stream_stats_date ON stream_stats(date);
CREATE INDEX IF NOT EXISTS idx_news_slug ON news(slug);
CREATE INDEX IF NOT EXISTS idx_news_published ON news(is_published, published_at);


-- =====================================================
-- ЧАСТЬ 6: ТРИГГЕРЫ
-- =====================================================

-- Автосоздание профиля при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Автообновление updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_releases_updated_at ON releases;
CREATE TRIGGER update_releases_updated_at BEFORE UPDATE ON releases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_news_updated_at ON news;
CREATE TRIGGER update_news_updated_at BEFORE UPDATE ON news FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- =====================================================
-- ГОТОВО!
-- =====================================================
-- Чтобы сделать себя админом, выполни:
-- UPDATE profiles SET role = 'admin' WHERE email = 'твой-email@example.com';
