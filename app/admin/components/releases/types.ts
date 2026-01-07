// Типы для модерации релизов

export interface Contributor {
  role: 'composer' | 'lyricist' | 'producer' | 'arranger' | 'performer' | 'mixer' | 'mastering' | 'other';
  fullName: string;
}

export const CONTRIBUTOR_ROLES = [
  { value: 'composer', label: 'Композитор' },
  { value: 'lyricist', label: 'Автор слов' },
  { value: 'producer', label: 'Продюсер' },
  { value: 'arranger', label: 'Аранжир.' },
  { value: 'performer', label: 'Исполнитель' },
  { value: 'mixer', label: 'Микс' },
  { value: 'mastering', label: 'Мастеринг' },
  { value: 'other', label: 'Другое' }
] as const;

export interface Release {
  id: string;
  created_at: string;
  release_type: 'basic' | 'exclusive';
  title: string;
  artist_name: string;
  cover_url: string;
  cover_url_original?: string; // Оригинальная обложка (без сжатия) для скачивания
  genre: string;
  subgenres?: string[];
  collaborators?: string[];
  release_artists?: string[];
  contributors?: Contributor[];
  status: string;
  payment_status: string | null;
  payment_receipt_url: string | null;
  payment_amount: number | null;
  user_email: string;
  user_name: string;
  user_avatar?: string;
  user_nickname?: string;
  tracks_count: number;
  user_role: 'basic' | 'exclusive';
  tracks?: Track[];
  rejection_reason?: string;
  platforms?: string[];
  countries?: string[];
  release_date?: string;
  upc?: string;
  label?: string;
  custom_id?: string;
  focus_track?: string;
  focus_track_promo?: string;
  album_description?: string;
}

export interface Track {
  id?: string;
  title: string;
  artists: string;
  file_url: string;
  duration?: number;
  explicit?: boolean;
  isrc?: string;
  upc?: string;
  lyrics?: string;
  language?: string;
  version?: string;
  hasDrugs?: boolean;
  isInstrumental?: boolean;
  featuring?: string[];
  producers?: string[];
  link?: string;
  audio_url?: string;
  audioMetadata?: {
    format: string;
    duration?: number;
    bitrate?: string;
    sampleRate?: string;
    size: number;
  };
}

export const statusConfig: Record<string, { label: string; color: string; emoji: string }> = {
  pending: { label: 'На модерации', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', emoji: '⏳' },
  distributed: { label: 'На дистрибуции', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', emoji: '🚀' },
  published: { label: 'Опубликован', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', emoji: '🎵' },
  rejected: { label: 'Отклонен', color: 'bg-red-500/20 text-red-400 border-red-500/30', emoji: '❌' },
  draft: { label: 'Черновик', color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30', emoji: '📝' },
};

export const genreList = [
  'Pop', 'Hip-Hop/Rap', 'R&B/Soul', 'Electronic', 'Rock', 
  'Alternative', 'Indie', 'Jazz', 'Classical', 'Country',
  'Latin', 'Reggae', 'Metal', 'Folk', 'Blues', 'World', 'Other'
];

export const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Ожидает оплаты', color: 'bg-yellow-500/20 text-yellow-400' },
  uploaded: { label: 'Чек загружен', color: 'bg-blue-500/20 text-blue-400' },
  verified: { label: 'Оплачено', color: 'bg-green-500/20 text-green-400' },
  rejected: { label: 'Чек отклонен', color: 'bg-red-500/20 text-red-400' },
};
