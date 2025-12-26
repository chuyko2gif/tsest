# Быстрый старт: Drag & Drop для черновиков

## 🎯 Что это решает

1. ✅ Система перетаскивания работает для черновиков релизов
2. ✅ При перетаскивании элемент **забывает** старое место - больше нет лишней пустоты
3. ✅ Автоматическая нормализация порядка после каждого перемещения

## 🚀 Установка (один раз)

1. Откройте Supabase SQL Editor
2. Выполните файл: **`sql/add_draft_ordering_system.sql`**

Готово! Система установлена.

## 💻 Код для фронтенда

### Получить черновики (с правильным порядком)

```typescript
const { data: drafts } = await supabase
  .from('releases_basic')  // или 'releases_exclusive'
  .select('*')
  .eq('user_id', userId)
  .eq('status', 'draft')
  .order('draft_order', { ascending: true });  // ← Важно!
```

### Переместить черновик на новую позицию

```typescript
async function moveDraft(releaseId: string, newPosition: number) {
  const { error } = await supabase.rpc('reorder_draft_release', {
    p_release_id: releaseId,
    p_new_position: newPosition,  // 1, 2, 3, 4...
    p_table_name: 'basic'  // или 'exclusive'
  });
  
  if (error) {
    console.error('Ошибка:', error);
    return false;
  }
  
  return true;
}
```

### Пример с @dnd-kit

```typescript
async function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  if (!over || active.id === over.id) return;

  const oldIndex = drafts.findIndex(d => d.id === active.id);
  const newIndex = drafts.findIndex(d => d.id === over.id);

  // 1. Обновляем UI сразу
  const newDrafts = [...drafts];
  const [item] = newDrafts.splice(oldIndex, 1);
  newDrafts.splice(newIndex, 0, item);
  setDrafts(newDrafts);

  // 2. Сохраняем в БД
  await moveDraft(active.id as string, newIndex + 1);
}
```

## ⚡ Что происходит автоматически

- **При создании черновика** → автоматически ставится в конец списка
- **При удалении черновика** → все остальные перенумеровываются  
- **При публикации черновика** → order очищается, черновики перенумеровываются
- **При перетаскивании** → элемент перемещается, все между сдвигаются, пропуски убираются

## 📌 Важно помнить

1. Позиции начинаются с **1** (не с 0)
2. Всегда добавляйте `.order('draft_order')` при запросе черновиков
3. Указывайте правильный `table_name`: `'basic'` или `'exclusive'`

## 🐛 Если что-то не работает

```sql
-- Проверить черновики пользователя
SELECT id, title, draft_order 
FROM releases_basic 
WHERE user_id = 'YOUR_ID' AND status = 'draft'
ORDER BY draft_order;

-- Проверить функцию
SELECT reorder_draft_release(
  'RELEASE_ID'::uuid, 
  2, 
  'basic'
);
```

---

**Полная документация**: [DRAFT_ORDERING.md](./DRAFT_ORDERING.md)
