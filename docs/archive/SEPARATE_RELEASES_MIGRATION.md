# 🔄 Миграция на отдельные таблицы релизов

## Проблема

В текущей системе используется одна таблица `releases` для двух типов релизов:
- **Basic** (платные релизы с обязательной оплатой)
- **Exclusive** (бесплатные релизы)

Это вызывает конфликты:
- ❌ Смешанная логика обработки оплаты
- ❌ Необязательные поля для одних, обязательные для других
- ❌ Сложность в модерации и разделении типов
- ❌ Возможные конфликты в RLS политиках

## Решение

Создание двух отдельных таблиц:
- ✅ `releases_basic` - для платных Basic релизов
- ✅ `releases_exclusive` - для бесплатных Exclusive релизов

## 📋 Шаги миграции

### Шаг 1: Создание новых таблиц

1. Откройте **Supabase Dashboard** → **SQL Editor**
2. Создайте новый запрос
3. Скопируйте содержимое файла `sql/CREATE_SEPARATE_RELEASES_TABLES.sql`
4. Выполните скрипт

Скрипт создаст:
- ✅ Таблицу `releases_basic` со всеми полями для платных релизов
- ✅ Таблицу `releases_exclusive` для бесплатных релизов
- ✅ RLS политики для обеих таблиц
- ✅ Функции модерации для каждого типа релизов
- ✅ Общую функцию для получения всех релизов

### Шаг 2: Миграция существующих данных (опционально)

Если у вас уже есть данные в таблице `releases`:

1. Откройте файл `sql/CREATE_SEPARATE_RELEASES_TABLES.sql`
2. Найдите секцию **"9. МИГРАЦИЯ ДАННЫХ"** (в конце файла)
3. Раскомментируйте блок миграции
4. Выполните скрипт

Это перенесет:
- Basic релизы → `releases_basic`
- Exclusive релизы → `releases_exclusive`

### Шаг 3: Обновление кода приложения

Необходимо обновить следующие файлы:

#### 1. Basic релизы: `app/cabinet/release-basic/create/components/SendStep.tsx`

Заменить:
```typescript
const { error: insertError } = await supabase
  .from('releases')
  .insert(releaseData);
```

На:
```typescript
const { error: insertError } = await supabase
  .from('releases_basic')
  .insert(releaseData);
```

И удалить поле `user_role` из `releaseData`, так как теперь тип определяется таблицей.

#### 2. Exclusive релизы: `app/cabinet/release/create/components/SendStep.tsx`

Заменить:
```typescript
const { error: insertError } = await supabase
  .from('releases')
  .insert(releaseData);
```

На:
```typescript
const { error: insertError } = await supabase
  .from('releases_exclusive')
  .insert(releaseData);
```

И удалить поля `user_role` и `payment_status` из `releaseData`.

#### 3. Админ панель: `app/admin/components/ReleasesModeration.tsx`

Заменить:
```typescript
const { data, error } = await supabase.rpc('get_pending_releases');
```

На:
```typescript
const { data, error } = await supabase.rpc('get_all_pending_releases');
```

И обновить функции утверждения/отклонения:

```typescript
// Для Basic релизов
await supabase.rpc('approve_basic_release', { release_id, admin_id });
await supabase.rpc('reject_basic_release', { release_id, admin_id, reason });
await supabase.rpc('verify_basic_payment', { release_id, admin_id });

// Для Exclusive релизов
await supabase.rpc('approve_exclusive_release', { release_id, admin_id });
await supabase.rpc('reject_exclusive_release', { release_id, admin_id, reason });
```

#### 4. Админ панель: `app/admin/page.tsx`

Аналогично обновить вызовы функций модерации.

### Шаг 4: Обновление компонента отображения релизов

В компонентах, где отображаются релизы пользователя (личный кабинет), нужно загружать данные из обеих таблиц:

```typescript
// Загрузка релизов пользователя
const loadReleases = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Получаем профиль для определения роли
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  let releases = [];

  if (profile?.role === 'basic') {
    const { data } = await supabase
      .from('releases_basic')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    releases = data || [];
  } else if (profile?.role === 'exclusive') {
    const { data } = await supabase
      .from('releases_exclusive')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    releases = data || [];
  }

  setReleases(releases);
};
```

## 🔍 Проверка работы

### Проверка таблиц
```sql
-- Проверка структуры
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('releases_basic', 'releases_exclusive')
ORDER BY table_name, ordinal_position;

-- Проверка данных
SELECT COUNT(*) as basic_count FROM releases_basic;
SELECT COUNT(*) as exclusive_count FROM releases_exclusive;
```

### Проверка функций
```sql
-- Получение всех релизов на модерации
SELECT * FROM get_all_pending_releases();

-- Получение Basic релизов
SELECT * FROM get_pending_basic_releases();

-- Получение Exclusive релизов
SELECT * FROM get_pending_exclusive_releases();
```

### Проверка RLS
```sql
-- Проверка политик
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('releases_basic', 'releases_exclusive');
```

## 📊 Преимущества новой структуры

### ✅ Четкое разделение
- Basic релизы в отдельной таблице с обязательными полями оплаты
- Exclusive релизы без полей оплаты

### ✅ Упрощенная модерация
- Отдельные функции для каждого типа релизов
- Общая функция для получения всех релизов на модерации
- Проще фильтровать и обрабатывать

### ✅ Улучшенная производительность
- Меньше условий в запросах
- Более эффективные индексы
- Четкие политики RLS

### ✅ Масштабируемость
- Легко добавлять новые поля для каждого типа
- Независимые изменения структуры
- Проще расширять функционал

## 🗑️ Очистка после миграции

После успешной миграции и проверки работы новых таблиц:

```sql
-- Переименуйте старую таблицу для резервной копии
ALTER TABLE releases RENAME TO releases_old_backup;

-- Или полностью удалите её (ОСТОРОЖНО!)
-- DROP TABLE releases CASCADE;
```

## 🆘 Откат изменений

Если что-то пошло не так:

```sql
-- Удалить новые таблицы
DROP TABLE IF EXISTS releases_basic CASCADE;
DROP TABLE IF EXISTS releases_exclusive CASCADE;

-- Удалить функции
DROP FUNCTION IF EXISTS get_pending_basic_releases();
DROP FUNCTION IF EXISTS get_pending_exclusive_releases();
DROP FUNCTION IF EXISTS approve_basic_release(UUID, UUID);
DROP FUNCTION IF EXISTS reject_basic_release(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS verify_basic_payment(UUID, UUID);
DROP FUNCTION IF EXISTS reject_basic_payment(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS approve_exclusive_release(UUID, UUID);
DROP FUNCTION IF EXISTS reject_exclusive_release(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS get_all_pending_releases();

-- Восстановить старую таблицу (если была переименована)
ALTER TABLE releases_old_backup RENAME TO releases;
```

## 📝 Что дальше?

После миграции:
1. ✅ Протестируйте создание Basic релиза
2. ✅ Протестируйте создание Exclusive релиза
3. ✅ Протестируйте модерацию в админ панели
4. ✅ Проверьте отображение релизов в личном кабинете
5. ✅ Убедитесь, что все функции работают корректно

## 🎯 Итого

Новая структура устраняет конфликты и делает систему:
- **Понятнее** - четкое разделение типов
- **Надежнее** - меньше условий и ошибок
- **Быстрее** - оптимизированные запросы
- **Гибче** - проще расширять функционал
