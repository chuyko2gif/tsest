'use client';

import { memo, useRef, useEffect, useCallback, useState } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================
export interface User {
  id: string;
  email: string;
  nickname?: string;
  avatar_url?: string;
  role?: string;
  member_id?: string;
}

export interface Track {
  title: string;
  artists: string;
  file: File | null;
  file_url?: string;
  explicit: boolean;
  isrc: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================
export const countryFlags: { [key: string]: string } = {
  'Россия': '🇷🇺', 'Беларусь': '🇧🇾', 'Казахстан': '🇰🇿', 'Украина': '🇺🇦',
  'Узбекистан': '🇺🇿', 'Азербайджан': '🇦🇿', 'Армения': '🇦🇲', 'Грузия': '🇬🇪',
  'Молдова': '🇲🇩', 'Кыргызстан': '🇰🇬', 'Таджикистан': '🇹🇯', 'Туркменистан': '🇹🇲',
  'США': '🇺🇸', 'Великобритания': '🇬🇧', 'Германия': '🇩🇪', 'Франция': '🇫🇷',
  'Италия': '🇮🇹', 'Испания': '🇪🇸', 'Канада': '🇨🇦', 'Австралия': '🇦🇺',
  'Япония': '🇯🇵', 'Южная Корея': '🇰🇷', 'Бразилия': '🇧🇷', 'Мексика': '🇲🇽',
  'Аргентина': '🇦🇷', 'Польша': '🇵🇱', 'Турция': '🇹🇷', 'Нидерланды': '🇳🇱',
  'Швеция': '🇸🇪', 'Норвегия': '🇳🇴', 'Финляндия': '🇫🇮', 'Чехия': '🇨🇿',
  'Австрия': '🇦🇹', 'Бельгия': '🇧🇪', 'Швейцария': '🇨🇭', 'Дания': '🇩🇰',
  'Португалия': '🇵🇹', 'Греция': '🇬🇷', 'Ирландия': '🇮🇪', 'Китай': '🇨🇳',
  'Индия': '🇮🇳', 'ОАЭ': '🇦🇪', 'ЮАР': '🇿🇦'
};

export const allCountries = Object.keys(countryFlags);

export const genreList = [
  'Pop', 'Hip-Hop/Rap', 'R&B/Soul', 'Electronic', 'Rock', 
  'Alternative', 'Indie', 'Jazz', 'Classical', 'Country',
  'Latin', 'Reggae', 'Metal', 'Folk', 'Blues', 'World', 'Other'
];

export const platformsList = [
  { id: 'spotify', name: 'Spotify' },
  { id: 'apple', name: 'Apple Music' },
  { id: 'yandex', name: 'Яндекс Музыка' },
  { id: 'vk', name: 'VK Музыка' },
  { id: 'youtube', name: 'YouTube Music' },
  { id: 'deezer', name: 'Deezer' },
  { id: 'tidal', name: 'Tidal' },
  { id: 'amazon', name: 'Amazon Music' },
  { id: 'soundcloud', name: 'SoundCloud' },
  { id: 'tiktok', name: 'TikTok' },
];

// ============================================================================
// HELPERS
// ============================================================================
export const getAvatarUrl = (avatarUrl: string | undefined, supabase: SupabaseClient): string => {
  if (!avatarUrl) return '';
  if (avatarUrl.startsWith('http')) return avatarUrl;
  const { data } = supabase.storage.from('avatars').getPublicUrl(avatarUrl);
  return data?.publicUrl || '';
};

export const validateAudioFile = (file: File): { valid: boolean; error?: string } => {
  const fileName = file.name.toLowerCase();
  const isWav = fileName.endsWith('.wav');
  const isFlac = fileName.endsWith('.flac');
  if (!isWav && !isFlac) return { valid: false, error: '❌ Только WAV или FLAC форматы' };
  return { valid: true };
};

// ============================================================================
// USER SEARCH COMPONENT
// ============================================================================
interface UserSearchProps {
  supabase: SupabaseClient;
  selectedUser: User | null;
  onSelectUser: (user: User | null) => void;
}

export const UserSearch = memo(function UserSearch({ supabase, selectedUser, onSelectUser }: UserSearchProps) {
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchError, setSearchError] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);

