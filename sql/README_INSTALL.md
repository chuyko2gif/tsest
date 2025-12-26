# 🚨 DRAG & DROP НЕ РАБОТАЕТ? СДЕЛАЙ ЭТО!

## ⚡ ВАРИАНТ 1: Основной (рекомендуется)

### Файл: `sql/SIMPLE_DRAFT_ORDERING.sql`

1. **Открой Supabase** → SQL Editor → New Query
2. **Скопируй ВЕСЬ файл** `SIMPLE_DRAFT_ORDERING.sql`
3. **Вставь и нажми RUN**
4. Должно быть: ✅ Success

---

## 🔧 ВАРИАНТ 2: Если первый не работает

### Файл: `sql/MINIMAL_DRAFT_ORDER.sql`

**Это самая простая версия!**

1. Открой Supabase SQL Editor
2. Скопируй файл `MINIMAL_DRAFT_ORDER.sql`
3. Выполни (RUN)

---

## 📋 ВАРИАНТ 3: Ручная установка (копируй построчно)

Если оба варианта не работают, выполняй команды по одной:

### 1. Добавь поля:
```sql
ALTER TABLE releases_basic ADD COLUMN IF NOT EXISTS draft_order INTEGER;
ALTER TABLE releases_exclusive ADD COLUMN IF NOT EXISTS draft_order INTEGER;
```

### 2. Дай номера черновикам (basic):
```sql
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as num
  FROM releases_basic WHERE status = 'draft'
)
UPDATE releases_basic SET draft_order = numbered.num
FROM numbered WHERE releases_basic.id = numbered.id;
```

### 3. Дай номера черновикам (exclusive):
```sql
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as num
  FROM releases_exclusive WHERE status = 'draft'
)
UPDATE releases_exclusive SET draft_order = numbered.num
FROM numbered WHERE releases_exclusive.id = numbered.id;
```

### 4. Создай функцию (скопируй всё сразу):
```sql
CREATE OR REPLACE FUNCTION reorder_draft_release(
  p_release_id UUID,
  p_new_position INTEGER,
  p_table_name TEXT
)
RETURNS void AS $$
DECLARE v_user_id UUID;
BEGIN
  IF p_table_name = 'basic' THEN
    SELECT user_id INTO v_user_id FROM releases_basic WHERE id = p_release_id;
    UPDATE releases_basic SET draft_order = 99999 WHERE id = p_release_id;
    WITH numbered AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY 
        CASE WHEN id = p_release_id THEN p_new_position ELSE draft_order END
      ) as num
      FROM releases_basic WHERE user_id = v_user_id AND status = 'draft'
    )
    UPDATE releases_basic SET draft_order = numbered.num
    FROM numbered WHERE releases_basic.id = numbered.id;
  ELSE
    SELECT user_id INTO v_user_id FROM releases_exclusive WHERE id = p_release_id;
    UPDATE releases_exclusive SET draft_order = 99999 WHERE id = p_release_id;
    WITH numbered AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY 
        CASE WHEN id = p_release_id THEN p_new_position ELSE draft_order END
      ) as num
      FROM releases_exclusive WHERE user_id = v_user_id AND status = 'draft'
    )
    UPDATE releases_exclusive SET draft_order = numbered.num
    FROM numbered WHERE releases_exclusive.id = numbered.id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5. Дай права:
```sql
GRANT EXECUTE ON FUNCTION reorder_draft_release TO authenticated;
```

### 6. Проверь:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'releases_basic' AND column_name = 'draft_order';
```

Должно вернуть: **draft_order** ✅

---

## 🧪 ТЕСТИРОВАНИЕ

После выполнения SQL:

```bash
# 1. Перезапусти приложение
npm run dev

# 2. Открой браузер
# 3. Зайди в "Архив (Черновики)"
# 4. Перетащи черновик
# 5. Обнови страницу (F5)
# 6. Порядок сохранился? ✅ РАБОТАЕТ!
```

---

## ❌ ЧТО ДЕЛАТЬ ЕСЛИ ОШИБКА

### Ошибка: "column draft_order already exists"
```sql
-- Удали и создай заново:
ALTER TABLE releases_basic DROP COLUMN IF EXISTS draft_order;
ALTER TABLE releases_exclusive DROP COLUMN IF EXISTS draft_order;
```
Потом снова выполни один из вариантов.

### Ошибка: "function reorder_draft_release already exists"
```sql
-- Удали старую:
DROP FUNCTION IF EXISTS reorder_draft_release;
```
Потом снова создай функцию.

### Ошибка: "permission denied for function reorder_draft_release"
```sql
-- Дай права:
GRANT EXECUTE ON FUNCTION reorder_draft_release TO authenticated;
GRANT EXECUTE ON FUNCTION reorder_draft_release TO anon;
```

---

## 💡 ПРОВЕРКА РАБОТЫ

**Тест 1: Поле создано?**
```sql
SELECT draft_order FROM releases_basic WHERE status = 'draft' LIMIT 1;
```
Если ошибка "column does not exist" → поле не создано!

**Тест 2: Функция существует?**
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'reorder_draft_release';
```
Должно вернуть: **reorder_draft_release** ✅

**Тест 3: Черновики пронумерованы?**
```sql
SELECT id, title, draft_order FROM releases_basic 
WHERE status = 'draft' ORDER BY draft_order;
```
Должны быть цифры: 1, 2, 3, 4... ✅

---

## 🆘 ВСЕ РАВНО НЕ РАБОТАЕТ?

**Напиши мне:**
1. Какой вариант пробовал? (1, 2 или 3)
2. Текст ошибки из Supabase
3. Результат проверки (Тесты 1, 2, 3)

Я точно помогу! 💪
