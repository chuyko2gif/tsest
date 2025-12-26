# THQ Label

Платформа для дистрибуции музыки. Next.js 14 + Supabase + Tailwind CSS.

## 🚀 Быстрый старт

```bash
# Установка зависимостей
npm install

# Запуск dev-сервера
npm run dev

# Сборка для продакшена
npm run build
```

Откройте [http://localhost:3000](http://localhost:3000)

## 📁 Структура проекта

```
thq-label/
├── app/                    # Next.js App Router
│   ├── admin/             # 👑 Админ-панель
│   ├── cabinet/           # 🎵 Личный кабинет артиста
│   └── api/               # 🔌 API endpoints
├── components/            # Глобальные компоненты
├── contexts/              # React контексты
├── lib/                   # Утилиты
├── docs/                  # 📚 Документация
├── sql/                   # SQL миграции
└── scripts/               # Скрипты
```

## 📚 Документация

- [docs/README.md](docs/README.md) - Обзор проекта
- [docs/STRUCTURE.md](docs/STRUCTURE.md) - Структура проекта
- [docs/DATABASE.md](docs/DATABASE.md) - Схема базы данных
- [docs/RELEASES.md](docs/RELEASES.md) - Система релизов
- [docs/ADMIN.md](docs/ADMIN.md) - Админ-панель

## 🛠 Технологии

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## 👤 Роли пользователей

| Роль | Описание |
|------|----------|
| `basic` | Платные релизы (500₽ за релиз) |
| `exclusive` | Безлимитные релизы |
| `admin` | Полный доступ к админке |

## 🔧 Переменные окружения

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

## 📧 Email

Настройте SMTP в Supabase для:
- Подтверждение регистрации
- Сброс пароля
- Уведомления

## 📝 Лицензия

Proprietary - THQ Label
