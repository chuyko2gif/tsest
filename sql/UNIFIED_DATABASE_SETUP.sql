-- ============================================
-- 🎯 THQ LABEL - ЕДИНЫЙ СКРИПТ БАЗЫ ДАННЫХ
-- Версия: 2.0
-- Дата: 30 декабря 2025
-- ============================================
-- 
-- ПОРЯДОК УСТАНОВКИ:
-- 1. Создайте проект в Supabase
-- 2. Откройте SQL Editor
-- 3. Вставьте и выполните этот скрипт ЦЕЛИКОМ
-- 4. Настройте переменные окружения в .env.local
--
-- СТРУКТУРА БАЗЫ:
-- - profiles: Профили пользователей
-- - releases_basic: Релизы Basic (платные)
-- - releases_exclusive: Релизы Exclusive (бесплатные)
-- - tickets: Тикеты поддержки
-- - ticket_messages: Сообщения в тикетах
-- - withdrawal_requests: Заявки на вывод
-- - payouts: История выплат
-- - transactions: История транзакций
-- - reports: Отчеты о прослушиваниях
-- - news: Новости
-- ============================================

-- ============================================
-- ЧАСТЬ 1: ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
-- ============================================

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Функция генерации member_id (THQ-XXXXX)
CREATE OR REPLACE FUNCTION generate_member_id()
RETURNS TRIGGER AS $$
DECLARE
  new_id TEXT;
BEGIN
  IF NEW.member_id IS NULL THEN
    new_id := 'THQ-' || LPAD(FLOOR(random() * 100000)::TEXT, 5, '0');
    WHILE EXISTS (SELECT 1 FROM profiles WHERE member_id = new_id) LOOP
      new_id := 'THQ-' || LPAD(FLOOR(random() * 100000)::TEXT, 5, '0');
    END LOOP;
    NEW.member_id := new_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ЧАСТЬ 2: ТАБЛИЦА ПРОФИЛЕЙ
-- ============================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  nickname TEXT,
  avatar TEXT,
  member_id TEXT UNIQUE,
  role TEXT DEFAULT 'basic' CHECK (role IN ('owner', 'admin', 'exclusive', 'basic')),
  original_role TEXT,
  balance NUMERIC(12, 2) DEFAULT 0.00,
  theme TEXT DEFAULT 'purple',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Добавляем колонки если не существуют
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='avatar') THEN
    ALTER TABLE profiles ADD COLUMN avatar TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='original_role') THEN
    ALTER TABLE profiles ADD COLUMN original_role TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='theme') THEN
    ALTER TABLE profiles ADD COLUMN theme TEXT DEFAULT 'purple';
  END IF;
END $$;

-- Индексы
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_member_id ON profiles(member_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Триггер для генерации member_id
DROP TRIGGER IF EXISTS generate_member_id_trigger ON profiles;
CREATE TRIGGER generate_member_id_trigger
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_member_id();

-- Триггер для updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ЧАСТЬ 3: ТАБЛИЦЫ РЕЛИЗОВ
-- ============================================

-- RELEASES_BASIC (Платные релизы)
CREATE TABLE IF NOT EXISTS releases_basic (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Пользователь
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Информация о релизе
  title TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  cover_url TEXT,
  genre TEXT NOT NULL,
  subgenres TEXT[] DEFAULT '{}',
  release_date DATE,
  collaborators TEXT[] DEFAULT '{}',
  
  -- Треклист (JSONB)
  tracks JSONB DEFAULT '[]'::jsonb,
  
  -- Страны/Платформы
  countries TEXT[] DEFAULT '{}',
  platforms TEXT[] DEFAULT '{}',
  
  -- Договор
  contract_agreed BOOLEAN DEFAULT false NOT NULL,
  contract_agreed_at TIMESTAMPTZ,
  
  -- Промо
  focus_track TEXT,
  album_description TEXT,
  is_promo_skipped BOOLEAN DEFAULT false,
  
  -- Статус
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'published', 'distributed')) NOT NULL,
  status_updated_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Оплата (обязательно для Basic)
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'pending', 'verified', 'rejected')) NOT NULL,
  payment_amount NUMERIC(10, 2) DEFAULT 500.00 NOT NULL,
  payment_receipt_url TEXT,
  payment_verified_at TIMESTAMPTZ,
  payment_verified_by UUID REFERENCES auth.users(id),
  
  -- Коды
  upc_code TEXT,
  catalog_number TEXT,
  copyright TEXT,
  
  -- Drag & Drop
  draft_order INTEGER,
  
  -- Модерация
  admin_notes TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  moderated_by UUID REFERENCES auth.users(id),
  moderated_at TIMESTAMPTZ
);

