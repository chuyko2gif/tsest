"use client";
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Release } from './types';
import { STATUS_COLORS, formatDate } from './constants';
import { CoverImage } from '@/components/ui/CoverImage';

interface SortableReleaseCardProps {
  release: Release;
  onClick: () => void;
  isDragging?: boolean;
  isOverlay?: boolean;
}

export function SortableReleaseCard({ 
  release, 
  onClick, 
  isDragging,
  isOverlay = false 
}: SortableReleaseCardProps) {
  const statusColor = STATUS_COLORS[release.status] || 'bg-zinc-500';
  const isDraft = release.status === 'draft';
  
  const statusLabel = {
    pending: 'На модерации',
    rejected: 'Отклонён',
    approved: 'Одобрен',
    published: 'Выложен',
    distributed: 'Распространён',
    draft: 'Черновик',
    awaiting_payment: 'Ожидает оплаты'
  }[release.status] || release.status;

  // Настройка sortable только для черновиков
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: release.id,
    disabled: !isDraft || isOverlay,
  });

  // Стили для трансформации
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms cubic-bezier(0.18, 0.67, 0.6, 1.22)',
    opacity: isSortableDragging && !isOverlay ? 0 : 1,
    transformStyle: 'preserve-3d' as const,
    // Важно для touch-устройств: отключаем браузерный scroll/pan во время drag
    touchAction: isDraft ? 'none' : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        // Предотвращаем клик если это drag
        if (isSortableDragging) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        onClick();
      }}
      className={`
        relative group p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 w-full
        ${isDraft ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
        ${isOverlay 
          ? 'bg-white/10 border-purple-400 shadow-2xl shadow-purple-500/50 scale-105 rotate-2' 
          : 'bg-white/5 border-white/10'
        }
        ${!isOverlay && !isSortableDragging && 'hover:scale-[1.03] hover:shadow-xl hover:shadow-purple-500/20 hover:border-purple-500/30'}
        transition-all duration-200 ease-out
      `}
    >
      {/* Эффект "поднятия" при перетаскивании */}
      {isOverlay && (
        <div className="absolute -inset-2 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-2xl blur-xl -z-10" />
      )}

      {/* Обложка */}
      <div className="w-full aspect-square rounded-lg sm:rounded-xl overflow-hidden bg-black/20 flex items-center justify-center mb-2 sm:mb-3">
        {release.cover_url ? (
          <CoverImage 
            src={release.cover_url} 
            className="w-full h-full" 
            alt={release.title}
            fallbackIcon={<div className="text-2xl sm:text-3xl">🎵</div>}
          />
        ) : (
          <div className="text-2xl sm:text-3xl">🎵</div>
        )}
      </div>

      {/* Информация */}
      <div className="mb-2 sm:mb-3">
        <div className="font-bold text-white truncate text-xs sm:text-sm">{release.title}</div>
        <div className="text-[10px] sm:text-xs text-zinc-400 truncate">{release.artist_name || release.artist}</div>
      </div>

      {/* Статус и дата */}
      <div className="flex items-center justify-between gap-1 sm:gap-2">
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink min-w-0">
          <div className={`text-[9px] px-1.5 sm:px-2 py-1 rounded-full text-white font-bold whitespace-nowrap flex-shrink-0 ${statusColor}`}>
            {statusLabel}
          </div>
          {/* Бейдж "Оплачено" для оплаченных черновиков - справа от статуса */}
          {isDraft && release.is_paid && (
            <div className="flex items-center gap-0.5 text-[9px] px-1 sm:px-1.5 py-1 rounded-full font-medium bg-gradient-to-r from-emerald-500/25 to-teal-500/25 text-emerald-300 border border-emerald-400/40 shadow-sm shadow-emerald-500/20 flex-shrink-0">
              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}
        </div>
        <div className="text-[9px] sm:text-[10px] text-zinc-400 whitespace-nowrap flex-shrink-0">
          {formatDate(release.date || release.created_at)}
        </div>
      </div>
      
      {/* Индикатор перетаскивания для черновиков */}
      {isDraft && !isOverlay && (
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="p-1.5 sm:p-2 bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-sm rounded-lg border border-purple-400/30 shadow-lg shadow-purple-500/20">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-purple-300 sm:w-4 sm:h-4">
              <circle cx="9" cy="5" r="1" fill="currentColor"/>
              <circle cx="9" cy="12" r="1" fill="currentColor"/>
              <circle cx="9" cy="19" r="1" fill="currentColor"/>
              <circle cx="15" cy="5" r="1" fill="currentColor"/>
              <circle cx="15" cy="12" r="1" fill="currentColor"/>
              <circle cx="15" cy="19" r="1" fill="currentColor"/>
            </svg>
          </div>
        </div>
      )}

      {/* Индикатор редактирования для pending релизов */}
      {release.status === 'pending' && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl sm:rounded-2xl flex items-end justify-center pb-3 sm:pb-4">
          <div 
            className="text-[10px] sm:text-xs font-bold flex items-center gap-1"
            style={{ color: '#ffffff' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" className="sm:w-3.5 sm:h-3.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Редактировать
          </div>
        </div>
      )}

      {/* Индикатор оплаты для awaiting_payment релизов */}
      {release.status === 'awaiting_payment' && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl sm:rounded-2xl flex items-end justify-center pb-3 sm:pb-4">
          <div className="text-[10px] sm:text-xs font-bold text-orange-400 flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-3.5 sm:h-3.5">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            Оплатить
          </div>
        </div>
      )}
    </div>
  );
}
