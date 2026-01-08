'use client';

import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Release, statusConfig } from './types';

// ============================================================================
// ОПТИМИЗАЦИЯ: Глобальный кэш доминантных цветов для предотвращения повторных вычислений
// ============================================================================
const dominantColorCache = new Map<string, { r: number; g: number; b: number }>();

// Функция для извлечения доминантного цвета из изображения - ОПТИМИЗИРОВАННАЯ
function getDominantColor(imageUrl: string): Promise<{ r: number; g: number; b: number }> {
  // Проверяем кэш
  const cached = dominantColorCache.get(imageUrl);
  if (cached) return Promise.resolve(cached);
  
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ r: 139, g: 92, b: 246 }); // фиолетовый по умолчанию
        return;
      }
      
      // Уменьшенный размер для скорости
      const size = 20;
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);
      
      const imageData = ctx.getImageData(0, 0, size, size).data;
      let r = 0, g = 0, b = 0, count = 0;
      
      // Каждый 4-й пиксель для скорости
      for (let i = 0; i < imageData.length; i += 16) {
        const red = imageData[i];
        const green = imageData[i + 1];
        const blue = imageData[i + 2];
        const alpha = imageData[i + 3];
        
        if (alpha > 200 && (red + green + blue) > 60 && (red + green + blue) < 700) {
          r += red;
          g += green;
          b += blue;
          count++;
        }
      }
      
      const result = count > 0 
        ? { r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) }
        : { r: 139, g: 92, b: 246 };
      
      // Сохраняем в кэш
      dominantColorCache.set(imageUrl, result);
      resolve(result);
    };
    img.onerror = () => {
      resolve({ r: 139, g: 92, b: 246 });
    };
    img.src = imageUrl;
  });
}

interface ReleaseCardProps {
  release: Release;
  isSelected?: boolean;
  onSelect?: (checked: boolean) => void;
  onClick: () => void;
  searchQuery?: string;
  showCheckbox?: boolean;
}

