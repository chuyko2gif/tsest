'use client';

import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  ReleaseInfoStep,
  TracklistStep,
  CountriesStep,
  PlatformsStep,
  getAllPlatforms,
} from '@/app/cabinet/release/create/components';
import { getAllCountries } from '@/components/icons/CountryFlagsSVG';
import { TrackAuthor } from '@/components/ui/TrackAuthors';

// ============================================================================
// TYPES
// ============================================================================
export type ReleaseType = 'single' | 'ep' | 'album';

interface User {
  id: string;
  email: string;
  nickname?: string;
  display_name?: string;
  avatar_url?: string;
  role?: string;
  member_id?: string;
}

interface AudioMetadata {
  format: string;
  duration?: number;
  bitrate?: string;
  sampleRate?: string;
  size: number;
}

interface Track {
  title: string;
  link: string;
  audioFile?: File | null;
  audioMetadata?: AudioMetadata | null;
  hasDrugs: boolean;
  lyrics: string;
  language: string;
  version?: string;
  producers?: string[];
  featuring?: string[];
  authors?: TrackAuthor[];
  isrc?: string;
}

interface AdminCreateReleaseProps {
  supabase: SupabaseClient;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// ============================================================================
// HELPERS
// ============================================================================
const getAvatarUrl = (avatarUrl: string | undefined, supabase: SupabaseClient): string => {
  if (!avatarUrl) return '';
  if (avatarUrl.startsWith('http')) return avatarUrl;
  const { data } = supabase.storage.from('avatars').getPublicUrl(avatarUrl);
  return data?.publicUrl || '';
};

// ============================================================================
// USER SELECT STEP
// ============================================================================
interface UserSearchProps {
  supabase: SupabaseClient;
  selectedUser: User | null;
  onSelectUser: (user: User | null) => void;
  onNext: () => void;
}

const UserSelectStep = memo(function UserSelectStep({ supabase, selectedUser, onSelectUser, onNext }: UserSearchProps) {
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
        .select('id, email, nickname, display_name, avatar, role, member_id')
        .or(`email.ilike.%${query}%,nickname.ilike.%${query}%,display_name.ilike.%${query}%,member_id.ilike.%${query}%`)
        .limit(20);
      if (error) { setSearchError('Ошибка поиска'); setSearchResults([]); return; }
      if (!data || data.length === 0) { setSearchError(`Пользователь "${query}" не найден`); setSearchResults([]); return; }
      // Преобразуем avatar в avatar_url для совместимости
      const usersWithAvatarUrl = data.map(user => ({ ...user, avatar_url: user.avatar }));
      setSearchResults(usersWithAvatarUrl);
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
    <div className="animate-fade-up">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center ring-1 ring-white/10">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-300">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-black bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Выбор пользователя</h2>
            <p className="text-sm text-zinc-500 mt-1">Выберите пользователя, для которого создаётся релиз</p>
          </div>
        </div>
      </div>

      <div ref={searchRef} className="relative mb-6">
        <input type="text" value={userSearch}
          onChange={(e) => { setUserSearch(e.target.value); setShowResults(true); }}
          onFocus={() => setShowResults(true)}
          placeholder="Поиск по email, нику, имени или ID участника..."
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-zinc-500 focus:border-purple-500/50 focus:outline-none transition text-lg"
        />
        {isSearching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-h-96 overflow-y-auto">
            {searchResults.map((user) => (
              <button key={user.id} type="button"
                onClick={() => { onSelectUser(user); setUserSearch(''); setShowResults(false); setSearchError(''); }}
                className="w-full px-3 sm:px-4 py-3 sm:py-4 flex items-center gap-2 sm:gap-4 hover:bg-white/5 transition text-left border-b border-white/5 last:border-b-0 group">
                
                {/* Аватар с бейджем роли */}
                <div className="relative flex-shrink-0">
                  {getAvatarUrl(user.avatar_url, supabase) ? (
                    <img src={getAvatarUrl(user.avatar_url, supabase)} alt="" className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl object-cover ring-2 ring-white/10 group-hover:ring-purple-500/50 transition" />
                  ) : (
                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-purple-400 font-bold text-base sm:text-xl ring-2 ring-white/10 group-hover:ring-purple-500/50 transition">
                      {(user.nickname || user.display_name || user.email)?.[0]?.toUpperCase()}
                    </div>
                  )}
                  {/* Бейдж роли на углу */}
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center border-2 ${
                    user.role === 'owner' ? 'bg-[#8b5cf6] border-[#a78bfa]' :
                    user.role === 'admin' ? 'bg-[#ff4757] border-[#ff6b81]' :
                    user.role === 'exclusive' ? 'bg-[#f59e0b] border-[#fbbf24]' : 
                    'bg-zinc-700 border-zinc-500'
                  }`}>
                    <span className="text-white font-bold text-[10px] sm:text-xs">
                      {user.role === 'owner' ? '♛' :
                       user.role === 'admin' ? '★' :
                       user.role === 'exclusive' ? '◆' : '○'}
                    </span>
                  </div>
                </div>

                {/* Информация о пользователе */}
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                    <p className="text-white font-bold truncate text-sm sm:text-base">
                      {user.nickname || user.display_name || 'Без имени'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm mb-0.5 sm:mb-1">
                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p className="text-zinc-400 truncate text-xs sm:text-sm">{user.email}</p>
                  </div>
                  {user.member_id && (
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <p className="text-zinc-500 truncate text-xs sm:text-sm">{user.member_id}</p>
                    </div>
                  )}
                </div>

                {/* Бейдж роли справа */}
                <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold flex items-center gap-1 sm:gap-1.5 flex-shrink-0 ${
                  user.role === 'owner' ? 'bg-[#8b5cf6]/20 text-[#a78bfa] border border-[#8b5cf6]/30' :
                  user.role === 'admin' ? 'bg-[#ff4757]/20 text-[#ff6b81] border border-[#ff4757]/30' :
                  user.role === 'exclusive' ? 'bg-[#f59e0b]/20 text-[#fbbf24] border border-[#f59e0b]/30' : 
                  'bg-zinc-800/30 text-zinc-400 border border-zinc-700/50'
                }`}>
                  <span className="text-xs sm:text-sm">
                    {user.role === 'owner' ? '♛' :
                     user.role === 'admin' ? '★' :
                     user.role === 'exclusive' ? '◆' : '○'}
                  </span>
                  <span className="hidden sm:inline">{user.role?.toUpperCase() || 'BASIC'}</span>
                </span>
              </button>
            ))}
          </div>
        )}
        
