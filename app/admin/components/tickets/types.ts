// Типы для системы тикетов

export interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  priority: string;
  category?: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  last_admin_message_at: string | null;
  admin_read_at: string | null;
  archived_at: string | null;
  ticket_messages: TicketMessage[];
  user_email?: string;
  user_nickname?: string;
  user_telegram?: string;
  user_avatar?: string;
  user_role?: string;
  release_id?: string;
  release?: {
    id: string;
    artist: string;
    title: string;
    artwork_url?: string;
    status: string;
    created_at: string;
  };
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  images: string[];
  sender_email?: string;
  sender_username?: string;
  sender_avatar?: string;
  sender_nickname?: string;
  reactions?: MessageReaction[];
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction: string;
  user?: {
    nickname: string;
    avatar: string;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  nickname?: string;
  avatar?: string;
  role?: string;
  balance?: number;
  created_at?: string;
}

export interface UserTransaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  status: string;
  description?: string;
  reference_id?: string;
  source?: string;
  bank_name?: string;
  card_number?: string;
  admin_comment?: string;
  created_at: string;
}

export type TicketFilter = 'all' | 'in_progress' | 'pending' | 'closed';

export const statusColors: Record<string, string> = {
  open: 'bg-green-500/20 text-green-400 border-green-500/30',
  in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  closed: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
};

export const statusLabels: Record<string, string> = {
  open: 'Открыт',
  in_progress: 'В работе',
  pending: 'Ожидание',
  closed: 'Закрыт',
};

export const categoryLabels: Record<string, string> = {
  general: 'Общий вопрос',
  problem: 'Проблема',
  payout: 'Выплаты',
  account: 'Аккаунт',
  releases: 'Релизы',
  other: 'Другое'
};

export const priorityColors: Record<string, string> = {
  low: 'bg-zinc-500/20 text-zinc-400',
  medium: 'bg-blue-500/20 text-blue-400',
  high: 'bg-orange-500/20 text-orange-400',
  urgent: 'bg-red-500/20 text-red-400',
};

export const priorityLabels: Record<string, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  urgent: 'Срочно',
};
