# 🚀 Инструкция по настройке Supabase для системы релизов

## Шаг 1: Настройка базы данных (SQL)

### 1.1 Откройте Supabase SQL Editor

1. Перейдите на [supabase.com](https://supabase.com)
2. Откройте ваш проект
3. В левом меню выберите **SQL Editor**

### 1.2 Выполните SQL скрипт

1. Нажмите **New query** (новый запрос)
2. Скопируйте содержимое файла `sql/SETUP_RELEASES_COMPLETE.sql`
3. Вставьте в редактор
4. Нажмите **Run** (выполнить) или `Ctrl+Enter`

Этот скрипт:
- ✅ Создаст/обновит таблицу `releases` со всеми необходимыми полями
- ✅ Создаст/обновит таблицу `profiles`
- ✅ Настроит все политики RLS (Row Level Security)
- ✅ Создаст индексы для быстрой работы
- ✅ Настроит автоматическое создание профилей при регистрации

---

## Шаг 2: Настройка Storage для обложек релизов

### 2.1 Создание bucket для обложек

1. В левом меню Supabase выберите **Storage**
2. Нажмите **Create a new bucket**
3. Заполните форму:
   - **Name**: `release-covers`
   - **Public bucket**: ✅ **Включить** (обложки должны быть публичными)
4. Нажмите **Create bucket**

### 2.2 Настройка политик Storage

После создания bucket нужно настроить политики доступа:

#### Политика для загрузки (INSERT)

1. Откройте bucket `release-covers`
2. Перейдите на вкладку **Policies**
3. Нажмите **New Policy**
4. Выберите **For full customization**
5. Заполните:
   - **Policy name**: `Users can upload covers`
   - **Allowed operation**: `INSERT`
   - **Target roles**: `authenticated`
   - **WITH CHECK expression**:
   ```sql
   (bucket_id = 'release-covers'::text) AND 
   (auth.uid()::text = (storage.foldername(name))[1])
   ```
6. Нажмите **Review** → **Save policy**

#### Политика для чтения (SELECT)

1. Нажмите **New Policy** снова
2. Выберите **For full customization**
3. Заполните:
   - **Policy name**: `Anyone can view covers`
   - **Allowed operation**: `SELECT`
   - **Target roles**: `public, authenticated`
   - **USING expression**:
   ```sql
   bucket_id = 'release-covers'::text
   ```
4. Нажмите **Review** → **Save policy**

#### Политика для обновления (UPDATE)

1. Нажмите **New Policy**
2. Выберите **For full customization**
3. Заполните:
   - **Policy name**: `Users can update own covers`
   - **Allowed operation**: `UPDATE`
   - **Target roles**: `authenticated`
   - **USING expression**:
   ```sql
   (bucket_id = 'release-covers'::text) AND 
   (auth.uid()::text = (storage.foldername(name))[1])
   ```
4. Нажмите **Review** → **Save policy**

#### Политика для удаления (DELETE)

1. Нажмите **New Policy**
2. Выберите **For full customization**
3. Заполните:
   - **Policy name**: `Users can delete own covers`
   - **Allowed operation**: `DELETE`
   - **Target roles**: `authenticated`
   - **USING expression**:
   ```sql
   (bucket_id = 'release-covers'::text) AND 
   (auth.uid()::text = (storage.foldername(name))[1])
   ```
4. Нажмите **Review** → **Save policy**

### 2.3 Альтернатива: SQL скрипт для Storage

Или вы можете выполнить SQL скрипт:

```sql
-- Создание bucket для обложек релизов
INSERT INTO storage.buckets (id, name, public)
VALUES ('release-covers', 'release-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Политики для storage
CREATE POLICY "Users can upload covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'release-covers' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Anyone can view covers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'release-covers');

CREATE POLICY "Users can update own covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'release-covers' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own covers"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'release-covers' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## Шаг 3: Настройка ролей пользователей

### 3.1 Установка роли вашему пользователю

Если вы хотите сделать себя админом:

1. Откройте **SQL Editor**
2. Выполните запрос:

```sql
-- Замените 'your-email@example.com' на ваш email
UPDATE profiles 
SET role = 'admin'
WHERE email = 'your-email@example.com';

-- Или по ID пользователя
UPDATE profiles 
SET role = 'admin'
WHERE id = 'ваш-user-id';
```

### 3.2 Установка роли basic/exclusive пользователям

```sql
-- Для basic пользователя (платный план)
UPDATE profiles 
SET role = 'basic'
WHERE email = 'user@example.com';

-- Для exclusive пользователя (бесплатный)
UPDATE profiles 
SET role = 'exclusive'
WHERE email = 'user@example.com';
```

### 3.3 Проверка ролей

```sql
-- Посмотреть всех пользователей и их роли
SELECT id, email, display_name, role, balance
FROM profiles
ORDER BY created_at DESC;
```

---

## Шаг 4: Проверка настройки

### 4.1 Проверка таблицы releases

```sql
-- Проверка всех столбцов
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'releases'
ORDER BY ordinal_position;
```

### 4.2 Проверка политик RLS

```sql
-- Проверка политик для releases
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'releases';

-- Проверка что RLS включен
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'releases';
```

### 4.3 Проверка Storage

```sql
-- Проверка buckets
SELECT * FROM storage.buckets WHERE id = 'release-covers';

-- Проверка политик storage
SELECT * FROM pg_policies WHERE tablename = 'objects';
```

---

## Шаг 5: Тестирование

### 5.1 Проверьте в приложении

1. Откройте приложение
2. Войдите в систему
3. Попробуйте создать релиз
4. Загрузите обложку
5. Нажмите "Отправить на модерацию"

### 5.2 Проверьте в Supabase

```sql
-- Посмотреть созданные релизы
SELECT 
  id,
  title,
  artist_name,
  user_role,
  status,
  payment_status,
  created_at
FROM releases
ORDER BY created_at DESC
LIMIT 10;
```

---

## Возможные проблемы и решения

### ❌ Ошибка "permission denied for table releases"

**Решение:** RLS не настроен. Выполните скрипт `SETUP_RELEASES_COMPLETE.sql`

### ❌ Ошибка "new row violates check constraint"

**Решение:** Передаются некорректные значения для enum полей (status, payment_status, user_role)

### ❌ Ошибка при загрузке обложки

**Решение:** 
1. Проверьте что bucket `release-covers` создан
2. Проверьте что bucket публичный
3. Проверьте политики storage

### ❌ Профиль не создаётся автоматически

**Решение:** Триггер не настроен. Выполните раздел 7 из `SETUP_RELEASES_COMPLETE.sql`

---

## Дополнительные настройки

### Создание bucket для чеков об оплате (для Basic)

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-receipts', 'payment-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Политики (только админы видят чеки)
CREATE POLICY "Users can upload receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-receipts' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins can view receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-receipts' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'owner')
  )
);
```

---

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте консоль браузера (F12)
2. Проверьте логи в Supabase (раздел Logs)
3. Убедитесь что все шаги выполнены по порядку

Удачи! 🎵
