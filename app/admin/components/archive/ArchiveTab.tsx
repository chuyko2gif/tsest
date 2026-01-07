"use client";
import React, { useState, useEffect, useRef } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { useTheme } from '@/contexts/ThemeContext';

interface ArchiveTabProps {
  supabase: SupabaseClient;
}

// Простой встроенный плеер для трека
function SimpleTrackPlayer({ 
  releaseId, 
  releaseType, 
  trackIndex, 
  trackTitle,
  coverUrl,
  supabase 
}: { 
  releaseId: string; 
  releaseType: string; 
  trackIndex: number;
  trackTitle: string;
  coverUrl?: string;
  supabase: SupabaseClient;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlay = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    if (audioUrl && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const url = `/api/stream-audio?releaseId=${releaseId}&releaseType=${releaseType}&trackIndex=${trackIndex}`;
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error('Ошибка загрузки');

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      setAudioUrl(blobUrl);

      const audio = new Audio(blobUrl);
      audioRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => setError('Ошибка воспроизведения');
      
      await audio.play();
      setIsPlaying(true);
    } catch (err: any) {
      setError(err.message || 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  return (
    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-black/30 rounded-lg">
      {/* Миниатюра */}
      <div className="relative flex-shrink-0">
        {coverUrl ? (
          <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden">
            <img src={coverUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-xs sm:text-sm font-bold text-white">{trackIndex + 1}</span>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-violet-500/20 flex items-center justify-center text-xs sm:text-sm font-bold text-violet-400">
            {trackIndex + 1}
          </div>
        )}
      </div>

      {/* Кнопка воспроизведения */}
      <button
        onClick={handlePlay}
        disabled={loading}
        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all min-h-[36px] ${
          error ? 'bg-red-500/20 text-red-400' : 'bg-violet-500 text-white hover:bg-violet-600'
        } ${loading ? 'opacity-50' : ''}`}
      >
        {loading ? (
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        ) : isPlaying ? (
          <svg width="14" height="14" className="sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
          </svg>
        ) : (
          <svg width="14" height="14" className="sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5.14v14l11-7-11-7z"/>
          </svg>
        )}
      </button>

      {/* Название */}
      <div className="flex-1 min-w-0">
        <div className="text-xs sm:text-sm text-white truncate">{trackTitle}</div>
        <div className="text-[10px] sm:text-xs text-zinc-500">
          {loading ? 'Загрузка...' : error ? error : isPlaying ? '▶ Воспр.' : 'Нажмите ▶'}
        </div>
      </div>
    </div>
  );
}

export default function ArchiveTab({ supabase }: ArchiveTabProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  const [archivedReleases, setArchivedReleases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRelease, setExpandedRelease] = useState<string | null>(null);

  useEffect(() => {
    loadArchivedReleases();
  }, [supabase]);

  const loadArchivedReleases = async () => {
    try {
      setLoading(true);
      
      // Load rejected AND awaiting_payment releases from both tables
      const [basicRejected, basicAwaiting, exclusiveRejected, exclusiveAwaiting] = await Promise.all([
        supabase
          .from('releases_basic')
          .select('*')
          .eq('status', 'rejected')
          .order('updated_at', { ascending: false }),
        supabase
          .from('releases_basic')
          .select('*')
          .eq('status', 'awaiting_payment')
          .order('updated_at', { ascending: false }),
        supabase
          .from('releases_exclusive')
          .select('*')
          .eq('status', 'rejected')
          .order('updated_at', { ascending: false }),
        supabase
          .from('releases_exclusive')
          .select('*')
          .eq('status', 'awaiting_payment')
          .order('updated_at', { ascending: false })
      ]);

      const allReleases = [
        ...(basicRejected.data || []).map(r => ({ ...r, release_type: 'basic' })),
        ...(basicAwaiting.data || []).map(r => ({ ...r, release_type: 'basic' })),
        ...(exclusiveRejected.data || []).map(r => ({ ...r, release_type: 'exclusive' })),
        ...(exclusiveAwaiting.data || []).map(r => ({ ...r, release_type: 'exclusive' }))
      ].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

      setArchivedReleases(allReleases);
    } catch (error) {
      console.error('Error loading archived releases:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h2 className="text-lg sm:text-2xl font-black uppercase text-white">Архив релизов</h2>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1">Отклонённые и ожидающие оплаты материалы</p>
        </div>
        {/* Легенда статусов */}
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
            <span className="text-[10px] sm:text-xs text-zinc-400">Отклонён</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-orange-500 animate-pulse"></div>
            <span className="text-[10px] sm:text-xs text-zinc-400">Ожидает оплаты</span>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#6050ba] border-t-transparent"></div>
          <p className="text-zinc-400 mt-4">Загрузка...</p>
        </div>
      ) : archivedReleases.length === 0 ? (
        <div className="text-center py-12 sm:py-20 text-zinc-400">
          <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🗄️</div>
          <p className="text-base sm:text-lg font-semibold text-white">Архив пуст</p>
          <p className="text-xs sm:text-sm mt-2">Отклонённые релизы будут отображаться здесь</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {archivedReleases.map((release) => (
            <div
              key={release.id}
              className={`group bg-gradient-to-br from-[#0d0d0f] to-[#1a1a1f] border rounded-xl p-3 sm:p-4 transition-all relative overflow-hidden ${
                release.status === 'awaiting_payment' 
                  ? 'border-orange-500/50 hover:border-orange-500' 
                  : 'border-white/10 hover:border-red-500/30'
              }`}
            >
              {/* Баннер статуса для awaiting_payment - ОЧЕНЬ ЗАМЕТНЫЙ */}
              {release.status === 'awaiting_payment' && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white text-center py-1.5 sm:py-2 font-black text-xs sm:text-sm uppercase tracking-wider animate-pulse shadow-lg shadow-orange-500/30">
                  💳 <span className="hidden sm:inline">ОЖИДАЕТ </span>ОПЛАТЫ
                </div>
              )}
              
              {/* Контент с отступом если есть баннер */}
              <div className={release.status === 'awaiting_payment' ? 'mt-8 sm:mt-10' : ''}>
                {release.cover_url && (
                  <img
                    src={release.cover_url}
                    alt={release.title}
                    className={`w-full aspect-square object-cover rounded-lg mb-2 sm:mb-3 ${
                      release.status === 'awaiting_payment' ? 'ring-2 ring-orange-500/50' : ''
                    }`}
                  />
                )}
                <h3 className="font-bold text-white text-sm sm:text-base truncate">{release.title}</h3>
                <p className="text-xs sm:text-sm text-zinc-400 truncate">{release.artist_name}</p>
                
                <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-bold ${
                    release.release_type === 'basic'
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-purple-500/20 text-purple-300'
                  }`}>
                    {release.release_type === 'basic' ? 'BASIC' : 'EXCL'}
                  </span>
                  {release.status === 'rejected' ? (
                    <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-bold bg-red-500/20 text-red-300">
                      ОТКЛОНЁН
                    </span>
                  ) : (
                    <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-black bg-orange-500/30 text-orange-300 border border-orange-500/50 animate-pulse">
                      💳 НА ОПЛАТЕ
                    </span>
                  )}
                </div>

                {/* Сумма к оплате для awaiting_payment */}
                {release.status === 'awaiting_payment' && (
                  <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-orange-500/10 border-2 border-orange-500/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] sm:text-xs text-orange-400/80 uppercase font-bold tracking-wider">К оплате:</p>
                        <p className="text-lg sm:text-2xl font-black text-orange-400">
                          {release.payment_amount || (release.release_type_value === 'single' ? 300 : release.release_type_value === 'ep' ? 600 : 900)} ₽
                        </p>
                      </div>
                      <div className="text-orange-400/60 hidden sm:block">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                          <line x1="1" y1="10" x2="23" y2="10"/>
                        </svg>
                      </div>
                    </div>
                    <p className="text-[9px] sm:text-[10px] text-orange-400/60 mt-1 sm:mt-2">
                      ⚠️ Публикация недоступна до оплаты
                    </p>
                  </div>
                )}

                {release.rejection_reason && release.status === 'rejected' && (
                  <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-[10px] sm:text-xs text-zinc-400 mb-0.5 sm:mb-1">Причина отклонения:</p>
                    <p className="text-xs sm:text-sm text-white line-clamp-2">{release.rejection_reason}</p>
                  </div>
                )}

              {/* Треклист с плеером */}
              {release.tracks && release.tracks.length > 0 && (
                <div className="mt-2 sm:mt-3">
                  <button
                    onClick={() => setExpandedRelease(expandedRelease === release.id ? null : release.id)}
                    className="w-full flex items-center justify-between p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors min-h-[40px]"
                  >
                    <span className="text-xs sm:text-sm text-zinc-300 flex items-center gap-1.5 sm:gap-2">
                      <svg width="14" height="14" className="sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18V5l12-2v13"/>
                        <circle cx="6" cy="18" r="3"/>
                        <circle cx="18" cy="16" r="3"/>
                      </svg>
                      Треклист ({release.tracks.length})
                    </span>
                    <svg 
                      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      className={`sm:w-4 sm:h-4 text-zinc-500 transition-transform ${expandedRelease === release.id ? 'rotate-180' : ''}`}
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                  
                  {expandedRelease === release.id && (
                    <div className="mt-2 space-y-1.5 sm:space-y-2">
                      {release.tracks.map((track: any, idx: number) => (
                        <SimpleTrackPlayer
                          key={idx}
                          releaseId={release.id}
                          releaseType={release.release_type}
                          trackIndex={idx}
                          trackTitle={track.title}
                          coverUrl={release.cover_url}
                          supabase={supabase}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <div className="mt-2 sm:mt-3 text-[10px] sm:text-xs text-zinc-500">
                {new Date(release.updated_at).toLocaleString('ru-RU')}
              </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

