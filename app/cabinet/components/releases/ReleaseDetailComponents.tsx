import React, { ReactNode, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Release, Track, TrackAuthor } from './types';
import { STATUS_BADGE_STYLES, formatDate, formatDateFull, getTracksWord } from './constants';
import { SupabaseClient } from '@supabase/supabase-js';
import { TRACK_AUTHOR_ROLES } from '@/components/ui/TrackAuthors';
import { useTheme } from '@/contexts/ThemeContext';

// Глобальный event для остановки всех треков
const STOP_ALL_AUDIO_EVENT = 'thq-stop-all-audio';

// Функция для остановки всех треков
const stopAllAudio = () => {
  window.dispatchEvent(new CustomEvent(STOP_ALL_AUDIO_EVENT));
};

// Хелпер для форматирования авторов трека (поддержка старого и нового формата)
const formatTrackAuthors = (authors: string | string[] | TrackAuthor[] | undefined): string => {
  if (!authors) return '';
  
  // Если это массив объектов TrackAuthor
  if (Array.isArray(authors) && authors.length > 0 && typeof authors[0] === 'object' && 'role' in authors[0]) {
    return (authors as TrackAuthor[]).map(a => {
      const roleLabel = TRACK_AUTHOR_ROLES.find(r => r.value === a.role)?.label || a.role;
      return `${a.fullName} (${roleLabel})`;
    }).join(', ');
  }
  
  // Если это массив строк (старый формат)
  if (Array.isArray(authors)) {
    return (authors as string[]).join(', ');
  }
  
  // Если это строка
  return authors as string;
};

// Компонент метаданных
export function MetadataItem({ icon, color, text, isLight }: { icon: string; color: string; text: string; isLight?: boolean }) {
  const colorClasses: Record<string, string> = isLight 
    ? {
        purple: 'text-purple-600',
        blue: 'text-blue-600',
        green: 'text-green-600',
        orange: 'text-orange-600'
      }
    : {
        purple: 'text-purple-400',
        blue: 'text-blue-400',
        green: 'text-green-400',
        orange: 'text-orange-400'
      };

  const icons: Record<string, ReactNode> = {
    music: <path d="M9 18V5l12-2v13M9 18l-7 2V7l7-2M9 18l12-2M9 9l12-2"/>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    play: <><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></>,
    tag: <><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <svg className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${colorClasses[color]} flex-shrink-0`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {icons[icon]}
      </svg>
      <span className={`text-xs sm:text-sm truncate ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>{text}</span>
    </div>
  );
}

// Бейдж информации
export function InfoBadge({ label, value, mono, isLight }: { label: string; value: string; mono?: boolean; isLight?: boolean }) {
  return (
    <div className={`px-2.5 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl border transition-colors ${
      isLight 
        ? 'bg-gray-50 border-gray-200 hover:bg-gray-100' 
        : 'bg-white/5 border-white/10 hover:bg-white/10'
    }`}>
      <div className={`text-[9px] sm:text-[10px] uppercase tracking-wide mb-0.5 sm:mb-1 ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>{label}</div>
      <div className={`font-${mono ? 'mono' : 'semibold'} font-bold text-[10px] sm:text-xs truncate ${isLight ? 'text-gray-900' : 'text-white'}`}>{value}</div>
    </div>
  );
}

// Секция Copyright
export function CopyrightSection({ copyright }: { copyright: string }) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  
  return (
    <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl sm:rounded-2xl border ${
      isLight ? 'bg-gray-50 border-gray-200' : 'bg-white/5 border-white/10'
    }`}>
      <div className="flex items-start gap-2 sm:gap-3">
        <svg className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5 ${isLight ? 'text-gray-500' : 'text-zinc-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><path d="M15 9a3 3 0 1 0 0 6"/>
        </svg>
        <div className="min-w-0 flex-1">
          <div className={`text-[10px] sm:text-xs uppercase tracking-wide mb-1 ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>Copyright</div>
          <div className={`text-xs sm:text-sm break-words ${isLight ? 'text-gray-700' : 'text-zinc-300'}`}>{copyright}</div>
        </div>
      </div>
    </div>
  );
}

// Секция стран
export function CountriesSection({ countries }: { countries: string[] }) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  const [isExpanded, setIsExpanded] = useState(false);
  const displayCountries = isExpanded ? countries : countries.slice(0, 10);
  const hasMore = countries.length > 10;

  return (
    <div className={`mb-4 sm:mb-6 p-3 sm:p-5 rounded-xl sm:rounded-2xl border ${
      isLight 
        ? 'bg-gradient-to-br from-gray-50 to-white border-gray-200' 
        : 'bg-gradient-to-br from-white/5 to-white/[0.02] border-white/10'
    }`}>
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <svg className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <h3 className={`font-bold text-base sm:text-lg ${isLight ? 'text-gray-900' : 'text-white'}`}>Страны распространения</h3>
        <span className={`ml-auto text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full ${
          isLight ? 'text-gray-600 bg-gray-100' : 'text-zinc-500 bg-white/5'
        }`}>{countries.length} стран</span>
      </div>
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {displayCountries.map((country, idx) => (
          <span key={idx} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
            isLight 
              ? 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700' 
              : 'bg-white/10 hover:bg-white/15 border-white/10 text-white'
          }`}>
            {country}
          </span>
        ))}
      </div>
      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`mt-3 w-full px-4 py-2 border rounded-lg text-sm transition-all flex items-center justify-center gap-2 ${
            isLight 
              ? 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-600 hover:text-gray-900' 
              : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-400 hover:text-white'
          }`}
        >
          <span>{isExpanded ? 'Скрыть' : `Показать все (${countries.length})`}</span>
          <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
    </div>
  );
}

