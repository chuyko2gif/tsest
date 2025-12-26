-- ==============================================================
-- ПОЛНОЕ ВОССТАНОВЛЕНИЕ БАЗЫ ДАННЫХ THQ LABEL
-- ==============================================================
-- Этот скрипт восстанавливает ВСЮ систему с сохранением данных
-- ==============================================================

-- ============== ШАГ 1: ОТКЛЮЧАЕМ RLS ВРЕМЕННО ==============
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE payouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;

SELECT '✅ Шаг 1: RLS отключен' as status;

-- ============== ШАГ 2: УДАЛЯЕМ ВСЕ СТАРЫЕ ПОЛИТИКИ ==============
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable update for own profile" ON profiles;
DROP POLICY IF EXISTS "Enable update for admins" ON profiles;
DROP POLICY IF EXISTS "Enable update for admins and owners" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

DROP POLICY IF EXISTS "Users can view own tickets" ON tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON tickets;
DROP POLICY IF EXISTS "Admins can update tickets" ON tickets;

DROP POLICY IF EXISTS "Users can view own ticket messages" ON ticket_messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON ticket_messages;
DROP POLICY IF EXISTS "Users can create messages" ON ticket_messages;

DROP POLICY IF EXISTS "Users can view own withdrawal requests" ON withdrawal_requests;
DROP POLICY IF EXISTS "Admins can view all withdrawal requests" ON withdrawal_requests;
DROP POLICY IF EXISTS "Users can create own withdrawal requests" ON withdrawal_requests;
DROP POLICY IF EXISTS "Admins can update withdrawal requests" ON withdrawal_requests;

DROP POLICY IF EXISTS "Users can view own payouts" ON payouts;
DROP POLICY IF EXISTS "Admins can view all payouts" ON payouts;
DROP POLICY IF EXISTS "Admins can manage payouts" ON payouts;

DROP POLICY IF EXISTS "Users can view own reports" ON reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON reports;

SELECT '✅ Шаг 2: Старые политики удалены' as status;

-- ============== ШАГ 3: УДАЛЯЕМ ВСЕ ТРИГГЕРЫ ==============
DROP TRIGGER IF EXISTS set_default_role_trigger ON profiles;
DROP TRIGGER IF EXISTS set_role_on_insert_trigger ON profiles;
DROP TRIGGER IF EXISTS protect_roles_trigger ON profiles;
DROP TRIGGER IF EXISTS prevent_role_downgrade ON profiles;

DROP FUNCTION IF EXISTS set_default_role();
DROP FUNCTION IF EXISTS set_role_for_new_users();
DROP FUNCTION IF EXISTS protect_important_roles();
DROP FUNCTION IF EXISTS protect_admin_owner_roles();
DROP FUNCTION IF EXISTS protect_owner_role();

SELECT '✅ Шаг 3: Триггеры удалены' as status;

-- ============== ШАГ 4: УДАЛЯЕМ DEFAULT ==============
ALTER TABLE profiles ALTER COLUMN role DROP DEFAULT;

SELECT '✅ Шаг 4: DEFAULT удалён' as status;

-- ============== ШАГ 5: ВОССТАНАВЛИВАЕМ РОЛИ ==============
-- Устанавливаем owner для ваших email
UPDATE profiles SET role = 'owner' WHERE email = 'maksbroska@gmail.com';
UPDATE profiles SET role = 'owner' WHERE email = 'littlehikai@gmail.com';

-- Всем остальным ставим basic (если роль NULL)
UPDATE profiles SET role = 'basic' WHERE role IS NULL OR role = '';

SELECT '✅ Шаг 5: Роли восстановлены' as status;

-- ============== ШАГ 6: СОЗДАЕМ ПРАВИЛЬНЫЕ ТРИГГЕРЫ ==============

-- Триггер для новых пользователей (ТОЛЬКО INSERT)
CREATE OR REPLACE FUNCTION set_role_for_new_users()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS NULL OR NEW.role = '' THEN
    NEW.role := 'basic';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_role_on_insert_trigger
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_role_for_new_users();

