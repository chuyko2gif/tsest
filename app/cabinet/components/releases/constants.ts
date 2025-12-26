// Константы и утилиты для релизов

export const STATUS_LABELS: Record<string, string> = {
  pending: 'На модерации',
  approved: 'Одобрен',
  rejected: 'Отклонен',
  distributed: 'Распространён',
  published: 'Опубликован',
  draft: 'Черновик'
};

export const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
  distributed: 'bg-blue-500',
  published: 'bg-green-500',
  draft: 'bg-zinc-500'
};

export const STATUS_BADGE_STYLES: Record<string, string> = {
  approved: 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30',
  rejected: 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30',
  distributed: 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/30',
  draft: 'bg-zinc-500/20 text-zinc-400 ring-1 ring-zinc-500/30',
  published: 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
};

export const FILTER_OPTIONS = [
  { value: 'all', label: 'Все', icon: '📋' },
  { value: 'pending', label: 'На модерации', icon: '⏳' },
  { value: 'approved', label: 'Утверждён', icon: '✅' },
  { value: 'distributed', label: 'На дистрибьюции', icon: '🚀' },
  { value: 'published', label: 'Опубликован', icon: '✅' },
  { value: 'rejected', label: 'Отклонён', icon: '❌' }
];

export const SORT_OPTIONS = [
  { value: 'date', label: 'По дате' },
  { value: 'title', label: 'По названию' },
  { value: 'status', label: 'По статусу' }
];

// Утилиты форматирования
export function formatDate(date: string | undefined): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('ru-RU');
}

export function formatDateFull(date: string | undefined): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('ru-RU', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

export function getTracksWord(count: number): string {
  if (count === 1) return 'трек';
  if (count > 1 && count < 5) return 'трека';
  return 'треков';
}

// Копирование в буфер обмена
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    return true;
  } catch (err) {
    console.error('Ошибка копирования:', err);
    return false;
  }
}