// Бейдж метаданных трека
export function MetadataBadge({ color, icon, label, value }: { color: string; icon: string; label: string; value?: string }) {
  const colorClasses: Record<string, { bg: string; border: string; text: string }> = {
    blue: { bg: 'from-blue-500/10 to-blue-600/5', border: 'border-blue-500/20 hover:border-blue-500/40', text: 'text-blue-300' },
    green: { bg: 'from-green-500/10 to-green-600/5', border: 'border-green-500/20 hover:border-green-500/40', text: 'text-green-300' },
    orange: { bg: 'from-orange-500/10 to-orange-600/5', border: 'border-orange-500/20 hover:border-orange-500/40', text: 'text-orange-300' },
    pink: { bg: 'from-pink-500/10 to-pink-600/5', border: 'border-pink-500/20 hover:border-pink-500/40', text: 'text-pink-300' },
    amber: { bg: 'from-amber-500/10 to-amber-600/5', border: 'border-amber-500/20 hover:border-amber-500/40', text: 'text-amber-300' }
  };

  const iconColors: Record<string, string> = { blue: 'text-blue-400', green: 'text-green-400', orange: 'text-orange-400', pink: 'text-pink-400', amber: 'text-amber-400' };

  const icons: Record<string, ReactNode> = {
    globe: <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>,
    grid: <><path d="M3 3h18v18H3z"/><path d="M3 9h18M9 21V9"/></>,
    tag: <><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>,
    users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>
  };

  const colors = colorClasses[color];

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-br ${colors.bg} rounded-lg border ${colors.border} transition-colors h-8`}>
      <svg className={`w-3.5 h-3.5 ${iconColors[color]} flex-shrink-0`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {icons[icon]}
      </svg>
      {value ? (
        <span className={`text-xs font-medium ${colors.text}`}>
          <span className="opacity-60">{label}:</span> {value}
        </span>
      ) : (
        <span className={`text-xs font-medium ${colors.text}`}>{label}</span>
      )}
    </div>
  );
}

// Метаданные трека - всегда показываем основные поля
export function TrackMetadata({ track }: { track: Track }) {
  const [copiedIsrc, setCopiedIsrc] = useState(false);
  
  const handleCopyIsrc = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (track.isrc) {
      navigator.clipboard.writeText(track.isrc);
      setCopiedIsrc(true);
      setTimeout(() => setCopiedIsrc(false), 2000);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-3">
      {/* ISRC с кнопкой копирования */}
      {track.isrc ? (
        <button
          onClick={handleCopyIsrc}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-lg border border-green-500/20 hover:border-green-500/40 transition-colors h-8 group"
          title="Копировать ISRC"
        >
          <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3h18v18H3z"/><path d="M3 9h18M9 21V9"/>
          </svg>
          <span className="text-xs font-medium text-green-300">
            <span className="opacity-60">ISRC:</span> {track.isrc}
          </span>
          {copiedIsrc ? (
            <svg className="w-3 h-3 text-green-400 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-3 h-3 text-green-400/50 group-hover:text-green-400 ml-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          )}
        </button>
      ) : (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-yellow-500/10 rounded-lg border border-yellow-500/30 h-8">
          <svg className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-xs text-yellow-300">ISRC не добавлен</span>
        </div>
      )}
      {/* Instrumental badge - если трек инструментальный */}
      {track.isInstrumental && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/10 rounded-lg border border-amber-500/30 h-8">
          <svg className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18V5l12-2v13M9 9l12-2"/>
            <circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
          </svg>
          <span className="text-xs text-amber-300 font-medium">Instrumental</span>
        </div>
      )}
      {/* Язык - только если НЕ инструментал */}
      {!track.isInstrumental && track.language ? (
        <MetadataBadge color="blue" icon="globe" label={track.language} />
      ) : !track.isInstrumental && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-500/10 rounded-lg border border-zinc-500/30 h-8">
          <svg className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          <span className="text-xs text-zinc-500">Язык не указан</span>
        </div>
      )}
      {/* Версия - только если есть */}
      {track.version && (
        <MetadataBadge color="orange" icon="tag" label={track.version} />
      )}
      {/* Producer - если есть (поддержка producer и producers) */}
      {(track.producer || track.producers) && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-br from-blue-500/10 to-indigo-600/5 rounded-lg border border-blue-500/20 hover:border-blue-500/40 transition-colors h-8">
          <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="4" width="4" height="16" rx="1"/>
            <rect x="10" y="8" width="4" height="12" rx="1"/>
            <rect x="16" y="2" width="4" height="18" rx="1"/>
          </svg>
          <span className="text-xs font-medium text-blue-300">
            <span className="opacity-60">prod.</span> {
              track.producers 
                ? (Array.isArray(track.producers) ? track.producers.join(', ') : track.producers)
                : (Array.isArray(track.producer) ? track.producer.join(', ') : track.producer)
            }
          </span>
        </div>
      )}
      {/* Featuring - только если есть */}
      {track.featuring && (
        <MetadataBadge color="pink" icon="users" label="feat." value={Array.isArray(track.featuring) ? track.featuring.join(', ') : track.featuring} />
      )}
      {/* Авторы - только если есть */}
      {track.authors && (
        <MetadataBadge color="amber" icon="user" label="авт." value={formatTrackAuthors(track.authors)} />
      )}
    </div>
  );
}

// Компонент трека со встроенным плеером (как в админке)
export function TrackItem({ track, index, canPlay, releaseId, releaseType, supabase, coverUrl, isLight }: { 
  track: Track; index: number; canPlay: boolean; releaseId: string; releaseType: 'basic' | 'exclusive'; supabase?: SupabaseClient; coverUrl?: string; isLight?: boolean;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [volume, setVolume] = useState(0.15);
  const [isMuted, setIsMuted] = useState(false);
  const maxVolume = 0.5;
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLyricsModal, setShowLyricsModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // Функция копирования с обратной связью
  const copyWithFeedback = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const formatTime = (sec: number) => {
    if (!sec || !isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const updateProgress = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      animationRef.current = requestAnimationFrame(updateProgress);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    // Применяем масштабирование для плавного контроля громкости
    const scaledVolume = newVolume * maxVolume;
    if (audioRef.current) audioRef.current.volume = scaledVolume;
    if (newVolume > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (audioRef.current) audioRef.current.volume = volume * maxVolume;
    } else {
      setIsMuted(true);
      if (audioRef.current) audioRef.current.volume = 0;
    }
  };

  const loadAudio = async () => {
    if (audioRef.current && audioUrl) return audioRef.current;
    setLoading(true);
    setError(null);
    try {
      const session = await supabase?.auth.getSession();
      const res = await fetch(`/api/stream-audio?releaseId=${releaseId}&releaseType=${releaseType}&trackIndex=${index}`, {
        headers: session?.data.session?.access_token ? { Authorization: `Bearer ${session.data.session.access_token}` } : {}
      });
      if (!res.ok) throw new Error('Ошибка загрузки');
      const blob = await res.blob();
      if (!blob.size) throw new Error('Пустой файл');
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      const audio = new Audio(url);
      audio.volume = isMuted ? 0 : volume * maxVolume;
      audioRef.current = audio;
      audio.onloadedmetadata = () => setDuration(audio.duration);
      audio.onended = () => { setIsPlaying(false); setCurrentTime(0); };
      audio.onerror = () => setError('Ошибка');
      audio.addEventListener('pause', () => setIsPlaying(false));
      audio.addEventListener('play', () => {
        setIsPlaying(true);
        animationRef.current = requestAnimationFrame(updateProgress);
      });
      await new Promise<void>((resolve) => {
        audio.oncanplaythrough = () => resolve();
        setTimeout(resolve, 2000);
      });
      return audio;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Слушаем глобальный event для остановки (НЕ сбрасываем позицию)
  useEffect(() => {
    const handleStopAll = () => {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setIsPlaying(false);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      }
    };
    window.addEventListener(STOP_ALL_AUDIO_EVENT, handleStopAll);
    return () => window.removeEventListener(STOP_ALL_AUDIO_EVENT, handleStopAll);
  }, []);

  // Остановка аудио при переключении вкладки браузера
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setIsPlaying(false);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handlePlayPause = async () => {
    if (!canPlay || !supabase) return;
    
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }
    
    // Сначала останавливаем СВОЙ трек если есть
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    // Останавливаем ВСЕ треки через глобальный event
    stopAllAudio();
    
    // Ждем чтобы все успели остановиться
    await new Promise(r => setTimeout(r, 100));
    
    const audio = audioRef.current || await loadAudio();
    if (!audio) return;
    
    // Еще раз проверяем что никто не играет
    stopAllAudio();
    await new Promise(r => setTimeout(r, 50));
    
    try {
      await audio.play();
    } catch (e: any) {
      if (e.name !== 'AbortError') setError('Ошибка');
    }
  };

  const seekToPosition = (clientX: number) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newTime = pct * duration;
    setCurrentTime(newTime);
    if (audioRef.current) audioRef.current.currentTime = newTime;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    seekToPosition(e.clientX);
  };

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    seekToPosition(e.clientX);
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => seekToPosition(e.clientX);
    const handleMouseUp = () => setIsDragging(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, duration]);

  useEffect(() => () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  }, [audioUrl]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const tagName = target.tagName.toLowerCase();
    // Не раскрываем если клик по кнопкам, инпутам или элементам с data-player-control
    if (tagName === 'button' || tagName === 'input' || tagName === 'svg' || tagName === 'path' || tagName === 'polygon' || tagName === 'line') return;
    if (target.hasAttribute('data-player-control') || target.closest('[data-player-control]')) return;
    setIsExpanded(!isExpanded);
  };

  return (
    <div 
      className={`track-item group rounded-xl sm:rounded-2xl border p-3 sm:p-4 cursor-pointer select-none isolate will-change-auto ${
        isLight 
          ? 'bg-gradient-to-br from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 border-gray-200 hover:border-purple-400'
          : 'bg-gradient-to-br from-white/5 to-white/[0.02] hover:from-white/8 hover:to-white/[0.04] border-white/10 hover:border-purple-500/30'
      }`}
      onClick={handleCardClick}
      style={{ contain: 'layout style' }}
    >
      {/* Main row: number, cover, info, progress, volume, actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Номер трека */}
        <span className={`text-xs sm:text-sm font-medium tabular-nums w-4 sm:w-5 text-right flex-shrink-0 transition-colors ${
          isLight ? 'text-gray-400 group-hover:text-gray-600' : 'text-zinc-500 group-hover:text-zinc-400'
        }`}>
          {index + 1}
        </span>
        
        {/* Play button with cover */}
        <button
          onClick={handlePlayPause}
          disabled={!canPlay || loading}
          className={`relative flex-shrink-0 w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl overflow-hidden ${
            !canPlay ? 'opacity-50 cursor-not-allowed' :
            isPlaying ? 'ring-2 ring-purple-500 shadow-lg shadow-purple-500/30' : (isLight ? 'ring-1 ring-gray-300 hover:ring-purple-400' : 'ring-1 ring-white/10 hover:ring-purple-500/50')
          }`}
        >
          {coverUrl ? (
            <img src={coverUrl} alt="" className="w-full h-full object-cover pointer-events-none" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-700 pointer-events-none" />
          )}
          <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${
            loading ? 'bg-black/70' : error ? 'bg-red-500/30' : isPlaying ? 'bg-black/50' : 'bg-black/40'
          }`}>
            {loading ? (
              <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : error ? (
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="text-red-400">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
            ) : !canPlay ? (
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24" className="text-zinc-500">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
              </svg>
            ) : isPlaying ? (
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="text-white">
                <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
              </svg>
            ) : (
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24" className="sm:w-4 sm:h-4 text-white ml-0.5">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </div>
        </button>

        {/* Track info & progress */}
        <div className="flex-1 min-w-0">
          {/* Строка 1: Название + prod. + feat. + E */}
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
            <h4 className={`track-title text-xs sm:text-sm font-medium truncate max-w-[120px] sm:max-w-[250px] ${isLight ? 'text-gray-900' : 'text-white'}`}>{track.title}</h4>
            {/* Продюсеры - скрыты на мобилке */}
            {(track.producer || track.producers) && (
              <span className={`hidden sm:inline text-xs truncate max-w-[120px] ${isLight ? 'text-blue-600/70' : 'text-blue-400/70'}`}>
                prod. {
                  track.producers 
                    ? (Array.isArray(track.producers) ? track.producers.join(', ') : track.producers)
                    : (Array.isArray(track.producer) ? track.producer.join(', ') : track.producer)
                }
              </span>
            )}
            {/* Фиты - скрыты на мобилке */}
            {track.featuring && (
              <span className={`hidden sm:inline text-xs truncate max-w-[120px] ${isLight ? 'text-pink-600/70' : 'text-pink-400/70'}`}>
                feat. {Array.isArray(track.featuring) ? track.featuring.join(', ') : track.featuring}
              </span>
            )}
            {/* Explicit */}
            {(track.explicit || track.hasDrugs) && !track.isInstrumental && (
              <span className="inline-flex items-center justify-center w-[14px] h-[14px] sm:w-[16px] sm:h-[16px] bg-red-500/20 text-red-400 text-[8px] sm:text-[9px] font-bold rounded border border-red-500/40 leading-none flex-shrink-0">E</span>
            )}
          </div>
          
          {/* Progress bar */}
          {canPlay && (
            <div className="flex items-center gap-1.5 sm:gap-2" data-player-control>
              <div 
                ref={progressRef}
                onClick={handleProgressClick}
                onMouseDown={handleProgressMouseDown}
                className={`flex-1 h-1 rounded-full cursor-pointer relative group/bar select-none ${isDragging ? 'cursor-grabbing' : ''} ${
                  isLight ? 'bg-gray-200' : 'bg-white/10'
                }`}
              >
                <div 
                  className="absolute inset-y-0 left-0 bg-violet-500 rounded-full"
                  style={{ width: `${progress}%`, transition: isDragging || isPlaying ? 'none' : 'width 0.1s' }}
                />
                <div 
                  className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-white rounded-full shadow-md pointer-events-none ${isDragging ? 'opacity-100 scale-110' : 'opacity-0 group-hover/bar:opacity-100'}`}
                  style={{ left: `calc(${progress}% - 4px)` }}
                />
              </div>
              <span className={`text-[9px] sm:text-[10px] font-mono w-[55px] sm:w-[70px] text-right flex-shrink-0 ${
                isLight ? 'text-gray-500' : 'text-zinc-500'
              }`}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          )}
        </div>

        {/* Volume control - скрыт на мобилке */}
        {canPlay && (
          <div className="track-volume hidden sm:flex items-center gap-1.5 flex-shrink-0 group/volume">
            <button
              onClick={toggleMute}
              className={`w-6 h-6 rounded-md border flex items-center justify-center ${
                isLight 
                  ? 'bg-gray-100 hover:bg-gray-200 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900' 
                  : 'bg-white/5 hover:bg-purple-500/20 border-transparent text-zinc-500 hover:text-purple-400'
              }`}
              title={isMuted ? 'Включить звук' : 'Выключить звук'}
            >
              {isMuted || volume === 0 ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <line x1="23" y1="9" x2="17" y2="15"/>
                  <line x1="17" y1="9" x2="23" y2="15"/>
                </svg>
              ) : volume < 0.5 ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
              ) : (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
              )}
            </button>
            <div 
              className={`relative w-14 h-1.5 rounded-full cursor-pointer ${
                isLight ? 'bg-gray-200 group-hover/volume:bg-gray-300' : 'bg-white/10 group-hover/volume:bg-white/15'
              }`}
              data-player-control
            >
              <div 
                className="absolute inset-y-0 left-0 bg-violet-500/70 rounded-full"
                style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div 
                className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full shadow-sm pointer-events-none ${
                  isLight ? 'bg-violet-500 opacity-100' : 'bg-white opacity-0 group-hover/volume:opacity-100'
                }`}
                style={{ left: `calc(${(isMuted ? 0 : volume) * 100}% - 5px)` }}
              />
            </div>
          </div>
        )}

        {/* Lyrics button */}
        {track.lyrics && (
          <button 
            onClick={(e) => { e.stopPropagation(); setShowLyricsModal(true); }}
            className={`flex-shrink-0 px-2 sm:px-2.5 h-7 sm:h-8 rounded-lg border flex items-center gap-1 sm:gap-1.5 transition ${
              isLight 
                ? 'bg-violet-50 hover:bg-violet-100 border-violet-300 hover:border-violet-400 text-violet-600 hover:text-violet-700'
                : 'bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/30 hover:border-violet-500/50 text-violet-400 hover:text-violet-300'
            }`}
            title="Показать текст песни"
          >
            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <span className="text-[9px] sm:text-[10px] font-medium hidden sm:inline">Текст</span>
          </button>
        )}

        {/* Expand button with hint */}
        <button 
          onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
          className={`flex-shrink-0 px-2 sm:px-2.5 h-7 sm:h-8 rounded-lg border flex items-center gap-1 sm:gap-1.5 group/expand ${
            isLight 
              ? 'bg-gray-100 hover:bg-gray-200 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900'
              : 'bg-white/5 hover:bg-purple-500/20 border-transparent text-zinc-400 hover:text-purple-300'
          }`}
          title={isExpanded ? 'Скрыть информацию' : 'Показать информацию о треке'}
        >
          <span className="text-[9px] sm:text-[10px] font-medium hidden sm:inline">Инфо</span>
          <svg className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <polyline points="6 9 12 15 18 9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Expandable details - ISRC первым, красивые бейджи */}
      {isExpanded && (
        <div className={`mt-3 pt-3 border-t animate-fade-in ${isLight ? 'border-gray-200' : 'border-white/5'}`}>
          {/* Все бейджи в одной строке с переносом */}
          <div className="flex flex-wrap items-center gap-2">
            {/* ISRC - первым */}
            {track.isrc ? (
              <button
                onClick={(e) => { e.stopPropagation(); copyWithFeedback(track.isrc!, `isrc-${index}`); }}
                className={`group/isrc flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  copiedId === `isrc-${index}` 
                    ? 'bg-emerald-500/20 border-emerald-500/40 scale-105' 
                    : isLight 
                      ? 'bg-emerald-50 border-emerald-300 hover:border-emerald-400'
                      : 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/30 hover:border-emerald-500/50'
                }`}
                title="Нажмите чтобы скопировать"
              >
                <span className={`text-[10px] font-semibold uppercase ${copiedId === `isrc-${index}` ? 'text-emerald-500' : (isLight ? 'text-emerald-600' : 'text-emerald-500')}`}>
                  {copiedId === `isrc-${index}` ? '✓' : 'ISRC'}
                </span>
                <span className={`text-xs ${copiedId === `isrc-${index}` ? 'text-emerald-500' : (isLight ? 'text-gray-600' : 'text-zinc-400')}`}>
                  {track.isrc}
                </span>
                <svg className={`w-3 h-3 flex-shrink-0 ${copiedId === `isrc-${index}` ? 'text-emerald-500' : (isLight ? 'text-gray-400 hidden group-hover/isrc:block' : 'text-zinc-500 hidden group-hover/isrc:block')}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {copiedId === `isrc-${index}` ? <polyline points="20 6 9 17 4 12"/> : <><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>}
                </svg>
              </button>
            ) : (
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${isLight ? 'bg-gray-100 border border-gray-200' : 'bg-zinc-500/10 border border-zinc-500/20'}`}>
                <span className={`text-[10px] font-semibold uppercase ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>ISRC</span>
                <span className={`text-xs ${isLight ? 'text-gray-400' : 'text-zinc-600'}`}>—</span>
              </div>
            )}

            {/* Продюсеры */}
            {(track.producer || track.producers) && (() => {
              const producers = track.producers 
                ? (Array.isArray(track.producers) ? track.producers.filter((p: string) => p?.trim()).join(', ') : track.producers)
                : (Array.isArray(track.producer) ? track.producer.filter((p: string) => p?.trim()).join(', ') : track.producer);
              return producers && (
                <button
                  onClick={(e) => { e.stopPropagation(); copyWithFeedback(producers, `prod-${index}`); }}
                  className={`group/prod flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    copiedId === `prod-${index}` 
                      ? 'bg-emerald-500/20 border-emerald-500/40 scale-105' 
                      : isLight 
                        ? 'bg-blue-50 border-blue-300 hover:bg-blue-100 hover:border-blue-400'
                        : 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/40'
                  }`}
                  title="Нажмите чтобы скопировать"
                >
                  <span className={`text-[10px] font-semibold uppercase ${copiedId === `prod-${index}` ? 'text-emerald-500' : (isLight ? 'text-blue-600' : 'text-blue-400')}`}>
                    {copiedId === `prod-${index}` ? '✓' : 'Prod.'}
                  </span>
                  <span className={`text-xs ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>{producers}</span>
                  <svg className={`w-3 h-3 flex-shrink-0 ${copiedId === `prod-${index}` ? 'text-emerald-500' : (isLight ? 'text-gray-400 hidden group-hover/prod:block' : 'text-zinc-500 hidden group-hover/prod:block')}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {copiedId === `prod-${index}` ? <polyline points="20 6 9 17 4 12"/> : <><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>}
                  </svg>
                </button>
              );
            })()}

            {/* Фиты */}
            {track.featuring && (() => {
              const featuring = Array.isArray(track.featuring) ? track.featuring.filter((f: string) => f?.trim()).join(', ') : track.featuring;
              return featuring && (
                <button
                  onClick={(e) => { e.stopPropagation(); copyWithFeedback(featuring, `feat-${index}`); }}
                  className={`group/feat flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    copiedId === `feat-${index}` 
                      ? 'bg-emerald-500/20 border-emerald-500/40 scale-105' 
                      : isLight 
                        ? 'bg-pink-50 border-pink-300 hover:bg-pink-100 hover:border-pink-400'
                        : 'bg-pink-500/10 border-pink-500/20 hover:bg-pink-500/20 hover:border-pink-500/40'
                  }`}
                  title="Нажмите чтобы скопировать"
                >
                  <span className={`text-[10px] font-semibold uppercase ${copiedId === `feat-${index}` ? 'text-emerald-500' : (isLight ? 'text-pink-600' : 'text-pink-400')}`}>
                    {copiedId === `feat-${index}` ? '✓' : 'Feat.'}
                  </span>
                  <span className={`text-xs ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>{featuring}</span>
                  <svg className={`w-3 h-3 flex-shrink-0 ${copiedId === `feat-${index}` ? 'text-emerald-500' : (isLight ? 'text-gray-400 hidden group-hover/feat:block' : 'text-zinc-500 hidden group-hover/feat:block')}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {copiedId === `feat-${index}` ? <polyline points="20 6 9 17 4 12"/> : <><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>}
                  </svg>
                </button>
              );
            })()}

            {/* Авторы */}
            {track.authors && Array.isArray(track.authors) && track.authors.length > 0 && (track.authors as any[]).map((author: any, idx: number) => {
              if (typeof author === 'object' && author.fullName) {
                const roleInfo = TRACK_AUTHOR_ROLES.find(r => r.value === author.role);
                const roleLabel = roleInfo?.label || author.role;
                const authorCopyId = `author-${index}-${idx}`;
                const isCopied = copiedId === authorCopyId;
                return (
                  <button
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); copyWithFeedback(author.fullName, authorCopyId); }}
                    className={`group/author flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                      isCopied 
                        ? 'bg-emerald-500/20 border-emerald-500/40 scale-105' 
                        : isLight 
                          ? 'bg-amber-50 border-amber-300 hover:bg-amber-100 hover:border-amber-400'
                          : 'bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40'
                    }`}
                    title="Нажмите чтобы скопировать"
                  >
                    <svg className={`w-3 h-3 flex-shrink-0 ${isCopied ? 'text-emerald-500' : (isLight ? 'text-amber-600' : 'text-amber-400')}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {isCopied ? <polyline points="20 6 9 17 4 12"/> : <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>}
                    </svg>
                    <span className={`text-xs font-medium ${isLight ? 'text-gray-700' : 'text-zinc-300'}`}>{author.fullName}</span>
                    <span className={`text-[10px] leading-none ${isCopied ? 'text-emerald-500/70' : (isLight ? 'text-amber-600/70' : 'text-amber-400/70')}`}>({roleLabel})</span>
                    <svg className={`w-3 h-3 flex-shrink-0 ${isCopied ? 'text-emerald-500' : (isLight ? 'text-gray-400 hidden group-hover/author:block' : 'text-zinc-500 hidden group-hover/author:block')}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {isCopied ? <polyline points="20 6 9 17 4 12"/> : <><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>}
                    </svg>
                  </button>
                );
              }
              return null;
            })}

            {/* Версия */}
            {track.version && (
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${isLight ? 'bg-violet-50 border-violet-300' : 'bg-violet-500/10 border-violet-500/20'}`}>
                <span className={`text-[10px] font-semibold uppercase ${isLight ? 'text-violet-600' : 'text-violet-400'}`}>Ver.</span>
                <span className={`text-xs ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>{track.version}</span>
              </div>
            )}

            {/* Язык - только если НЕ инструментал */}
            {!track.isInstrumental && track.language && (
              <span className={`px-2 py-1 rounded-lg text-[10px] font-medium border ${isLight ? 'bg-cyan-50 border-cyan-300 text-cyan-600' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'}`}>
                {track.language}
              </span>
            )}
            {/* Explicit/Clean - только если НЕ инструментал */}
            {!track.isInstrumental && (
              (track.explicit || track.hasDrugs) ? (
                <span className={`inline-flex items-center justify-center w-[22px] h-[22px] text-[10px] font-bold rounded-lg border leading-none ${isLight ? 'bg-red-50 border-red-300 text-red-600' : 'bg-red-500/15 text-red-400 border-red-500/40'}`}>
                  E
                </span>
              ) : (
                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-600' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                  Clean
                </span>
              )
            )}
            {/* Instrumental */}
            {track.isInstrumental && (
              <span className={`px-2 py-1 rounded-lg text-[10px] font-medium border ${isLight ? 'bg-amber-50 border-amber-300 text-amber-600' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                Instrumental
              </span>
            )}
          </div>
        </div>
      )}

      {/* Lyrics Modal */}
      {showLyricsModal && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
          onClick={() => setShowLyricsModal(false)}
        >
          <div 
            className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-white/10 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col shadow-2xl animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center border border-violet-500/20">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-violet-400" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-white">Текст песни</h3>
                  <p className="text-sm text-zinc-400">{track.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Кнопка копирования */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(track.lyrics || '');
                    // Показываем уведомление если есть функция
                  }}
                  className="w-10 h-10 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 flex items-center justify-center transition group"
                  title="Копировать текст"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400 group-hover:text-emerald-300">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                </button>
                {/* Кнопка закрытия */}
                <button
                  onClick={() => setShowLyricsModal(false)}
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 flex items-center justify-center transition group"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400 group-hover:text-zinc-300">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-black/30 rounded-xl p-5 border border-white/5 shadow-inner">
              <pre className="text-zinc-300 text-sm whitespace-pre-wrap font-sans leading-relaxed">
                {track.lyrics}
              </pre>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// Секция треклиста
export function TracklistSection({ tracks, releaseId, releaseType, status, supabase, coverUrl }: { 
  tracks: Track[]; releaseId: string; releaseType: 'basic' | 'exclusive'; status: string; supabase?: SupabaseClient; coverUrl?: string;
}) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  // Allow playing tracks for approved, published, or distributed statuses
  const canPlay = status === 'approved' || status === 'published' || status === 'distributed';
  return (
    <div className="mb-4 sm:mb-6">
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-5">
        <svg className={`w-5 h-5 sm:w-6 sm:h-6 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>
        </svg>
        <h3 className={`font-bold text-lg sm:text-2xl ${isLight ? 'text-gray-900' : 'text-white'}`}>Треклист</h3>
        <span className={`ml-auto text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full ${
          isLight ? 'text-gray-600 bg-gray-100' : 'text-zinc-500 bg-white/5'
        }`}>{tracks.length} {getTracksWord(tracks.length)}</span>
      </div>
      <div className="space-y-2 sm:space-y-3">
        {tracks.map((track, idx) => (
          <TrackItem key={idx} track={track} index={idx} canPlay={canPlay} releaseId={releaseId} releaseType={releaseType} supabase={supabase} coverUrl={coverUrl} isLight={isLight}/>
        ))}
      </div>
    </div>
  );
}
