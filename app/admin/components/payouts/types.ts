// Типы для управления выплатами

export interface User {
  id: string;
  email: string;
  nickname: string | null;
  avatar: string | null;
  member_id: string | null;
  balance: number;
  role: string | null;
}

export interface Payout {
  id: number;
  user_id: string;
  year: number;
  quarter: number;
  amount: number;
  note: string | null;
  paid_by: string | null;
  is_read: boolean;
  created_at: string;
  transactions?: { id: string }[];
  profiles?: User;
  type?: 'payout' | 'withdrawal';
}

export interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}
