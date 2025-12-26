// Утилиты для цветов статусов

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'open': 
      return 'bg-green-500/10 border-green-500/50 text-green-400';
    case 'answered': 
      return 'bg-blue-500/10 border-blue-500/50 text-blue-400';
    case 'closed': 
      return 'bg-zinc-500/10 border-zinc-500/50 text-zinc-400';
    default: 
      return 'bg-zinc-500/10 border-zinc-500/50 text-zinc-400';
  }
};

export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'open': return 'Открыт';
    case 'answered': return 'Отвечен';
    case 'closed': return 'Закрыт';
    default: return status;
  }
};

export const getStatusIcon = (status: string): string => {
  switch (status) {
    case 'open': return '🟢';
    case 'answered': return '🔵';
    case 'closed': return '⚪';
    default: return '⚪';
  }
};
