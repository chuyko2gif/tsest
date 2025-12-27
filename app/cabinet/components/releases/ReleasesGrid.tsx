"use client";
import React from 'react';
import { Release } from './types';
import { UserRole } from '../../lib/types';
import ReleaseCard, { AddReleaseCard } from './ReleaseCard';

interface ReleasesGridProps {
  releases: Release[];
  userRole?: UserRole;
  showArchive: boolean;
  onReleaseClick: (release: Release) => void;
  onAddRelease: () => void;
  onShowPaymentModal: () => void;
  totalCount: number;
  hasFilters: boolean;
  onResetFilters: () => void;
  onDeleteDraft?: (releaseId: string) => void;
  onDragStart?: (releaseId: string) => void;
  onDragEnd?: () => void;
  draggingReleaseId?: string | null;
  onDragEnter?: (releaseId: string) => void;
  dropTargetId?: string | null;
  onDrop?: (e: React.DragEvent) => void;
}

export default function ReleasesGrid({
  releases,
  userRole,
  showArchive,
  onReleaseClick,
  onAddRelease,
  onShowPaymentModal,
  totalCount,
  hasFilters,
  onResetFilters,
  onDeleteDraft,
  onDragStart,
  onDragEnd,
  draggingReleaseId,
  onDragEnter,
  dropTargetId,
  onDrop
}: ReleasesGridProps) {
  // Вычисляем количество колонок для разных экранов
  const getColumns = () => {
    if (typeof window === 'undefined') return 5;
    const width = window.innerWidth;
    if (width < 640) return 2;  // sm
    if (width < 768) return 3;  // md
    if (width < 1024) return 4; // lg
    return 5;
  };

  const [columns, setColumns] = React.useState(getColumns());

  React.useEffect(() => {
    const handleResize = () => setColumns(getColumns());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Пустое состояние
  if (releases.length === 0) {
    return <EmptyState 
      showArchive={showArchive}
      totalCount={totalCount}
      userRole={userRole}
      hasFilters={hasFilters}
      onAddRelease={onAddRelease}
      onShowPaymentModal={onShowPaymentModal}
      onResetFilters={onResetFilters}
    />;
  }

  return (
    <div 
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4"
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* Карточка добавления релиза */}
      {!showArchive && (
        <>
          {userRole === 'exclusive' && <AddReleaseCard onClick={onAddRelease} />}
          {userRole === 'basic' && <AddReleaseCard onClick={onShowPaymentModal} />}
          {(userRole === 'admin' || userRole === 'owner') && <AddReleaseCard onClick={onAddRelease} />}
        </>
      )}

      {/* Карточки релизов */}
      {releases.map((release, index) => {
        const isDraggingThis = draggingReleaseId === release.id;
        const isTarget = dropTargetId === release.id;
        
        // Пропускаем перетаскиваемый элемент - он будет скрыт через ReleaseCard
        
        return (
          <div 
            key={release.id} 
            className="relative"
            style={{
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transformOrigin: 'center center'
            }}
          >
            {/* Улучшенный Placeholder индикатор */}
            {isTarget && draggingReleaseId && !isDraggingThis && (
              <div className="absolute inset-0 rounded-2xl pointer-events-none z-10 overflow-hidden">
                {/* Анимированная граница */}
                <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-purple-400 bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-sm">
                  {/* Пульсирующее свечение */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400/30 to-transparent animate-pulse" />
                </div>
                
                {/* Индикатор "Вставить сюда" */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl shadow-purple-500/50 flex items-center gap-1 animate-bounce">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M19 14l-7 7m0 0l-7-7m7 7V3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Вставить
                  </div>
                </div>
              </div>
            )}
            
            <ReleaseCard
              release={release}
              onClick={() => onReleaseClick(release)}
              onDelete={onDeleteDraft}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              isDragging={isDraggingThis}
              onDragEnter={onDragEnter}
              isDropTarget={isTarget}
            />
          </div>
        );
      })}
    </div>
  );
}

// Компонент пустого состояния
interface EmptyStateProps {
  showArchive: boolean;
  totalCount: number;
  userRole?: UserRole;
  hasFilters: boolean;
  onAddRelease: () => void;
  onShowPaymentModal: () => void;
  onResetFilters: () => void;
}

function EmptyState({ 
  showArchive, 
  totalCount, 
  userRole, 
  hasFilters, 
  onAddRelease, 
  onShowPaymentModal,
  onResetFilters 
}: EmptyStateProps) {
  const isEmpty = totalCount === 0;

  return (
    <div className="col-span-full flex items-center justify-center py-24">
      <div className="text-center max-w-md">
        {/* Иконка */}
        <div className="relative inline-block mb-6">
          <div className={`absolute inset-0 blur-2xl rounded-full ${isEmpty ? 'bg-gradient-to-br from-purple-500/20 to-blue-500/20' : 'bg-gradient-to-br from-zinc-500/20 to-zinc-600/20'}`} />
          <div className="relative w-32 h-32 mx-auto bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-3xl flex items-center justify-center border border-white/10">
            {isEmpty ? (
              <svg className="w-16 h-16 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
              </svg>
            ) : (
              <svg className="w-16 h-16 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            )}
          </div>
        </div>
        
        {/* Заголовок */}
        <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">
          {showArchive 
            ? 'Архив пуст'
            : isEmpty ? 'Начните свой путь' : 'Ничего не найдено'
          }
        </h3>
        
        {/* Описание */}
        <p className="text-zinc-400 text-sm leading-relaxed mb-6">
          {showArchive
            ? 'В архиве пока нет черновиков. Сохраненные черновики будут отображаться здесь.'
            : isEmpty 
              ? 'У вас пока нет релизов. Создайте свой первый релиз и начните путь к успеху в музыкальной индустрии.'
              : 'По вашему запросу релизов не найдено. Попробуйте изменить параметры поиска или фильтры.'
          }
        </p>
        
        {/* Кнопки действий */}
        {!showArchive && isEmpty && (
          <AddFirstReleaseButton 
            userRole={userRole}
            onAddRelease={onAddRelease}
            onShowPaymentModal={onShowPaymentModal}
          />
        )}
        
        {/* Кнопка сброса фильтров */}
        {hasFilters && !isEmpty && (
          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all duration-300 border border-white/10"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Сбросить фильтры
          </button>
        )}
      </div>
    </div>
  );
}

// Кнопка добавления первого релиза
interface AddFirstReleaseButtonProps {
  userRole?: UserRole;
  onAddRelease: () => void;
  onShowPaymentModal: () => void;
}

function AddFirstReleaseButton({ userRole, onAddRelease, onShowPaymentModal }: AddFirstReleaseButtonProps) {
  const handleClick = () => {
    if (userRole === 'basic') {
      onShowPaymentModal();
    } else {
      onAddRelease();
    }
  };

  if (!userRole) return null;

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      Добавить первый релиз
    </button>
  );
}
