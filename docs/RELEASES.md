# Система релизов

## Обзор

Система поддерживает два типа релизов:
- **Basic** - платные релизы (500₽)
- **Exclusive** - безлимитные релизы для exclusive артистов

## Структура компонентов

```
app/cabinet/components/releases/
├── index.ts           # Экспорт всех компонентов
├── types.ts           # TypeScript типы
├── constants.ts       # Константы и утилиты
├── hooks.ts           # React хуки
├── CopyToast.tsx      # Уведомление о копировании
├── PaymentModal.tsx   # Модальное окно оплаты
├── PlatformIcons.tsx  # Иконки платформ
├── ReleaseCard.tsx    # Карточка релиза
├── ReleaseDetailView.tsx  # Детальный просмотр
├── ReleasesFilters.tsx    # Фильтры и поиск
├── ReleasesGrid.tsx       # Сетка релизов
└── ReleasesHeader.tsx     # Заголовок и архив
```

## Использование

```tsx
import { 
  useReleases, 
  useFilteredReleases,
  ReleaseDetailView,
  ReleasesGrid 
} from './releases';

function MyComponent({ userId }) {
  const { releases, loading } = useReleases(userId);
  const filtered = useFilteredReleases(releases, filters);
  
  return <ReleasesGrid releases={filtered} />;
}
```

## Статусы релизов

| Статус | Описание |
|--------|----------|
| `draft` | Черновик (в архиве) |
| `pending` | На модерации |
| `approved` | Одобрен |
| `rejected` | Отклонен |
| `distributed` | Распространяется |
| `published` | Опубликован |

## Процесс создания релиза

### Basic релиз
1. Пользователь загружает чек оплаты (500₽)
2. Заполняет форму релиза
3. Отправляет на модерацию
4. Админ проверяет оплату
5. Одобряет или отклоняет релиз

### Exclusive релиз
1. Пользователь заполняет форму
2. Отправляет на модерацию
3. Админ проверяет контент
4. Одобряет или отклоняет

## Хуки

### useReleases
Загружает релизы пользователя
```tsx
const { releases, loading, tracksMap } = useReleases(userId);
```

### useFilteredReleases
Фильтрует и сортирует релизы
```tsx
const filtered = useFilteredReleases(releases, {
  searchQuery: '',
  filterStatus: 'all',
  filterGenre: 'all',
  sortBy: 'date',
  order: 'desc',
  showArchive: false
});
```

## Компоненты

### ReleaseCard
Карточка релиза в сетке
```tsx
<ReleaseCard 
  release={release} 
  onClick={() => handleClick(release)} 
/>
```

### ReleaseDetailView
Детальный просмотр релиза
```tsx
<ReleaseDetailView
  release={selectedRelease}
  onBack={() => setSelected(null)}
  showCopyToast={showToast}
  setShowCopyToast={setShowToast}
/>
```

### PaymentModal
Модальное окно оплаты для Basic
```tsx
<PaymentModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  userId={userId}
/>
```

## Платформы дистрибуции

- Spotify
- Apple Music
- YouTube Music
- VK Музыка
- Яндекс Музыка
- И другие...
