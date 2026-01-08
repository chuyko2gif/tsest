'use client';

import React, { memo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Release } from '../types';

interface ReleasesListProps {
  releases: Release[];
  viewMode: 'moderation' | 'archive' | 'create';
  selectedIds: string[];
  onSelectRelease: (id: string) => void;
  onViewRelease: (id: string, type: 'basic' | 'exclusive') => void;
}

export default function ReleasesList({
  releases,
  viewMode,
  selectedIds,
  onSelectRelease,
  onViewRelease
}: ReleasesListProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';

  if (releases.length === 0) {
    return (
      <div className={`text-center py-20 border border-dashed rounded-2xl ${isLight ? 'border-gray-300' : 'border-white/10'}`}>
        <div className="flex justify-center mb-4">
          <svg className={`w-16 h-16 ${isLight ? 'text-gray-400' : 'text-zinc-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className={isLight ? 'text-gray-500' : 'text-zinc-500'}>Нет релизов на модерации</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
      {releases.map((release) => (
        <ReleaseCardCompact
          key={release.id}
          release={release}
          viewMode={viewMode}
          isSelected={selectedIds.includes(release.id)}
          onSelect={onSelectRelease}
          onView={onViewRelease}
          isLight={isLight}
        />
      ))}
    </div>
  );
}

interface ReleaseCardCompactProps {
  release: Release;
  viewMode: 'moderation' | 'archive' | 'create';
  isSelected: boolean;
  onSelect: (id: string) => void;
  onView: (id: string, type: 'basic' | 'exclusive') => void;
  isLight: boolean;
}

// ============================================================================
// ОПТИМИЗАЦИЯ: memo для предотвращения ререндеров при скролле
// ============================================================================
const ReleaseCardCompact = memo(function ReleaseCardCompact({
  release,
  viewMode,
  isSelected,
  onSelect,
  onView,
  isLight
}: ReleaseCardCompactProps) {
  return (
    <div
      onClick={() => onView(release.id, release.release_type)}
      className={`p-3 sm:p-5 border rounded-xl transition cursor-pointer relative min-h-[44px] ${
        isLight 
          ? 'bg-white/80 border-gray-200 hover:border-[#6050ba]/50 active:bg-gray-50' 
          : 'bg-white/[0.02] border-white/5 hover:border-[#6050ba]/50 active:bg-white/[0.04]'
      }`}
    >
      {/* ===== МОБИЛЬНАЯ ВЕРСИЯ ===== */}
      <div className="sm:hidden">
        <div className="flex gap-3">
          {/* Чекбокс + Обложка */}
          <div className="flex flex-col items-center gap-2">
            {viewMode === 'archive' && (
              <label 
                onClick={(e) => e.stopPropagation()}
                className="flex-shrink-0 cursor-pointer group relative w-5 h-5 transition-transform hover:scale-110"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onSelect(release.id)}
                  className="peer absolute opacity-0 w-10 h-10 -left-2 -top-2 cursor-pointer z-10"
                />
                <div className={`w-5 h-5 rounded border-2 peer-checked:bg-[#6050ba] peer-checked:border-[#6050ba] transition-all duration-200 group-hover:border-[#6050ba]/50 absolute inset-0 ${
                  isLight ? 'border-gray-300 bg-white' : 'border-white/20 bg-white/5'
                }`}></div>
                <svg 
                  className="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-0 peer-checked:scale-100 transition-transform duration-200 pointer-events-none" 
                  viewBox="0 0 12 10" 
                  fill="none"
                >
                  <path d="M1 5L4.5 8.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </label>
            )}
            <div className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 ${isLight ? 'bg-gray-100' : 'bg-white/5'}`}>
              {release.cover_url ? (
                <img 
                  src={release.cover_url} 
                  alt={release.title} 
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover" 
                  style={{ contentVisibility: 'auto' }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className={`w-6 h-6 ${isLight ? 'text-gray-400' : 'text-zinc-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Информация */}
          <div className="flex-1 min-w-0">
            {/* Название и тип */}
            <h3 className={`font-bold text-sm truncate ${isLight ? 'text-gray-800' : 'text-white'}`}>{release.title}</h3>
            
            {/* Артист */}
            <div className="flex items-center gap-1.5 mt-0.5">
              {release.user_avatar && (
                <div 
                  className="w-4 h-4 rounded-full bg-cover bg-center flex-shrink-0"
                  style={{ backgroundImage: `url(${release.user_avatar})` }}
                />
              )}
              <p className={`text-xs truncate ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>{release.artist_name}</p>
            </div>
            
            {/* Бейджи */}
            <div className="flex flex-wrap items-center gap-1 mt-1.5">
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                release.user_role === 'basic' 
                  ? 'bg-[#6050ba]/20 text-[#9d8df1]' 
                  : 'bg-purple-500/20 text-purple-400'
              }`}>
                {release.user_role === 'basic' ? 'BASIC' : 'EXCL'}
              </span>
              <StatusBadgeMobile status={release.status} isLight={isLight} />
              {release.user_role === 'basic' && (
                <PaymentBadgeMobile paymentStatus={release.payment_status} isLight={isLight} />
              )}
            </div>
            
            {/* Мета информация */}
            <div className={`flex items-center gap-2 mt-1.5 text-[10px] ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
              <span>{release.genre}</span>
              <span>•</span>
              <span>{release.tracks_count} тр.</span>
              {release.release_date && (
                <>
                  <span>•</span>
                  <span>{new Date(release.release_date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}</span>
                </>
              )}
            </div>
          </div>

          {/* Стрелка */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={`flex-shrink-0 mt-5 ${isLight ? 'text-gray-400' : 'text-zinc-600'}`}>
            <polyline points="9 18 15 12 9 6" strokeWidth="2"/>
          </svg>
        </div>
      </div>

      {/* ===== ДЕСКТОП ВЕРСИЯ ===== */}
      <div className="hidden sm:block">
        <div className="flex items-start gap-4">
          {/* Чекбокс для выбора (только в архиве) */}
          {viewMode === 'archive' && (
            <label 
              onClick={(e) => e.stopPropagation()}
              className="flex-shrink-0 cursor-pointer group relative w-5 h-5 transition-transform hover:scale-110 mt-1"
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelect(release.id)}
                className="peer absolute opacity-0 w-10 h-10 -left-2 -top-2 cursor-pointer z-10"
              />
              <div className={`w-5 h-5 rounded border-2 peer-checked:bg-[#6050ba] peer-checked:border-[#6050ba] transition-all duration-200 group-hover:border-[#6050ba]/50 absolute inset-0 ${
                isLight ? 'border-gray-300 bg-white' : 'border-white/20 bg-white/5'
              }`}></div>
              <svg 
                className="w-3.5 h-3.5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-0 peer-checked:scale-100 transition-transform duration-200 pointer-events-none" 
                viewBox="0 0 12 10" 
                fill="none"
              >
                <path d="M1 5L4.5 8.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </label>
          )}

          {/* Обложка */}
          <div className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 ${isLight ? 'bg-gray-100' : 'bg-white/5'}`}>
            {release.cover_url ? (
              <img 
                src={release.cover_url} 
                alt={release.title} 
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
                style={{ contentVisibility: 'auto' }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className={`w-8 h-8 ${isLight ? 'text-gray-400' : 'text-zinc-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
            )}
          </div>

          {/* Информация */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className={`font-bold text-base truncate ${isLight ? 'text-gray-800' : 'text-white'}`}>{release.title}</h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
                release.user_role === 'basic' 
                  ? 'bg-[#6050ba]/20 text-[#9d8df1]' 
                  : 'bg-purple-500/20 text-purple-400'
              }`}>
                {release.user_role === 'basic' ? 'BASIC' : 'EXCL'}
              </span>
              <StatusBadge status={release.status} isLight={isLight} />
            </div>
            {release.user_role === 'basic' && (
              <div className="mb-1">
                <PaymentBadge paymentStatus={release.payment_status} isLight={isLight} />
              </div>
            )}
            <div className="flex items-center gap-2">
              {release.user_avatar && (
                <div 
                  className="w-6 h-6 rounded-lg bg-cover bg-center flex-shrink-0"
                  style={{ backgroundImage: `url(${release.user_avatar})` }}
                />
              )}
              <p className={`text-sm truncate ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>{release.artist_name}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
              <span className={isLight ? 'text-gray-500' : 'text-zinc-500'}>{release.genre}</span>
              <span className={isLight ? 'text-gray-500' : 'text-zinc-500'}>{release.tracks_count} тр.</span>
              <div className={`flex items-center gap-1.5 ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>
                <svg className="w-3.5 h-3.5 text-emerald-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span className="font-medium">Создан:</span>
                <span className={isLight ? 'text-gray-700' : 'text-white/80'}>{new Date(release.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
              {release.release_date && (
                <div className={`flex items-center gap-1.5 ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>
                  <svg className="w-3.5 h-3.5 text-purple-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
                    <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
                    <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
                    <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
                  </svg>
                  <span className="font-medium">Релиз:</span>
                  <span className={isLight ? 'text-gray-700' : 'text-white/80'}>{new Date(release.release_date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
              )}
            </div>
          </div>

          {/* Стрелка */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={`flex-shrink-0 ${isLight ? 'text-gray-400' : 'text-zinc-600'}`}>
            <polyline points="9 18 15 12 9 6" strokeWidth="2"/>
          </svg>
        </div>
      </div>
    </div>
  );
});

// Мобильные версии бейджей (более компактные)
function StatusBadgeMobile({ status, isLight }: { status: string; isLight: boolean }) {
  const config: Record<string, { text: string; className: string; showSpinner?: boolean; showX?: boolean; showCheck?: boolean }> = {
    pending: { text: 'МОД', className: 'bg-yellow-500/20 text-yellow-500', showSpinner: true },
    approved: { text: 'ОК', className: 'bg-violet-500/20 text-violet-500', showCheck: true },
    published: { text: 'ВЫЛ', className: 'bg-emerald-500/20 text-emerald-500', showCheck: true },
    rejected: { text: 'ОТК', className: 'bg-red-500/20 text-red-500', showX: true },
    awaiting_payment: { text: 'ОПЛ', className: 'bg-orange-500/20 text-orange-500' },
    draft: { text: 'ЧРН', className: isLight ? 'bg-gray-200 text-gray-600' : 'bg-zinc-500/20 text-zinc-400' },
  };

  const { text, className, showSpinner, showX, showCheck } = config[status] || { text: '?', className: isLight ? 'bg-gray-200 text-gray-600' : 'bg-zinc-500/20 text-zinc-400' };

  return (
    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5 ${className}`}>
      {showSpinner && (
        <svg className="animate-spin h-2.5 w-2.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {showCheck && (
        <svg className="h-2.5 w-2.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      )}
      {showX && (
        <svg className="h-2.5 w-2.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      )}
      {text}
    </span>
  );
}

function PaymentBadgeMobile({ paymentStatus, isLight }: { paymentStatus: string | null; isLight: boolean }) {
  const config: Record<string, { text: string; className: string }> = {
    pending: { text: '₽?', className: 'bg-yellow-500/20 text-yellow-500' },
    verified: { text: '₽✓', className: 'bg-emerald-500/20 text-emerald-500' },
  };

  const { text, className } = config[paymentStatus || ''] || { text: '₽✗', className: 'bg-red-500/20 text-red-500' };

  return (
    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${className}`}>
      {text}
    </span>
  );
}

function StatusBadge({ status, isLight }: { status: string; isLight: boolean }) {
  const config: Record<string, { text: string; className: string; showSpinner?: boolean; showX?: boolean; showCheck?: boolean }> = {
    pending: { text: 'НА МОДЕРАЦИИ', className: 'bg-yellow-500/20 text-yellow-500', showSpinner: true },
    approved: { text: 'ОДОБРЕН', className: 'bg-violet-500/20 text-violet-500', showCheck: true },
    published: { text: 'ВЫЛОЖЕН', className: 'bg-emerald-500/20 text-emerald-500', showCheck: true },
    rejected: { text: 'ОТКЛОНЁН', className: 'bg-red-500/20 text-red-500', showX: true },
    awaiting_payment: { text: 'ОЖИДАЕТ ОПЛАТЫ', className: 'bg-orange-500/20 text-orange-500' },
    draft: { text: 'ЧЕРНОВИК', className: isLight ? 'bg-gray-200 text-gray-600' : 'bg-zinc-500/20 text-zinc-400' },
  };

  const { text, className, showSpinner, showX, showCheck } = config[status] || { text: status?.toUpperCase() || 'НЕИЗВЕСТНО', className: isLight ? 'bg-gray-200 text-gray-600' : 'bg-zinc-500/20 text-zinc-400' };

  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${className}`}>
      {showSpinner && (
        <svg className="animate-spin h-3 w-3 mr-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {showCheck && (
        <svg className="h-3 w-3 -mr-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12"/>
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

// Displayname для DevTools
ReleaseCardCompact.displayName = 'ReleaseCardCompact';
function PaymentBadge({ paymentStatus, isLight }: { paymentStatus: string | null; isLight: boolean }) {
  const config: Record<string, { text: string; className: string }> = {
    pending: { text: 'Платеж на проверке', className: 'bg-yellow-500/20 text-yellow-500' },
    verified: { text: 'Оплачено', className: 'bg-emerald-500/20 text-emerald-500' },
  };

  const { text, className } = config[paymentStatus || ''] || { text: 'Не оплачено', className: 'bg-red-500/20 text-red-500' };

  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${className}`}>
      {text}
    </span>
  );
}
