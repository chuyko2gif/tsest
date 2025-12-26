"use client";
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Release } from './types';
import { STATUS_COLORS, formatDate } from './constants';

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
    approved: 'Утвержден',
    rejected: 'Отклонен',
    distributed: 'На дистрибьюции',
    published: 'Опубликован',
    draft: 'Черновик'
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
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms cubic-bezier(0.18, 0.67, 0.6, 1.22)',
    opacity: isSortableDragging && !isOverlay ? 0 : 1,
    transformStyle: 'preserve-3d' as const,
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
        relative group p-4 rounded-2xl border-2
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
      <div className="w-full h-40 rounded-xl overflow-hidden bg-black/20 flex items-center justify-center mb-3">
        {release.cover_url ? (
          <img 
            src={release.cover_url} 
            className="w-full h-full object-cover" 
            alt={release.title}
            draggable="false" 
          />
        ) : (
          <div className="text-3xl">🎵</div>
        )}
      </div>

      {/* Информация */}
      <div className="mb-3">
        <div className="font-bold text-white truncate text-sm">{release.title}</div>
        <div className="text-xs text-zinc-400 truncate">{release.artist_name || release.artist}</div>
      </div>

      {/* Статус и дата */}
      <div className="flex items-center justify-between">
        <div className={`text-[9px] px-2 py-1 rounded-full text-white font-bold ${statusColor}`}>
          {statusLabel}
        </div>
        <div className="text-[10px] text-zinc-400">
          {formatDate(release.date || release.created_at)}
        </div>
      </div>
      
      {/* Индикатор перетаскивания для черновиков */}
      {isDraft && !isOverlay && (
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="p-2 bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-sm rounded-lg border border-purple-400/30 shadow-lg shadow-purple-500/20">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-purple-300">
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-end justify-center pb-4">
          <div className="text-xs font-bold text-white flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeWidth="2"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth="2"/>
            </svg>
            Редактировать
          </div>
        </div>
      )}
    </div>
  );
}
