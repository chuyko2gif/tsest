-- Включаем обязательное подтверждение email
-- После выполнения этого скрипта пользователи НЕ смогут войти до подтверждения почты

-- 1. Политика для создания профиля - разрешаем создание
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;
CREATE POLICY "Allow profile creation" ON profiles
  FOR INSERT
  WITH CHECK (true);  -- Профиль создаётся триггером автоматически

-- 2. Триггер остаётся прежним - создаёт профиль автоматически
-- (не меняем, он уже настроен)

-- 3. Политики для SELECT - только подтверждённые пользователи
DROP POLICY IF EXISTS "Enable read for all authenticated users" ON profiles;
CREATE POLICY "Enable read for all authenticated users" ON profiles 
  FOR SELECT TO authenticated 
  USING (true);  -- Все аутентифицированные могут читать

-- 4. UPDATE - только свой профиль
DROP POLICY IF EXISTS "Enable update for own profile" ON profiles;
CREATE POLICY "Enable update for own profile" ON profiles 
  FOR UPDATE TO authenticated 
  USING (auth.uid() = id);

-- 5. Анонимное чтение запрещаем
DROP POLICY IF EXISTS "Enable read for anon users" ON profiles;

-- ВАЖНО: После выполнения этого скрипта перейдите в Supabase Dashboard:
-- Authentication → Providers → Email → Включите галочку "Confirm email"
-- Settings → Auth → SMTP Settings → Настройте SMTP от Brevo