-- Триггер защиты owner
CREATE OR REPLACE FUNCTION protect_owner_role()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role = 'owner' AND NEW.role != 'owner' THEN
    RAISE EXCEPTION 'Нельзя изменить роль OWNER!';
  END IF;
  IF OLD.role = 'admin' AND NEW.role IN ('basic', 'exclusive') THEN
    RAISE EXCEPTION 'Нельзя понизить ADMIN!';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER protect_roles_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION protect_owner_role();

SELECT '✅ Шаг 6: Триггеры созданы' as status;

-- ============== ШАГ 7: СОЗДАЕМ ПОЛИТИКИ RLS ==============

-- PROFILES
CREATE POLICY "Anyone can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- TICKETS
CREATE POLICY "Users can view own tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')
  ));

CREATE POLICY "Users can create tickets"
  ON tickets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update tickets"
  ON tickets FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')
  ));

-- TICKET_MESSAGES
CREATE POLICY "Users can view own messages"
  ON ticket_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets 
      WHERE tickets.id = ticket_messages.ticket_id 
      AND (tickets.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')
      ))
    )
  );

CREATE POLICY "Users can create messages"
  ON ticket_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets 
      WHERE tickets.id = ticket_messages.ticket_id 
      AND (tickets.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')
      ))
    )
  );

-- WITHDRAWAL_REQUESTS
CREATE POLICY "Users can view own withdrawal requests"
  ON withdrawal_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')
  ));

CREATE POLICY "Users can create withdrawal requests"
  ON withdrawal_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update withdrawal requests"
  ON withdrawal_requests FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')
  ));

-- PAYOUTS
CREATE POLICY "Users can view own payouts"
  ON payouts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')
  ));

CREATE POLICY "Admins can manage payouts"
  ON payouts FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')
  ));

-- REPORTS
CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')
  ));

CREATE POLICY "Admins can manage reports"
  ON reports FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')
  ));

SELECT '✅ Шаг 7: RLS политики созданы' as status;

-- ============== ШАГ 8: ВКЛЮЧАЕМ RLS ==============
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

SELECT '✅ Шаг 8: RLS включен' as status;

-- ============== ШАГ 9: ПРОВЕРЯЕМ CONSTRAINT ==============
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('basic', 'exclusive', 'admin', 'owner'));

SELECT '✅ Шаг 9: Constraint создан' as status;

-- ============== ШАГ 10: ВКЛЮЧАЕМ REALTIME ==============
-- Удаляем таблицы из публикации (игнорируем ошибки если их там нет)
DO $$ 
BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE tickets;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE ticket_messages;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE withdrawal_requests;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE payouts;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE profiles;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Теперь добавляем заново
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE ticket_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE withdrawal_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE payouts;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

SELECT '✅ Шаг 10: Realtime включен' as status;

-- ============== ФИНАЛЬНАЯ ПРОВЕРКА ==============
SELECT '🎉 ===============================================' as result;
SELECT '🎉 БАЗА ДАННЫХ ПОЛНОСТЬЮ ВОССТАНОВЛЕНА!' as result;
SELECT '🎉 ===============================================' as result;

-- Показываем всех пользователей
SELECT 
  '👥 ПОЛЬЗОВАТЕЛИ:' as info,
  email,
  role,
  nickname,
  balance
FROM profiles
ORDER BY 
  CASE role
    WHEN 'owner' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'exclusive' THEN 3
    WHEN 'basic' THEN 4
  END,
  created_at DESC;

-- Показываем статистику
SELECT 
  '📊 СТАТИСТИКА:' as info,
  role,
  COUNT(*) as количество
FROM profiles
GROUP BY role
ORDER BY 
  CASE role
    WHEN 'owner' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'exclusive' THEN 3
    WHEN 'basic' THEN 4
  END;

-- Проверяем триггеры
SELECT 
  '⚙️ ТРИГГЕРЫ:' as info,
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'profiles';

-- Проверяем политики
SELECT 
  '🔒 RLS ПОЛИТИКИ:' as info,
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE tablename IN ('profiles', 'tickets', 'ticket_messages', 'withdrawal_requests', 'payouts', 'reports')
ORDER BY tablename, policyname;

SELECT '✅ ВСЁ ГОТОВО! Теперь очистите кеш браузера и перезагрузите сайт!' as final_message;
