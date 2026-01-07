// Типы для управления пользователями

export interface User {
  id: string;
  email: string;
  nickname: string;
  member_id: string;
  balance: number;
  role: 'admin' | 'exclusive' | 'basic' | 'owner';
  avatar: string | null;
  created_at: string;
  email_confirmed: boolean;
  last_sign_in: string;
  telegram?: string;
}

// Profile совместим с UsersTab
export interface Profile {
  id: string;
  email: string;
  nickname: string | null;
  display_name?: string | null;
  member_id: string | null;
  balance: number;
  role: 'admin' | 'exclusive' | 'basic' | 'owner' | null;
  avatar: string | null;
  created_at: string | null;
  telegram?: string | null;
  vk?: string | null;
  instagram?: string | null;
  youtube?: string | null;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'payout' | 'withdrawal' | 'refund' | 'adjustment';
  amount: number;
  status: string;
  description?: string;
  reference_id?: string;
  bank_name?: string;
  card_number?: string;
  admin_comment?: string;
  source?: string;
  created_at: string;
}

export interface Release {
  id: string;
  title: string;
  artist: string;
  artist_name?: string; // DB field
  status: string;
  created_at: string;
  release_type?: 'basic' | 'exclusive';
  cover_url?: string;
  custom_id?: string;
  upc?: string;
  release_date?: string;
  genre?: string;
  subgenres?: string[];
  label?: string;
  language?: string;
  copyright?: string;
  tracks?: any[];
}

export interface Payout {
  id: string;
  amount: number;
  created_at: string;
}

export interface Ticket {
  id: string;
  subject: string;
  title?: string; // legacy
  status: 'open' | 'in_progress' | 'closed' | 'pending' | string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  message?: string;
  last_message_at?: string;
  last_admin_message_at?: string;
  has_unread_admin_reply?: boolean;
  release_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface RoleColors {
  bg: string;
  border: string;
  text: string;
}

export const roleColors: Record<string, RoleColors> = {
  owner: { bg: 'bg-[#8b5cf6]/5', border: 'border-[#8b5cf6]/30', text: 'text-[#a78bfa]' },
  admin: { bg: 'bg-[#ff4757]/5', border: 'border-[#ff4757]/30', text: 'text-[#ff6b81]' },
  exclusive: { bg: 'bg-[#f59e0b]/5', border: 'border-[#f59e0b]/30', text: 'text-[#fbbf24]' },
  basic: { bg: 'bg-zinc-800/30', border: 'border-zinc-700/50', text: 'text-zinc-400' },
};

// Светлая тема цветов для ролей
export const roleColorsLight: Record<string, RoleColors> = {
  owner: { bg: 'bg-purple-100/60', border: 'border-purple-300/50', text: 'text-purple-600' },
  admin: { bg: 'bg-red-100/60', border: 'border-red-300/50', text: 'text-red-500' },
  exclusive: { bg: 'bg-amber-100/60', border: 'border-amber-300/50', text: 'text-amber-600' },
  basic: { bg: 'bg-gray-100/60', border: 'border-gray-300/50', text: 'text-gray-500' },
};

export const roleConfig: Record<string, { label: string; color: string; priority: number }> = {
  owner: { label: 'Owner', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', priority: 0 },
  admin: { label: 'Admin', color: 'bg-red-500/20 text-red-400 border-red-500/30', priority: 1 },
  exclusive: { label: 'Exclusive', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', priority: 2 },
  basic: { label: 'Basic', color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30', priority: 3 },
};

export const sortOptions = [
  { value: 'role', label: 'По роли' },
  { value: 'email', label: 'По email' },
  { value: 'nickname', label: 'По нику' },
  { value: 'created_at', label: 'По дате' },
] as const;

// Utility function
export function getUserRole(user: Profile): string {
  return user.role || 'basic';
}
