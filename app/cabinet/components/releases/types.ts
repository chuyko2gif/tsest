// Типы для релизов
import { UserRole } from '../../lib/types';

export interface Release {
  id: string;
  title: string;
  artist_name?: string;
  artist?: string;
  cover_url?: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'distributed' | 'published';
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
  subgenres?: string[];
  contract_agreed?: boolean;
  contract_agreed_at?: string;
  payment_status?: 'pending' | 'verified' | 'rejected';
  payment_amount?: number;
  payment_receipt_url?: string;
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
  explicit?: boolean;
  lyrics?: string;
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
  sortBy: 'date' | 'title' | 'status';
  order: 'asc' | 'desc';
  showArchive: boolean;
}
