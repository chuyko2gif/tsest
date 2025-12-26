// Типы для управления новостями

export interface NewsItem {
  id: number;
  title: string;
  content: string;
  category: string;
  image: string | null;
  scheduled_for: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

export interface ConfirmDialogState {
  show: boolean;
  message: string;
  onConfirm: () => void;
}
