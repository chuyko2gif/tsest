# 🔥 СРОЧНОЕ ИСПРАВЛЕНИЕ РОЛЕЙ - ПРОСТАЯ ИНСТРУКЦИЯ

## Проблема
В БД роль = owner, но на сайте показывает basic

## ЧТО ВЫПОЛНИТЬ В БАЗЕ ДАННЫХ:

### ВАРИАНТ 1: Быстрое исправление (скопируйте и выполните)
```sql
-- Удаляем всё что сбрасывает роли
DROP TRIGGER IF EXISTS set_default_role_trigger ON profiles;
DROP TRIGGER IF EXISTS set_role_on_insert_trigger ON profiles;
DROP FUNCTION IF EXISTS set_default_role();
DROP FUNCTION IF EXISTS set_role_for_new_users();
ALTER TABLE profiles ALTER COLUMN role DROP DEFAULT;

-- Устанавливаем owner
UPDATE profiles SET role = 'owner' WHERE email = 'maksbroska@gmail.com';
UPDATE profiles SET role = 'owner' WHERE email = 'littlehikai@gmail.com';

-- Создаем триггер ТОЛЬКО для новых пользователей
CREATE OR REPLACE FUNCTION set_role_for_new_users()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS NULL OR NEW.role = '' THEN
    NEW.role := 'basic';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_role_on_insert_trigger
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_role_for_new_users();

-- Создаем защиту от изменения owner
CREATE OR REPLACE FUNCTION protect_owner_role()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role = 'owner' AND NEW.role != 'owner' THEN
    RAISE EXCEPTION 'Нельзя изменить роль OWNER!';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS protect_roles_trigger ON profiles;
CREATE TRIGGER protect_roles_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION protect_owner_role();

-- Проверка
SELECT email, role, nickname FROM profiles WHERE email IN ('maksbroska@gmail.com', 'littlehikai@gmail.com');
```

### ВАРИАНТ 2: Полный скрипт
Выполните файл: **sql/EMERGENCY_FIX_ROLES.sql**

### ВАРИАНТ 3: Детальная проверка
Выполните файл: **sql/CHECK_EXACT_ROLE.sql** - покажет ВСЕ детали

## ЧТО СДЕЛАТЬ ПОСЛЕ SQL:

1. **Очистите кеш браузера** полностью:
   - `Ctrl + Shift + Delete`
   - Очистите ВСЁ: cookies, localStorage, кеш
   - Или откройте в режиме инкогнито

2. **Откройте консоль браузера** (F12) и обновите страницу

3. **Проверьте логи** - должны увидеть:
   ```
   🔍 Загрузка профиля для email: maksbroska@gmail.com
   ✅ Профиль найден! Email: maksbroska@gmail.com Роль из БД: owner
   ✅ Устанавливаем роль напрямую: owner
   ✅ Финальная установленная роль в state: owner
   ```

4. **Если всё равно basic** - скопируйте ВСЕ логи из консоли и покажите

## ВОЗМОЖНЫЕ ПРОБЛЕМЫ:

### Если в логах видите "Ошибка загрузки профиля"
- Проверьте RLS политики в Supabase
- Таблица profiles должна быть доступна для чтения

### Если в логах видите "Роль пустая или некорректная"
- Роль в БД действительно пустая
- Выполните SQL скрипт еще раз

### Если логов вообще нет
- Очистите кеш браузера
- Перезапустите dev сервер: `npm run dev`

## ЧТО ИСПРАВЛЕНО В КОДЕ:

1. ✅ Убрали `role: 'basic'` из регистрации
2. ✅ Убрали `role: 'basic'` из создания профиля
3. ✅ Добавили повторную загрузку роли при ошибке
4. ✅ Добавили детальные логи для отладки
5. ✅ Убрали сброс роли на basic при исключениях

## БЫСТРАЯ ПРОВЕРКА В БД:
```sql
SELECT email, role FROM profiles WHERE email = 'maksbroska@gmail.com';
```
Должно показать: `maksbroska@gmail.com | owner`
