"use client";
import React, { useState, useRef, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';

interface AudioPlayerProps {
  releaseId: string;
  releaseType: 'basic' | 'exclusive';
  trackIndex: number;
  supabase: SupabaseClient;
  className?: string;
  variant?: 'full' | 'compact'; // full - с полосой прогресса, compact - только кнопка
}

export default function AudioPlayer({ 
  releaseId, 
  releaseType, 
  trackIndex, 
  supabase,
  className = '',
  variant = 'full'
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Очистка при размонтировании
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      setIsAudioReady(false);
    };
  }, [releaseId, trackIndex]);

  const getAudioUrl = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const url = `/api/stream-audio?releaseId=${releaseId}&releaseType=${releaseType}&trackIndex=${trackIndex}`;
      
      // Добавляем токен в заголовки для авторизации
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      return url;
    } catch (error) {
      console.error('Error getting audio URL:', error);
      return null;
    }
  };

  const togglePlay = async () => {
    if (!audioRef.current) {
      // Инициализация аудио элемента
      setLoading(true);
      const url = await getAudioUrl();
      if (!url) {
        setLoading(false);
        return;
      }

      const audio = new Audio(url);
      audioRef.current = audio;
      setIsAudioReady(true);

      // Обработчики событий
      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration);
        setLoading(false);
      });

      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
      });

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });

      audio.addEventListener('error', (e) => {
        const error = audio.error;
        console.error('Audio error:', error?.message || error?.code || 'Unknown audio error');
        setLoading(false);
        setIsPlaying(false);
      });

      audio.play();
      setIsPlaying(true);
    } else {
      // Переключение воспроизведения
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (variant === 'compact') {
    // Компактная версия - только кнопка Play/Pause
    return (
      <button
        onClick={togglePlay}
        disabled={loading}
        className={`w-10 h-10 rounded-lg bg-gradient-to-br from-[#6050ba] to-[#9d8df1] hover:from-[#7060ca] hover:to-[#ad9dff] flex items-center justify-center transition-all shadow-lg hover:shadow-[#6050ba]/50 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        title={isPlaying ? 'Пауза' : 'Воспроизвести'}
      >
        {loading ? (
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : isPlaying ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        )}
      </button>
    );
  }

  // Полная версия с полосой прогресса
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        onClick={togglePlay}
        disabled={loading}
        className="w-10 h-10 flex-shrink-0 rounded-lg bg-gradient-to-br from-[#6050ba] to-[#9d8df1] hover:from-[#7060ca] hover:to-[#ad9dff] flex items-center justify-center transition-all shadow-lg hover:shadow-[#6050ba]/50 disabled:opacity-50 disabled:cursor-not-allowed"
        title={isPlaying ? 'Пауза' : 'Воспроизвести'}
      >
        {loading ? (
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : isPlaying ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        )}
      </button>

      <div className="flex-1 flex items-center gap-2">
        <span className="text-xs text-zinc-400 font-mono w-10 text-right">
          {formatTime(currentTime)}
        </span>
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          disabled={!isAudioReady}
          className="flex-1 h-2 bg-white/10 rounded-full appearance-none cursor-pointer disabled:cursor-not-allowed [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-[#6050ba] [&::-webkit-slider-thumb]:to-[#9d8df1] [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-[#6050ba]/50 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-gradient-to-br [&::-moz-range-thumb]:from-[#6050ba] [&::-moz-range-thumb]:to-[#9d8df1] [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:shadow-[#6050ba]/50 [&::-moz-range-thumb]:cursor-pointer"
          style={{
            background: isAudioReady 
              ? `linear-gradient(to right, #6050ba 0%, #9d8df1 ${(currentTime / duration) * 100}%, rgba(255,255,255,0.1) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.1) 100%)`
              : 'rgba(255,255,255,0.1)'
          }}
        />
        <span className="text-xs text-zinc-400 font-mono w-10">
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}
