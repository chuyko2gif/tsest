# Система сортировки черновиков с Drag & Drop

## Описание

Система позволяет пользователям перетаскивать свои черновики релизов для изменения их порядка. Решает проблему с "лишней пустотой" при перетаскивании - элемент корректно перемещается на новую позицию без дублирования.

## База данных

### Поля

- `draft_order` (INTEGER) - порядковый номер черновика для сортировки
- Автоматически назначается при создании черновика
- Автоматически очищается при изменении статуса с 'draft' на другой
- Автоматически пересчитывается при удалении черновика

### Функция для перестановки

```sql
reorder_draft_release(
  p_release_id UUID,      -- ID релиза для перемещения
  p_new_position INTEGER, -- Новая позиция (1-based)
  p_table_name TEXT       -- 'basic' или 'exclusive'
)
```

## Использование на фронтенде

### 1. Получение черновиков с сортировкой

```typescript
// Basic релизы
const { data: drafts } = await supabase
  .from('releases_basic')
  .select('*')
  .eq('user_id', userId)
  .eq('status', 'draft')
  .order('draft_order', { ascending: true });

// Exclusive релизы
const { data: drafts } = await supabase
  .from('releases_exclusive')
  .select('*')
  .eq('user_id', userId)
  .eq('status', 'draft')
  .order('draft_order', { ascending: true });
```

### 2. Перестановка черновика (Drag & Drop)

```typescript
// Функция для перемещения релиза на новую позицию
async function reorderDraft(
  releaseId: string, 
  newPosition: number, 
  tableType: 'basic' | 'exclusive'
) {
  const { error } = await supabase.rpc('reorder_draft_release', {
    p_release_id: releaseId,
    p_new_position: newPosition,
    p_table_name: tableType
  });

  if (error) {
    console.error('Ошибка перестановки:', error);
    return false;
  }

  return true;
}
```

### 3. Пример с библиотекой @dnd-kit

```typescript
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

function DraftsList() {
  const [drafts, setDrafts] = useState<Draft[]>([]);

  // Загрузка черновиков
  useEffect(() => {
    loadDrafts();
  }, []);

  async function loadDrafts() {
    const { data } = await supabase
      .from('releases_basic')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'draft')
      .order('draft_order', { ascending: true });
    
    setDrafts(data || []);
  }

  // Обработка завершения перетаскивания
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    // Находим индексы
    const oldIndex = drafts.findIndex(d => d.id === active.id);
    const newIndex = drafts.findIndex(d => d.id === over.id);

    // Оптимистичное обновление UI
    const newDrafts = [...drafts];
    const [movedItem] = newDrafts.splice(oldIndex, 1);
    newDrafts.splice(newIndex, 0, movedItem);
    setDrafts(newDrafts);

    // Отправка запроса в БД (позиция 1-based)
    const success = await reorderDraft(
      active.id as string, 
      newIndex + 1,  // Позиция в БД начинается с 1
      'basic'
    );

    // Если ошибка, перезагружаем данные
    if (!success) {
      loadDrafts();
    }
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={drafts.map(d => d.id)}
        strategy={verticalListSortingStrategy}
      >
        {drafts.map(draft => (
          <DraftItem key={draft.id} draft={draft} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

### 4. Пример с react-beautiful-dnd

```typescript
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

function DraftsList() {
  const [drafts, setDrafts] = useState<Draft[]>([]);

  async function handleDragEnd(result: DropResult) {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    if (sourceIndex === destIndex) return;

    // Оптимистичное обновление UI
    const newDrafts = Array.from(drafts);
    const [movedItem] = newDrafts.splice(sourceIndex, 1);
    newDrafts.splice(destIndex, 0, movedItem);
    setDrafts(newDrafts);

    // Отправка запроса в БД
    const success = await reorderDraft(
      result.draggableId,
      destIndex + 1,  // 1-based позиция
      'basic'
    );

    if (!success) {
      loadDrafts(); // Откат при ошибке
    }
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="drafts">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            {drafts.map((draft, index) => (
              <Draggable key={draft.id} draggableId={draft.id} index={index}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <DraftItem draft={draft} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
```

## Автоматическое поведение

### При создании черновика
- Автоматически назначается `draft_order` = MAX(draft_order) + 1
- Новый черновик всегда добавляется в конец списка

### При удалении черновика
- Автоматически пересчитываются `draft_order` для оставшихся черновиков
- Убираются пропуски в нумерации

### При изменении статуса
- Если статус меняется с 'draft' на другой, `draft_order` очищается (NULL)
- Оставшиеся черновики автоматически перенумеровываются

### При перемещении (drag & drop)
- Элемент перемещается на новую позицию
- Все элементы между старой и новой позицией сдвигаются
- После перемещения происходит нормализация (убираются пропуски)
- **Решена проблема с "лишней пустотой"** - элемент корректно занимает новую позицию

## Примечания

1. **Позиции 1-based**: В БД позиции начинаются с 1, а не с 0
2. **Оптимистичное обновление**: Рекомендуется сначала обновить UI, потом отправить запрос
3. **Обработка ошибок**: При ошибке перемещения нужно перезагрузить данные из БД
4. **Разделение таблиц**: Basic и Exclusive релизы хранятся отдельно, нужно указывать `table_name`

## Установка

Запустите SQL скрипт в вашей БД Supabase:

```bash
# Через Supabase SQL Editor
# Откройте файл: sql/add_draft_ordering_system.sql
# Скопируйте и выполните весь код
```

## Проверка работы

```sql
-- Проверить черновики пользователя
SELECT id, title, status, draft_order, created_at
FROM releases_basic
WHERE user_id = 'YOUR_USER_ID' AND status = 'draft'
ORDER BY draft_order;

-- Переместить черновик
SELECT reorder_draft_release(
  'RELEASE_ID'::uuid,
  3,  -- новая позиция
  'basic'
);
```

## Возможные проблемы и решения

### Черновики не сортируются
- Убедитесь, что в запросе есть `ORDER BY draft_order`
- Проверьте, что статус = 'draft'

### Ошибка при перемещении
- Проверьте RLS политики: пользователь должен быть владельцем черновика
- Убедитесь, что передается правильный `table_name` ('basic' или 'exclusive')

### Появляются пропуски в нумерации
- Это нормально временно, но после перемещения происходит автоматическая нормализация
- Если пропуски остаются, выполните нормализацию вручную через функцию `reorder_draft_release`
