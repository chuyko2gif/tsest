# 📧 НАСТРОЙКА EMAIL ДЛЯ ХОСТА

## Шаг 1: Настройка URL в Supabase

1. Откройте https://supabase.com/dashboard
2. Выберите свой проект
3. Перейдите в **Authentication → URL Configuration**

### Site URL
```
https://thq-git-main-nazarbekansar2108-svgs-projects.vercel.app
```

### Redirect URLs
Добавьте все эти URL:
```
https://thq-git-main-nazarbekansar2108-svgs-projects.vercel.app/**
https://thq-git-main-nazarbekansar2108-svgs-projects.vercel.app/auth
https://thq-git-main-nazarbekansar2108-svgs-projects.vercel.app/auth/callback
https://thq-git-main-nazarbekansar2108-svgs-projects.vercel.app/reset-password
https://thq-git-main-nazarbekansar2108-svgs-projects.vercel.app/cabinet
```

---

## Шаг 2: Email Templates (Шаблоны писем)

⚠️ **ВАЖНО:** Эти шаблоны используются только для смены email через Supabase.
Регистрация и сброс пароля работают через наш SMTP!

Перейдите в **Authentication → Email Templates**

### ✉️ Change Email (Смена email) - ОБЯЗАТЕЛЬНО ОБНОВИТЬ!

**Subject:**
```
Подтвердите смену email для THQ Label
```

**Message Body (HTML):**
```html
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Подтверждение email - THQ Label</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #ffffff;" bgcolor="#ffffff">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #ffffff; padding: 40px 20px;" bgcolor="#ffffff">
        <tr>
            <td align="center">
                <!-- Черная карточка -->
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #0c0c0e; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; overflow: hidden; box-shadow: 0 0 80px rgba(96, 80, 186, 0.15);" bgcolor="#0c0c0e">
                    
                    <!-- Шапка с фиолетовым градиентом -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #6050ba 0%, #9d8df1 100%); padding: 40px 20px; text-align: center;">
                            <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 900; text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3); letter-spacing: -1px;">
                                thqlabel
                            </h1>
                            <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase;">
                                Music Label
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Контент на черном фоне -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; color: white; font-size: 24px; font-weight: 800;">
                                Подтверждение нового email
                            </h2>
                            
                            <p style="margin: 0 0 20px 0; color: rgba(255, 255, 255, 0.7); font-size: 15px; line-height: 1.6;">
                                Вы запросили изменение email адреса вашего аккаунта.
                            </p>
                            
                            <p style="margin: 0 0 30px 0; color: rgba(255, 255, 255, 0.7); font-size: 15px; line-height: 1.6;">
                                Чтобы подтвердить новый email, нажмите на кнопку ниже:
                            </p>
                            
                            <!-- Кнопка -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6050ba 0%, #7060ca 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(96, 80, 186, 0.3);">
                                            Подтвердить Email
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Информационный блок -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 20px; margin: 0 0 20px 0;">
                                <tr>
                                    <td style="color: rgba(255, 255, 255, 0.6); font-size: 13px; line-height: 1.6;">
                                        <p style="margin: 0 0 10px 0;">
                                            • Ссылка действительна в течение 60 минут
                                        </p>
                                        <p style="margin: 0 0 10px 0;">
                                            • После подтверждения вы сможете войти с новым email
                                        </p>
                                        <p style="margin: 0;">
                                            • Если вы не запрашивали смену email, проигнорируйте это письмо
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <hr style="border: none; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 30px 0;">
                            
                            <p style="margin: 0; color: rgba(255, 255, 255, 0.5); font-size: 13px; line-height: 1.6;">
                                Если вы не запрашивали изменение email, просто проигнорируйте это письмо — с вашим аккаунтом всё в порядке.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Подвал -->
                    <tr>
                        <td style="background: rgba(255, 255, 255, 0.02); padding: 30px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.05);">
                            <p style="margin: 0 0 10px 0; color: rgba(255, 255, 255, 0.4); font-size: 12px;">
                                © 2025 thqlabel. Все права защищены.
                            </p>
                            <p style="margin: 0; color: rgba(255, 255, 255, 0.3); font-size: 11px;">
                                Это автоматическое письмо, пожалуйста, не отвечайте на него.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

### 📝 Confirm Signup - МОЖНО ПРОПУСТИТЬ
(Не используется - регистрация идет через наш SMTP)

### 🔑 Reset Password - МОЖНО ПРОПУСТИТЬ  
(Не используется - сброс пароля идет через наш SMTP)

---

## Шаг 3: Email Settings

Перейдите в **Authentication → Providers → Email**

### ВАЖНО! Включите:
- ✅ **Enable Email provider** - должен быть включён!
- ✅ **Confirm email** - ОБЯЗАТЕЛЬНО включить для подтверждения
- ⚠️ **Enable auto-confirm** - должен быть ВЫКЛЮЧЕН (иначе письма не шлются)

### Дополнительно:
- ✅ **Secure email change enabled** - двойное подтверждение при смене email

### Rate Limiting:
- Emails per hour: `10` (защита от спама)

---

## Шаг 3.1: Проверьте SMTP

Перейдите в **Project Settings → Auth**

### Убедитесь:
- **SMTP Host** должен быть настроен (или оставить пустым для Supabase SMTP)
- Если пусто - Supabase будет использовать свой встроенный SMTP (работает!)

---

## Шаг 4: SMTP Settings (Отправка email)

По умолчанию Supabase использует свой SMTP. Это работает, но:
- Может попадать в спам
- Ограничение 4 письма в час на бесплатном плане

### Опционально: Свой SMTP (Gmail)

Если хочешь использовать свой email:

1. **Settings → Project Settings → SMTP Settings**
2. Enable Custom SMTP Server

**Настройки для Gmail:**
```
Host: smtp.gmail.com
Port: 587
Username: your-email@gmail.com
Password: [App Password - создай в настройках Google]
Sender email: your-email@gmail.com
Sender name: THQ Label
```

**Получить App Password:**
1. https://myaccount.google.com/security
2. Включить двухфакторную аутентификацию
3. App passwords → Создать пароль

---

## ✅ Проверка работы

После настройки проверь:

1. **Регистрация нового пользователя:**
   - https://thq-git-main-nazarbekansar2108-svgs-projects.vercel.app/auth
   - Зарегистрируйся с новым email
   - Проверь почту - должно прийти письмо

2. **Сброс пароля:**
   - https://thq-git-main-nazarbekansar2108-svgs-projects.vercel.app/auth
   - Нажми "Забыли пароль?"
   - Введи email
   - Проверь почту

3. **Смена email (в кабинете):**
   - https://thq-git-main-nazarbekansar2108-svgs-projects.vercel.app/change-email
   - Смени email
   - Проверь обе почты (старую и новую)

---

## 🔍 Проверка логов

Если email не приходят:

1. Supabase Dashboard → **Logs → Edge Functions**
2. Ищи ошибки с email
3. Проверь спам в почте
4. Проверь что URL правильные

---

## 📋 Checklist

- [ ] Site URL настроен (`https://thq-git-main-nazarbekansar2108-svgs-projects.vercel.app`)
- [ ] Redirect URLs добавлены (все 5 штук)
- [ ] Email templates обновлены (русский текст + THQ Label)
- [ ] Email confirmations включены
- [ ] Проверена регистрация - письмо приходит
- [ ] Проверен сброс пароля - письмо приходит
- [ ] (Опционально) SMTP настроен, если используешь Gmail

---

**Готово! Теперь email будут работать на хосте! ✅**
