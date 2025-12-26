-- Исправляем RLS политики для таблицы transactions
-- Разрешаем владельцам и админам создавать транзакции

-- Удаляем старые политики если есть
DROP POLICY IF EXISTS "Allow insert transactions for admins" ON transactions;
DROP POLICY IF EXISTS "Allow owners and admins to insert transactions" ON transactions;

-- Создаём новую политику для INSERT
CREATE POLICY "Allow owners and admins to insert transactions"
ON transactions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('owner', 'admin')
  )
);

-- Политика для SELECT (чтение своих транзакций)
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
CREATE POLICY "Users can view their own transactions"
ON transactions
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('owner', 'admin')
  )
);

-- Политика для UPDATE (только админы и владельцы)
DROP POLICY IF EXISTS "Allow owners and admins to update transactions" ON transactions;
CREATE POLICY "Allow owners and admins to update transactions"
ON transactions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('owner', 'admin')
  )
);