-- RELEASES_EXCLUSIVE (Бесплатные релизы)
CREATE TABLE IF NOT EXISTS releases_exclusive (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Пользователь
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Информация о релизе
  title TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  cover_url TEXT,
  genre TEXT NOT NULL,
  subgenres TEXT[] DEFAULT '{}',
  release_date DATE,
  collaborators TEXT[] DEFAULT '{}',
  
  -- Треклист (JSONB)
  tracks JSONB DEFAULT '[]'::jsonb,
  
  -- Страны/Платформы
  countries TEXT[] DEFAULT '{}',
  platforms TEXT[] DEFAULT '{}',
  
  -- Договор
  contract_agreed BOOLEAN DEFAULT false NOT NULL,
  contract_agreed_at TIMESTAMPTZ,
  
  -- Промо
  focus_track TEXT,
  album_description TEXT,
  is_promo_skipped BOOLEAN DEFAULT false,
  
  -- Статус
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'published', 'distributed')) NOT NULL,
  status_updated_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Коды
  upc_code TEXT,
  catalog_number TEXT,
  copyright TEXT,
  
  -- Drag & Drop
  draft_order INTEGER,
  
  -- Модерация
  admin_notes TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  moderated_by UUID REFERENCES auth.users(id),
  moderated_at TIMESTAMPTZ
);

