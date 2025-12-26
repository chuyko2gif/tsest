# СРОЧНО - ИСПРАВЛЕНИЕ ОШИБКИ

## Проблема
Получаете ошибку: `Unexpected token '<', "<!DOCTYPE"... is not valid JSON`

## Причина
Таблица `linked_accounts` не существует в базе данных, поэтому API возвращает HTML ошибку вместо JSON.

## РЕШЕНИЕ - 3 ШАГА

### Шаг 1: Создать таблицу в Supabase

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите ваш проект
3. Зайдите в **SQL Editor** (слева в меню)
4. Нажмите **New Query**
5. Скопируйте и вставьте весь код из файла `sql/COMPLETE_LINKED_ACCOUNTS_SETUP.sql`
6. Нажмите **Run** (или F5)
7. Дождитесь сообщения "Success. No rows returned"

### Шаг 2: Проверить Environment Variables

Откройте `.env.local` и убедитесь, что там есть ВСЕ 3 переменные:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ваш-проект.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ваш-anon-key
SUPABASE_SERVICE_ROLE_KEY=ваш-service-role-key
```

**Service Role Key** найдите здесь:
- Supabase Dashboard → Settings → API → Project API keys → `service_role` (секретный ключ)

### Шаг 3: Перезапустить сервер

В терминале:

1. Остановите сервер (Ctrl+C)
2. Запустите снова:
   ```bash
   npm run dev
   ```

## Проверка что все работает

После выполнения всех шагов:

1. Откройте в браузере: http://localhost:3000/api/linked-accounts/health
2. Должны увидеть JSON с `"status": "ok"`:
   ```json
   {
     "status": "ok",
     "timestamp": "...",
     "environment": {
       "hasUrl": true,
       "hasServiceKey": true
     },
     "database": {
       "tableExists": true
     }
   }
   ```

3. Если все ОК, зайдите в настройки личного кабинета
4. Найдите раздел "Linked Accounts" (Связанные аккаунты)
5. Попробуйте добавить аккаунт

## Если все еще не работает

Откройте браузер → F12 → Console → Network → найдите запрос к `/api/linked-accounts`
- Посмотрите Response - должен быть JSON, а не HTML
- Если HTML - значит:
  - Таблица не создалась (повторите Шаг 1)
  - Service Role Key неправильный (проверьте Шаг 2)
  - Сервер не перезапустился (повторите Шаг 3)

## Нужна помощь?

1. Проверьте файл: `TROUBLESHOOT_LINKED_ACCOUNTS.md`
2. Или напишите мне что показывает: http://localhost:3000/api/linked-accounts/health
