# Структура проекта THQ Label

## Корневая структура

```
thq-label/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Главная страница
│   ├── layout.tsx         # Корневой layout
│   ├── globals.css        # Глобальные стили
│   ├── about/             # Страница "О нас"
│   ├── admin/             # Админ-панель
│   ├── api/               # API endpoints
│   ├── auth/              # Авторизация
│   ├── cabinet/           # Личный кабинет артиста
│   ├── contacts/          # Контакты
│   ├── dashboard/         # Дашборд (редирект)
│   ├── faq/               # FAQ
│   ├── feed/              # Лента новостей
│   ├── news/              # Новости
│   └── reset-password/    # Сброс пароля
│
├── components/            # 📁 Глобальные компоненты
│   ├── index.ts           # Главный экспорт
│   ├── effects/           # Визуальные эффекты
│   │   ├── AnimatedBackground.tsx
│   │   └── index.ts
│   ├── widgets/           # Виджеты
│   │   ├── GlobalSupportWidget.tsx
│   │   └── index.ts
│   ├── providers/         # Провайдеры контекста
│   │   ├── ModalProvider.tsx
│   │   ├── SupportWidgetProvider.tsx
│   │   └── index.ts
│   └── ui/                # UI компоненты
│       ├── Toast.tsx
│       ├── FinanceNotification.tsx
│       └── index.ts
│
├── contexts/              # React контексты
│   ├── NotificationContext.tsx
│   └── ThemeContext.tsx
│
├── lib/                   # Глобальные утилиты
│   ├── supabase-server.ts
│   └── useSupportWidget.ts
│
├── docs/                  # Документация
│   ├── README.md          # Обзор проекта
│   ├── DATABASE.md        # Схема БД
│   ├── RELEASES.md        # Система релизов
│   ├── ADMIN.md           # Админ-панель
│   ├── STRUCTURE.md       # Этот файл
│   └── archive/           # Архив старой документации
│
├── sql/                   # SQL миграции
├── scripts/               # Скрипты для разработки
├── public/                # Статические файлы
├── email-templates/       # HTML шаблоны email
│
├── package.json           # Зависимости
├── tailwind.config.ts     # Tailwind CSS
├── next.config.ts         # Next.js конфиг
├── tsconfig.json          # TypeScript конфиг
└── README.md              # Основной README
```

## Структура cabinet/ (Личный кабинет)

```
app/cabinet/
├── page.tsx               # Главная страница кабинета
├── lib/
│   ├── supabase.ts        # Клиент Supabase
│   ├── fetchWithAuth.ts   # Fetch с авторизацией
│   ├── types.ts           # Типы
│   └── utils.ts           # Утилиты
│
├── components/
│   ├── index.ts           # Экспорт компонентов
│   ├── UserReleases.tsx   # Релизы (использует модули)
│   │
│   ├── finance/           # 📁 Финансы
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── constants.ts
│   │   ├── FinanceTab.tsx
│   │   ├── UserPayouts.tsx
│   │   └── UserReports.tsx
│   │
│   ├── settings/          # 📁 Настройки профиля
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── constants.ts
│   │   └── SettingsTab.tsx
│   │
│   ├── demos/             # 📁 Демо
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── constants.ts
│   │   └── DemoUploadForm.tsx
│   │
│   ├── sidebar/           # 📁 Сайдбар
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── constants.ts
│   │   └── Sidebar.tsx
│   │
│   ├── support/           # 📁 Поддержка
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── constants.ts
│   │   ├── SupportTab.tsx
│   │   ├── SupportSidebar.tsx
│   │   └── TicketList.tsx
│   │
│   ├── releases/          # 📁 Модули релизов
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── constants.ts
│   │   ├── hooks.ts
│   │   ├── ReleaseCard.tsx
│   │   ├── ReleaseDetailView.tsx
│   │   ├── ReleasesFilters.tsx
│   │   ├── ReleasesGrid.tsx
│   │   ├── ReleasesHeader.tsx
│   │   ├── PaymentModal.tsx
│   │   ├── PlatformIcons.tsx
│   │   └── CopyToast.tsx
│   │
│   └── ui/                # 📁 UI компоненты
│       ├── index.ts
│       ├── UIElements.tsx
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Select.tsx
│       ├── Badge.tsx
│       ├── Card.tsx
│       ├── Modal.tsx
│       ├── LoadingSpinner.tsx
│       └── EmptyState.tsx
│
├── release/               # Создание релиза (Exclusive)
├── release-basic/         # Создание релиза (Basic)
├── payouts/               # Выплаты
├── withdrawals/           # Выводы
└── reports/               # Отчёты
```

## Структура admin/ (Админ-панель)

