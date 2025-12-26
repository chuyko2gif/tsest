-- Добавляем поле для темы в профиль пользователя
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'purple' 
  CHECK (theme IN ('purple', 'blue', 'green', 'orange', 'red', 'pink', 'cyan'));

-- Комментарий
COMMENT ON COLUMN profiles.theme IS 'Выбранная пользователем тема оформления';

SELECT '✅ Поле theme добавлено в таблицу profiles!' as status;
