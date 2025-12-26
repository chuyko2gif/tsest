# Promise-Based Confirm Dialog System

## Overview
Красивая система модальных диалогов с Promise-based API для замены стандартных `window.confirm()`.

## Features
- ✅ Promise-based API (async/await)
- ✅ Glassmorphism UI
- ✅ Два типа: `standard` и `danger`
- ✅ Keyboard support (Escape to cancel)
- ✅ Focus trap
- ✅ Smooth animations

## Usage

### Basic Example

```typescript
import { useNotifications } from '@/app/cabinet/hooks/useNotifications';

function MyComponent() {
  const { confirm } = useNotifications();
  
  const handleDelete = async () => {
    const isConfirmed = await confirm(
      'Удалить черновик?',
      'Это действие нельзя отменить',
      'danger',
      'Удалить',
      'Отмена'
    );
    
    if (isConfirmed) {
      // Delete logic here
      console.log('Deleted!');
    }
  };
  
  return <button onClick={handleDelete}>Delete</button>;
}
```

### Standard Confirmation

```typescript
const handleSave = async () => {
  const result = await confirm(
    'Сохранить изменения?',
    'Все несохраненные данные будут потеряны'
  );
  
  if (result) {
    // Save logic
  }
};
```

### Danger Confirmation (Red button)

```typescript
const handleDelete = async () => {
  const result = await confirm(
    'Удалить релиз?',
    'Это действие необратимо',
    'danger',
    'Удалить',
    'Отмена'
  );
  
  if (result) {
    // Delete logic
  }
};
```

## API Reference

### `confirm(message, description?, type?, confirmText?, cancelText?): Promise<boolean>`

**Parameters:**
- `message` (string, required) - Заголовок диалога
- `description` (string, optional) - Дополнительное описание
- `type` ('standard' | 'danger', optional, default: 'standard') - Тип диалога
- `confirmText` (string, optional, default: 'Подтвердить') - Текст кнопки подтверждения
- `cancelText` (string, optional, default: 'Отмена') - Текст кнопки отмены

**Returns:** `Promise<boolean>` - `true` если подтверждено, `false` если отменено

## Component Setup

В `app/cabinet/page.tsx`:

```tsx
import { useNotifications } from './hooks/useNotifications';
import ConfirmDialog from './components/modals/ConfirmDialog';

function CabinetPage() {
  const { confirm, confirmDialog, handleConfirm, handleCancel } = useNotifications();
  
  return (
    <>
      {/* Your content */}
      
      <ConfirmDialog
        show={confirmDialog.show}
        message={confirmDialog.message}
        description={confirmDialog.description}
        type={confirmDialog.type}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
}
```

## Styling

### Colors
- **Standard**: Purple gradient (`from-purple-500 to-purple-600`)
- **Danger**: Red gradient (`from-red-500 to-red-600`)

### Animations
- Backdrop: Fade in/out
- Modal: Scale up + fade in
- Duration: 300ms

## Accessibility
- ✅ `Escape` key closes dialog (same as Cancel)
- ✅ Focus is trapped inside modal
- ✅ Body scroll is locked when open
- ✅ Click outside to cancel
