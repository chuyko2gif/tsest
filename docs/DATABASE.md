# Настройка базы данных

## Основные таблицы

### profiles
Профили пользователей
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  nickname TEXT,
  email TEXT,
  role TEXT DEFAULT 'pending',
  avatar_url TEXT,
  balance NUMERIC DEFAULT 0,
  theme TEXT DEFAULT 'dark',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### releases_basic
Basic релизы (платные)
```sql
CREATE TABLE releases_basic (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist_name TEXT,
  cover_url TEXT,
  status TEXT DEFAULT 'pending',
  tracks JSONB,
  platforms TEXT[],
  countries TEXT[],
  genre TEXT,
  release_date DATE,
  payment_status TEXT,
  payment_receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### releases_exclusive
Exclusive релизы
```sql
CREATE TABLE releases_exclusive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist_name TEXT,
  cover_url TEXT,
  status TEXT DEFAULT 'pending',
  tracks JSONB,
  platforms TEXT[],
  countries TEXT[],
  genre TEXT,
  release_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### tickets
Тикеты поддержки
```sql
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT,
  subject TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);
```

### ticket_messages
Сообщения в тикетах
```sql
CREATE TABLE ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id),
  content TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### withdrawal_requests
Заявки на вывод
```sql
CREATE TABLE withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_method TEXT,
  payment_details TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## RLS политики

Для каждой таблицы необходимо настроить Row Level Security (RLS).

### Пример для profiles
```sql
-- Включаем RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Пользователь видит только свой профиль
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Пользователь может обновлять свой профиль
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

## Триггеры

### Автосоздание профиля при регистрации
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nickname)
  VALUES (NEW.id, NEW.email, split_part(NEW.email, '@', 1));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Storage Buckets

### covers
Обложки релизов
```sql
INSERT INTO storage.buckets (id, name, public) 
VALUES ('covers', 'covers', true);
```

### tracks
Аудио файлы
```sql
INSERT INTO storage.buckets (id, name, public) 
VALUES ('tracks', 'tracks', false);
```

### payment-receipts
Чеки оплаты
```sql
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-receipts', 'payment-receipts', false);
```