-- Индексы для релизов
CREATE INDEX IF NOT EXISTS idx_releases_basic_user_id ON releases_basic(user_id);
CREATE INDEX IF NOT EXISTS idx_releases_basic_status ON releases_basic(status);
CREATE INDEX IF NOT EXISTS idx_releases_basic_payment_status ON releases_basic(payment_status);
CREATE INDEX IF NOT EXISTS idx_releases_basic_created_at ON releases_basic(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_releases_basic_draft_order ON releases_basic(user_id, status, draft_order) WHERE status = 'draft';

CREATE INDEX IF NOT EXISTS idx_releases_exclusive_user_id ON releases_exclusive(user_id);
CREATE INDEX IF NOT EXISTS idx_releases_exclusive_status ON releases_exclusive(status);
CREATE INDEX IF NOT EXISTS idx_releases_exclusive_created_at ON releases_exclusive(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_releases_exclusive_draft_order ON releases_exclusive(user_id, status, draft_order) WHERE status = 'draft';

-- Триггеры для updated_at
DROP TRIGGER IF EXISTS update_releases_basic_updated_at ON releases_basic;
CREATE TRIGGER update_releases_basic_updated_at
  BEFORE UPDATE ON releases_basic
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_releases_exclusive_updated_at ON releases_exclusive;
CREATE TRIGGER update_releases_exclusive_updated_at
  BEFORE UPDATE ON releases_exclusive
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ЧАСТЬ 4: ФУНКЦИЯ СОРТИРОВКИ ЧЕРНОВИКОВ
-- ============================================

CREATE OR REPLACE FUNCTION reorder_draft_release(
  p_release_id UUID,
  p_new_position INTEGER,
  p_table_name TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_old_position INTEGER;
BEGIN
  IF p_table_name = 'basic' THEN
    SELECT user_id, draft_order INTO v_user_id, v_old_position
    FROM releases_basic WHERE id = p_release_id;
  ELSE
    SELECT user_id, draft_order INTO v_user_id, v_old_position
    FROM releases_exclusive WHERE id = p_release_id;
  END IF;

  IF v_old_position = p_new_position THEN RETURN; END IF;

  IF p_table_name = 'basic' THEN
    UPDATE releases_basic SET draft_order = -1 WHERE id = p_release_id;
    
    IF v_old_position < p_new_position THEN
      UPDATE releases_basic SET draft_order = draft_order - 1
      WHERE user_id = v_user_id AND status = 'draft'
        AND draft_order > v_old_position AND draft_order <= p_new_position
        AND id != p_release_id;
    ELSE
      UPDATE releases_basic SET draft_order = draft_order + 1
      WHERE user_id = v_user_id AND status = 'draft'
        AND draft_order >= p_new_position AND draft_order < v_old_position
        AND id != p_release_id;
    END IF;
    
    UPDATE releases_basic SET draft_order = p_new_position WHERE id = p_release_id;
    
    UPDATE releases_basic SET draft_order = subquery.new_order
    FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY draft_order) as new_order
          FROM releases_basic WHERE user_id = v_user_id AND status = 'draft') as subquery
    WHERE releases_basic.id = subquery.id;
  ELSE
    UPDATE releases_exclusive SET draft_order = -1 WHERE id = p_release_id;
    
    IF v_old_position < p_new_position THEN
      UPDATE releases_exclusive SET draft_order = draft_order - 1
      WHERE user_id = v_user_id AND status = 'draft'
        AND draft_order > v_old_position AND draft_order <= p_new_position
        AND id != p_release_id;
    ELSE
      UPDATE releases_exclusive SET draft_order = draft_order + 1
      WHERE user_id = v_user_id AND status = 'draft'
        AND draft_order >= p_new_position AND draft_order < v_old_position
        AND id != p_release_id;
    END IF;
    
    UPDATE releases_exclusive SET draft_order = p_new_position WHERE id = p_release_id;
    
    UPDATE releases_exclusive SET draft_order = subquery.new_order
    FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY draft_order) as new_order
          FROM releases_exclusive WHERE user_id = v_user_id AND status = 'draft') as subquery
    WHERE releases_exclusive.id = subquery.id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION reorder_draft_release TO authenticated;

-- ============================================
-- ЧАСТЬ 5: ТИКЕТЫ ПОДДЕРЖКИ
-- ============================================

CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed', 'archived')),
  release_id UUID,
  user_email TEXT,
  user_nickname TEXT,
  is_read_by_admin BOOLEAN DEFAULT false,
  is_read_by_user BOOLEAN DEFAULT true,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_messages (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для тикетов
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);

-- ============================================
-- ЧАСТЬ 6: ФИНАНСОВАЯ СИСТЕМА
-- ============================================

-- Запросы на вывод
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL,
  payment_details TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  processed_by UUID REFERENCES profiles(id),
  processed_at TIMESTAMPTZ,
  admin_notes TEXT
);

-- Выплаты
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_details TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  notes TEXT
);

-- Транзакции
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'bonus', 'refund', 'fee')),
  amount NUMERIC(10,2) NOT NULL,
  balance_before NUMERIC(10,2) NOT NULL,
  balance_after NUMERIC(10,2) NOT NULL,
  description TEXT,
  reference_id UUID,
  reference_table TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Отчеты
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_streams INTEGER DEFAULT 0,
  total_revenue NUMERIC(10,2) DEFAULT 0.00,
  platform_breakdown JSONB,
  country_breakdown JSONB,
  release_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed BOOLEAN DEFAULT false
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_payouts_user_id ON payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);

-- ============================================
-- ЧАСТЬ 7: НОВОСТИ
-- ============================================

