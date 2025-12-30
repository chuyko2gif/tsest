"use client";
import React, { useState, useRef } from 'react';
import { Release } from './types';
import { STATUS_COLORS, formatDate } from './constants';

interface ReleaseCardProps {
  release: Release;
  onClick: () => void;
  onDelete?: (releaseId: string) => void;
  onDragStart?: (releaseId: string) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  onDragEnter?: (releaseId: string) => void;
  isDropTarget?: boolean;
}

export default function ReleaseCard({ release, onClick, onDelete, onDragStart, onDragEnd, isDragging, onDragEnter, isDropTarget }: ReleaseCardProps) {
  const statusColor = STATUS_COLORS[release.status] || 'bg-zinc-500';
  const isDraft = release.status === 'draft';
  const canDrag = isDraft;
  const lastEnterTimeRef = useRef<number>(0);
  const [isDragStarting, setIsDragStarting] = useState(false);
  
  const statusLabel = {
    pending: 'На модерации',
    approved: 'Утвержден',
    rejected: 'Отклонен',
    distributed: 'На дистрибьюции',
    published: 'Опубликован',
    draft: 'Черновик'
  }[release.status] || release.status;

  // Кружок для статуса
  const getStatusDot = () => {
    const colors = {
      pending: 'bg-yellow-400',
      distributed: 'bg-blue-400',
      published: 'bg-green-400',
      rejected: 'bg-red-400',
      draft: 'bg-zinc-400'
    };
    return colors[release.status as keyof typeof colors] || 'bg-zinc-400';
  };

  const shouldAnimate = release.status === 'pending' || release.status === 'distributed';

  const dragImageRef = React.useRef<HTMLElement | null>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);

  return (
    <div 
      ref={cardRef}
      draggable={canDrag}
      onDragStart={(e) => {
        if (canDrag) {
          setIsDragStarting(true);
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('releaseId', release.id);
          
          // Создаем улучшенное кастомное изображение для перетаскивания
          const card = e.currentTarget as HTMLElement;
          const dragImage = card.cloneNode(true) as HTMLElement;
          
          // Стили для drag preview - как на мобильных устройствах
          dragImage.style.position = 'fixed';
          dragImage.style.top = '-9999px';
          dragImage.style.left = '-9999px';
          dragImage.style.width = card.offsetWidth + 'px';
          dragImage.style.height = card.offsetHeight + 'px';
          dragImage.style.opacity = '0.95';
          dragImage.style.transform = 'rotate(3deg) scale(1.1)';
          dragImage.style.pointerEvents = 'none';
          dragImage.style.zIndex = '10000';
          dragImage.style.borderRadius = '1rem';
          dragImage.style.border = '2px solid rgba(168, 85, 247, 0.6)';
          dragImage.style.boxShadow = `
            0 25px 50px -12px rgba(168, 85, 247, 0.8),
            0 0 0 1px rgba(168, 85, 247, 0.4),
            0 0 30px rgba(168, 85, 247, 0.6),
            inset 0 2px 4px rgba(255, 255, 255, 0.2)
          `;
          dragImage.style.filter = 'brightness(1.2) saturate(1.2)';
          dragImage.style.backdropFilter = 'blur(10px)';
          
          document.body.appendChild(dragImage);
          dragImageRef.current = dragImage;
          
          // Устанавливаем изображение перетаскивания с центрированием
          try {
            const rect = card.getBoundingClientRect();
            e.dataTransfer.setDragImage(
              dragImage, 
              rect.width / 2, 
              rect.height / 2
            );
          } catch (error) {
            console.warn('Drag image setup failed:', error);
          }
          
          // Запускаем onDragStart немного позже для плавности
          requestAnimationFrame(() => {
            onDragStart?.(release.id);
            setTimeout(() => setIsDragStarting(false), 50);
          });
        }
      }}
      onDragEnd={() => {
        if (canDrag) {
          setIsDragStarting(false);
          // Удаляем drag image с небольшой задержкой для плавности
          setTimeout(() => {
            if (dragImageRef.current && document.body.contains(dragImageRef.current)) {
              document.body.removeChild(dragImageRef.current);
              dragImageRef.current = null;
            }
          }, 100);
          onDragEnd?.();
        }
      }}
      onDragEnter={(e) => {
        if (!isDragging && !isDragStarting) {
          e.preventDefault();
          // Throttle для производительности: не чаще раза в 50ms
          const now = Date.now();
          if (now - lastEnterTimeRef.current > 50) {
            lastEnterTimeRef.current = now;
            onDragEnter?.(release.id);
          }
        }
      }}
      onDragOver={(e) => {
        if (!isDragging) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }
      }}
      className={`relative group p-3 sm:p-4 glass-morphism-card glass-card-hover interactive-glass rounded-xl sm:rounded-2xl overflow-hidden ${
        isDraft ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      } ${
        isDragging ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-100 scale-100'
      } ${
        isDropTarget && !isDragging
          ? 'ring-2 ring-purple-400 bg-purple-500/10 scale-[0.95] glow-element'
          : !isDragging ? 'hover:scale-[1.03] hover:shadow-xl hover:shadow-purple-500/20 hover:border-purple-500/30' : ''
      }`}
      style={{
        transition: isDragging 
          ? 'opacity 0.15s ease-out, transform 0.15s ease-out' 
          : 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transformStyle: 'preserve-3d',
        willChange: isDragging ? 'transform, opacity' : 'auto'
      }}
      onClick={(e) => {
        // Предотвращаем клик при перетаскивании
        if (isDragging || isDragStarting) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        onClick();
      }}
    >
      {/* Фоновые эффекты для красоты */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 via-transparent to-pink-400/5 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
      
      {/* Обложка с улучшенными эффектами */}
      <div className="w-full h-32 sm:h-40 rounded-lg sm:rounded-xl overflow-hidden bg-black/20 flex items-center justify-center relative group/cover">
        {release.cover_url ? (
          <img 
            src={release.cover_url} 
            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110" 
            alt="" 
            draggable="false" 
          />
        ) : (
          <div className="text-2xl sm:text-3xl transition-all duration-300 group-hover:scale-125">🎵</div>
        )}
        {/* Overlay при наведении на обложку */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Информация с анимационными эффектами */}
      <div className="mt-2 sm:mt-3 relative">
        <div className="font-bold text-white truncate text-sm sm:text-base transition-all duration-300 group-hover:text-purple-300">
          {release.title}
        </div>
        <div className="text-xs sm:text-sm text-zinc-400 truncate transition-colors duration-300 group-hover:text-zinc-300">
          {release.artist_name || release.artist}
        </div>
      </div>

      {/* Статус и дата с улучшенным стилем */}
      <div className="mt-2 sm:mt-3">
        <div className={`text-[8px] sm:text-[9px] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-white font-bold flex items-center gap-1 sm:gap-1.5 w-fit transition-all duration-300 group-hover:scale-105 ${statusColor}`}>
          {shouldAnimate ? (
            <svg className="animate-spin h-2.5 w-2.5 sm:h-3 sm:w-3" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full transition-all duration-300 ${getStatusDot()}`}></span>
          )}
          <span className="hidden sm:inline">{statusLabel}</span>
          <span className="inline sm:hidden truncate max-w-[60px]">{statusLabel.slice(0, 6)}</span>
        </div>
      </div>
      
      {/* Индикатор редактирования для pending релизов с улучшенной анимацией */}
      {release.status === 'pending' && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-xl sm:rounded-2xl flex items-end justify-center pb-3 sm:pb-4">
          <div className="text-[10px] sm:text-xs font-bold text-white flex items-center gap-1 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="transition-all duration-300 group-hover:text-purple-300">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeWidth="2"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth="2"/>
            </svg>
            Редактировать
          </div>
        </div>
      )}
      
      {/* Индикатор перетаскивания для черновиков */}
      {isDraft && (
        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
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

    </div>
  );
}

// Карточка добавления релиза
interface AddReleaseCardProps {
  onClick: () => void;
}

export function AddReleaseCard({ onClick }: AddReleaseCardProps) {
  return (
    <div 
      className={`relative group p-3 sm:p-4 glass-morphism-card rounded-xl sm:rounded-2xl cursor-pointer hover:scale-[1.03] hover:shadow-xl hover:shadow-purple-500/30 hover:border-purple-500/30 transition-all duration-200 ease-out`}
      onClick={onClick}
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px'
      }}
    >
      {/* Обложка */}
      <div className="w-full h-32 sm:h-40 rounded-lg sm:rounded-xl overflow-hidden bg-black/20 flex items-center justify-center">
        <div className="text-2xl sm:text-3xl">＋</div>
      </div>

      {/* Информация */}
      <div className="mt-2 sm:mt-3 text-center">
        <div className="font-bold text-white text-sm sm:text-base">Добавить релиз</div>
        <div className="text-xs sm:text-sm text-zinc-400 truncate" style={{ visibility: 'hidden' }}>.</div>
      </div>

      {/* Статус и дата */}
      <div className="mt-2 sm:mt-3 flex items-center justify-between">
        <div className={`text-[8px] sm:text-[9px] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-white font-bold bg-zinc-500`} style={{ visibility: 'hidden' }}>
          .
        </div>
        <div className="text-[9px] sm:text-[11px] text-zinc-400" style={{ visibility: 'hidden' }}>
          .
        </div>
      </div>
    </div>
  );
}
