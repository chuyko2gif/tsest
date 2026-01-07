// Типы для релизов
import { UserRole } from '../../lib/types';

export interface Contributor {
  role: 'composer' | 'lyricist' | 'producer' | 'arranger' | 'performer' | 'mixer' | 'mastering' | 'other';
  fullName: string;
}

export interface TrackAuthor {
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
  custom_id?: string; // thqrel-0001, thqrel-0002, ...
  title: string;
  artist_name?: string;
  artist?: string;
  cover_url?: string;
  status: 'draft' | 'pending' | 'rejected' | 'approved' | 'published' | 'distributed' | 'awaiting_payment';
  release_type?: 'basic' | 'exclusive';
  date?: string;
  created_at?: string;
  genre?: string;
  release_date?: string;
  tracks?: Track[];
  platforms?: string[];
  countries?: string[];
  language?: string;
  upc?: string;
  label?: string;
  copyright?: string;
  description?: string;
  price?: number;
  credits?: string;
  collaborators?: string[];
  release_artists?: string[];
  contributors?: Contributor[];
  subgenres?: string[];
  contract_agreed?: boolean;
  contract_agreed_at?: string;
  payment_status?: 'pending' | 'verified' | 'rejected';
  payment_amount?: number;
  payment_receipt_url?: string;
  payment_transaction_id?: string;
  is_paid?: boolean;
  paid_at?: string;
  rejection_reason?: string;
  focus_track?: string;
  focus_track_promo?: string;
  album_description?: string;
  promo_photos?: string[];
  spotify_link?: string;
  apple_music_link?: string;
  youtube_link?: string;
  soundcloud_link?: string;
  vk_link?: string;
  instagram_link?: string;
}

export interface Track {
  title: string;
  upc?: string;
  isrc?: string;
  language?: string;
  version?: string;
  featuring?: string | string[];
  producers?: string | string[];
  producer?: string;
  authors?: string | string[] | TrackAuthor[]; // Поддержка старого и нового формата
  explicit?: boolean;
  hasDrugs?: boolean; // Алиас для explicit - указывает на наркотики/ненормативную лексику
  isInstrumental?: boolean; // Инструментальный трек (без слов)
  lyrics?: string;
  link?: string; // Ссылка на аудиофайл трека
}

export interface UserReleasesProps {
  userId?: string | null;
  nickname?: string;
  onOpenUpload?: () => void;
  userRole?: UserRole;
}

export interface FilterState {
  searchQuery: string;
  filterStatus: 'all' | string;
  filterGenre: string;
  filterReleaseType: 'all' | 'basic' | 'exclusive';
  sortBy: 'date' | 'title' | 'status';
  order: 'asc' | 'desc';
  showArchive: boolean;
}