CREATE TABLE IF NOT EXISTS news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_draft BOOLEAN DEFAULT false,
  scheduled_for TIMESTAMPTZ,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_news_created_at ON news(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_is_draft ON news(is_draft);

-- ============================================
-- ЧАСТЬ 8: RLS ПОЛИТИКИ
-- ============================================

-- Включаем RLS для всех таблиц
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE releases_basic ENABLE ROW LEVEL SECURITY;
ALTER TABLE releases_exclusive ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики
DO $$ 
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.tablename;
  END LOOP;
END $$;

-- PROFILES
CREATE POLICY "profiles_select_authenticated" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

-- RELEASES_BASIC
CREATE POLICY "releases_basic_select_own" ON releases_basic FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "releases_basic_select_admin" ON releases_basic FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
CREATE POLICY "releases_basic_insert_own" ON releases_basic FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "releases_basic_update_own_draft" ON releases_basic FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id AND status IN ('draft', 'pending')) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "releases_basic_update_admin" ON releases_basic FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
CREATE POLICY "releases_basic_delete_own_draft" ON releases_basic FOR DELETE TO authenticated 
  USING (auth.uid() = user_id AND status = 'draft');

-- RELEASES_EXCLUSIVE
CREATE POLICY "releases_exclusive_select_own" ON releases_exclusive FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "releases_exclusive_select_admin" ON releases_exclusive FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
CREATE POLICY "releases_exclusive_insert_own" ON releases_exclusive FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "releases_exclusive_update_own_draft" ON releases_exclusive FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id AND status IN ('draft', 'pending')) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "releases_exclusive_update_admin" ON releases_exclusive FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
CREATE POLICY "releases_exclusive_delete_own_draft" ON releases_exclusive FOR DELETE TO authenticated 
  USING (auth.uid() = user_id AND status = 'draft');

-- TICKETS
CREATE POLICY "tickets_select_own" ON tickets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "tickets_select_admin" ON tickets FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
CREATE POLICY "tickets_insert_own" ON tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tickets_update_admin" ON tickets FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

-- TICKET_MESSAGES
CREATE POLICY "ticket_messages_select_own" ON ticket_messages FOR SELECT TO authenticated 
  USING (ticket_id IN (SELECT id FROM tickets WHERE user_id = auth.uid()));
CREATE POLICY "ticket_messages_select_admin" ON ticket_messages FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
CREATE POLICY "ticket_messages_insert_own" ON ticket_messages FOR INSERT TO authenticated 
  WITH CHECK (ticket_id IN (SELECT id FROM tickets WHERE user_id = auth.uid()) OR 
              EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

-- FINANCIAL TABLES
CREATE POLICY "withdrawal_select_own" ON withdrawal_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "withdrawal_select_admin" ON withdrawal_requests FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
CREATE POLICY "withdrawal_insert_own" ON withdrawal_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "withdrawal_update_admin" ON withdrawal_requests FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

CREATE POLICY "payouts_select_own" ON payouts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "payouts_select_admin" ON payouts FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
CREATE POLICY "payouts_insert_admin" ON payouts FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
CREATE POLICY "payouts_update_admin" ON payouts FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

CREATE POLICY "transactions_select_own" ON transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "transactions_select_admin" ON transactions FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
CREATE POLICY "transactions_insert_admin" ON transactions FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

CREATE POLICY "reports_select_own" ON reports FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "reports_select_admin" ON reports FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

-- NEWS
CREATE POLICY "news_select_public" ON news FOR SELECT USING (is_draft = false OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
CREATE POLICY "news_insert_admin" ON news FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
CREATE POLICY "news_update_admin" ON news FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));
CREATE POLICY "news_delete_admin" ON news FOR DELETE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

-- ============================================
-- ЧАСТЬ 9: STORAGE BUCKETS
-- ============================================

