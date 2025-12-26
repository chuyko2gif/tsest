# 🚀 Быстрый старт: Раздельные таблицы релизов

## Что делает этот апгрейд?

Создает **две отдельные таблицы** вместо одной:
- `releases_basic` - для платных релизов (Basic план)
- `releases_exclusive` - для бесплатных релизов (Exclusive план)

**Преимущества:**
- ✅ Нет конфликтов в структуре данных
- ✅ Четкое разделение логики оплаты
- ✅ Проще модерировать и масштабировать
- ✅ **Не затрагивает существующие таблицы!**

---

## ⚡ Пошаговая инструкция

### Шаг 1: Создание новых таблиц (5 минут)

1. Откройте **Supabase Dashboard** → **SQL Editor**
2. Создайте новый запрос
3. Скопируйте содержимое файла:
   ```
   sql/CREATE_SEPARATE_RELEASES_TABLES.sql
   ```
4. Нажмите **Run** (выполнить)

✅ **Готово!** Созданы таблицы `releases_basic` и `releases_exclusive`

---

### Шаг 2: Обновление кода (10 минут)

#### 2.1 Basic релизы

**Файл:** `app/cabinet/release-basic/create/components/SendStep.tsx`

Найдите строку (~238):
```typescript
.from('releases')
```

Замените на:
```typescript
.from('releases_basic')
```

И удалите поле `user_role` из объекта `releaseData` (~224):
```typescript
// Удалите эту строку:
user_role: 'basic',
```

---

#### 2.2 Exclusive релизы

**Файл:** `app/cabinet/release/create/components/SendStep.tsx`

Найдите строку (~239):
```typescript
.from('releases')
```

Замените на:
```typescript
.from('releases_exclusive')
```

И удалите поля `user_role` и `payment_status` из объекта `releaseData` (~224):
```typescript
// Удалите эти строки:
user_role: 'exclusive',
payment_status: null,
```

---

#### 2.3 Админ панель

**Файл:** `app/admin/components/ReleasesModeration.tsx`

Замените вызов функции (~34):
```typescript
// Было:
const { data, error } = await supabase.rpc('get_pending_releases');

// Стало:
const { data, error } = await supabase.rpc('get_all_pending_releases');
```

И обновите функции утверждения/отклонения (~60, ~80):
```typescript
// Для утверждения:
const functionName = selectedRelease.release_type === 'basic' 
  ? 'approve_basic_release' 
  : 'approve_exclusive_release';

const { error } = await supabase.rpc(functionName, {
  release_id: selectedRelease.id,
  admin_id: user.id
});

// Для отклонения:
const functionName = selectedRelease.release_type === 'basic' 
  ? 'reject_basic_release' 
  : 'reject_exclusive_release';

const { error } = await supabase.rpc(functionName, {
  release_id: selectedRelease.id,
  admin_id: user.id,
  reason: rejectionReason
});
```

Добавьте поле `release_type` в интерфейс Release:
```typescript
interface Release {
  // ... существующие поля ...
  release_type: 'basic' | 'exclusive';  // ← добавить
}
```

---

### Шаг 3: Тестирование (5 минут)

1. ✅ Создайте тестовый Basic релиз
2. ✅ Создайте тестовый Exclusive релиз
3. ✅ Проверьте отображение в админ панели
4. ✅ Протестируйте модерацию

**Проверка в Supabase:**
```sql
-- Посмотреть созданные релизы
SELECT COUNT(*) as basic_count FROM releases_basic;
SELECT COUNT(*) as exclusive_count FROM releases_exclusive;

-- Посмотреть все релизы на модерации
SELECT * FROM get_all_pending_releases();
```

---

### Шаг 4: Миграция старых данных (опционально)

**Если у вас уже есть данные в таблице `releases`:**

1. Откройте **Supabase Dashboard** → **SQL Editor**
2. Скопируйте содержимое файла:
   ```
   sql/MIGRATE_OLD_RELEASES_DATA.sql
   ```
