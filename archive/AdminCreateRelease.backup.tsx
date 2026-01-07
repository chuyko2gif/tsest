"use client";
// Force rebuild v2 - 2026-01-01
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  nickname?: string;
  avatar_url?: string;
  role?: string;
  member_id?: string;
}

interface Track {
  title: string;
  artists: string;
  file: File | null;
  file_url?: string;
  explicit: boolean;
  isrc: string;
}

// Флаги стран
const countryFlags: { [key: string]: string } = {
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

const allCountries = Object.keys(countryFlags);

// Хелпер для получения аватарки
const getAvatarUrl = (avatarUrl: string | undefined, supabase: SupabaseClient): string => {
  if (!avatarUrl) return '';
  if (avatarUrl.startsWith('http')) return avatarUrl;
  // Если это путь в storage
  const { data } = supabase.storage.from('avatars').getPublicUrl(avatarUrl);
  return data?.publicUrl || '';
};

interface AdminCreateReleaseProps {
  supabase: SupabaseClient;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const genreList = [
  'Pop', 'Hip-Hop/Rap', 'R&B/Soul', 'Electronic', 'Rock', 
  'Alternative', 'Indie', 'Jazz', 'Classical', 'Country',
  'Latin', 'Reggae', 'Metal', 'Folk', 'Blues', 'World', 'Other'
];

const PlatformIcons: Record<string, React.ReactNode> = {
  spotify: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  ),
  apple: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  ),
  yandex: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-3h1.5V9.5h2.25L9.5 17H10zM15.5 7H11v1.5h3v3h-2V10h-1.5v3h3.5c.55 0 1-.45 1-1V8c0-.55-.45-1-1-1z"/>
    </svg>
  ),
  vk: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.391 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4 8.57 4 8.098c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.678.847 2.49 2.27 4.673 2.862 4.673.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z"/>
    </svg>
  ),
  youtube: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
  deezer: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.81 4.16v3.03H24V4.16h-5.19zM6.27 8.38v3.027h5.189V8.38h-5.19zm12.54 0v3.027H24V8.38h-5.19zM0 12.6v3.027h5.19V12.6H0zm6.27 0v3.027h5.189V12.6h-5.19zm6.27 0v3.027h5.19V12.6h-5.19zm6.27 0v3.027H24V12.6h-5.19zM0 16.81v3.028h5.19v-3.027H0zm6.27 0v3.028h5.189v-3.027h-5.19zm6.27 0v3.028h5.19v-3.027h-5.19zm6.27 0v3.028H24v-3.027h-5.19z"/>
    </svg>
  ),
  tidal: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.012 3.992L8.008 7.996 4.004 3.992 0 7.996 4.004 12l4.004-4.004L12.012 12l-4.004 4.004 4.004 4.004 4.004-4.004L12.012 12l4.004-4.004-4.004-4.004zm4.004 4.004l4.004-4.004L24.024 7.996l-4.004 4.004-4.004-4.004z"/>
    </svg>
  ),
  amazon: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595l.315-.14c.138-.06.234-.1.293-.13.226-.088.39-.046.493.127.112.181.063.389-.147.626-.18.2-.404.42-.67.645-.624.52-1.314 1.004-2.068 1.45-1.262.745-2.6 1.29-4.013 1.64a15.7 15.7 0 01-3.18.338c-2.127 0-4.17-.36-6.13-1.08-1.97-.71-3.55-1.655-4.74-2.83-.255-.25-.326-.5-.213-.75l.207-.394.088-.17.1-.2zm6.268-1.628c-.207-.03-.36-.14-.46-.328l-.036-.09a.605.605 0 01.12-.547c.302-.378.686-.673 1.152-.88.522-.228 1.144-.38 1.866-.456l.17-.017c.376-.024.72-.04 1.03-.05.32-.01.592-.01.818 0 1.127.042 2.082.18 2.863.414.207.063.354.18.44.35.09.17.09.35 0 .54-.178.376-.47.74-.877 1.086-.482.413-1.12.753-1.916 1.022-.78.26-1.51.39-2.185.39-.544 0-1.05-.07-1.52-.22-.457-.144-.88-.38-1.264-.71-.384-.332-.614-.72-.69-1.16l-.028-.175c-.02-.14.006-.27.078-.39.072-.12.168-.193.288-.22l.162-.027.162.01c.42.04.833.02 1.237-.06.426-.087.822-.23 1.185-.428.304-.164.555-.358.75-.582.21-.24.26-.52.147-.838l-.036-.11c-.16-.417-.54-.628-1.14-.633l-.21.007-.265.025c-.418.04-.9.12-1.443.24l-.2.044-.34.08c-.458.114-.87.18-1.235.2l-.242.01zm4.01-6.95c-.206-.188-.36-.38-.46-.572-.104-.203-.15-.405-.14-.604l.01-.13c.06-.49.273-.92.64-1.29.385-.387.88-.68 1.49-.88.588-.19 1.23-.285 1.928-.285.9 0 1.684.127 2.352.38.69.264 1.186.608 1.484 1.03.303.43.445.89.423 1.378l-.007.115c-.024.317-.125.612-.3.884-.17.264-.412.49-.724.677-.243.146-.467.25-.67.314-.21.06-.422.095-.636.1l-.107.003c-.244 0-.47-.028-.68-.085-.208-.057-.39-.144-.548-.26-.16-.118-.28-.255-.36-.41-.09-.152-.125-.327-.107-.523l.01-.106.025-.13c.08-.34.245-.65.495-.93.274-.305.625-.564 1.05-.775.408-.202.832-.35 1.27-.445l.224-.04c.163-.026.303-.018.42.025.116.043.2.12.25.228.053.108.065.238.04.39l-.02.09-.05.16c-.12.36-.323.69-.612.99-.322.332-.706.604-1.15.814-.43.203-.87.34-1.318.41l-.23.028c-.246.024-.47.025-.67.003-.21-.023-.39-.08-.54-.175-.16-.095-.273-.22-.342-.373-.075-.16-.084-.357-.026-.59l.028-.105c.08-.288.24-.556.48-.805.264-.273.597-.5 1-.68.38-.167.787-.292 1.218-.374l.233-.04c.254-.036.48-.02.68.05.208.07.343.196.407.377l.026.09c.045.166.032.328-.04.488-.072.16-.188.31-.35.448-.16.137-.356.253-.587.347-.223.09-.474.146-.753.167l-.126.007c-.37.002-.74-.07-1.11-.215-.384-.153-.692-.374-.923-.664l-.08-.108zm-.24-3.18c.06-.306.192-.544.396-.712.206-.17.45-.254.73-.254.3 0 .544.094.73.28.175.18.263.416.263.71 0 .27-.088.5-.263.69-.19.2-.44.3-.75.3-.286 0-.525-.09-.716-.27-.19-.182-.305-.425-.35-.73l-.01-.1z"/>
    </svg>
  ),
  soundcloud: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.052-.1-.1-.1m-.899.828c-.06 0-.091.037-.104.094L0 14.479l.165 1.308c.014.057.045.094.09.094s.089-.037.099-.094l.209-1.308-.209-1.332c-.01-.057-.054-.094-.099-.094m1.83-1.229c-.061 0-.12.045-.12.104l-.21 2.563.225 2.458c0 .06.045.12.12.12.074 0 .135-.061.135-.12l.254-2.474-.254-2.548c-.015-.06-.061-.12-.135-.12m.705-.405c-.075 0-.135.06-.15.135l-.194 2.97.194 2.458c.015.09.074.15.15.15.075 0 .135-.061.15-.15l.225-2.474-.225-2.97c-.015-.075-.06-.135-.15-.135m.87-.539c-.09 0-.149.075-.164.164l-.194 3.32.194 2.458c.015.09.074.164.164.164.09 0 .164-.074.18-.164l.209-2.474-.209-3.32c-.015-.104-.09-.164-.18-.164m.855-.271c-.09 0-.165.09-.18.18L4.2 14.479l.18 2.443c.015.09.075.18.165.18.104 0 .164-.09.18-.18l.195-2.443-.21-4.065c-.015-.09-.09-.18-.18-.18m.855-.181c-.104 0-.18.09-.195.195l-.164 4.065.18 2.428c.015.104.09.195.18.195.104 0 .18-.09.195-.195l.21-2.428-.21-4.08c-.015-.09-.104-.18-.195-.18m.87-.119c-.12 0-.21.104-.21.21l-.165 4.065.165 2.413c0 .12.09.225.21.225.12 0 .209-.105.225-.225l.18-2.413-.18-4.065c-.015-.12-.105-.21-.225-.21m.87-.062c-.12 0-.225.104-.225.225l-.15 4.02.15 2.414c0 .135.104.225.225.225.135 0 .225-.104.24-.225l.165-2.413-.165-4.02c-.015-.135-.105-.226-.24-.226m.87-.061c-.135 0-.24.12-.24.24l-.15 3.974.15 2.399c0 .135.12.24.255.24.12 0 .24-.105.24-.24l.165-2.413-.165-3.96c0-.135-.12-.254-.255-.254m.93 0c-.135 0-.255.119-.255.254l-.12 3.96.135 2.398c0 .15.12.255.255.255.135 0 .255-.12.255-.27l.15-2.399-.165-3.945c0-.149-.12-.269-.255-.269m.87 0c-.15 0-.27.135-.27.27l-.12 3.944.135 2.384c0 .15.12.27.255.284.15 0 .27-.12.285-.27l.135-2.398-.15-3.944c0-.15-.135-.27-.27-.27m.87.029c-.15 0-.285.135-.285.27l-.105 3.899.12 2.369c0 .165.12.3.27.3.165 0 .285-.135.3-.3l.12-2.369-.135-3.899c0-.15-.135-.285-.285-.285m.856 0c-.15 0-.27.135-.285.285l-.105 3.899.12 2.354c.015.18.135.3.285.3.149 0 .284-.12.284-.3l.135-2.354-.135-3.885c-.015-.165-.135-.299-.285-.299m5.699 1.98c-.375 0-.735.074-1.064.209-.195-2.234-2.055-3.99-4.35-3.99-.585 0-1.139.119-1.644.33-.195.074-.255.165-.255.329v7.828c0 .165.135.314.315.329h7.02c1.455 0 2.625-1.186 2.625-2.655-.015-1.456-1.185-2.641-2.64-2.641"/>
    </svg>
  ),
  tiktok: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>
  ),
};

