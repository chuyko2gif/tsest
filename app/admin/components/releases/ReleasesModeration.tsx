'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { SupabaseClient } from '@supabase/supabase-js';
import AdminCreateRelease from './AdminCreateRelease';
import { useTheme } from '@/contexts/ThemeContext';
import { showSuccessToast, showErrorToast } from '@/lib/utils/showToast';

// Хуки
import { useReleases, useFilteredReleases } from './hooks/useReleases';

// Компоненты
import { ReleasesHeader, SearchAndFilters, ReleasesList } from './components';
import BulkActionsBar from './moderation/BulkActionsBar';
import DeleteConfirmModal from './moderation/DeleteConfirmModal';
import ReleaseDetailModal from './moderation/ReleaseDetailModal';

// Типы
import { Release } from './types';

interface ReleasesModerationProps {
  supabase: SupabaseClient;
}

export default function ReleasesModeration({ supabase }: ReleasesModerationProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  
  // Состояния режимов и фильтров
  const [viewMode, setViewMode] = useState<'moderation' | 'archive' | 'create'>('moderation');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterUserRole, setFilterUserRole] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'artist'>('date');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  
  // Состояния для модального окна
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Массовые операции
  const [selectedReleaseIds, setSelectedReleaseIds] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Удаление
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState<'single' | 'bulk'>('single');
  const [deleteCount, setDeleteCount] = useState(0);
  
  // Portal состояние
  const [mounted, setMounted] = useState(false);

  // Хуки для данных
  const { releases, loading, loadReleases, loadFullRelease } = useReleases(supabase);
  
  // Фильтрованные релизы
  const filteredReleases = useFilteredReleases(releases, {
    viewMode,
    statusFilter,
    searchQuery,
    filterDate,
    filterUserRole,
    sortBy,
    order
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (showModal || showDeleteConfirm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal, showDeleteConfirm]);

  useEffect(() => {
    setSelectedReleaseIds([]);
  }, [viewMode]);

  // Открытие модального окна
  const handleViewRelease = useCallback(async (releaseId: string, releaseType: 'basic' | 'exclusive') => {
    const release = await loadFullRelease(releaseId, releaseType);
    if (release) {
      setSelectedRelease(release);
      setShowModal(true);
    }
  }, [loadFullRelease]);

  // Утверждение релиза
  const handleApprove = useCallback(async () => {
    if (!supabase || !selectedRelease) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const tableName = selectedRelease.release_type === 'basic' ? 'releases_basic' : 'releases_exclusive';
      
      const { error } = await supabase
        .from(tableName)
        .update({ 
          status: 'distributed',
          approved_at: new Date().toISOString(),
          approved_by: user.id
        })
        .eq('id', selectedRelease.id);
      
      if (error) throw error;
      
      showSuccessToast('Релиз успешно утверждён!');
      setShowModal(false);
      setSelectedRelease(null);
      loadReleases();
    } catch (error: any) {
      console.error('Ошибка утверждения:', error);
      showErrorToast(`Ошибка: ${error.message || 'Неизвестная ошибка'}`);
    }
  }, [supabase, selectedRelease, loadReleases]);

  // Отклонение релиза
  const handleReject = useCallback(async () => {
    if (!supabase || !selectedRelease || !rejectionReason.trim()) {
      alert('Укажите причину отклонения');
      return;
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const functionName = selectedRelease.release_type === 'basic' 
        ? 'reject_basic_release' 
        : 'reject_exclusive_release';

      const { error } = await supabase.rpc(functionName, {
        release_id: selectedRelease.id,
        admin_id: user.id,
        reason: rejectionReason
      });
      
      if (error) throw error;
      
      showSuccessToast('Релиз отклонён');
      setShowModal(false);
      setSelectedRelease(null);
      setRejectionReason('');
      loadReleases();
    } catch (error) {
      console.error('Ошибка отклонения:', error);
      showErrorToast('Ошибка при отклонении релиза');
    }
  }, [supabase, selectedRelease, rejectionReason, loadReleases]);

  // Удаление релиза
  const handleDeleteRelease = useCallback(() => {
    if (!selectedRelease) return;
    setDeleteType('single');
    setDeleteCount(1);
    setShowDeleteConfirm(true);
  }, [selectedRelease]);

  const confirmDeleteRelease = useCallback(async () => {
    if (!supabase || !selectedRelease) return;
    
    setShowDeleteConfirm(false);
    
    try {
      const tableName = selectedRelease.release_type === 'basic' ? 'releases_basic' : 'releases_exclusive';
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', selectedRelease.id);
      
      if (error) throw error;
      
      showSuccessToast('Релиз удалён');
      setShowModal(false);
      setSelectedRelease(null);
      loadReleases();
    } catch (error) {
      console.error('Ошибка удаления:', error);
      showErrorToast('Ошибка при удалении');
    }
  }, [supabase, selectedRelease, loadReleases]);

  // Массовые операции
  const toggleSelectAll = useCallback(() => {
    if (selectedReleaseIds.length === filteredReleases.length) {
      setSelectedReleaseIds([]);
    } else {
      setSelectedReleaseIds(filteredReleases.map(r => r.id));
    }
  }, [selectedReleaseIds.length, filteredReleases]);

  const toggleSelectRelease = useCallback((releaseId: string) => {
    setSelectedReleaseIds(prev => 
      prev.includes(releaseId) 
        ? prev.filter(id => id !== releaseId)
        : [...prev, releaseId]
    );
  }, []);

  const handleBulkPublish = useCallback(async () => {
    if (!supabase || selectedReleaseIds.length === 0) return;
    if (!confirm(`Опубликовать ${selectedReleaseIds.length} релизов?`)) return;
    
    setIsPublishing(true);
    try {
      const updatePromises = selectedReleaseIds.map(async releaseId => {
        const release = releases.find(r => r.id === releaseId);
        if (!release) return;
        
        const tableName = release.release_type === 'basic' ? 'releases_basic' : 'releases_exclusive';
        
        const { error } = await supabase
          .from(tableName)
          .update({ status: 'published' })
          .eq('id', releaseId);
        
        if (error) throw error;
      });
      
      await Promise.all(updatePromises);
      
      showSuccessToast(`Опубликовано: ${selectedReleaseIds.length} релизов`);
      setSelectedReleaseIds([]);
      loadReleases();
    } catch (error) {
      console.error('Ошибка публикации:', error);
      showErrorToast('Ошибка при публикации');
    } finally {
      setIsPublishing(false);
    }
  }, [supabase, selectedReleaseIds, releases, loadReleases]);

  const handleBulkDelete = useCallback(() => {
    if (selectedReleaseIds.length === 0) return;
    setDeleteType('bulk');
    setDeleteCount(selectedReleaseIds.length);
    setShowDeleteConfirm(true);
  }, [selectedReleaseIds.length]);

  const confirmBulkDelete = useCallback(async () => {
    if (!supabase || selectedReleaseIds.length === 0) return;
    
    setShowDeleteConfirm(false);
    setIsPublishing(true);
    
    try {
      const deletePromises = selectedReleaseIds.map(async releaseId => {
        const release = releases.find(r => r.id === releaseId);
        if (!release) return;
        
        const tableName = release.release_type === 'basic' ? 'releases_basic' : 'releases_exclusive';
        
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('id', releaseId);
        
        if (error) throw error;
      });
      
      await Promise.all(deletePromises);
      
      showSuccessToast(`Удалено: ${selectedReleaseIds.length} релизов`);
      setSelectedReleaseIds([]);
      loadReleases();
    } catch (error) {
      console.error('Ошибка удаления:', error);
      showErrorToast('Ошибка при удалении');
    } finally {
      setIsPublishing(false);
    }
  }, [supabase, selectedReleaseIds, releases, loadReleases]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-zinc-500 animate-pulse">Загрузка...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Заголовок и фильтры */}
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 mb-4 sm:mb-6">
        <ReleasesHeader
          viewMode={viewMode}
          setViewMode={setViewMode}
          setStatusFilter={setStatusFilter}
          totalCount={releases.length}
          filteredCount={filteredReleases.length}
        />
        
        <SearchAndFilters
          viewMode={viewMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          filterUserRole={filterUserRole}
          setFilterUserRole={setFilterUserRole}
          filterDate={filterDate}
          setFilterDate={setFilterDate}
          loading={loading}
          onRefresh={loadReleases}
        />
      </div>

      {/* Контент */}
      {viewMode === 'create' ? (
        <AdminCreateRelease 
          supabase={supabase} 
          onSuccess={() => {
            setViewMode('archive');
            loadReleases();
          }}
          onCancel={() => setViewMode('moderation')}
        />
      ) : (
        <>
          {/* Панель массовых действий */}
          {viewMode === 'archive' && (
            <BulkActionsBar
              totalCount={filteredReleases.length}
              selectedCount={selectedReleaseIds.length}
              onSelectAll={toggleSelectAll}
              onPublish={handleBulkPublish}
              onDelete={handleBulkDelete}
              isPublishing={isPublishing}
            />
          )}

          {/* Список релизов */}
          <ReleasesList
            releases={filteredReleases}
            viewMode={viewMode}
            selectedIds={selectedReleaseIds}
            onSelectRelease={toggleSelectRelease}
            onViewRelease={handleViewRelease}
          />
        </>
      )}

      {/* Модальное окно подтверждения удаления */}
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={deleteType === 'single' ? confirmDeleteRelease : confirmBulkDelete}
        count={deleteCount}
        type={deleteType}
      />

      {/* Модальное окно детали релиза - будет реализовано отдельно */}
      {showModal && selectedRelease && mounted && createPortal(
        <ReleaseDetailModal
          release={selectedRelease}
          supabase={supabase}
          onClose={() => {
            setShowModal(false);
            setSelectedRelease(null);
          }}
          onApprove={handleApprove}
          onReject={handleReject}
          onDelete={handleDeleteRelease}
          rejectionReason={rejectionReason}
          setRejectionReason={setRejectionReason}
          onRefresh={() => {
            if (selectedRelease) {
              handleViewRelease(selectedRelease.id, selectedRelease.release_type);
            }
            loadReleases();
          }}
        />,
        document.body
      )}
    </div>
  );
}
