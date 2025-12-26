# Настройка индикатора "печатает..."

## Что реализовано

Добавлена система отслеживания когда пользователь или админ печатает сообщение в чате поддержки.

### Компоненты:

1. **Таблица базы данных** `typing_status`
   - Хранит информацию о том, кто сейчас печатает
   - Автоматически очищается через 5 секунд неактивности

2. **API endpoint** `/api/support/tickets/[id]/typing`
   - POST: Обновляет статус печати
   - GET: Получает статус печати другого пользователя

3. **UI компоненты**:
   - В пользовательском чате: "Админ печатает..."
   - В админ панели: "Пользователь печатает..."
   - Анимированные точки (bounce animation)

## Установка

### Шаг 1: Создать таблицу в Supabase

Выполните этот SQL в Supabase SQL Editor:

```sql
-- Создаем таблицу для хранения статуса печати
CREATE TABLE IF NOT EXISTS public.typing_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL,
  user_id UUID NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(ticket_id, user_id)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_typing_status_ticket_id ON public.typing_status(ticket_id);
CREATE INDEX IF NOT EXISTS idx_typing_status_last_activity ON public.typing_status(last_activity);

-- Функция для автоматической очистки старых записей
CREATE OR REPLACE FUNCTION clean_old_typing_status()
RETURNS void AS $$
BEGIN
  DELETE FROM public.typing_status
  WHERE last_activity < NOW() - INTERVAL '5 seconds';
END;
$$ LANGUAGE plpgsql;
```

### Шаг 2: Проверить работу

1. Откройте чат поддержки от имени пользователя
2. Откройте тот же тикет в админ панели
3. Начните печатать в одном из окон
4. Во втором окне должно появиться сообщение "[Админ/Пользователь] печатает..." с анимированными точками

## Как это работает

1. **При вводе текста** (onChange в textarea):
   - Отправляется POST запрос с `isTyping: true`
   - В базу добавляется/обновляется запись со временем последней активности

2. **Каждую секунду** (setInterval 1000ms):
   - GET запрос проверяет есть ли активный статус печати от другого пользователя
   - Если найден статус моложе 5 секунд - показывается индикатор

3. **Автоматическое скрытие**:
   - Через 3 секунды после последнего обновления индикатор исчезает
   - Старые записи в БД удаляются функцией `clean_old_typing_status()`

## Производительность

- Минимальная нагрузка на сервер
- Запросы выполняются только когда тикет открыт
- Используется debouncing для уменьшения количества запросов
- Старые записи автоматически очищаются

## Файлы с изменениями

- `app/api/support/tickets/[id]/typing/route.ts` - API endpoint
- `app/cabinet/components/SupportSidebar.tsx` - Пользовательский интерфейс
- `app/admin/components/AdminTicketsPanel.tsx` - Админ панель
- `sql/add_typing_status_table.sql` - SQL схема таблицы

## Примечание

В production-окружении лучше использовать Redis для хранения временных данных о статусе печати, но для текущей реализации использование PostgreSQL вполне допустимо.
