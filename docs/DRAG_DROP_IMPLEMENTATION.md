# 🎯 iPhone-Style Drag & Drop System

## 📦 Технический стек

- **Framework:** Next.js (React 18)
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **Library:** @dnd-kit (v6+)

---

## 🏗️ Архитектура компонентов

### 1. **DraggableReleasesGrid.tsx** (Главный контейнер)
Управляет всей логикой drag & drop.

**Ключевые функции:**
- `handleDragStart` - инициализация перетаскивания
- `handleDragOver` - отслеживание позиции над корзиной
- `handleDragEnd` - определяет: удаление или сортировка

### 2. **SortableReleaseCard.tsx** (Карточка релиза)
Отдельная карточка с возможностью перетаскивания.

**Особенности:**
- Использует `useSortable` hook из @dnd-kit
- Плавная трансформация при перемещении
- Эффект "поднятия" для overlay
- Disabled для не-черновиков

### 3. **TrashZone.tsx** (Зона удаления)
Корзина внизу экрана для удаления черновиков.

**Фичи:**
- Появляется только при активном drag
- Визуальная реакция на hover
- Анимированные эффекты (огонь, взрывы)

---

## 🔄 Логика работы `handleDragEnd`

```typescript
const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event;
  
  // ПРОВЕРКА 1: Элемент отпущен в пустоту?
  if (!over) {
    // ➡️ Возврат на место
    setActiveId(null);
    return;
  }

  // ПРОВЕРКА 2: Элемент отпущен на корзину?
  if (over.id === 'trash-zone') {
    // ➡️ УДАЛЕНИЕ
    const releaseToDelete = releases.find(r => r.id === active.id);
    
    if (releaseToDelete?.status === 'draft') {
      // Оптимистичное удаление из UI
      setLocalReleases(prev => prev.filter(r => r.id !== active.id));
      
      // Удаление из БД
      await onDeleteDraft(active.id);
    }
    
    setActiveId(null);
    return;
  }

  // ПРОВЕРКА 3: Элемент переместили на другую позицию?
  if (active.id !== over.id) {
    // ➡️ СОРТИРОВКА
    const oldIndex = draftReleases.findIndex(r => r.id === active.id);
    const newIndex = draftReleases.findIndex(r => r.id === over.id);
    
    // Оптимистичное обновление UI
    const reordered = arrayMove(draftReleases, oldIndex, newIndex);
    setLocalReleases([...nonDrafts, ...reordered]);
    
    // Сохранение в БД
    await onReorderDrafts(draggedRelease.id, newPosition, releaseType);
  }

  setActiveId(null);
};
```

### Ключевые проверки:

1. **`if (!over)`** - элемент отпущен вне зон → возврат на место
2. **`if (over.id === 'trash-zone')`** - элемент на корзине → удаление
3. **`if (active.id !== over.id)`** - элемент на другом релизе → сортировка

---

## 🎨 UX/UI Детали

### Эффект "поднятия" при drag:
```typescript
// В DragOverlay
<div className="transform rotate-3 scale-110 opacity-95">
  <SortableReleaseCard isOverlay />
</div>
```

### Плавная анимация сортировки:
```typescript
style={{
  transform: CSS.Transform.toString(transform),
  transition: 'transform 200ms cubic-bezier(0.18, 0.67, 0.6, 1.22)',
}}
```

### Визуальный фидбек корзины:
```typescript
{isOver && (
  <>
    <div className="animate-pulse" /> // Пульсация
    <div className="text-2xl animate-bounce">🔥</div> // Огонь
    <div className="border-red-500 animate-ping" /> // Волны
  </>
)}
```

---

## 📱 Особенности реализации "как на iPhone"

### ✅ 1. Минимальное расстояние активации
```typescript
useSensor(PointerSensor, {
  activationConstraint: {
    distance: 8, // 8px перед началом drag
  },
})
```
Предотвращает случайное перетаскивание при клике.

### ✅ 2. Плавное перемещение других элементов
```typescript
strategy={rectSortingStrategy}
```
@dnd-kit автоматически анимирует сдвиг элементов при перетаскивании.

### ✅ 3. Оптимистичное обновление UI
```typescript
// Сначала обновляем UI (мгновенно)
setLocalReleases(reordered);

// Потом сохраняем в БД (асинхронно)
await onReorderDrafts(...);
```
Обеспечивает мгновенный отклик без ожидания сервера.

### ✅ 4. Откат при ошибке
```typescript
try {
  await onReorderDrafts(...);
} catch (error) {
  // Возвращаем старое состояние
  setLocalReleases(releases);
}
```

### ✅ 5. Эффект глубины (3D)
```typescript
style={{
  transformStyle: 'preserve-3d',
  transform: 'rotate-3 scale-110',
}}
```

---

## 🚀 Использование

```tsx
<DraggableReleasesGrid
  releases={draftReleases}
  userRole={userRole}
  showArchive={true}
  onReleaseClick={handleClick}
  onAddRelease={handleAdd}
  onDeleteDraft={async (id) => {
    await deleteFromDB(id);
    reload();
  }}
  onReorderDrafts={async (id, pos, type) => {
    return await saveOrderToDB(id, pos, type);
  }}
/>
```