3. Выполните скрипт
4. Проверьте вывод в консоли - должны совпасть количества записей

После успешной миграции старая таблица будет переименована в `releases_old_backup` для безопасности.

---

## 📊 Что изменилось в структуре?

### До (одна таблица):
```
releases
├── id
├── user_role ('basic' | 'exclusive')
├── payment_status (смешанная логика)
└── ...
```

### После (две таблицы):
```
releases_basic                releases_exclusive
├── id                        ├── id
├── payment_status ✓          ├── (нет оплаты)
├── payment_amount ✓          └── ...
└── ...                       
```

---

## 🔍 Доступные функции в Supabase

### Для админов:

```typescript
// Получить все релизы на модерации (Basic + Exclusive)
await supabase.rpc('get_all_pending_releases');

// Получить только Basic релизы
await supabase.rpc('get_pending_basic_releases');

// Получить только Exclusive релизы
await supabase.rpc('get_pending_exclusive_releases');

// Утвердить Basic релиз
await supabase.rpc('approve_basic_release', { release_id, admin_id });

// Утвердить Exclusive релиз
await supabase.rpc('approve_exclusive_release', { release_id, admin_id });

// Отклонить Basic релиз
await supabase.rpc('reject_basic_release', { release_id, admin_id, reason });

// Отклонить Exclusive релиз
await supabase.rpc('reject_exclusive_release', { release_id, admin_id, reason });

// Подтвердить оплату Basic релиза
await supabase.rpc('verify_basic_payment', { release_id, admin_id });

// Отклонить оплату Basic релиза
await supabase.rpc('reject_basic_payment', { release_id, admin_id, reason });
```

---

## ❓ FAQ

### Что будет со старой таблицей `releases`?

Ничего! Она остается нетронутой. Новые таблицы создаются отдельно.

### Нужно ли удалять старую таблицу?

Нет, можно оставить для резервной копии. После успешной миграции её можно переименовать или удалить.

### Что если я уже использую `update_updated_at_column()`?

Скрипт проверяет существование функции и не создаст дубликат.

### Как откатить изменения?

```sql
DROP TABLE IF EXISTS releases_basic CASCADE;
DROP TABLE IF EXISTS releases_exclusive CASCADE;
DROP FUNCTION IF EXISTS get_all_pending_releases();
DROP FUNCTION IF EXISTS get_pending_basic_releases();
DROP FUNCTION IF EXISTS get_pending_exclusive_releases();
DROP FUNCTION IF EXISTS approve_basic_release(UUID, UUID);
DROP FUNCTION IF EXISTS reject_basic_release(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS verify_basic_payment(UUID, UUID);
DROP FUNCTION IF EXISTS reject_basic_payment(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS approve_exclusive_release(UUID, UUID);
DROP FUNCTION IF EXISTS reject_exclusive_release(UUID, UUID, TEXT);
```

---

## ✅ Чеклист внедрения

- [ ] Выполнен SQL скрипт `CREATE_SEPARATE_RELEASES_TABLES.sql`
- [ ] Обновлен `SendStep.tsx` для Basic релизов
- [ ] Обновлен `SendStep.tsx` для Exclusive релизов
- [ ] Обновлен `ReleasesModeration.tsx` в админ панели
- [ ] Протестировано создание Basic релиза
- [ ] Протестировано создание Exclusive релиза
- [ ] Протестирована модерация
- [ ] (Опционально) Мигрированы старые данные

---

## 🎉 Готово!

Теперь у вас:
- ✅ Две отдельные таблицы без конфликтов
- ✅ Четкое разделение логики оплаты
- ✅ Упрощенная модерация
- ✅ Безопасная структура данных

**Детальная документация:**
- `SEPARATE_RELEASES_MIGRATION.md` - полная инструкция
- `CODE_UPDATES_FOR_SEPARATE_TABLES.md` - примеры кода