        {showResults && searchError && userSearch.length >= 2 && (
          <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl">
            <p className="text-zinc-400 text-center">{searchError}</p>
          </div>
        )}
      </div>
      
      {selectedUser && (
        <div className="p-3 sm:p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl sm:rounded-2xl mb-6 sm:mb-8 animate-fade-in">
          <div className="flex items-start sm:items-center gap-2.5 sm:gap-4">
            {/* Аватар с бейджем */}
            <div className="relative flex-shrink-0">
              {getAvatarUrl(selectedUser.avatar_url, supabase) ? (
                <img src={getAvatarUrl(selectedUser.avatar_url, supabase)} alt="" className="w-10 h-10 sm:w-20 sm:h-20 rounded-lg sm:rounded-2xl object-cover ring-2 ring-purple-500/50" />
              ) : (
                <div className="w-10 h-10 sm:w-20 sm:h-20 rounded-lg sm:rounded-2xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center text-purple-300 font-bold text-sm sm:text-3xl ring-2 ring-purple-500/50">
                  {(selectedUser.nickname || selectedUser.display_name || selectedUser.email)?.[0]?.toUpperCase()}
                </div>
              )}
              {/* Бейдж роли */}
              <div className={`absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-5 h-5 sm:w-8 sm:h-8 rounded-md sm:rounded-xl flex items-center justify-center border-2 ${
                selectedUser.role === 'owner' ? 'bg-[#8b5cf6] border-[#a78bfa]' :
                selectedUser.role === 'admin' ? 'bg-[#ff4757] border-[#ff6b81]' :
                selectedUser.role === 'exclusive' ? 'bg-[#f59e0b] border-[#fbbf24]' :
                'bg-zinc-700 border-zinc-500'
              }`}>
                <span className="text-white font-bold text-[10px] sm:text-base">
                  {selectedUser.role === 'owner' ? '♛' :
                   selectedUser.role === 'admin' ? '★' :
                   selectedUser.role === 'exclusive' ? '◆' : '○'}
                </span>
              </div>
            </div>

            {/* Информация */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 sm:mb-2">
                <p className="text-white font-bold text-sm sm:text-2xl truncate">
                  {selectedUser.nickname || selectedUser.display_name || 'Без имени'}
                </p>
                <span className={`hidden sm:flex px-3 py-1 rounded-lg text-xs font-bold items-center gap-1.5 ${
                  selectedUser.role === 'owner' ? 'bg-[#8b5cf6]/20 text-[#a78bfa] border border-[#8b5cf6]/30' :
                  selectedUser.role === 'admin' ? 'bg-[#ff4757]/20 text-[#ff6b81] border border-[#ff4757]/30' :
                  selectedUser.role === 'exclusive' ? 'bg-[#f59e0b]/20 text-[#fbbf24] border border-[#f59e0b]/30' :
                  'bg-zinc-800/30 text-zinc-400 border border-zinc-700/50'
                }`}>
                  <span className="text-sm">
                    {selectedUser.role === 'owner' ? '♛' :
                     selectedUser.role === 'admin' ? '★' :
                     selectedUser.role === 'exclusive' ? '◆' : '○'}
                  </span>
                  {selectedUser.role?.toUpperCase() || 'BASIC'}
                </span>
              </div>
              
              <div className="text-[11px] sm:text-sm text-zinc-400 space-y-0.5 sm:space-y-0 sm:flex sm:items-center sm:gap-2">
                <span className="block sm:inline break-all">{selectedUser.email}</span>
                {selectedUser.member_id && (
                  <>
                    <span className="hidden sm:inline text-zinc-600">•</span>
                    <span className="block sm:inline text-zinc-500">{selectedUser.member_id}</span>
                  </>
                )}
              </div>
            </div>

            {/* Кнопка удаления */}
            <button type="button" onClick={() => onSelectUser(null)}
              className="p-1.5 sm:p-3 hover:bg-red-500/20 rounded-lg sm:rounded-xl transition text-zinc-400 hover:text-red-400 flex-shrink-0 self-start sm:self-center">
              <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-6 border-t border-white/10">
        <button
          type="button"
          onClick={onNext}
          disabled={!selectedUser}
          className="px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-lg"
          style={{ color: 'white' }}
        >
          Далее
          <svg className="w-5 h-5" fill="none" stroke="white" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
});

// ============================================================================
// RELEASE TYPE STEP
// ============================================================================
interface ReleaseTypeSelectorProps {
  releaseType: ReleaseType | null;
  onSelectType: (type: ReleaseType) => void;
  onNext: () => void;
  onBack: () => void;
}

function ReleaseTypeStep({ releaseType, onSelectType, onNext, onBack }: ReleaseTypeSelectorProps) {
  const types = [
    { 
      id: 'single' as ReleaseType, 
      name: 'Сингл', 
      desc: '1 трек', 
      icon: <svg className="w-10 h-10 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
      </svg>, 
      color: 'from-purple-500/20 to-purple-600/20 border-purple-500/30' 
    },
    { 
      id: 'ep' as ReleaseType, 
      name: 'EP', 
      desc: '2-7 треков', 
      icon: <svg className="w-10 h-10 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3" fill="currentColor" />
        <circle cx="12" cy="12" r="6" opacity="0.3" />
        <path d="M12 2 L12 22 M2 12 L22 12" opacity="0.2" strokeWidth="1" />
      </svg>, 
      color: 'from-blue-500/20 to-blue-600/20 border-blue-500/30' 
    },
    { 
      id: 'album' as ReleaseType, 
      name: 'Альбом', 
      desc: '8-50 треков', 
      icon: <svg className="w-10 h-10 text-emerald-400" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="11" r="9" stroke="currentColor" strokeWidth="2" opacity="0.4"/>
        <circle cx="12" cy="11" r="3" fill="currentColor" opacity="0.4"/>
        <circle cx="12" cy="13" r="9" stroke="currentColor" strokeWidth="2"/>
        <circle cx="12" cy="13" r="5" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
        <circle cx="12" cy="13" r="3" fill="currentColor"/>
      </svg>, 
      color: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30' 
    },
  ];

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center ring-1 ring-white/10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-300 relative z-10">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-black bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent animate-pulse" style={{animationDuration: '3s'}}>Тип релиза</h2>
            <p className="text-sm text-zinc-500 mt-1">Выберите формат релиза</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {types.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => onSelectType(type.id)}
            className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden ${
              releaseType === type.id 
                ? `bg-gradient-to-br ${type.color} ring-2 ring-white/30 scale-[1.03] shadow-2xl` 
                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] hover:shadow-xl'
            }`}
            style={releaseType === type.id ? {
              boxShadow: type.id === 'single' ? '0 0 40px rgba(168, 85, 247, 0.3)' : 
                         type.id === 'ep' ? '0 0 40px rgba(59, 130, 246, 0.3)' : 
                         '0 0 40px rgba(16, 185, 129, 0.3)'
            } : {}}
          >
            {/* Эффект свечения при наведении */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Блик */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>

            <div className="relative z-10">
              <div className={`mb-4 transform transition-transform duration-300 ${
                releaseType === type.id ? 'scale-110' : 'group-hover:scale-105'
              }`}>{type.icon}</div>
              <h3 className="text-xl font-bold text-white mb-1 transition-colors">{type.name}</h3>
              <p className={`text-sm transition-colors ${
                releaseType === type.id ? 'text-zinc-300' : 'text-zinc-400 group-hover:text-zinc-300'
              }`}>{type.desc}</p>
            </div>
            
            {/* Галочка для выбранного */}
            {releaseType === type.id && (
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white flex items-center justify-center animate-scale-in">
                <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="flex justify-between pt-6 border-t border-white/10">
        <button type="button" onClick={onBack}
          className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition font-medium flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Назад
        </button>
        <button type="button" onClick={onNext} disabled={!releaseType}
          className="px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          style={{ color: 'white' }}>
          Далее
          <svg className="w-5 h-5" fill="none" stroke="white" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// ADMIN SEND STEP
// ============================================================================
interface AdminSendStepProps {
  supabase: SupabaseClient;
  selectedUser: User;
  releaseType: ReleaseType;
  releaseTitle: string;
  artistName: string;
  genre: string;
  coverFile: File | null;
  releaseDate: string | null;
  tracks: Track[];
  selectedPlatformsList: string[];
  excludedCountries: string[];
  upc: string;
  onBack: () => void;
  onSuccess: () => void;
  setCurrentStep: (step: string) => void;
}

function AdminSendStep({ supabase, selectedUser, releaseType, releaseTitle, artistName, genre, coverFile, releaseDate, tracks, selectedPlatformsList, excludedCountries, upc, onBack, onSuccess, setCurrentStep }: AdminSendStepProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [nextCustomId, setNextCustomId] = useState<string>('');
  const [expandedTrack, setExpandedTrack] = useState<number | null>(null);
  const allCountries = getAllCountries();
  const selectedCountries = allCountries.filter(c => !excludedCountries.includes(c));

  // Загрузка следующего custom_id для preview
  useEffect(() => {
    const loadNextCustomId = async () => {
      const { data, error } = await supabase.rpc('generate_release_custom_id');
      
      if (error) {
        setNextCustomId('Ошибка загрузки');
        return;
      }
      
      if (data) {
        setNextCustomId(data);
      } else {
        setNextCustomId('thqrel-0001');
      }
    };
    loadNextCustomId();
  }, [supabase]);

  const getMinTracks = (): number => {
    if (releaseType === 'ep') return 2;
    if (releaseType === 'album') return 8;
    return 1;
  };

  const checks = [
    { name: 'Пользователь', valid: !!selectedUser, issue: 'Не выбран пользователь', step: 'user', color: 'from-purple-500 to-blue-500' },
    { name: 'Название', valid: !!releaseTitle.trim(), issue: 'Не указано название', step: 'release', color: 'from-blue-500 to-cyan-500' },
    { name: 'Артист', valid: !!artistName.trim(), issue: 'Не указан артист', step: 'release', color: 'from-blue-500 to-cyan-500' },
    { name: 'Жанр', valid: !!genre, issue: 'Не выбран жанр', step: 'release', color: 'from-blue-500 to-cyan-500' },
    { name: 'Обложка', valid: !!coverFile, issue: 'Не загружена обложка', step: 'release', color: 'from-blue-500 to-cyan-500' },
    { name: 'Дата релиза', valid: !!releaseDate, issue: 'Не указана дата', step: 'release', color: 'from-blue-500 to-cyan-500' },
    { name: 'Треки', valid: tracks.length >= getMinTracks(), issue: `Минимум ${getMinTracks()} ${getMinTracks() === 1 ? 'трек' : 'трека'}`, step: 'tracklist', color: 'from-cyan-500 to-teal-500' },
    { name: 'Площадки', valid: selectedPlatformsList.length > 0, issue: 'Не выбраны площадки', step: 'platforms', color: 'from-emerald-500 to-green-500' },
    { name: 'Страны', valid: selectedCountries.length > 0, issue: 'Не выбраны страны', step: 'countries', color: 'from-teal-500 to-emerald-500' },
  ];

  const allValid = checks.every(c => c.valid);

  const handleSubmit = async () => {
    if (!allValid) return;
    setSubmitting(true);
    setError('');

    try {
      let coverUrl = '';
      if (coverFile) {
        const fileName = `${selectedUser.id}/${Date.now()}_cover.${coverFile.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage.from('release-covers').upload(fileName, coverFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('release-covers').getPublicUrl(fileName);
        coverUrl = urlData.publicUrl;
      }

      // Загружаем аудио файлы треков и получаем URL
      const tracksData = await Promise.all(tracks.map(async (track, index) => {
        let audioUrl = track.link || '';
        
        // Если есть audioFile, загружаем его в storage
        if (track.audioFile) {
          try {
            const audioFileExt = track.audioFile.name.split('.').pop();
            const audioFileName = `${selectedUser.id}/${Date.now()}-track-${index}.${audioFileExt}`;
            
            const { error: audioUploadError } = await supabase.storage
              .from('release-audio')
              .upload(audioFileName, track.audioFile, {
                contentType: track.audioFile.type,
                upsert: true
              });
            
            if (audioUploadError) {
              // Ошибка загрузки аудио
            } else {
              const { data: audioUrlData } = supabase.storage
                .from('release-audio')
                .getPublicUrl(audioFileName);
              audioUrl = audioUrlData.publicUrl;
            }
          } catch {
            // Ошибка при загрузке аудио
          }
        }
        
        return {
          title: track.title,
          artists: artistName,
          hasDrugs: track.hasDrugs,
          lyrics: track.lyrics,
          language: track.language,
          version: track.version || '',
          producers: track.producers || [],
          featuring: track.featuring || [],
          authors: track.authors || [],
          order: index + 1,
          isrc: track.isrc || '',
          link: audioUrl,
          audio_url: audioUrl,
        };
      }));

      // Генерируем custom_id вручную, так как статус published
      const { data: generatedCustomId, error: customIdError } = await supabase.rpc('generate_release_custom_id');
      if (customIdError) {
        throw new Error('Не удалось сгенерировать код релиза');
      }

      const { data: newRelease, error: releaseError } = await supabase.from('releases_exclusive').insert({
        user_id: selectedUser.id, title: releaseTitle, artist_name: artistName,
        genre, cover_url: coverUrl, release_date: releaseDate, status: 'published', release_type: releaseType,
        platforms: selectedPlatformsList, countries: selectedCountries, tracks: tracksData, upc: upc || null,
        contract_agreed: true, contract_agreed_at: new Date().toISOString(),
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        custom_id: generatedCustomId,
      }).select().single();

      if (releaseError) throw releaseError;
      
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Ошибка при создании релиза');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-up">
      {/* ===== МОБИЛЬНАЯ ВЕРСИЯ ===== */}
      <div className="lg:hidden">
        {/* Заголовок */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center ring-1 ring-white/10">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-300">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Публикация</h2>
            <p className="text-xs text-zinc-500">Проверьте данные</p>
          </div>
        </div>

        {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}

        {/* Ошибки валидации */}
        {!allValid && (
          <div className="mb-4 p-4 bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm font-semibold text-white">Не все данные заполнены</span>
            </div>
            <div className="space-y-2">
              {checks.filter(c => !c.valid).map((check, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(check.step)}
                  className="w-full flex items-center gap-2 p-2 bg-white/5 rounded-lg text-left"
                >
                  <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <span className="text-xs text-red-400 flex-1">{check.name}</span>
                  <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Карточка релиза с обложкой */}
        <div className="mb-4 p-4 bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-white/10 rounded-2xl">
          <div className="flex gap-4">
            {/* Обложка */}
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0 ring-1 ring-white/10">
              {coverFile ? (
                <img 
                  src={URL.createObjectURL(coverFile)} 
                  alt="Cover" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
              )}
            </div>
            {/* Инфо релиза */}
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-base truncate">{releaseTitle || 'Без названия'}</p>
              <p className="text-zinc-400 text-sm truncate">{artistName || 'Без артиста'}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 text-xs font-medium bg-purple-500/20 text-purple-300 rounded-full">
                  {releaseType === 'single' ? 'Сингл' : releaseType === 'ep' ? 'EP' : 'Альбом'}
                </span>
                <span className="text-xs text-zinc-500">{genre || '—'}</span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">{releaseDate || '—'}</p>
            </div>
          </div>
        </div>

        {/* Код релиза */}
        <div className="mb-4 p-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-400">Код релиза</p>
            <span className="text-sm font-bold font-mono text-purple-300">{nextCustomId || '...'}</span>
          </div>
          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Треклист */}
        {tracks.length > 0 && (
          <div className="mb-4 p-3 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white">Треклист</h3>
              <span className="text-xs text-zinc-500">{tracks.length} {tracks.length === 1 ? 'трек' : tracks.length < 5 ? 'трека' : 'треков'}</span>
            </div>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {tracks.map((track, idx) => (
                <div key={idx} className="bg-white/5 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedTrack(expandedTrack === idx ? null : idx)}
                    className="w-full flex items-center gap-2 p-2 text-left"
                  >
                    <div className="w-6 h-6 rounded bg-zinc-700 flex items-center justify-center text-xs font-medium text-zinc-400 flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{track.title || 'Без названия'}</p>
                      {track.version && <p className="text-xs text-zinc-500">{track.version}</p>}
                    </div>
                    {track.audioFile && (
                      <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    <svg className={`w-4 h-4 text-zinc-500 transition-transform flex-shrink-0 ${expandedTrack === idx ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedTrack === idx && (
                    <div className="px-3 pb-3 pt-2 border-t border-white/10 bg-black/20">
                      <div className="grid grid-cols-2 gap-2">
                        {/* Язык */}
                        <div className="p-2 bg-white/5 rounded-lg">
                          <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Язык</p>
                          <p className="text-xs text-white mt-0.5">{track.language || '—'}</p>
                        </div>
                        {/* 18+ */}
                        <div className="p-2 bg-white/5 rounded-lg">
                          <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Explicit</p>
                          <div className="mt-0.5">
                            {track.hasDrugs ? (
                              <span className="px-2 py-0.5 text-xs bg-red-500/30 text-red-300 rounded-full">18+</span>
                            ) : (
                              <span className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded-full">Нет</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Featuring */}
                      {track.featuring && track.featuring.filter(f => f).length > 0 && (
                        <div className="mt-2 p-2 bg-white/5 rounded-lg">
                          <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Featuring</p>
                          <p className="text-xs text-white mt-0.5 break-words">{track.featuring.filter(f => f).join(', ')}</p>
                        </div>
                      )}
                      
                      {/* Продюсеры */}
                      {track.producers && track.producers.filter(p => p).length > 0 && (
                        <div className="mt-2 p-2 bg-white/5 rounded-lg">
                          <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Продюсеры</p>
                          <p className="text-xs text-white mt-0.5 break-words">{track.producers.filter(p => p).join(', ')}</p>
                        </div>
                      )}
                      
                      {/* Авторы */}
                      {track.authors && track.authors.filter(a => a && a.fullName).length > 0 && (
                        <div className="mt-2 p-2 bg-white/5 rounded-lg">
                          <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Авторы</p>
                          <p className="text-xs text-white mt-0.5 break-words">
                            {track.authors.filter(a => a && a.fullName).map(a => {
                              const roleLabel = a.role || 'Автор';
                              return `${a.fullName} (${roleLabel})`;
                            }).join('; ')}
                          </p>
                        </div>
                      )}
                      
                      {/* ISRC */}
                      {track.isrc && (
                        <div className="mt-2 p-2 bg-white/5 rounded-lg">
                          <p className="text-[10px] text-zinc-500 uppercase tracking-wide">ISRC</p>
                          <p className="text-xs text-purple-300 font-mono mt-0.5">{track.isrc}</p>
                        </div>
                      )}
                      
                      {/* Текст */}
                      {track.lyrics && (
                        <div className="mt-2 p-2 bg-white/5 rounded-lg">
                          <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Текст</p>
                          <p className="text-xs text-zinc-300 mt-1 max-h-24 overflow-y-auto break-words leading-relaxed">{track.lyrics.slice(0, 300)}{track.lyrics.length > 300 ? '...' : ''}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Компактная информация */}
        <div className="mb-4 grid grid-cols-2 gap-2">
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-xs text-zinc-500">Пользователь</p>
            <p className="text-sm text-white font-medium truncate">{selectedUser?.nickname || selectedUser?.email?.split('@')[0] || '—'}</p>
          </div>
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-xs text-zinc-500">UPC</p>
            <p className="text-sm text-white font-mono truncate">{upc || '—'}</p>
          </div>
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-xs text-zinc-500">Площадки</p>
            <p className="text-sm text-white font-medium">{selectedPlatformsList.length}</p>
          </div>
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-xs text-zinc-500">Страны</p>
            <p className="text-sm text-white font-medium">{excludedCountries.length > 0 ? `${255 - excludedCountries.length}` : 'Все'}</p>
          </div>
        </div>

        {/* Чеклист */}
        <div className="mb-4 p-3 bg-white/5 border border-white/10 rounded-xl">
          <h3 className="text-sm font-semibold text-white mb-2">Проверка</h3>
          <div className="space-y-1.5">
            {checks.map((check, i) => (
              <div key={i} className="flex items-center gap-2">
                {check.valid ? (
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                    <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </div>
                )}
                <span className={`text-xs ${check.valid ? 'text-zinc-400' : 'text-red-400'}`}>{check.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex gap-3 pt-4 border-t border-white/10">
          <button type="button" onClick={onBack} className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition font-medium flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>Назад
          </button>
          <button type="button" onClick={handleSubmit} disabled={!allValid || submitting}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-xl text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {submitting ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /></>) : (<><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Опубликовать</>)}
          </button>
        </div>
      </div>

      {/* ===== ДЕСКТОП ВЕРСИЯ (оригинальная) ===== */}
      <div className="hidden lg:block">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center ring-1 ring-white/10">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-300">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-black bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Публикация релиза</h2>
              <p className="text-sm text-zinc-500 mt-1">Проверьте данные и опубликуйте релиз</p>
            </div>
          </div>
        </div>

        {error && <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">{error}</div>}

        {!allValid && (
          <div className="mb-8 p-8 bg-gradient-to-br from-red-500/10 via-orange-500/10 to-yellow-500/10 border border-red-500/20 rounded-2xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center ring-1 ring-red-500/30 flex-shrink-0">
                <svg className="w-7 h-7 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Не все данные заполнены</h3>
                <p className="text-zinc-400 mb-4">Чтобы опубликовать релиз, необходимо заполнить все обязательные поля. Нажмите на кнопку, чтобы перейти к нужному шагу:</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {checks.filter(c => !c.valid).map((check, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(check.step)}
                  className="group p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white group-hover:text-red-300 transition-colors">{check.name}</span>
                        <svg className="w-4 h-4 text-zinc-500 group-hover:text-red-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <p className="text-sm text-red-400">{check.issue}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6 p-5 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl">
          <p className="text-xs text-zinc-400 mb-1">Код релиза</p>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold font-mono text-purple-300">{nextCustomId || 'Загрузка...'}</span>
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-xs text-zinc-500 mt-1">Код будет сгенерирован автоматически при публикации</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl"><p className="text-zinc-400 text-sm mb-1">Пользователь</p><p className="text-white font-medium">{selectedUser?.nickname || selectedUser?.email || '—'}</p></div>
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl"><p className="text-zinc-400 text-sm mb-1">Тип релиза</p><p className="text-white font-medium">{releaseType === 'single' ? 'Сингл' : releaseType === 'ep' ? 'EP' : releaseType === 'album' ? 'Альбом' : '—'}</p></div>
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl"><p className="text-zinc-400 text-sm mb-1">Название</p><p className="text-white font-medium">{releaseTitle || '—'}</p></div>
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl"><p className="text-zinc-400 text-sm mb-1">Артист</p><p className="text-white font-medium">{artistName || '—'}</p></div>
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl"><p className="text-zinc-400 text-sm mb-1">Жанр</p><p className="text-white font-medium">{genre || '—'}</p></div>
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl"><p className="text-zinc-400 text-sm mb-1">Дата релиза</p><p className="text-white font-medium">{releaseDate || '—'}</p></div>
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl"><p className="text-zinc-400 text-sm mb-1">UPC</p><p className="text-white font-medium font-mono text-sm">{upc || '—'}</p></div>
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl"><p className="text-zinc-400 text-sm mb-1">Треки</p><p className="text-white font-medium">{tracks.length || '—'}</p></div>
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl"><p className="text-zinc-400 text-sm mb-1">Площадки</p><p className="text-white font-medium">{selectedPlatformsList.length || '—'}</p></div>
        </div>

        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl mb-8">
          <h3 className="text-lg font-bold text-white mb-4">Проверка</h3>
          <div className="space-y-2">
            {checks.map((check, i) => (
              <div key={i} className="flex items-center gap-3">
                {check.valid ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </div>
                )}
                <span className={check.valid ? 'text-zinc-300' : 'text-red-400'}>{check.name} {!check.valid && `— ${check.issue}`}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between pt-6 border-t border-white/10">
          <button type="button" onClick={onBack} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition font-medium flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>Назад
          </button>
          <button type="button" onClick={handleSubmit} disabled={!allValid || submitting}
            className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-xl text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            {submitting ? (<><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Публикация...</>) : (<><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Опубликовать релиз</>)}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STEPS SIDEBAR
// ============================================================================
interface StepsSidebarProps {
  currentStep: string;
  setCurrentStep: (step: string) => void;
  selectedUser: User | null;
  releaseType: ReleaseType | null;
  releaseTitle: string;
  genre: string;
  coverFile: File | null;
  releaseDate: string | null;
  tracksCount: number;
  selectedPlatforms: number;
  selectedCountries: number;
  onCancel?: () => void;
  mobileStepsOpen: boolean;
  setMobileStepsOpen: (open: boolean) => void;
}

function StepsSidebar({ currentStep, setCurrentStep, selectedUser, releaseType, releaseTitle, genre, coverFile, releaseDate, tracksCount, selectedPlatforms, selectedCountries, onCancel, mobileStepsOpen, setMobileStepsOpen }: StepsSidebarProps) {
  const getMinTracks = (): number => { if (releaseType === 'ep') return 2; if (releaseType === 'album') return 8; return 1; };

  const isStepComplete = (stepId: string): boolean => {
    switch(stepId) {
      case 'user': return !!selectedUser;
      case 'type': return !!releaseType;
      case 'release': return !!(releaseTitle.trim() && genre && coverFile && releaseDate);
      case 'tracklist': return tracksCount >= getMinTracks();
      case 'countries': return selectedCountries > 0;
      case 'platforms': return selectedPlatforms > 0;
      default: return false;
    }
  };

  const steps = [
    { id: 'user', label: 'Пользователь', icon: '1' },
    { id: 'type', label: 'Тип релиза', icon: '2' },
    { id: 'release', label: 'Информация', icon: '3' },
    { id: 'tracklist', label: 'Треклист', icon: '4' },
    { id: 'countries', label: 'Страны', icon: '5' },
    { id: 'platforms', label: 'Площадки', icon: '6' },
    { id: 'send', label: 'Публикация', icon: '→' },
  ];

  const mainStepIds = ['user', 'type', 'release', 'tracklist', 'countries', 'platforms'];
  const completedSteps = mainStepIds.filter(id => isStepComplete(id)).length;

  const getProgressColor = () => {
    if (completedSteps === 0) return { from: '#ef4444', to: '#dc2626' };
    if (completedSteps === 1) return { from: '#f97316', to: '#ea580c' };
    if (completedSteps === 2) return { from: '#fb923c', to: '#f97316' };
    if (completedSteps === 3) return { from: '#fbbf24', to: '#f59e0b' };
    if (completedSteps === 4) return { from: '#a3e635', to: '#84cc16' };
    if (completedSteps === 5) return { from: '#4ade80', to: '#22c55e' };
    return { from: '#10b981', to: '#059669' };
  };

  const progressColor = getProgressColor();

  return (
    <>
      {/* Мобильная версия - компактная полоса прогресса с раскрывающимся списком */}
      <div className="lg:hidden w-full mb-3">
        <div className="backdrop-blur-xl border rounded-2xl shadow-lg relative overflow-hidden bg-gradient-to-br from-white/[0.07] to-white/[0.02] border-white/10 shadow-black/10">
          {/* Декоративный градиент */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />
          
          {/* Основная строка - кликабельная */}
          <div 
            className="relative z-10 p-3 cursor-pointer"
            onClick={() => setMobileStepsOpen(!mobileStepsOpen)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Текущий шаг */}
                <div className="flex items-center gap-2">
                  <div>
                    <div className="text-xs font-medium text-purple-400">
                      {steps.find(s => s.id === currentStep)?.label || 'Создание релиза'}
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      {releaseType ? (releaseType === 'single' ? 'Сингл' : releaseType === 'ep' ? 'EP' : 'Альбом') : 'Админ-панель'}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Стрелка раскрытия */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-white/5 hover:bg-white/10 ${!mobileStepsOpen ? 'animate-bounce-subtle' : ''}`}>
                <svg 
                  width="20" height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  className={`transition-transform duration-200 text-zinc-300 ${mobileStepsOpen ? 'rotate-180' : ''}`}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              
              {/* Прогресс справа */}
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div 
                      key={i} 
                      className={`w-4 h-1.5 rounded-full transition-all duration-300 ${i < completedSteps ? '' : 'bg-white/10'}`}
                      style={i < completedSteps ? { 
                        background: `linear-gradient(135deg, ${progressColor.from}, ${progressColor.to})`,
                        boxShadow: `0 0 4px ${progressColor.from}60`
                      } : undefined}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold" style={{ color: progressColor.from }}>
                  {completedSteps}/6
                </span>
              </div>
            </div>
          </div>
          
          {/* Раскрывающийся список шагов */}
          {mobileStepsOpen && (
            <div className="relative z-10 px-3 pb-3 pt-1 border-t border-white/10">
              <div className="space-y-1.5">
                {steps.map((step) => {
                  const isComplete = isStepComplete(step.id);
                  const isCurrent = currentStep === step.id;
                  
                  return (
                    <button 
                      key={step.id} 
                      onClick={() => {
                        setCurrentStep(step.id);
                        setMobileStepsOpen(false);
                      }}
                      className={`w-full text-left py-2.5 px-3 rounded-xl flex items-center gap-2.5 transition-all ${
                        isCurrent 
                          ? 'bg-gradient-to-r from-purple-500/30 to-purple-600/30 text-white border border-white/20'
                          : 'bg-white/5 text-zinc-400 hover:bg-white/10 border border-transparent hover:border-white/10'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isComplete && step.id !== 'send' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white/10 text-zinc-400'
                      }`}>
                        {isComplete && step.id !== 'send' ? (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polyline points="20 6 9 17 4 12" strokeWidth="3"/>
                          </svg>
                        ) : (
                          step.icon
                        )}
                      </span>
                      <span className="text-sm font-medium flex-1">{step.label}</span>
                      {isCurrent && (
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Десктоп версия */}
      <aside className="hidden lg:flex w-full lg:w-64 backdrop-blur-xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 rounded-3xl p-6 flex-col lg:self-start lg:sticky lg:top-24 shadow-2xl shadow-black/20">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-lg bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">Создание релиза</h3>
          {onCancel && (
            <button onClick={onCancel} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 flex items-center justify-center transition-all" title="Отмена">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400"><path d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          )}
        </div>
        <p className="text-xs text-zinc-400">Админ-панель</p>
      </div>

      {releaseType && (
        <div className="mb-3 p-3 backdrop-blur-lg bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-blue-500/20 border border-white/20 rounded-xl">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
              releaseType === 'single' ? 'bg-purple-500/20' : 
              releaseType === 'ep' ? 'bg-blue-500/20' : 
              'bg-emerald-500/20'
            }`}>
              {releaseType === 'single' ? (
                <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
              ) : releaseType === 'ep' ? (
                <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="8" />
                  <circle cx="12" cy="12" r="2" fill="currentColor" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="11" r="7" stroke="currentColor" strokeWidth="2" opacity="0.4"/>
                  <circle cx="12" cy="11" r="2" fill="currentColor" opacity="0.4"/>
                  <circle cx="12" cy="13" r="7" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="13" r="2" fill="currentColor"/>
                </svg>
              )}
            </div>
            <div className="flex-1"><div className="font-bold text-sm text-white">{releaseType === 'single' ? 'Сингл' : releaseType === 'ep' ? 'EP' : 'Альбом'}</div></div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {steps.map((step) => {
          const isComplete = isStepComplete(step.id);
          const isCurrent = currentStep === step.id;
          return (
            <button key={step.id} onClick={() => setCurrentStep(step.id)}
              className={`w-full text-left py-3 px-4 rounded-xl flex items-center gap-3 transition-all ${isCurrent ? 'backdrop-blur-md bg-gradient-to-r from-purple-500/40 to-purple-600/40 text-white shadow-lg shadow-purple-500/30 border border-white/20' : 'backdrop-blur-sm bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isComplete ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10'}`}>
                {isComplete && step.id !== 'send' ? (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12" strokeWidth="3"/></svg>) : step.icon}
              </span>
              <span className="text-sm font-medium">{step.label}</span>
              {isCurrent && <span className="ml-auto w-2 h-2 rounded-full bg-white animate-pulse" />}
            </button>
          );
        })}
      </div>

      <div className="mt-auto pt-4 border-t border-white/10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-zinc-400 font-medium">Прогресс</span>
          <div className="flex items-center font-mono text-sm"><span className="font-bold" style={{ color: progressColor.from }}>{completedSteps}</span><span className="text-zinc-500 mx-0.5">/</span><span className="text-zinc-400 font-bold">6</span></div>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-1 h-3 rounded-full bg-white/5 border border-white/10 overflow-hidden">
              <div className={`h-full transition-all duration-500 ${i < completedSteps ? 'opacity-100' : 'opacity-0'}`} style={{ background: `linear-gradient(135deg, ${progressColor.from}, ${progressColor.to})`, transitionDelay: `${i * 60}ms` }} />
            </div>
          ))}
        </div>
        {completedSteps === 6 && (
          <div className="flex items-center justify-center mt-3 gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
            <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span className="text-[11px] font-semibold text-emerald-400">Готово к публикации</span>
          </div>
        )}n      </div>
    </aside>
    </>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function AdminCreateRelease({ supabase, onSuccess, onCancel }: AdminCreateReleaseProps) {
  const [currentStep, setCurrentStep] = useState('user');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [releaseType, setReleaseType] = useState<ReleaseType | null>(null);
  const [success, setSuccess] = useState(false);
  const [mobileStepsOpen, setMobileStepsOpen] = useState(false);

  // Release info state
  const [releaseTitle, setReleaseTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [genre, setGenre] = useState('');
  const [subgenres, setSubgenres] = useState<string[]>([]);
  const [subgenreInput, setSubgenreInput] = useState('');
  const [releaseDate, setReleaseDate] = useState<string | null>(null);
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [collaboratorInput, setCollaboratorInput] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [upc, setUpc] = useState('');

  // Tracklist state
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<number | null>(null);
  const [trackTitle, setTrackTitle] = useState('');
  const [trackLink, setTrackLink] = useState('');
  const [trackAudioFile, setTrackAudioFile] = useState<File | null>(null);
  const [trackAudioMetadata, setTrackAudioMetadata] = useState<AudioMetadata | null>(null);
  const [trackHasDrugs, setTrackHasDrugs] = useState(false);
  const [trackLyrics, setTrackLyrics] = useState('');
  const [trackLanguage, setTrackLanguage] = useState('');
  const [trackVersion, setTrackVersion] = useState('');
  const [trackProducers, setTrackProducers] = useState<string[]>([]);
  const [trackFeaturing, setTrackFeaturing] = useState<string[]>([]);
  const [trackAuthors, setTrackAuthors] = useState<TrackAuthor[]>([]);
  const [trackIsrc, setTrackIsrc] = useState('');

  // Countries & Platforms
  const [excludedCountries, setExcludedCountries] = useState<string[]>([]);
  const [selectedPlatformsList, setSelectedPlatformsList] = useState<string[]>(() => getAllPlatforms());
  const [selectedPlatforms, setSelectedPlatforms] = useState(() => getAllPlatforms().length);

  useEffect(() => { if (selectedUser && !artistName) setArtistName(selectedUser.nickname || ''); }, [selectedUser]);

  const allCountries = getAllCountries();
  const selectedCountriesCount = allCountries.length - excludedCountries.length;

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 ring-4 ring-emerald-500/20">
          <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h3 className="text-3xl font-black text-white mb-2">Релиз опубликован!</h3>
        <p className="text-zinc-400 mb-8">Релиз успешно создан и добавлен пользователю</p>
        <button onClick={() => onSuccess?.()} className="px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-xl text-white font-bold transition">Вернуться к релизам</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <StepsSidebar currentStep={currentStep} setCurrentStep={setCurrentStep} selectedUser={selectedUser} releaseType={releaseType} releaseTitle={releaseTitle} genre={genre} coverFile={coverFile} releaseDate={releaseDate} tracksCount={tracks.length} selectedPlatforms={selectedPlatforms} selectedCountries={selectedCountriesCount} onCancel={onCancel} mobileStepsOpen={mobileStepsOpen} setMobileStepsOpen={setMobileStepsOpen} />
      <section className="flex-1 backdrop-blur-xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 rounded-3xl p-6 lg:p-10 min-h-[500px] shadow-2xl shadow-black/20">
        {currentStep === 'user' && <UserSelectStep supabase={supabase} selectedUser={selectedUser} onSelectUser={setSelectedUser} onNext={() => setCurrentStep('type')} />}
        {currentStep === 'type' && <ReleaseTypeStep releaseType={releaseType} onSelectType={setReleaseType} onNext={() => setCurrentStep('release')} onBack={() => setCurrentStep('user')} />}
        {currentStep === 'release' && <ReleaseInfoStep releaseTitle={releaseTitle} setReleaseTitle={setReleaseTitle} artistName={artistName} setArtistName={setArtistName} collaborators={collaborators} setCollaborators={setCollaborators} collaboratorInput={collaboratorInput} setCollaboratorInput={setCollaboratorInput} genre={genre} setGenre={setGenre} subgenres={subgenres} setSubgenres={setSubgenres} subgenreInput={subgenreInput} setSubgenreInput={setSubgenreInput} releaseDate={releaseDate} setReleaseDate={setReleaseDate} showCalendar={showCalendar} setShowCalendar={setShowCalendar} calendarMonth={calendarMonth} setCalendarMonth={setCalendarMonth} calendarYear={calendarYear} setCalendarYear={setCalendarYear} coverFile={coverFile} setCoverFile={setCoverFile} upc={upc} setUpc={setUpc} onNext={() => setCurrentStep('tracklist')} />}
        {currentStep === 'tracklist' && <TracklistStep releaseTitle={releaseTitle} releaseType={releaseType} coverFile={coverFile} tracks={tracks} setTracks={setTracks} currentTrack={currentTrack} setCurrentTrack={setCurrentTrack} trackTitle={trackTitle} setTrackTitle={setTrackTitle} trackLink={trackLink} setTrackLink={setTrackLink} trackAudioFile={trackAudioFile} setTrackAudioFile={setTrackAudioFile} trackAudioMetadata={trackAudioMetadata} setTrackAudioMetadata={setTrackAudioMetadata} trackHasDrugs={trackHasDrugs} setTrackHasDrugs={setTrackHasDrugs} trackLyrics={trackLyrics} setTrackLyrics={setTrackLyrics} trackLanguage={trackLanguage} setTrackLanguage={setTrackLanguage} trackVersion={trackVersion} setTrackVersion={setTrackVersion} trackProducers={trackProducers} setTrackProducers={setTrackProducers} trackFeaturing={trackFeaturing} setTrackFeaturing={setTrackFeaturing} trackAuthors={trackAuthors} setTrackAuthors={setTrackAuthors} onNext={() => setCurrentStep('countries')} onBack={() => setCurrentStep('release')} />}
        {currentStep === 'countries' && <CountriesStep excludedCountries={excludedCountries} setExcludedCountries={setExcludedCountries} onNext={() => setCurrentStep('platforms')} onBack={() => setCurrentStep('tracklist')} />}
        {currentStep === 'platforms' && <PlatformsStep selectedPlatforms={selectedPlatforms} setSelectedPlatforms={setSelectedPlatforms} selectedPlatformsList={selectedPlatformsList} setSelectedPlatformsList={setSelectedPlatformsList} onNext={() => setCurrentStep('send')} onBack={() => setCurrentStep('countries')} />}
        {currentStep === 'send' && (
          selectedUser && releaseType ? (
            <AdminSendStep supabase={supabase} selectedUser={selectedUser} releaseType={releaseType} releaseTitle={releaseTitle} artistName={artistName} genre={genre} coverFile={coverFile} releaseDate={releaseDate} tracks={tracks} selectedPlatformsList={selectedPlatformsList} excludedCountries={excludedCountries} upc={upc} onBack={() => setCurrentStep('platforms')} onSuccess={() => setSuccess(true)} setCurrentStep={setCurrentStep} />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center mb-6 ring-1 ring-white/10">
                <svg className="w-10 h-10 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Недостаточно данных</h3>
              <p className="text-zinc-400 mb-6 max-w-md">Вы не можете перейти к публикации, не заполнив предыдущие шаги. Пожалуйста, вернитесь назад и заполните необходимую информацию.</p>
              <button onClick={() => setCurrentStep('user')} className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-xl text-white font-medium transition flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Вернуться к началу
              </button>
            </div>
          )
        )}
      </section>
    </div>
  );
}