const platformsList = [
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

export default function AdminCreateRelease({ supabase, onSuccess, onCancel }: AdminCreateReleaseProps) {
  // Поиск пользователя
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Данные релиза
  const [releaseType, setReleaseType] = useState<'single' | 'ep' | 'album'>('single');
  const [title, setTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [genre, setGenre] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [coverError, setCoverError] = useState<string>('');
  const [coverInfo, setCoverInfo] = useState<{ width: number; height: number } | null>(null);
  const [upc, setUpc] = useState('');
  
  // Треки
  const [tracks, setTracks] = useState<Track[]>([{ title: '', artists: '', file: null, explicit: false, isrc: '' }]);
  const [trackError, setTrackError] = useState<string>('');
  
  // Страны
  const [selectedCountries, setSelectedCountries] = useState<string[]>(allCountries);
  
  // Площадки
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(platformsList.map(p => p.id));
  
  // Состояние формы
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [searchError, setSearchError] = useState<string>('');
  
  // Поиск пользователя
  const searchUsers = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setSearchError('');
      return;
    }
    
    setIsSearching(true);
    setSearchError('');
    try {
      // Поиск по email и nickname
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, nickname, avatar_url, role')
        .or(`email.ilike.%${query}%,nickname.ilike.%${query}%`)
        .limit(15);
      
      if (error) {
        setSearchError('Ошибка поиска. Попробуйте позже.');
        setSearchResults([]);
        return;
      }
      
      if (!data || data.length === 0) {
        setSearchError(`Пользователь "${query}" не найден`);
        setSearchResults([]);
        return;
      }
      
      setSearchResults(data);
    } catch {
      setSearchError('Ошибка соединения');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [supabase]);
  
  // Debounce поиска
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(userSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearch, searchUsers]);
  
  // Закрытие результатов при клике вне
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Обработка обложки с валидацией
  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setCoverError('');
    setCoverInfo(null);
    
    // Проверка формата
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      setCoverError('Формат должен быть JPG или PNG');
      return;
    }
    
    // Проверка размера файла (макс 50 МБ)
    if (file.size > 50 * 1024 * 1024) {
      setCoverError('Размер файла не должен превышать 50 МБ');
      return;
    }
    
    // Проверка разрешения
    const img = new Image();
    img.onload = () => {
      const width = img.width;
      const height = img.height;
      
      setCoverInfo({ width, height });
      
      // Проверка квадратности
      if (width !== height) {
        setCoverError(`❌ Обложка должна быть квадратной! Ваш размер: ${width}x${height}px`);
        return;
      }
      
      // Проверка минимального размера
      if (width < 3000) {
        setCoverError(`❌ Минимум 3000x3000px. Ваш размер: ${width}x${height}px`);
        return;
      }
      
      // Всё ок
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setCoverPreview(reader.result as string);
      reader.readAsDataURL(file);
    };
    
    img.onerror = () => {
      setCoverError('Ошибка загрузки изображения');
    };
    
    img.src = URL.createObjectURL(file);
  };
  
  // Валидация аудио файла
  const validateAudioFile = (file: File): { valid: boolean; error?: string } => {
    const fileName = file.name.toLowerCase();
    const isWav = fileName.endsWith('.wav');
    const isFlac = fileName.endsWith('.flac');
    
    if (!isWav && !isFlac) {
      return { valid: false, error: '❌ Только WAV или FLAC форматы' };
    }
    
    return { valid: true };
  };
  
  // Добавление трека с ограничением для сингла
  const addTrack = () => {
    if (releaseType === 'single' && tracks.length >= 1) {
      setTrackError('Для сингла можно добавить только 1 трек');
      return;
    }
    if (releaseType === 'ep' && tracks.length >= 6) {
      setTrackError('Для EP максимум 6 треков');
      return;
    }
    setTrackError('');
    setTracks([...tracks, { title: '', artists: artistName, file: null, explicit: false, isrc: '' }]);
  };
  
  // При смене типа релиза - обрезаем треки если нужно
  useEffect(() => {
    if (releaseType === 'single' && tracks.length > 1) {
      setTracks([tracks[0]]);
    }
  }, [releaseType]);
  
  // Удаление трека
  const removeTrack = (index: number) => {
    if (tracks.length > 1) {
      setTracks(tracks.filter((_, i) => i !== index));
    }
  };
  
  // Обновление трека
  const updateTrack = (index: number, field: keyof Track, value: any) => {
    const updated = [...tracks];
    updated[index] = { ...updated[index], [field]: value };
    setTracks(updated);
  };
  
  // Переключение площадки
  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };
  
  // Отправка формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) {
      setError('Выберите пользователя');
      return;
    }
    
    if (!title.trim()) {
      setError('Введите название релиза');
      return;
    }
    
    if (!artistName.trim()) {
      setError('Введите имя артиста');
      return;
    }
    
    if (!genre) {
      setError('Выберите жанр');
      return;
    }
    
    if (tracks.some(t => !t.title.trim())) {
      setError('Заполните названия всех треков');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Загрузка обложки если есть
      let coverUrl = '';
      if (coverFile) {
        const fileName = `${selectedUser.id}/${Date.now()}_cover.${coverFile.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage
          .from('releases')
          .upload(fileName, coverFile);
        
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage.from('releases').getPublicUrl(fileName);
        coverUrl = urlData.publicUrl;
      }
      
      // Загрузка треков
      const uploadedTracks = [];
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        let fileUrl = '';
        
        if (track.file) {
          const fileName = `${selectedUser.id}/${Date.now()}_track_${i}.${track.file.name.split('.').pop()}`;
          const { error: uploadError } = await supabase.storage
            .from('releases')
            .upload(fileName, track.file);
          
          if (uploadError) throw uploadError;
          
          const { data: urlData } = supabase.storage.from('releases').getPublicUrl(fileName);
          fileUrl = urlData.publicUrl;
        }
        
        uploadedTracks.push({
          title: track.title,
          artists: track.artists || artistName,
          file_url: fileUrl,
          explicit: track.explicit,
          isrc: track.isrc || null,
          order: i + 1,
        });
      }
      
      // Генерация custom_id (thqrel-XXXX)
      const { data: maxIdData } = await supabase.rpc('generate_release_custom_id');
      const customId = maxIdData || `thqrel-${String(Date.now()).slice(-4)}`;
      
      // Создание релиза в releases_exclusive (так оно появится в кабинете пользователя)
      const { data: release, error: releaseError } = await supabase
        .from('releases_exclusive')
        .insert({
          user_id: selectedUser.id,
          custom_id: customId,
          title,
          artist_name: artistName,
          genre,
          cover_url: coverUrl,
          release_date: releaseDate || null,
          status: 'published', // Опубликованный релиз
          release_type: releaseType, // Тип релиза (single, ep, album)
          platforms: selectedPlatforms,
          countries: selectedCountries,
          tracks: uploadedTracks,
          contract_agreed: true,
          upc: upc || null,
        })
        .select()
        .single();
      
      if (releaseError) throw releaseError;
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
      
    } catch (err: any) {
      console.error('Ошибка создания релиза:', JSON.stringify(err, null, 2));
      console.error('Детали ошибки:', err?.message, err?.details, err?.hint, err?.code);
      setError(err?.message || err?.details || err?.hint || JSON.stringify(err) || 'Ошибка при создании релиза');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Релиз создан!</h3>
        <p className="text-zinc-400">Релиз успешно добавлен и опубликован</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Добавить релиз</h2>
          <p className="text-zinc-400 text-sm mt-1">Создание релиза для пользователя (с площадок)</p>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition"
          >
            Отмена
          </button>
        )}
      </div>
      
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Блок 1: Выбор пользователя */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400">1</span>
            Пользователь
          </h3>
          
          <div ref={searchRef} className="relative">
            <input
              type="text"
              value={userSearch}
              onChange={(e) => {
                setUserSearch(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              placeholder="Поиск по email или тегу..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-purple-500/50 focus:outline-none transition"
            />
            
            {isSearching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            
            {/* Результаты поиска */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl max-h-64 overflow-y-auto">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      setSelectedUser(user);
                      setUserSearch('');
                      setShowResults(false);
                      setSearchError('');
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition text-left"
                  >
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
                      {user.member_id && <p className="text-purple-400 text-xs">{user.member_id}</p>}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      user.role === 'exclusive' ? 'bg-purple-500/20 text-purple-400' : 'bg-zinc-500/20 text-zinc-400'
                    }`}>
                      {user.role || 'basic'}
                    </span>
                  </button>
                ))}
              </div>
            )}
            
            {/* Сообщение если не найден */}
            {showResults && searchError && userSearch.length >= 2 && (
              <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-white/10 rounded-xl p-4 shadow-2xl">
                <p className="text-zinc-400 text-center">{searchError}</p>
              </div>
            )}
          </div>
          
          {/* Выбранный пользователь */}
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
                {selectedUser.member_id && <p className="text-purple-400 text-xs mt-1">{selectedUser.member_id}</p>}
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="p-2 hover:bg-white/10 rounded-lg transition text-zinc-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
        
        {/* Блок 2: Информация о релизе */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400">2</span>
            Информация о релизе
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Тип релиза */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-400 mb-2">Тип релиза</label>
              <div className="flex gap-2">
                {(['single', 'ep', 'album'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setReleaseType(type)}
                    className={`flex-1 py-3 rounded-xl font-bold transition ${
                      releaseType === type
                        ? 'bg-purple-500 text-white'
                        : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                    }`}
                  >
                    {type === 'single' ? 'Сингл' : type === 'ep' ? 'EP' : 'Альбом'}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Название */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Название релиза *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Название"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-purple-500/50 focus:outline-none transition"
                required
              />
            </div>
            
            {/* Артист */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Имя артиста *</label>
              <input
                type="text"
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                placeholder="Имя артиста"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-purple-500/50 focus:outline-none transition"
                required
              />
            </div>
            
            {/* Жанр */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Жанр *</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500/50 focus:outline-none transition appearance-none cursor-pointer"
                required
              >
                <option value="" className="bg-zinc-900">Выберите жанр</option>
                {genreList.map((g) => (
                  <option key={g} value={g} className="bg-zinc-900">{g}</option>
                ))}
              </select>
            </div>
            
            {/* Дата релиза */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Дата релиза</label>
              <input
                type="date"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500/50 focus:outline-none transition"
              />
            </div>
            
            {/* UPC */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                UPC код
                <span className="text-purple-400 ml-1">(если есть)</span>
              </label>
              <input
                type="text"
                value={upc}
                onChange={(e) => setUpc(e.target.value)}
                placeholder="123456789012"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-purple-500/50 focus:outline-none transition font-mono"
              />
            </div>
            
            {/* Обложка */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-400 mb-2">Обложка</label>
              <div className="flex gap-4 items-start">
                {coverPreview ? (
                  <div className="relative group">
                    <img src={coverPreview} alt="Обложка" className="w-32 h-32 rounded-xl object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setCoverFile(null);
                        setCoverPreview('');
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <label className="w-32 h-32 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-500/50 transition">
                    <svg className="w-8 h-8 text-zinc-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs text-zinc-500">Загрузить</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverChange}
                      className="hidden"
                    />
                  </label>
                )}
                <div className="text-sm text-zinc-500">
                  <p className="font-medium text-white">Требования:</p>
                  <p>• Строго 3000x3000 px (квадрат)</p>
                  <p>• Форматы: JPG, PNG</p>
                  {coverInfo && (
                    <p className={`mt-2 ${coverError ? 'text-red-400' : 'text-emerald-400'}`}>
                      Загружено: {coverInfo.width}x{coverInfo.height}px
                    </p>
                  )}
                  {coverError && (
                    <p className="mt-2 text-red-400 whitespace-pre-line">{coverError}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Блок 3: Треклист */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400">3</span>
            Треклист
            {releaseType === 'single' && <span className="text-xs text-zinc-500 ml-2">(макс. 1 трек)</span>}
            {releaseType === 'ep' && <span className="text-xs text-zinc-500 ml-2">(макс. 6 треков)</span>}
          </h3>
          
          {trackError && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {trackError}
            </div>
          )}
          
          <div className="space-y-4">
            {tracks.map((track, index) => (
              <div key={index} className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center gap-4 mb-4">
                  <span className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400 font-bold text-sm">
                    {index + 1}
                  </span>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Название трека */}
                    <input
                      type="text"
                      value={track.title}
                      onChange={(e) => updateTrack(index, 'title', e.target.value)}
                      placeholder="Название трека *"
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:border-purple-500/50 focus:outline-none transition"
                    />
                    
                    {/* Артисты */}
                    <input
                      type="text"
                      value={track.artists}
                      onChange={(e) => updateTrack(index, 'artists', e.target.value)}
                      placeholder="Артисты"
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:border-purple-500/50 focus:outline-none transition"
                    />
                    
                    {/* ISRC */}
                    <input
                      type="text"
                      value={track.isrc}
                      onChange={(e) => updateTrack(index, 'isrc', e.target.value)}
                      placeholder="ISRC код"
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:border-purple-500/50 focus:outline-none transition font-mono text-sm"
                    />
                  </div>
                  
                  {/* Explicit */}
                  <button
                    type="button"
                    onClick={() => updateTrack(index, 'explicit', !track.explicit)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition ${
                      track.explicit
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-white/5 text-zinc-500 border border-white/10'
                    }`}
                    title="Explicit content"
                  >
                    E
                  </button>
                  
                  {/* Удалить */}
                  {tracks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTrack(index)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition text-zinc-400 hover:text-red-400"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
                
                {/* Загрузка аудио */}
                <div className="flex items-center gap-4">
                  <label className="flex-1 flex items-center gap-3 px-4 py-3 bg-white/5 border border-dashed border-white/20 rounded-xl cursor-pointer hover:border-purple-500/50 transition">
                    <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-2v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    <span className="text-sm text-zinc-400">
                      {track.file ? (
                        <span className="text-emerald-400">✓ {track.file.name}</span>
                      ) : (
                        'Загрузить аудио (WAV или FLAC)'
                      )}
                    </span>
                    <input
                      type="file"
                      accept=".wav,.flac,audio/wav,audio/x-wav,audio/flac"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const validation = validateAudioFile(file);
                          if (!validation.valid) {
                            setTrackError(validation.error || 'Ошибка загрузки');
                            return;
                          }
                          setTrackError('');
                          updateTrack(index, 'file', file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  {track.file && (
                    <button
                      type="button"
                      onClick={() => updateTrack(index, 'file', null)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition text-zinc-400 hover:text-red-400"
                      title="Удалить файл"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {/* Кнопка добавления трека - показываем только если можно добавить */}
            {!(releaseType === 'single' && tracks.length >= 1) && (
            <button
              type="button"
              onClick={addTrack}
              className="w-full py-3 border-2 border-dashed border-white/20 rounded-xl text-zinc-400 hover:border-purple-500/50 hover:text-purple-400 transition flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Добавить трек
            </button>
            )}
          </div>
        </div>
        
        {/* Блок 4: Страны */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400">4</span>
            Страны распространения
          </h3>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              onClick={() => setSelectedCountries(allCountries)}
              className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-500/30 transition"
            >
              Выбрать все
            </button>
            <button
              type="button"
              onClick={() => setSelectedCountries([])}
              className="px-3 py-1.5 bg-white/5 text-zinc-400 rounded-lg text-sm font-medium hover:bg-white/10 transition"
            >
              Снять все
            </button>
            <span className="px-3 py-1.5 text-zinc-500 text-sm">
              Выбрано: {selectedCountries.length} из {allCountries.length}
            </span>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {allCountries.map((country) => (
              <button
                key={country}
                type="button"
                onClick={() => {
                  setSelectedCountries(prev =>
                    prev.includes(country)
                      ? prev.filter(c => c !== country)
                      : [...prev, country]
                  );
                }}
                className={`p-2 rounded-lg flex items-center gap-2 text-sm transition ${
                  selectedCountries.includes(country)
                    ? 'bg-purple-500/20 border border-purple-500/50 text-white'
                    : 'bg-white/5 border border-white/10 text-zinc-500 hover:bg-white/10'
                }`}
              >
                <span className="text-lg">{countryFlags[country]}</span>
                <span className="truncate text-xs">{country}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Блок 5: Площадки */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400">5</span>
            Площадки
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {platformsList.map((platform) => (
              <button
                key={platform.id}
                type="button"
                onClick={() => togglePlatform(platform.id)}
                className={`p-3 rounded-xl flex flex-col items-center gap-2 transition ${
                  selectedPlatforms.includes(platform.id)
                    ? 'bg-purple-500/20 border border-purple-500/50 text-white'
                    : 'bg-white/5 border border-white/10 text-zinc-500 hover:bg-white/10'
                }`}
              >
                <div className="text-2xl">{PlatformIcons[platform.id]}</div>
                <span className="text-xs font-medium text-center">{platform.name}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Кнопка отправки */}
        <div className="flex justify-end gap-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition font-bold"
            >
              Отмена
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !selectedUser}
            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-xl text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Создание...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Создать и опубликовать
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
