// Типы для живых тикетов

export interface Message {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_admin: boolean;
  is_read: boolean;
  created_at: string;
  attachments?: Attachment[];
  user?: {
    nickname: string;
    avatar: string;
  };
}

export interface Attachment {
  id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
}

export interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  created_at: string;
  last_message_at: string;
  last_message_preview: string;
  unread_count: number;
  is_typing: boolean;
  typing_user_id: string;
  archived_at: string | null;
  user?: {
    nickname: string;
    email: string;
    avatar: string;
    member_id: string;
  };
}

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'open': return 'bg-green-500/20 text-green-300 border-green-500/30';
    case 'answered': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'closed': return 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30';
    default: return 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30';
  }
};

export const getStatusLabel = (status: string) => {
  switch (status) {
    case 'open': return '🟢 Открыт';
    case 'answered': return '💬 Ответили';
    case 'closed': return '⚫ Закрыт';
    default: return status;
  }
};

export type FilterType = 'all' | 'open' | 'answered' | 'closed';
