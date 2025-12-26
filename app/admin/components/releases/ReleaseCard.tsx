'use client';

import React from 'react';
import { Release, statusConfig } from './types';

interface ReleaseCardProps {
  release: Release;
  isSelected?: boolean;
  onSelect?: (checked: boolean) => void;
  onClick: () => void;
  searchQuery?: string;
  showCheckbox?: boolean;
}

export default function ReleaseCard({
  release,
  isSelected = false,
  onSelect,
  onClick,
  searchQuery = '',
  showCheckbox = false
}: ReleaseCardProps) {
  const status = statusConfig[release.status] || statusConfig.pending;
  
  const highlightMatch = (text: string) => {
    if (!searchQuery || !text) return text;
    const lower = text.toLowerCase();
    const query = searchQuery.toLowerCase();
    if (lower.includes(query)) {
      return <span className="bg-yellow-500/30 px-0.5 rounded">{text}</span>;
    }
    return text;
  };

  return (
    <div 
      onClick={onClick}
      className={`bg-zinc-900/80 border rounded-xl p-4 cursor-pointer transition-all hover:border-purple-500/50 ${
        isSelected ? 'border-purple-500 ring-2 ring-purple-500/30' : 'border-zinc-800'
      }`}
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
            className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-purple-500 focus:ring-purple-500"
          />
        </div>
      )}

      <div className="flex gap-4">
        {/* Обложка */}
        <div className="flex-shrink-0">
          {release.cover_url ? (
            <img 
              src={release.cover_url} 
              alt={release.title}
              className="w-20 h-20 rounded-lg object-cover"
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
            <h3 className="font-bold text-white truncate">{highlightMatch(release.title)}</h3>
            <span className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${status.color}`}>
              <span>{status.emoji}</span>
              <span>{status.label}</span>
            </span>
          </div>
          
          <p className="text-sm text-zinc-400 truncate mb-2">{highlightMatch(release.artist_name)}</p>
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Тип релиза */}
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              release.release_type === 'exclusive' 
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                : 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30'
            }`}>
              {release.release_type === 'exclusive' ? 'EXCLUSIVE' : 'BASIC'}
            </span>
            
            {/* Жанр */}
            {release.genre && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                {release.genre}
              </span>
            )}
            
            {/* Треки */}
            <span className="text-[10px] text-zinc-500">
              {release.tracks_count || 0} треков
            </span>
          </div>

          {/* Пользователь */}
          <div className="flex items-center gap-2 mt-2">
            {release.user_avatar ? (
              <img src={release.user_avatar} alt="" className="w-5 h-5 rounded-full" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center">
                <span className="text-[8px] text-zinc-400">
                  {(release.user_nickname || release.user_email || 'U')[0].toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-xs text-zinc-500 truncate">
              {release.user_nickname || release.user_email}
            </span>
          </div>

          {/* Дата */}
          <p className="text-[10px] text-zinc-600 mt-1">
            {new Date(release.created_at).toLocaleDateString('ru-RU')}
          </p>
        </div>
      </div>
    </div>
  );
}
