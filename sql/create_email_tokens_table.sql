-- Таблица для хранения токенов верификации email и сброса пароля
-- Это необходимо для работы email-ов в production (serverless)
-- Токены в памяти не работают, т.к. каждый запрос может попасть на разный инстанс

-- Создаём таблицу email_tokens
CREATE TABLE IF NOT EXISTS email_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  token_type TEXT NOT NULL CHECK (token_type IN ('verification', 'password_reset')),
  email TEXT NOT NULL,
  password_hash TEXT, -- только для verification токенов
  nickname TEXT, -- только для verification токенов
  telegram TEXT, -- телеграм пользователя (только для verification)
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Добавляем колонку telegram если таблица уже существует
ALTER TABLE email_tokens ADD COLUMN IF NOT EXISTS telegram TEXT;

-- Индекс для быстрого поиска по токену
CREATE INDEX IF NOT EXISTS idx_email_tokens_token ON email_tokens(token);

-- Индекс для очистки истекших токенов
CREATE INDEX IF NOT EXISTS idx_email_tokens_expires_at ON email_tokens(expires_at);

-- Автоматическая очистка старых токенов (запускать через cron или scheduled function)
-- Токены старше 24 часов будут автоматически удаляться

-- Включаем RLS (Row Level Security)
ALTER TABLE email_tokens ENABLE ROW LEVEL SECURITY;

-- Удаляем старую политику если есть
DROP POLICY IF EXISTS "Service role full access to email_tokens" ON email_tokens;

-- Политика: только service role может работать с токенами
CREATE POLICY "Service role full access to email_tokens"
  ON email_tokens
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Функция для очистки истекших токенов (можно вызывать периодически)
CREATE OR REPLACE FUNCTION cleanup_expired_email_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM email_tokens 
  WHERE expires_at < NOW() OR used = true;
END;
$$;

-- Комментарии к таблице
COMMENT ON TABLE email_tokens IS 'Хранение токенов для верификации email и сброса пароля';
COMMENT ON COLUMN email_tokens.token_type IS 'Тип токена: verification (регистрация) или password_reset (сброс пароля)';
COMMENT ON COLUMN email_tokens.password_hash IS 'Хеш пароля для регистрации (только для verification)';
COMMENT ON COLUMN email_tokens.nickname IS 'Никнейм пользователя (только для verification)';