---

## 🔧 Настройка анимаций

### Скорость перехода:
```typescript
transition: 'transform 200ms cubic-bezier(0.18, 0.67, 0.6, 1.22)'
//                         ↑ Время  ↑ Easing функция (bounce эффект)
```

### Масштаб при поднятии:
```typescript
scale-110  // 110% размер
rotate-3   // 3 градуса поворот
opacity-95 // 95% прозрачность
```

### Тень при drag:
```css
shadow-2xl shadow-purple-500/50
```

---

## 📊 Производительность

### Оптимизации:
- ✅ `willChange: 'transform'` - предупреждает браузер
- ✅ `requestAnimationFrame` - синхронизация с частотой кадров
- ✅ Throttling для onDragOver (50ms)
- ✅ CSS transforms вместо top/left
- ✅ Условный рендеринг (opacity: 0 вместо display: none)

---

## 🐛 Обработка граничных случаев

### 1. Отмена перетаскивания (ESC):
```typescript
onDragCancel={() => {
  setActiveId(null);
  setIsOverTrash(false);
}}
```

### 2. Быстрое движение мыши:
```typescript
collisionDetection={closestCenter}
```
Определяет ближайший элемент даже при быстром движении.

### 3. Перетаскивание не-черновиков:
```typescript
disabled: !isDraft || isOverlay
```
Отключаем drag для релизов со статусом !== 'draft'.

---

## 🎯 Интеграция с БД

### Функция сохранения порядка:
```typescript
const reorderDraftInDatabase = async (
  releaseId: string,
  newPosition: number,
  releaseType: 'basic' | 'exclusive'
) => {
  const { error } = await supabase.rpc('reorder_draft_release', {
    p_release_id: releaseId,
    p_new_position: newPosition,
    p_table_name: releaseType
  });
  
  return !error;
};
```

### SQL функция (уже существует):
```sql
CREATE OR REPLACE FUNCTION reorder_draft_release(
  p_release_id UUID,
  p_new_position INTEGER,
  p_table_name TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Логика перенумерации draft_order
END;
$$ LANGUAGE plpgsql;
```

---

## 🎨 Кастомизация

### Изменить цвет корзины:
```typescript
// В TrashZone.tsx
isOver 
  ? 'bg-red-500'      // ← Поменяйте на свой цвет
  : 'bg-red-500/20'
```

### Изменить высоту зоны удаления:
```typescript
{isOver ? 'h-48' : 'h-32'}  // ← Настройте высоту
```

### Добавить свои эффекты:
```typescript
{isOver && (
  <div className="text-3xl animate-spin">⚡</div>
)}
```

---

## 📝 Чеклист проверки

- [x] Drag работает только для черновиков
- [x] Элементы плавно двигаются при сортировке
- [x] Корзина появляется при drag
- [x] Корзина реагирует на hover
- [x] Удаление работает через drag на корзину
- [x] Порядок сохраняется в БД
- [x] Клик на карточку не вызывает drag
- [x] ESC отменяет перетаскивание
- [x] Работает на всех разрешениях
- [x] Анимации плавные (60 FPS)

---

## 🚨 Известные ограничения

1. **Требуется @dnd-kit установлен:**
   ```bash
   npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
   ```

2. **Работает только в режиме архива (черновиков)**
   - Для не-черновиков используется старая система

3. **Перезагрузка после изменений**
   - После сортировки/удаления идет reload страницы
   - Можно убрать, если добавить live updates

---

## 🎓 Ключевые концепции @dnd-kit

### Sensors:
Определяют как начинается drag (мышь, тач, клавиатура).

### Collision Detection:
Определяет над каким элементом мы находимся.

### Sortable Context:
Управляет порядком элементов в сетке.

### Droppable:
Зоны куда можно "бросить" элемент (корзина).

### Drag Overlay:
Элемент который визуально следует за курсором.

---

## 💡 Дополнительные идеи

### 1. Haptic Feedback (для мобильных):
```typescript
if ('vibrate' in navigator) {
  navigator.vibrate(50); // При hover над корзиной
}
```

### 2. Звуковые эффекты:
```typescript
const deleteSound = new Audio('/sounds/delete.mp3');
if (over.id === 'trash-zone') {
  deleteSound.play();
}
```

### 3. Подтверждение удаления:
```typescript
if (over.id === 'trash-zone') {
  const confirmed = await showConfirmDialog();
  if (!confirmed) return;
}
```

---

## 📚 Полезные ссылки

- [📖 @dnd-kit Docs](https://docs.dndkit.com/)
- [🎨 Examples](https://master--5fc05e08a4a65d0021ae0bf2.chromatic.com/)
- [🔧 API Reference](https://docs.dndkit.com/api-documentation)

---

**Автор:** Senior Frontend Developer  
**Дата:** 26 декабря 2025  
**Версия:** 1.0.0
