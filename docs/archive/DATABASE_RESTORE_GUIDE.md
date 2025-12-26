# 🚨 ПОЛНОЕ ВОССТАНОВЛЕНИЕ БАЗЫ ДАННЫХ

## ЧТО СЛУЧИЛОСЬ
База данных сломалась после изменений. Нужно полностью восстановить все политики, триггеры и роли.

## ⚡ БЫСТРОЕ РЕШЕНИЕ

### 1. ОТКРОЙТЕ SUPABASE SQL EDITOR
https://supabase.com/dashboard → ваш проект → SQL Editor

### 2. ВЫПОЛНИТЕ СКРИПТ
Скопируйте и выполните файл: **sql/FULL_DATABASE_RESTORE.sql**

Или используйте этот короткий вариант:

```sql
-- ОТКЛЮЧАЕМ RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests DISABLE ROW LEVEL SECURITY;

-- УДАЛЯЕМ СТАРЫЕ ПОЛИТИКИ И ТРИГГЕРЫ
DROP POLICY IF EXISTS "Enable update for admins and owners" ON profiles;
DROP TRIGGER IF EXISTS protect_roles_trigger ON profiles;
DROP FUNCTION IF EXISTS protect_owner_role() CASCADE;

-- ВОССТАНАВЛИВАЕМ РОЛИ
UPDATE profiles SET role = 'owner' WHERE email IN ('maksbroska@gmail.com', 'littlehikai@gmail.com');
UPDATE profiles SET role = 'basic' WHERE role IS NULL OR role = '';

-- СОЗДАЕМ ПОЛИТИКИ
CREATE POLICY "Anyone can view profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can update any" ON profiles FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

-- ВКЛЮЧАЕМ RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- ПРОВЕРКА
SELECT email, role FROM profiles;
```

### 3. ОЧИСТИТЕ КЕШ БРАУЗЕРА
- `Ctrl + Shift + Delete`
- Очистите ВСЁ (cookies, localStorage, кеш)
- ИЛИ откройте в **режиме инкогнито**

### 4. ПЕРЕЗАПУСТИТЕ СЕРВЕР
```bash
cd "C:\Users\Asus\Downloads\Telegram Desktop\thq-label"
npm run dev
```

### 5. ПРОВЕРЬТЕ САЙТ
Откройте http://localhost:3000 и войдите в систему

## 🔍 ЧТО ДЕЛАЕТ СКРИПТ

1. ✅ Отключает RLS временно
2. ✅ Удаляет все сломанные политики и триггеры
3. ✅ Восстанавливает роли (owner для ваших email)
4. ✅ Создает правильные RLS политики для всех таблиц
5. ✅ Создает триггеры защиты ролей
6. ✅ Включает RLS обратно
7. ✅ Включает Realtime для обновлений

## ⚠️ ВАЖНО

После выполнения скрипта вы увидите:
```
✅ Шаг 1: RLS отключен
✅ Шаг 2: Старые политики удалены
✅ Шаг 3: Триггеры удалены
...
🎉 БАЗА ДАННЫХ ПОЛНОСТЬЮ ВОССТАНОВЛЕНА!
```

## 📊 ПРОВЕРКА

В конце скрипт покажет:
- 👥 Список всех пользователей с ролями
- 📊 Статистику по ролям
- ⚙️ Список триггеров
- 🔒 Список RLS политик

## ❓ ЕСЛИ НЕ РАБОТАЕТ

### Проблема: "Permission denied"
**Решение:** Вы должны быть owner проекта в Supabase

### Проблема: Сайт не открывается
**Решение:** 
1. Проверьте консоль браузера (F12)
2. Проверьте что dev сервер запущен
3. Убедитесь что .env.local файл правильно настроен

### Проблема: Роль всё равно basic
**Решение:**
1. Выполните в SQL: `SELECT email, role FROM profiles;`
2. Если роль owner в БД - очистите кеш браузера полностью
3. Откройте в режиме инкогнито

## 📁 ФАЙЛЫ

- **sql/FULL_DATABASE_RESTORE.sql** - полный скрипт восстановления (рекомендуется)
- **sql/EMERGENCY_FIX_ROLES.sql** - исправление только ролей
- **sql/CHECK_EXACT_ROLE.sql** - детальная проверка

## 🆘 ПОСЛЕДНЯЯ ИНСТАНЦИЯ

Если ничего не помогает, выполните последовательно:

```sql
-- 1. Проверка подключения
SELECT current_user, current_database();

-- 2. Проверка таблицы
SELECT * FROM profiles LIMIT 1;

-- 3. Установка owner вручную
UPDATE profiles SET role = 'owner' WHERE email = 'maksbroska@gmail.com';

-- 4. Проверка
SELECT email, role FROM profiles WHERE email = 'maksbroska@gmail.com';
```

Результат должен показать: `maksbroska@gmail.com | owner`