// ============================================================================
// ОПТИМИЗАЦИЯ: memo + useMemo + useCallback для предотвращения лишних ререндеров
// ============================================================================
const ReleaseCard = memo(function ReleaseCard({
  release,
  isSelected = false,
  onSelect,
  onClick,
  searchQuery = '',
  showCheckbox = false
}: ReleaseCardProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  const status = statusConfig[release.status] || statusConfig.pending;
  const shouldAnimate = release.status === 'pending' || release.status === 'distributed';
  const [dominantColor, setDominantColor] = useState<{ r: number; g: number; b: number } | null>(null);
  
  // Извлекаем доминантный цвет из обложки
  useEffect(() => {
    if (release.cover_url) {
      getDominantColor(release.cover_url).then(setDominantColor);
    } else {
      setDominantColor(null);
    }
  }, [release.cover_url]);
  
  // ОПТИМИЗАЦИЯ: Мемоизированная функция подсветки
  const highlightMatch = useCallback((text: string) => {
    if (!searchQuery || !text) return text;
    const lower = text.toLowerCase();
    const query = searchQuery.toLowerCase();
    if (lower.includes(query)) {
      return <span className={`px-0.5 rounded ${isLight ? 'bg-yellow-200' : 'bg-yellow-500/30'}`}>{text}</span>;
    }
    return text;
  }, [searchQuery, isLight]);

  // ОПТИМИЗАЦИЯ: Мемоизированный динамический стиль свечения
  const dynamicStyle = useMemo(() => dominantColor && release.cover_url ? {
    boxShadow: isLight 
      ? `0 4px 20px rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, 0.12), 0 0 0 1px rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, 0.1)`
      : `0 0 25px rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, 0.15), 0 0 10px rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, 0.1)`,
    borderColor: `rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, ${isLight ? 0.25 : 0.2})`
  } : {}, [dominantColor, release.cover_url, isLight]);

  return (
    <div 
      onClick={onClick}
      className={`border rounded-xl p-4 cursor-pointer transition-all ${
        isLight 
          ? `bg-white/80 backdrop-blur-sm ${isSelected ? 'border-purple-500 ring-2 ring-purple-500/30' : 'border-purple-200/40'} hover:border-purple-400/60`
          : `bg-zinc-900/80 ${isSelected ? 'border-purple-500 ring-2 ring-purple-500/30' : 'border-zinc-800'} hover:border-purple-500/50`
      }`}
      style={!isSelected ? dynamicStyle : undefined}
      onMouseEnter={(e) => {
        if (!isSelected && dominantColor && release.cover_url) {
          const target = e.currentTarget;
          if (isLight) {
            target.style.boxShadow = `0 8px 30px rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, 0.2), 0 0 0 1px rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, 0.15)`;
          } else {
            target.style.boxShadow = `0 0 40px rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, 0.3), 0 0 20px rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, 0.2)`;
          }
          target.style.borderColor = `rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, ${isLight ? 0.4 : 0.4})`;
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          const target = e.currentTarget;
          if (dominantColor && release.cover_url) {
            if (isLight) {
              target.style.boxShadow = `0 4px 20px rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, 0.12), 0 0 0 1px rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, 0.1)`;
            } else {
              target.style.boxShadow = `0 0 25px rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, 0.15), 0 0 10px rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, 0.1)`;
            }
            target.style.borderColor = `rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, ${isLight ? 0.25 : 0.2})`;
          } else {
            target.style.boxShadow = '';
            target.style.borderColor = '';
          }
        }
      }}
    >
      {/* Чекбокс для массового выбора */}
      {showCheckbox && (
        <div className="mb-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect?.(e.target.checked);
            }}
            onClick={(e) => e.stopPropagation()}
            className={`w-4 h-4 rounded focus:ring-purple-500 ${
              isLight 
                ? 'border-purple-300 bg-white text-purple-600'
                : 'border-zinc-600 bg-zinc-800 text-purple-500'
            }`}
          />
        </div>
      )}

      <div className="flex gap-4">
        {/* Обложка - ОПТИМИЗАЦИЯ: lazy loading + GPU-ускорение */}
        <div className="flex-shrink-0">
          {release.cover_url ? (
            <img 
              src={release.cover_url} 
              alt={release.title}
              loading="lazy"
              decoding="async"
              className="w-20 h-20 rounded-lg object-cover"
              style={{ contentVisibility: 'auto' }}
            />
          ) : (
            <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
          )}
        </div>

        {/* Информация */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className={`font-bold truncate ${isLight ? 'text-gray-800' : 'text-white'}`}>{highlightMatch(release.title)}</h3>
            <span className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${status.color}`}>
              {shouldAnimate ? (
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
              )}
              <span>{status.label}</span>
            </span>
          </div>
          
          <p className={`text-sm truncate mb-2 ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>{highlightMatch(release.artist_name)}</p>
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Тип релиза */}
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
              release.release_type === 'exclusive' 
                ? isLight 
                  ? 'bg-amber-100 text-amber-700 border-amber-300/50'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                : isLight
                  ? 'bg-gray-100 text-gray-600 border-gray-300/50'
                  : 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
            }`}>
              {release.release_type === 'exclusive' ? 'EXCLUSIVE' : 'BASIC'}
            </span>
            
            {/* Жанр */}
            {release.genre && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                isLight 
                  ? 'bg-purple-100 text-purple-700 border-purple-300/50'
                  : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
              }`}>
                {release.genre}
              </span>
            )}
            
            {/* Треки */}
            <span className={`text-[10px] ${isLight ? 'text-gray-400' : 'text-zinc-500'}`}>
              {release.tracks_count || 0} треков
            </span>
          </div>

          {/* Пользователь */}
          <div className="flex items-center gap-2 mt-2">
            {release.user_avatar ? (
              <img src={release.user_avatar} alt="" className="w-5 h-5 rounded-full" />
            ) : (
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isLight ? 'bg-gray-200' : 'bg-zinc-700'}`}>
                <span className={`text-[8px] ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>
                  {(release.user_nickname || release.user_email || 'U')[0].toUpperCase()}
                </span>
              </div>
            )}
            <span className={`text-xs truncate ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
              {release.user_nickname || release.user_email}
            </span>
          </div>

          {/* Дата */}
          <p className={`text-[10px] mt-1 ${isLight ? 'text-gray-400' : 'text-zinc-600'}`}>
            {new Date(release.created_at).toLocaleDateString('ru-RU')}
          </p>
        </div>
      </div>
    </div>
  );
});

// Displayname для DevTools
ReleaseCard.displayName = 'ReleaseCard';

export default ReleaseCard;
