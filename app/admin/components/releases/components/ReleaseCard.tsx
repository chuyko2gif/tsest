'use client';

import React from 'react';
import { Release } from '../types';

interface ReleaseCardProps {
  release: Release;
  viewMode: 'moderation' | 'archive' | 'create';
  isSelected: boolean;
  onSelect: (id: string) => void;
  onView: (id: string, type: 'basic' | 'exclusive') => void;
}

export default function ReleaseCard({
  release,
  viewMode,
  isSelected,
  onSelect,
  onView
}: ReleaseCardProps) {
  return (
    <div
      onClick={() => onView(release.id, release.release_type)}
      className="p-3 sm:p-5 bg-white/[0.02] border border-white/5 rounded-xl hover:border-[#6050ba]/50 transition cursor-pointer relative"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Чекбокс для выбора (только в архиве) */}
        {viewMode === 'archive' && (
          <label 
            onClick={(e) => e.stopPropagation()}
            className="flex-shrink-0 cursor-pointer group relative w-4 h-4 sm:w-5 sm:h-5 transition-transform hover:scale-110 mt-0.5"
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(release.id)}
              className="peer absolute opacity-0 w-full h-full cursor-pointer z-10"
            />
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded border-2 border-white/20 bg-white/5 peer-checked:bg-[#6050ba] peer-checked:border-[#6050ba] transition-all duration-200 group-hover:border-[#6050ba]/50 absolute inset-0"></div>
            <svg 
              className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-0 peer-checked:scale-100 transition-transform duration-200 pointer-events-none" 
              viewBox="0 0 12 10" 
              fill="none"
            >
              <path d="M1 5L4.5 8.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </label>
        )}

        {/* Обложка */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
          {release.cover_url ? (
            <img src={release.cover_url} alt={release.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
          )}
        </div>

        {/* Информация */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-bold text-white text-sm sm:text-base truncate">{release.title}</h3>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              release.user_role === 'basic' 
                ? 'bg-[#6050ba]/20 text-[#9d8df1]' 
                : 'bg-purple-500/20 text-purple-400'
            }`}>
              {release.user_role === 'basic' ? 'BASIC' : 'EXCLUSIVE'}
            </span>
            <StatusBadge status={release.status} />
            {release.user_role === 'basic' && (
              <PaymentBadge paymentStatus={release.payment_status} />
            )}
          </div>
          <div className="flex items-center gap-2">
            {release.user_avatar && (
              <div 
                className="w-6 h-6 rounded-lg bg-cover bg-center flex-shrink-0"
                style={{ backgroundImage: `url(${release.user_avatar})` }}
              />
            )}
            <p className="text-sm text-zinc-400">{release.artist_name}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
            <span className="text-zinc-500">{release.genre}</span>
            <span className="text-zinc-500">{release.tracks_count} треков</span>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <svg className="w-3.5 h-3.5 text-blue-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                <circle cx="12" cy="12" r="10" strokeWidth={2} />
              </svg>
              <span className="font-medium">Создан:</span>
              <span className="text-white/80">{new Date(release.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
            {release.release_date && (
              <div className="flex items-center gap-1.5 text-zinc-400">
                <svg className="w-3.5 h-3.5 text-purple-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
                  <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
                  <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
                  <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
                </svg>
                <span className="font-medium">Релиз:</span>
                <span className="text-white/80">{new Date(release.release_date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
            )}
          </div>
        </div>

        {/* Стрелка */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-zinc-600">
          <polyline points="9 18 15 12 9 6" strokeWidth="2"/>
        </svg>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { text: string; className: string; showSpinner?: boolean; showX?: boolean }> = {
    pending: { text: 'НА МОДЕРАЦИИ', className: 'bg-yellow-500/20 text-yellow-400', showSpinner: true },
    distributed: { text: 'НА ДИСТРИБЬЮЦИИ', className: 'bg-blue-500/20 text-blue-400', showSpinner: true },
    published: { text: 'ОПУБЛИКОВАН', className: 'bg-green-500/20 text-green-400' },
    rejected: { text: 'ОТКЛОНЕН', className: 'bg-red-500/20 text-red-400', showX: true },
  };

  const { text, className, showSpinner, showX } = config[status] || { 
    text: status.toUpperCase(), 
    className: 'bg-zinc-500/20 text-zinc-400' 
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${className}`}>
      {showSpinner && (
        <svg className="animate-spin h-3 w-3 mr-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {showX && (
        <svg className="h-3 w-3 -mr-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      )}
      {text}
    </span>
  );
}

function PaymentBadge({ paymentStatus }: { paymentStatus: string | null }) {
  const config: Record<string, { text: string; className: string }> = {
    pending: { text: 'Платеж на проверке', className: 'bg-yellow-500/20 text-yellow-400' },
    verified: { text: 'Оплачено', className: 'bg-emerald-500/20 text-emerald-400' },
  };

  const { text, className } = config[paymentStatus || ''] || { 
    text: 'Не оплачено', 
    className: 'bg-red-500/20 text-red-400' 
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${className}`}>
      {text}
    </span>
  );
}
