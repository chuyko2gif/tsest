// Типы для системы поддержки

export interface Message {
  id: string;
  ticket_id: string;
  user_id: string;
  sender_id?: string;
  message: string;
  is_admin: boolean;
  is_read: boolean;
  created_at: string;
  attachments?: Attachment[];
  user_avatar?: string;
  user_nickname?: string;
  user_email?: string;
  sender_avatar?: string;
  sender_nickname?: string;
  sender_email?: string;
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
  subject: string;
  status: string;
  created_at: string;
  last_message_at: string;
  last_message_preview: string;
  unread_count: number;
  is_typing: boolean;
  typing_user_id?: string | null;
  archived_at?: string | null;
  user_id?: string;
}

export type TicketStatus = 'open' | 'answered' | 'closed' | 'all';

export interface SupportUser {
  id: string;
  email: string;
  avatar?: string;
  nickname?: string;
  [key: string]: any;
}

export interface SupportSettings {
  notifications: boolean;
  soundEnabled: boolean;
}

export interface FilterState {
  status: TicketStatus;
  searchQuery: string;
}