```
app/admin/
├── page.tsx               # Главная страница админки
└── components/
    ├── index.ts           # Экспорт всех компонентов
    ├── types.ts           # Общие типы
    ├── constants.ts       # Константы
    │
    ├── ui/                # 📁 UI компоненты
    │   └── index.tsx      # Button, Input, Modal, Badge и др.
    │
    ├── moderation/        # 📁 Модуль модерации релизов
    │   ├── index.ts
    │   ├── types.ts
    │   ├── constants.ts
    │   └── ReleasesModeration.tsx
    │
    ├── tickets/           # 📁 Модуль тикетов
    │   ├── index.ts
    │   ├── types.ts
    │   ├── constants.ts
    │   ├── AdminTicketsPanel.tsx
    │   ├── TicketsTab.tsx
    │   └── TicketsTabLive.tsx
    │
    ├── users/             # 📁 Модуль пользователей
    │   ├── index.ts
    │   ├── types.ts
    │   ├── constants.ts
    │   └── UsersTab.tsx
    │
    ├── image/             # 📁 Работа с изображениями
    │   ├── index.ts
    │   └── ImageCropModal.tsx
    │
    ├── payouts/           # 📁 Выплаты
    │   ├── index.ts
    │   ├── types.ts
    │   ├── constants.ts
    │   └── PayoutsTab.tsx
    │
    ├── withdrawals/       # 📁 Выводы
    │   ├── index.ts
    │   ├── types.ts
    │   ├── constants.ts
    │   └── WithdrawalsTab.tsx
    │
    ├── news/              # 📁 Новости
    │   ├── index.ts
    │   ├── types.ts
    │   ├── constants.ts
    │   └── NewsTab.tsx
    │
    ├── demos/             # 📁 Демо
    │   ├── index.ts
    │   ├── types.ts
    │   ├── constants.ts
    │   └── DemosTab.tsx
    │
    ├── contracts/         # 📁 Контракты
    │   ├── index.ts
    │   ├── types.ts
    │   ├── constants.ts
    │   └── ContractsTab.tsx
    │
    └── archive/           # 📁 Архив
        ├── index.ts
        ├── types.ts
        ├── constants.ts
        └── ArchiveTab.tsx
```

## Структура api/

```
app/api/
├── auth/
│   ├── register/          # Регистрация
│   ├── login/             # Вход
│   └── logout/            # Выход
│
├── releases/              # CRUD релизов
├── tracks/                # Треки
├── upload/                # Загрузка файлов
│
├── admin/                 # Админ API
│   ├── releases/
│   ├── users/
│   ├── tickets/
│   └── withdrawals/
│
├── support/               # Поддержка
│   ├── tickets/
│   └── upload/
│
├── finance/               # Финансы
│   ├── balance/
│   ├── payouts/
│   └── withdrawals/
│
├── profile/               # Профиль
├── news/                  # Новости
└── demo/                  # Демо
```

## Принципы организации

### 1. Модульность
Каждая логическая сущность имеет свою папку с файлами:
- `types.ts` - TypeScript интерфейсы
- `constants.ts` - константы, лейблы, цвета
- `hooks.ts` - кастомные React хуки (при необходимости)
- `index.ts` - barrel export

### 2. UI компоненты
Переиспользуемые UI компоненты в папках `ui/`:
- Button, Input, Select
- Badge, Card, Modal
- LoadingSpinner, EmptyState

### 3. Глобальные компоненты
Папка `components/` в корне содержит:
- `effects/` - визуальные эффекты (AnimatedBackground)
- `widgets/` - виджеты (GlobalSupportWidget)
- `providers/` - провайдеры контекста
- `ui/` - глобальные UI компоненты

### 4. Документация
Вся документация в `docs/`:
- Техническая документация
- Архив устаревших инструкций

### 5. Чистый корень
В корне проекта только:
- Конфигурационные файлы
- README.md
- Основные папки

## Импорты

### Глобальные компоненты
```typescript
import { AnimatedBackground } from '@/components/effects';
import { GlobalSupportWidget } from '@/components/widgets';
import { ModalProvider, SupportWidgetProvider } from '@/components/providers';
import { Toast, FinanceNotificationContainer } from '@/components/ui';
```

### Компоненты кабинета
```typescript
import { FinanceTab, UserPayouts, UserReports } from './components/finance';
import { SettingsTab } from './components/settings';
import { DemoUploadForm } from './components/demos';
import { Sidebar } from './components/sidebar';
import { SupportTab, SupportSidebar, TicketList } from './components/support';
import { Button, Input, Select } from './components/ui';
```

### Компоненты админки
```typescript
import { ReleasesModeration } from './components/moderation';
import { UsersTab } from './components/users';
import { AdminTicketsPanel, TicketsTab, TicketsTabLive } from './components/tickets';
import { ImageCropModal } from './components/image';
import { DemosTab } from './components/demos';
import { ContractsTab } from './components/contracts';
import { ArchiveTab } from './components/archive';
import { NewsTab } from './components/news';
import { PayoutsTab } from './components/payouts';
import { WithdrawalsTab } from './components/withdrawals';
```