-- Создаем бакеты (если не существуют)
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('covers', 'covers', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('audio', 'audio', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('news', 'news', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('tickets', 'tickets', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-receipts', 'payment-receipts', false) ON CONFLICT (id) DO NOTHING;

-- Политики для storage
DROP POLICY IF EXISTS "Avatar upload" ON storage.objects;
DROP POLICY IF EXISTS "Avatar view" ON storage.objects;
DROP POLICY IF EXISTS "Avatar delete" ON storage.objects;

CREATE POLICY "Avatar upload" ON storage.objects FOR INSERT TO authenticated 
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Avatar view" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Avatar delete" ON storage.objects FOR DELETE TO authenticated 
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Cover upload" ON storage.objects;
DROP POLICY IF EXISTS "Cover view" ON storage.objects;

CREATE POLICY "Cover upload" ON storage.objects FOR INSERT TO authenticated 
  WITH CHECK (bucket_id = 'covers');
CREATE POLICY "Cover view" ON storage.objects FOR SELECT USING (bucket_id = 'covers');

DROP POLICY IF EXISTS "Audio upload" ON storage.objects;
DROP POLICY IF EXISTS "Audio view" ON storage.objects;

CREATE POLICY "Audio upload" ON storage.objects FOR INSERT TO authenticated 
  WITH CHECK (bucket_id = 'audio');
CREATE POLICY "Audio view" ON storage.objects FOR SELECT TO authenticated 
  USING (bucket_id = 'audio');

DROP POLICY IF EXISTS "News images view" ON storage.objects;
DROP POLICY IF EXISTS "News images upload" ON storage.objects;

CREATE POLICY "News images view" ON storage.objects FOR SELECT USING (bucket_id = 'news');
CREATE POLICY "News images upload" ON storage.objects FOR INSERT TO authenticated 
  WITH CHECK (bucket_id = 'news' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

DROP POLICY IF EXISTS "Payment receipts upload" ON storage.objects;
DROP POLICY IF EXISTS "Payment receipts view" ON storage.objects;

CREATE POLICY "Payment receipts upload" ON storage.objects FOR INSERT TO authenticated 
  WITH CHECK (bucket_id = 'payment-receipts');
CREATE POLICY "Payment receipts view" ON storage.objects FOR SELECT TO authenticated 
  USING (bucket_id = 'payment-receipts');

-- ============================================
-- ЧАСТЬ 10: КОММЕНТАРИИ
-- ============================================

COMMENT ON TABLE profiles IS 'Профили пользователей THQ Label';
COMMENT ON TABLE releases_basic IS 'Релизы Basic (платные, 500₽)';
COMMENT ON TABLE releases_exclusive IS 'Релизы Exclusive (бесплатные)';
COMMENT ON TABLE tickets IS 'Тикеты поддержки';
COMMENT ON TABLE ticket_messages IS 'Сообщения в тикетах';
COMMENT ON TABLE withdrawal_requests IS 'Заявки на вывод средств';
COMMENT ON TABLE payouts IS 'История выплат';
COMMENT ON TABLE transactions IS 'История транзакций баланса';
COMMENT ON TABLE reports IS 'Отчеты о прослушиваниях';
COMMENT ON TABLE news IS 'Новости лейбла';

COMMENT ON COLUMN releases_basic.tracks IS 'JSONB массив треков: [{title, link, hasDrugs, lyrics, language, version, producers, featuring, isrc}]';
COMMENT ON COLUMN releases_basic.draft_order IS 'Порядок черновиков для drag & drop (1, 2, 3...)';
COMMENT ON COLUMN releases_basic.is_promo_skipped IS 'Флаг: пропущен ли шаг промо';
COMMENT ON COLUMN profiles.member_id IS 'Уникальный ID пользователя формата THQ-XXXXX';
COMMENT ON COLUMN profiles.original_role IS 'Исходная роль до тестирования';

-- ============================================
-- ✅ ГОТОВО!
-- ============================================
-- 
-- База данных полностью настроена.
-- 
-- Следующие шаги:
-- 1. Создайте .env.local с переменными:
--    NEXT_PUBLIC_SUPABASE_URL=your-url
--    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
--    SUPABASE_SERVICE_ROLE_KEY=your-service-key
--
-- 2. Запустите npm run dev
--
-- 3. Для создания админа выполните в SQL Editor:
--    UPDATE profiles SET role = 'owner' WHERE email = 'your-email@example.com';
-- ============================================
