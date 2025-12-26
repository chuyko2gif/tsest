// Типы ролей
export type UserRole = 'basic' | 'exclusive' | 'admin' | 'owner';

// Конфигурация ролей с улучшенной цветовой палитрой
export const ROLE_CONFIG = {
  basic: {
    label: 'Basic Artist',
    shortLabel: 'BASIC',
    color: 'from-zinc-700 via-zinc-800 to-zinc-900',
    borderColor: 'border-zinc-600',
    glowColor: 'rgba(113, 113, 122, 0.3)',
    textColor: 'text-zinc-400',
    bgColor: 'bg-zinc-800/50',
    icon: '○',
    accentColor: '#71717a', // zinc-500
    darkAccent: '#3f3f46', // zinc-700
  },
  exclusive: {
    label: 'Exclusive Artist',
    shortLabel: 'EXCLUSIVE',
    color: 'from-[#f59e0b] via-[#f59e0b] to-[#d97706]',
    borderColor: 'border-[#fbbf24]',
    glowColor: 'rgba(251, 191, 36, 0.5)',
    textColor: 'text-[#fbbf24]',
    bgColor: 'bg-[#f59e0b]/20',
    icon: '◆',
    accentColor: '#fbbf24', // amber-400
    darkAccent: '#f59e0b', // amber-500
  },
  admin: {
    label: 'Administrator',
    shortLabel: 'ADMIN',
    color: 'from-[#ef4444] via-[#dc2626] to-[#b91c1c]',
    borderColor: 'border-[#f87171]',
    glowColor: 'rgba(248, 113, 113, 0.5)',
    textColor: 'text-[#f87171]',
    bgColor: 'bg-[#ef4444]/20',
    icon: '★',
    accentColor: '#f87171', // red-400
    darkAccent: '#dc2626', // red-600
  },
  owner: {
    label: 'Владелец платформы',
    shortLabel: 'OWNER',
    color: 'from-[#8b5cf6] via-[#7c3aed] to-[#6d28d9]',
    borderColor: 'border-[#a78bfa]',
    glowColor: 'rgba(167, 139, 250, 0.6)',
    textColor: 'text-[#a78bfa]',
    bgColor: 'bg-[#8b5cf6]/20',
    icon: '♛',
    accentColor: '#a78bfa', // violet-400
    darkAccent: '#7c3aed', // violet-600
  },
};

// Типы тикетов
export type Ticket = {
  id: string;
  user_id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'closed';
  created_at: string;
  updated_at: string;
};

export type TicketMessage = {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_admin: boolean;
  attachment_url: string | null;
  created_at: string;
};

// Списки админ/exclusive почт
export const ADMIN_EMAILS = ['littlehikai@gmail.com', 'maksbroska@gmail.com'];
export const EXCLUSIVE_EMAILS: string[] = ['jdsakd@gmail.com'];
