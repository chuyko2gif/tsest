# 🔧 Исправление проблем с регистрацией и email

## Проблемы которые были исправлены:

### 1. **Telegram не сохранялся при регистрации**
- ✅ Добавлена передача telegram в API `/api/send-verification-email`
- ✅ Telegram сохраняется в `email_tokens`
- ✅ При верификации telegram передаётся в `user_metadata`
- ✅ Триггер `handle_new_user` теперь сохраняет telegram в профиль

### 2. **Профиль не создавался после верификации**
- ✅ Добавлено явное создание профиля в `/api/verify-email` как fallback
- ✅ Генерируется `member_id` (THQ-XXXX)
- ✅ Устанавливается роль `basic` и баланс `0`

### 3. **Не показывалось сообщение после верификации**
- ✅ Добавлена обработка параметра `?verified=true` на странице `/auth`
- ✅ Показывается уведомление "Email успешно подтверждён!"
- ✅ Обработка ошибок (token_expired, invalid_token и т.д.)

## Что нужно сделать на хосте:

### 1. Выполни SQL в Supabase Dashboard → SQL Editor:

```sql
-- Добавляем колонку telegram в email_tokens
ALTER TABLE email_tokens ADD COLUMN IF NOT EXISTS telegram TEXT;

-- Обновляем триггер handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_member_id TEXT;
BEGIN
  new_member_id := 'THQ-' || LPAD(FLOOR(1000 + RANDOM() * 9000)::TEXT, 4, '0');
  
  INSERT INTO public.profiles (id, email, nickname, telegram, member_id, role, balance, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'nickname',
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'telegram',
    new_member_id,
    'basic',
    0,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nickname = COALESCE(profiles.nickname, EXCLUDED.nickname),
    telegram = COALESCE(profiles.telegram, EXCLUDED.telegram),
    member_id = COALESCE(profiles.member_id, EXCLUDED.member_id),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Пересоздаём триггер
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 2. Задеплой изменённые файлы:
- `app/auth/page.tsx` - обработка ?verified=true
- `app/api/send-verification-email/route.ts` - сохранение telegram
- `app/api/verify-email/route.ts` - создание профиля + telegram

### 3. Для существующего пользователя без профиля:

```sql
-- Найди пользователя
SELECT id, email FROM auth.users WHERE email = 'EMAIL_ПОЛЬЗОВАТЕЛЯ';

-- Создай профиль вручную (замени ID и EMAIL)
INSERT INTO profiles (id, email, nickname, member_id, role, balance, created_at, updated_at)
VALUES (
  'USER_ID',
  'EMAIL',
  'NICKNAME',
  'THQ-' || LPAD(FLOOR(1000 + RANDOM() * 9000)::TEXT, 4, '0'),
  'basic',
  0,
  NOW(),
  NOW()
);
```

## Проверка работы:

1. **Регистрация** - зарегистрируйся с telegram
2. **Верификация** - перейди по ссылке из письма
3. **Сообщение** - должно показаться "Email успешно подтверждён!"
4. **Вход** - войди с email и паролем
5. **Профиль** - проверь что есть member_id и telegram

## Файлы:
- [FIX_REGISTRATION_TELEGRAM.sql](sql/FIX_REGISTRATION_TELEGRAM.sql) - полный SQL скрипт
- [FIX_MISSING_PROFILE_DEBUG.sql](sql/FIX_MISSING_PROFILE_DEBUG.sql) - диагностика и ручное создание профиля