  const searchUsers = useCallback(async (query: string) => {
    if (!query || query.length < 2) { setSearchResults([]); setSearchError(''); return; }
    setIsSearching(true); setSearchError('');
    try {
      const { data, error } = await supabase.from('profiles')
        .select('id, email, nickname, avatar_url, role, member_id')
        .or(`email.ilike.%${query}%,nickname.ilike.%${query}%`).limit(15);
      if (error) { setSearchError('Ошибка поиска'); setSearchResults([]); return; }
      if (!data || data.length === 0) { setSearchError(`Пользователь "${query}" не найден`); setSearchResults([]); return; }
      setSearchResults(data);
    } catch { setSearchError('Ошибка соединения'); setSearchResults([]); }
    finally { setIsSearching(false); }
  }, [supabase]);

  useEffect(() => {
    const timer = setTimeout(() => searchUsers(userSearch), 300);
    return () => clearTimeout(timer);
  }, [userSearch, searchUsers]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400">1</span>
        Пользователь
      </h3>
      
      <div ref={searchRef} className="relative">
        <input type="text" value={userSearch}
          onChange={(e) => { setUserSearch(e.target.value); setShowResults(true); }}
          onFocus={() => setShowResults(true)}
          placeholder="Поиск по email или тегу..."
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-purple-500/50 focus:outline-none transition"
        />
        {isSearching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl max-h-64 overflow-y-auto">
            {searchResults.map((user) => (
              <button key={user.id} type="button"
                onClick={() => { onSelectUser(user); setUserSearch(''); setShowResults(false); setSearchError(''); }}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition text-left">
                {getAvatarUrl(user.avatar_url, supabase) ? (
                  <img src={getAvatarUrl(user.avatar_url, supabase)} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                    {(user.nickname || user.email)?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{user.nickname || 'Без имени'}</p>
                  <p className="text-zinc-400 text-sm truncate">{user.email}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${user.role === 'exclusive' ? 'bg-purple-500/20 text-purple-400' : 'bg-zinc-500/20 text-zinc-400'}`}>
                  {user.role || 'basic'}
                </span>
              </button>
            ))}
          </div>
        )}
        
        {showResults && searchError && userSearch.length >= 2 && (
          <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-white/10 rounded-xl p-4 shadow-2xl">
            <p className="text-zinc-400 text-center">{searchError}</p>
          </div>
        )}
      </div>
      
      {selectedUser && (
        <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center gap-4">
          {getAvatarUrl(selectedUser.avatar_url, supabase) ? (
            <img src={getAvatarUrl(selectedUser.avatar_url, supabase)} alt="" className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-lg">
              {(selectedUser.nickname || selectedUser.email)?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <p className="text-white font-bold">{selectedUser.nickname || 'Без имени'}</p>
            <p className="text-zinc-400 text-sm">{selectedUser.email}</p>
          </div>
          <button type="button" onClick={() => onSelectUser(null)}
            className="p-2 hover:bg-white/10 rounded-lg transition text-zinc-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
});

// ============================================================================
// TRACK ITEM COMPONENT
// ============================================================================
interface TrackItemProps {
  track: Track;
  index: number;
  canRemove: boolean;
  artistName: string;
  onUpdate: (field: keyof Track, value: any) => void;
  onRemove: () => void;
  onFileError: (error: string) => void;
}

export const TrackItem = memo(function TrackItem({ track, index, canRemove, artistName, onUpdate, onRemove, onFileError }: TrackItemProps) {
  return (
    <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
      <div className="flex items-center gap-4 mb-4">
        <span className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400 font-bold text-sm">{index + 1}</span>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
          <input type="text" value={track.title} onChange={(e) => onUpdate('title', e.target.value)} placeholder="Название трека *"
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:border-purple-500/50 focus:outline-none transition" />
          <input type="text" value={track.artists} onChange={(e) => onUpdate('artists', e.target.value)} placeholder="Артисты"
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:border-purple-500/50 focus:outline-none transition" />
          <input type="text" value={track.isrc} onChange={(e) => onUpdate('isrc', e.target.value)} placeholder="ISRC код"
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:border-purple-500/50 focus:outline-none transition font-mono text-sm" />
        </div>
        <button type="button" onClick={() => onUpdate('explicit', !track.explicit)}
          className={`px-3 py-2 rounded-lg text-xs font-bold transition ${track.explicit ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/5 text-zinc-500 border border-white/10'}`}>E</button>
        {canRemove && (
          <button type="button" onClick={onRemove} className="p-2 hover:bg-red-500/20 rounded-lg transition text-zinc-400 hover:text-red-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
      <div className="flex items-center gap-4">
        <label className="flex-1 flex items-center gap-3 px-4 py-3 bg-white/5 border border-dashed border-white/20 rounded-xl cursor-pointer hover:border-purple-500/50 transition">
          <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-2v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          <span className="text-sm text-zinc-400">
            {track.file ? <span className="text-emerald-400">✓ {track.file.name}</span> : 'Загрузить аудио (WAV или FLAC)'}
          </span>
          <input type="file" accept=".wav,.flac,audio/wav,audio/x-wav,audio/flac"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const validation = validateAudioFile(file);
                if (!validation.valid) { onFileError(validation.error || 'Ошибка'); return; }
                onFileError('');
                onUpdate('file', file);
              }
            }}
            className="hidden" />
        </label>
        {track.file && (
          <button type="button" onClick={() => onUpdate('file', null)} className="p-2 hover:bg-red-500/20 rounded-lg transition text-zinc-400 hover:text-red-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
});

// ============================================================================
// COUNTRIES SELECTOR
// ============================================================================
interface CountriesSelectorProps {
  selected: string[];
  onChange: (countries: string[]) => void;
}

export const CountriesSelector = memo(function CountriesSelector({ selected, onChange }: CountriesSelectorProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400">4</span>
        Страны распространения
      </h3>
      <div className="flex flex-wrap gap-2 mb-4">
        <button type="button" onClick={() => onChange(allCountries)}
          className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-500/30 transition">Выбрать все</button>
        <button type="button" onClick={() => onChange([])}
          className="px-3 py-1.5 bg-white/5 text-zinc-400 rounded-lg text-sm font-medium hover:bg-white/10 transition">Снять все</button>
        <span className="px-3 py-1.5 text-zinc-500 text-sm">Выбрано: {selected.length} из {allCountries.length}</span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {allCountries.map((country) => (
          <button key={country} type="button"
            onClick={() => onChange(selected.includes(country) ? selected.filter(c => c !== country) : [...selected, country])}
            className={`p-2 rounded-lg flex items-center gap-2 text-sm transition ${
              selected.includes(country) ? 'bg-purple-500/20 border border-purple-500/50 text-white' : 'bg-white/5 border border-white/10 text-zinc-500 hover:bg-white/10'
            }`}>
            <span className="text-lg">{countryFlags[country]}</span>
            <span className="truncate text-xs">{country}</span>
          </button>
        ))}
      </div>
    </div>
  );
});

// ============================================================================
// PLATFORMS SELECTOR
// ============================================================================
interface PlatformsSelectorProps {
  selected: string[];
  onChange: (platforms: string[]) => void;
}

export const PlatformsSelector = memo(function PlatformsSelector({ selected, onChange }: PlatformsSelectorProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400">5</span>
        Площадки
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {platformsList.map((platform) => (
          <button key={platform.id} type="button"
            onClick={() => onChange(selected.includes(platform.id) ? selected.filter(p => p !== platform.id) : [...selected, platform.id])}
            className={`p-3 rounded-xl flex flex-col items-center gap-2 transition ${
              selected.includes(platform.id) ? 'bg-purple-500/20 border border-purple-500/50 text-white' : 'bg-white/5 border border-white/10 text-zinc-500 hover:bg-white/10'
            }`}>
            <span className="text-xs font-medium text-center">{platform.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
});
