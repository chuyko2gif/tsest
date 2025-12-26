# Управление ролями пользователей

## ✅ Система обновлена!

Теперь **все роли определяются только из базы данных**. Никаких жестко закодированных списков email в коде.

## Типы ролей

- **admin** - полный доступ к админ-панели
- **exclusive** - эксклюзивные артисты с особыми возможностями
- **basic** - обычные пользователи

## Как назначить роль

### Через Supabase SQL Editor

1. Откройте https://supabase.com/dashboard/project/jfbuicudlyiwcrllduai/editor
2. Перейдите в **SQL Editor**
3. Используйте команды:

```sql
-- Назначить админа
UPDATE profiles SET role = 'admin' WHERE email = 'user@example.com';

-- Назначить exclusive артиста
UPDATE profiles SET role = 'exclusive' WHERE email = 'artist@example.com';

-- Вернуть к basic
UPDATE profiles SET role = 'basic' WHERE email = 'user@example.com';
```

### Через интерфейс Supabase

1. Откройте https://supabase.com/dashboard/project/jfbuicudlyiwcrllduai/editor
2. Выберите таблицу **profiles**
3. Найдите нужного пользователя
4. Измените значение в столбце **role** на `admin`, `exclusive` или `basic`
5. Сохраните изменения

### Через админ-панель сайта

Администраторы могут менять роли через `/admin` → вкладка **Пользователи**

## Готовые скрипты

В папке `sql/` есть готовые скрипты:
- `set_admin_role.sql` - установка ролей с примерами
- `fix_user_roles.sql` - массовое обновление ролей

## Проверка ролей

```sql
-- Показать всех админов
SELECT email, nickname, role FROM profiles WHERE role = 'admin';

-- Показать всех exclusive
SELECT email, nickname, role FROM profiles WHERE role = 'exclusive';

-- Показать все роли
SELECT email, nickname, role 
FROM profiles 
ORDER BY 
  CASE role 
    WHEN 'admin' THEN 1 
    WHEN 'exclusive' THEN 2 
    WHEN 'basic' THEN 3 
  END;
```

## Важно!

После изменения роли в базе данных:
1. Пользователь должен **перелогиниться** (выйти и войти заново)
2. Или просто **обновить страницу** - роль подгрузится автоматически

## Текущие админы

По умолчанию админами являются:
- maksbroska@gmail.com
- littlehikai@gmail.com

Если нужно добавить нового админа - используйте SQL команду выше.
