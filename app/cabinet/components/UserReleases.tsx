"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserRole } from '../lib/types';
import {
  Release,
  FilterState,
  useReleases,
  useFilteredReleases,
  ReleaseDetailView,
  ReleasesFilters,
  ReleasesGrid,
  ReleasesHeader,
  PaymentModal,
  CopyToast,
  DraggableReleasesGrid
} from './releases';

interface UserReleasesProps {
  userId?: string | null;
  nickname?: string;
  onOpenUpload?: () => void;
  userRole?: UserRole;
  showNotification?: (message: string, type: 'success' | 'error') => void;
}

export default function UserReleases({ userId, nickname, onOpenUpload, userRole, showNotification }: UserReleasesProps) {
  // Загрузка релизов
  const { releases, loading, tracksMap, setTracksMap, reloadReleases } = useReleases(userId);
  
  // Восстанавливаем состояние архива из localStorage
  const [initialShowArchive] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('showArchive');
      return saved === 'true';
    }
    return false;
  });
  
  // Состояние фильтров
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    filterStatus: 'all',
    filterGenre: 'all',
    sortBy: 'date',
    order: 'desc',
    showArchive: initialShowArchive
  });
  
  // UI состояние
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [isDraggingDraft, setIsDraggingDraft] = useState(false);
  const [draggingReleaseId, setDraggingReleaseId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<Release | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Фильтрованные релизы
  const displayReleases = useFilteredReleases(releases, filters);
  // Убираем перетаскиваемый элемент из отображения
  const filteredReleases = isDraggingDraft && draggingReleaseId
    ? displayReleases.filter(r => r.id !== draggingReleaseId)
    : displayReleases;

  // Сохраняем состояние архива в localStorage при изменении
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('showArchive', filters.showArchive.toString());
    }
  }, [filters.showArchive]);

  // Обработчик клика по релизу
  const handleReleaseClick = async (release: Release) => {
    // Релизы на модерации и черновики можно редактировать
    if (release.status === 'pending' || release.status === 'draft') {
      const editPath = release.release_type === 'basic' 
        ? `/cabinet/release-basic/edit/${release.id}${release.status === 'draft' ? '?draft=true' : ''}`
        : `/cabinet/release/edit/${release.id}${release.status === 'draft' ? '?draft=true' : ''}`;
      console.log('Redirecting to edit page:', editPath);
      console.log('Release type:', release.release_type);
      console.log('Release status:', release.status);
      window.location.href = editPath;
      return;
    }
    
    // Для всех остальных статусов показываем информацию
    setSelectedRelease(release);
    
    // Загружаем треки если есть
    if (!tracksMap[release.id] && release.tracks && Array.isArray(release.tracks)) {
      setTracksMap(prev => ({ ...prev, [release.id]: release.tracks || [] }));
    }
  };

  // Обработчик удаления черновика
  const handleDeleteDraft = async (releaseId: string) => {
    if (!supabase) return;
    
    try {
      const release = releases.find(r => r.id === releaseId);
      if (!release) return;

      const tableName = release.release_type === 'basic' ? 'releases_basic' : 'releases_exclusive';
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', releaseId);

      if (error) throw error;

      // Показываем уведомление
      setShowCopyToast(true);
      setTimeout(() => setShowCopyToast(false), 2000);
      
      // Обновляем данные без перезагрузки
      await reloadReleases();
    } catch (error) {
      console.error('Ошибка при удалении черновика:', error);
      alert('Не удалось удалить черновик');
    }
  };

  // Обработчики drag & drop
  const handleDragStart = (releaseId: string) => {
    setIsDraggingDraft(true);
    setDraggingReleaseId(releaseId);
  };

  const handleDragEnd = async () => {
    // Просто сбрасываем все состояния
    setIsDraggingDraft(false);
    setDraggingReleaseId(null);
    setDropTargetId(null);
  };

  // Функция для сохранения порядка в БД
  const reorderDraftInDatabase = async (releaseId: string, newPosition: number, releaseType: 'basic' | 'exclusive') => {
    if (!supabase) return false;
    
    try {
      const { error } = await supabase.rpc('reorder_draft_release', {
        p_release_id: releaseId,
        p_new_position: newPosition,
        p_table_name: releaseType
      });

      if (error) {
        console.error('Ошибка сохранения порядка:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Ошибка при перестановке:', error);
      return false;
    }
  };

  const handleDragEnter = (targetReleaseId: string) => {
    if (!draggingReleaseId || draggingReleaseId === targetReleaseId) return;
    
    // Устанавливаем целевую позицию с throttling
    requestAnimationFrame(() => {
      setDropTargetId(targetReleaseId);
    });
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    
    if (!draggingReleaseId || !dropTargetId || draggingReleaseId === dropTargetId) {
      handleDragEnd();
      return;
    }

    const draggedRelease = releases.find(r => r.id === draggingReleaseId);
    const targetRelease = releases.find(r => r.id === dropTargetId);

    if (!draggedRelease || !targetRelease || draggedRelease.status !== 'draft' || !draggedRelease.release_type) {
      handleDragEnd();
      return;
    }

    // Вычисляем новую позицию
    const draftReleases = releases.filter(r => r.status === 'draft');
    const targetIndex = draftReleases.findIndex(r => r.id === dropTargetId);
    const newPosition = targetIndex + 1; // draft_order начинается с 1

    // Сохраняем в базу
    const success = await reorderDraftInDatabase(
      draggingReleaseId,
      newPosition,
      draggedRelease.release_type as 'basic' | 'exclusive'
    );

    if (success) {
      // Обновляем данные без перезагрузки
      await reloadReleases();
    }

    handleDragEnd();
  };
  
  const confirmDeleteDraft = async () => {
    if (!draftToDelete || !supabase) return;
    
    setIsDeleting(true);
    try {
      const tableName = draftToDelete.release_type === 'basic' ? 'releases_basic' : 'releases_exclusive';
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', draftToDelete.id);

      if (error) throw error;

      // Закрываем модалку и обновляем данные
      setShowDeleteModal(false);
      setDraftToDelete(null);
      setIsDeleting(false);
      
      // Обновляем список релизов
      await reloadReleases();
    } catch (error) {
      console.error('Ошибка при удалении черновика:', error);
      alert('Не удалось удалить черновик');
      setIsDeleting(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Обработчик добавления релиза
  const handleAddRelease = () => {
    // Проверяем количество черновиков
    const draftsCount = releases.filter(r => r.status === 'draft').length;
    if (draftsCount >= 10) {
      if (showNotification) {
        showNotification('Достигнут лимит черновиков (10). Удалите или опубликуйте существующие черновики', 'error');
      }
      return;
    }
    if (onOpenUpload) onOpenUpload();
  };

  // Сброс фильтров
  const handleResetFilters = () => {
    setFilters(prev => ({
      ...prev,
      searchQuery: '',
      filterStatus: 'all',
      filterGenre: 'all'
    }));
  };

  // Проверка наличия активных фильтров
  const hasFilters = filters.searchQuery !== '' || 
                     filters.filterStatus !== 'all' || 
                     filters.filterGenre !== 'all';

  if (loading) {
    return <div className="text-zinc-600">Загрузка релизов...</div>;
  }

  return (
    <div className="w-full">
      {/* Детальный просмотр релиза */}
      {selectedRelease && selectedRelease.status !== 'pending' ? (
        <ReleaseDetailView
          release={selectedRelease}
          onBack={() => setSelectedRelease(null)}
          showCopyToast={showCopyToast}
          setShowCopyToast={setShowCopyToast}
        />
      ) : (
        <div>
          {/* Заголовок и фильтры */}
          <div className="flex flex-col lg:flex-row gap-6 mb-6">
            <div className="flex-1">
              <ReleasesHeader
                showArchive={filters.showArchive}
                setShowArchive={(show) => setFilters(prev => ({ ...prev, showArchive: show }))}
                releases={releases}
                filteredCount={filteredReleases.length}
              />
            </div>
            
            <ReleasesFilters
              filters={filters}
              setFilters={setFilters}
              releases={releases}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              totalCount={releases.length}
              filteredCount={filteredReleases.length}
            />
          </div>

          {/* Сетка релизов */}
          {filters.showArchive ? (
            // Используем новую drag & drop сетку для черновиков
            <DraggableReleasesGrid
              releases={filteredReleases}
              userRole={userRole}
              showArchive={filters.showArchive}
              onReleaseClick={handleReleaseClick}
              onAddRelease={handleAddRelease}
              onShowPaymentModal={() => setShowPaymentModal(true)}
              onDeleteDraft={async (releaseId) => {
                const release = releases.find(r => r.id === releaseId);
                if (release) {
                  const tableName = release.release_type === 'basic' ? 'releases_basic' : 'releases_exclusive';
                  const { error } = await supabase!
                    .from(tableName)
                    .delete()
                    .eq('id', releaseId);
                  
                  if (!error) {
                    // Обновляем список релизов без перезагрузки
                    await reloadReleases();
                  }
                }
              }}
              onReorderDrafts={reorderDraftInDatabase}
            />
          ) : (
            // Стандартная сетка для не-черновиков
            <ReleasesGrid
              releases={filteredReleases}
              userRole={userRole}
              showArchive={filters.showArchive}
              onReleaseClick={handleReleaseClick}
              onAddRelease={handleAddRelease}
              onShowPaymentModal={() => setShowPaymentModal(true)}
              onDragEnter={handleDragEnter}
              dropTargetId={dropTargetId}
              totalCount={releases.length}
              hasFilters={hasFilters}
              onResetFilters={handleResetFilters}
              onDeleteDraft={handleDeleteDraft}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              draggingReleaseId={draggingReleaseId}
              onDrop={handleDrop}
            />
          )}

          {/* Модальное окно оплаты */}
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            userId={userId}
          />
          
          {/* Модальное окно подтверждения удаления */}
          {showDeleteModal && draftToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-red-500/20 animate-scale-in">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-red-500/20 rounded-xl">
                    <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Удалить черновик?</h3>
                    <p className="text-sm text-zinc-400 mt-1">Это действие необратимо</p>
                  </div>
                </div>
                
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
                  <div className="flex gap-3">
                    {draftToDelete.cover_url && (
                      <img src={draftToDelete.cover_url} className="w-16 h-16 rounded-lg object-cover" alt="" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white truncate">{draftToDelete.title || 'Без названия'}</div>
                      <div className="text-sm text-zinc-400 truncate">{draftToDelete.artist || 'Неизвестный артист'}</div>
                      <div className="text-xs text-zinc-500 mt-1">
                        {draftToDelete.release_type === 'basic' ? '🎵 Базовый' : '👑 Эксклюзив'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDraftToDelete(null);
                    }}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl font-medium text-white hover:bg-white/10 transition-all disabled:opacity-50"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={confirmDeleteDraft}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-3 bg-red-500 border border-red-600 rounded-xl font-bold text-white hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isDeleting ? (
                      <>
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Удаление...
                      </>
                    ) : (
                      'Удалить'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Toast уведомление */}
      <CopyToast show={showCopyToast} />
    </div>
  );
}
