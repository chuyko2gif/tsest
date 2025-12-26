# Настройка базы данных для релизов

## Порядок выполнения SQL скриптов:

### 1. Создание основной таблицы релизов
Выполните скрипт: `sql/create_releases_unified.sql`

Этот скрипт создаст:
- Таблицу `releases` для хранения всех релизов (Basic и Exclusive)
- Индексы для быстрого поиска
- RLS политики безопасности
- Функции для работы с релизами:
  - `get_pending_releases()` - получить релизы на модерации
  - `approve_release(release_id, admin_id)` - утвердить релиз
  - `reject_release(release_id, admin_id, reason)` - отклонить релиз
  - `verify_payment(release_id, admin_id, is_verified)` - проверить платеж (для Basic)

### 2. Создание Storage Buckets
Выполните скрипт: `sql/create_storage_for_releases.sql`

Этот скрипт создаст:
- Бакет `payment-receipts` для чеков оплаты (Basic пользователи)
- Бакет `release-covers` для обложек релизов
- RLS политики для безопасного доступа к файлам

## Структура таблицы releases

### Основные поля:
- `id` - UUID первичный ключ
- `user_id` - ID пользователя
- `user_role` - Роль: 'basic' или 'exclusive'
- `status` - Статус: 'pending', 'approved', 'rejected', 'published'

### Информация о релизе:
- `title` - Название релиза
- `artist_name` - Имя артиста
- `cover_url` - URL обложки
- `genre` - Жанр
- `subgenres` - Массив поджанров
- `release_date` - Дата релиза
- `collaborators` - Массив соавторов
- `tracks` - JSONB с треками
- `countries` - Массив стран
- `platforms` - Массив платформ
- `focus_track` - Фокус-трек
- `album_description` - Описание альбома

### Поля для Basic пользователей:
- `payment_status` - Статус оплаты: 'unpaid', 'pending', 'verified', 'rejected'
- `payment_amount` - Сумма оплаты (500₽)
- `payment_receipt_url` - URL чека оплаты
- `payment_verified_at` - Когда проверен платеж
- `payment_verified_by` - Кто проверил платеж

### Служебные поля:
- `contract_agreed` - Согласие с договором
- `rejection_reason` - Причина отклонения
- `admin_notes` - Заметки администратора
- `approved_by` - Кто утвердил
- `approved_at` - Когда утверждено

## Использование в коде

### Создание релиза (Exclusive):
```typescript
const { error } = await supabase
  .from('releases')
  .insert({
    user_id: user.id,
    user_role: 'exclusive',
    title: releaseTitle,
    // ... остальные поля
    status: 'pending',
    payment_status: null
  });
```

### Создание релиза (Basic с оплатой):
```typescript
const { error } = await supabase
  .from('releases')
  .insert({
    user_id: user.id,
    user_role: 'basic',
    title: releaseTitle,
    // ... остальные поля
    status: 'pending',
    payment_status: 'pending',
    payment_amount: 500,
    payment_receipt_url: receiptUrl
  });
```

### Получение релизов на модерации (для админов):
```typescript
const { data, error } = await supabase
  .rpc('get_pending_releases');
```

### Утверждение релиза:
```typescript
const { error } = await supabase
  .rpc('approve_release', {
    release_id: releaseId,
    admin_id: adminUserId
  });
```

### Отклонение релиза:
```typescript
const { error } = await supabase
  .rpc('reject_release', {
    release_id: releaseId,
    admin_id: adminUserId,
    reason: 'Причина отклонения'
  });
```

### Проверка платежа (для Basic):
```typescript
const { error } = await supabase
  .rpc('verify_payment', {
    release_id: releaseId,
    admin_id: adminUserId,
    is_verified: true
  });
```

## Следующие шаги

1. Выполните SQL скрипты в Supabase Dashboard
2. Проверьте создание таблиц и политик
3. Убедитесь, что Storage Buckets созданы
4. Обновите админ панель для отображения релизов на модерации
