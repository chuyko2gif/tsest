# Настройка смены Email

## Что сделано:

1. ✅ Создана страница `/change-email` для подтверждения смены email
2. ✅ Добавлен параметр `emailRedirectTo` в функцию смены email
3. ✅ Уведомления справа снизу с анимацией
4. ✅ Автоматическое обновление email в Supabase Auth

## Что нужно сделать в Supabase Dashboard:

### 1. Добавить Redirect URL для смены email

Зайдите в Supabase Dashboard:
1. **Authentication** → **URL Configuration**
2. **Redirect URLs** → Добавить:
   - `http://localhost:3000/change-email`
   - `http://localhost:3001/change-email` (если используете порт 3001)
3. Нажать **Save**

### 2. Проверить email template

В **Authentication** → **Email Templates** → **Change Email Address**:
- Убедитесь, что используется `{{ .ConfirmationURL }}`
- Шаблон должен быть обновлён на черную карточку (см. email-templates/email-change-template.html)

## Как это работает:

1. Пользователь в кабинете вводит новый email и нажимает "Сменить email"
2. Supabase отправляет письмо с ссылкой на новый email
3. Пользователь кликает по ссылке в письме
4. Открывается страница `/change-email`
5. Страница автоматически обрабатывает токен из URL
6. Email обновляется в базе данных
7. Пользователь перенаправляется обратно в `/cabinet`

## Важно:

- Email меняется ТОЛЬКО после подтверждения по ссылке из письма
- Старый email остаётся активным до подтверждения нового
- Все данные пользователя сохраняются (profile, releases, etc.)
- Supabase автоматически обновляет email в таблице `auth.users`
- В таблице `profiles` email обновится автоматически через триггер или RLS

## Для продакшена:

Добавить в Redirect URLs:
- `https://yourdomain.com/change-email`
