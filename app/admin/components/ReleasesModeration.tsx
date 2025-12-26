"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { SupabaseClient } from '@supabase/supabase-js';

interface Release {
  id: string;
  created_at: string;
  release_type: 'basic' | 'exclusive';
  title: string;
  artist_name: string;
  cover_url: string;
  genre: string;
  status: string;
  payment_status: string | null;
  payment_receipt_url: string | null;
  payment_amount: number | null;
  user_email: string;
  user_name: string;
  user_avatar?: string;
  user_nickname?: string;
  tracks_count: number;
  user_role: 'basic' | 'exclusive';
}

interface ReleasesModerationProps {
  supabase: SupabaseClient;
}

export default function ReleasesModeration({ supabase }: ReleasesModerationProps) {
  const router = useRouter();
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRelease, setSelectedRelease] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [viewMode, setViewMode] = useState<'moderation' | 'archive'>('moderation'); // Новый стейт для переключения между модерацией и архивом
  
  // Новые состояния для поиска и фильтрации
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGenre, setFilterGenre] = useState<string>('all');
  const [filterUserRole, setFilterUserRole] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'artist'>('date');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  
  // Состояния для массового выбора в архиве
  const [selectedReleaseIds, setSelectedReleaseIds] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Toast уведомления
  const [toast, setToast] = useState<{show: boolean, message: string, type: 'success' | 'error' | 'info'}>({show: false, message: '', type: 'success'});
  
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({show: true, message, type});
    setTimeout(() => setToast({show: false, message: '', type: 'success'}), 5000);
  };
  
  // Состояния для ISRC кодов треков и UPC кода релиза
  const [editingTrackISRC, setEditingTrackISRC] = useState<{trackIndex: number, isrc: string} | null>(null);
  const [savingISRC, setSavingISRC] = useState(false);
  
  // Состояние для редактирования имени артиста
  const [editingArtistName, setEditingArtistName] = useState(false);
  const [artistNameInput, setArtistNameInput] = useState('');
  const [savingArtistName, setSavingArtistName] = useState(false);
  
  // Состояние для редактирования UPC кода релиза
  const [editingReleaseUPC, setEditingReleaseUPC] = useState(false);
  const [releaseUPCInput, setReleaseUPCInput] = useState('');
  const [savingReleaseUPC, setSavingReleaseUPC] = useState(false);

  useEffect(() => {
    loadReleases();
  }, [statusFilter, viewMode]); // Перезагружать при изменении фильтра или режима
  
  // Сбрасывать выбор при смене режима
  useEffect(() => {
    setSelectedReleaseIds([]);
  }, [viewMode]);

  const loadReleases = async () => {
    if (!supabase) return;
    
    setLoading(true);
    try {
      console.log('Loading releases with filter:', statusFilter, 'viewMode:', viewMode);
      
      // Загружаем релизы из обеих таблиц
      let query1 = supabase
        .from('releases_basic')
        .select('*');
      
      let query2 = supabase
        .from('releases_exclusive')
        .select('*');
      
      // Применяем фильтр в зависимости от режима
      if (viewMode === 'moderation') {
        // В модерации показываем только pending
        query1 = query1.eq('status', 'pending');
        query2 = query2.eq('status', 'pending');
      } else if (viewMode === 'archive') {
        // В архиве показываем все релизы, кроме pending и draft
        if (statusFilter === 'distributed') {
          query1 = query1.eq('status', 'distributed');
          query2 = query2.eq('status', 'distributed');
        } else if (statusFilter === 'published') {
          query1 = query1.eq('status', 'published');
          query2 = query2.eq('status', 'published');
        } else if (statusFilter === 'approved') {
          query1 = query1.eq('status', 'approved');
          query2 = query2.eq('status', 'approved');
        } else if (statusFilter === 'rejected') {
          query1 = query1.eq('status', 'rejected');
          query2 = query2.eq('status', 'rejected');
        } else {
          // Для 'all' показываем все статусы, КРОМЕ pending и draft (черновики должны быть только у пользователя)
          query1 = query1.neq('status', 'pending').neq('status', 'draft');
          query2 = query2.neq('status', 'pending').neq('status', 'draft');
        }
      }
      
      // Исключаем черновики из всех запросов в админ панели
      query1 = query1.neq('status', 'draft');
      query2 = query2.neq('status', 'draft');
      
      const [basicResult, exclusiveResult] = await Promise.all([
        query1,
        query2
      ]);
      
      console.log('Basic releases:', basicResult.data);
      console.log('Exclusive releases:', exclusiveResult.data);
      
      if (basicResult.error) {
        console.error('Error loading basic releases:', basicResult.error);
      }
      if (exclusiveResult.error) {
        console.error('Error loading exclusive releases:', exclusiveResult.error);
      }
      
      // Получаем информацию о пользователях
      const allUserIds = [
        ...(basicResult.data || []).map(r => r.user_id),
        ...(exclusiveResult.data || []).map(r => r.user_id)
      ];
      
      const uniqueUserIds = [...new Set(allUserIds)];
      console.log('User IDs:', uniqueUserIds);
      
      let userProfiles: any = {};
      if (uniqueUserIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, display_name, email, avatar, nickname')
          .in('id', uniqueUserIds);
        
        console.log('Profiles:', profilesData);
        
        if (profilesData) {
          profilesData.forEach(profile => {
            userProfiles[profile.id] = profile;
          });
        }
      }
      
      // Форматируем данные
      const basicReleases = (basicResult.data || []).map((r: any) => {
        const profile = userProfiles[r.user_id];
        return {
          ...r,
          release_type: 'basic' as const,
          user_role: 'basic' as const,
          artist_name: profile?.display_name || profile?.email || r.artist_name || 'Unknown',
          user_email: profile?.email || '',
          user_avatar: profile?.avatar || null,
          user_nickname: profile?.nickname || null,
          tracks_count: Array.isArray(r.tracks) ? r.tracks.length : 0
        };
      });
      
      const exclusiveReleases = (exclusiveResult.data || []).map((r: any) => {
        const profile = userProfiles[r.user_id];
        return {
          ...r,
          release_type: 'exclusive' as const,
          user_role: 'exclusive' as const,
          artist_name: profile?.display_name || profile?.email || r.artist_name || 'Unknown',
          user_email: profile?.email || '',
          user_avatar: profile?.avatar || null,
          user_nickname: profile?.nickname || null,
          tracks_count: Array.isArray(r.tracks) ? r.tracks.length : 0,
          payment_status: null,
          payment_amount: null,
          payment_receipt_url: null
        };
      });
      
      // Объединяем и сортируем по дате
      const allReleases = [...basicReleases, ...exclusiveReleases]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      console.log('All releases:', allReleases);
      setReleases(allReleases);
    } catch (error) {
      console.error('Ошибка загрузки релизов:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFullRelease = async (releaseId: string, releaseType: 'basic' | 'exclusive') => {
    if (!supabase) return;
    
    try {
      const tableName = releaseType === 'basic' ? 'releases_basic' : 'releases_exclusive';
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', releaseId)
        .single();
      
      console.log('Full release loaded:', { tableName, data, error });
      console.log('Payment fields:', {
        payment_status: data?.payment_status,
        payment_amount: data?.payment_amount,
        payment_receipt_url: data?.payment_receipt_url,
        user_role: data?.user_role || (tableName === 'releases_basic' ? 'basic' : 'exclusive')
      });
      console.log('Release STATUS:', data?.status);
      console.log('Status type:', typeof data?.status);
      console.log('Status === "published":', data?.status === 'published');
      
      if (error) throw error;
      
      // Определяем user_role на основе типа релиза
      const userRole = releaseType === 'basic' ? 'basic' : 'exclusive';
      
      setSelectedRelease({ 
        ...data, 
        release_type: releaseType,
        user_role: userRole
      });
      setShowModal(true);
    } catch (error) {
      console.error('Ошибка загрузки релиза:', error);
    }
  };

  const handleApprove = async () => {
    if (!supabase || !selectedRelease) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('=== APPROVING RELEASE ===');
      console.log('Release ID:', selectedRelease.id);
      console.log('Release Type:', selectedRelease.release_type);
      console.log('User ID:', user.id);

      // Обновляем статус релиза на 'approved'
      const tableName = selectedRelease.release_type === 'basic' ? 'releases_basic' : 'releases_exclusive';
      console.log('Table Name:', tableName);
      
      const updateData = { 
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user.id
      };
      console.log('Update Data:', updateData);
      
      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', selectedRelease.id);
      
      if (error) {
        console.error('Update Error:', error);
        throw error;
      }
      
      console.log('Release approved successfully');
      alert('Релиз утверждён!');
      setShowModal(false);
      setSelectedRelease(null);
      loadReleases();
    } catch (error: any) {
      console.error('Ошибка утверждения:', error);
      alert(`Ошибка при утверждении релиза: ${error.message || 'Неизвестная ошибка'}`);
    }
  };

  const handleReject = async () => {
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
      
      alert('Релиз отклонён');
      setShowModal(false);
      setSelectedRelease(null);
      setRejectionReason('');
      loadReleases();
    } catch (error) {
      console.error('Ошибка отклонения:', error);
      alert('Ошибка при отклонении релиза');
    }
  };

  const handleVerifyPayment = async (isVerified: boolean) => {
    if (!supabase || !selectedRelease) return;
    if (selectedRelease.release_type !== 'basic') return; // Только для Basic
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const functionName = isVerified ? 'verify_basic_payment' : 'reject_basic_payment';
      const params: any = {
        release_id: selectedRelease.id,
        admin_id: user.id
      };
      
      if (!isVerified) {
        params.reason = rejectionReason || '';
      }

      const { error } = await supabase.rpc(functionName, params);
      
      if (error) throw error;
      
      showToast(isVerified ? 'Платеж подтвержден' : 'Платеж отклонен', 'success');
      loadFullRelease(selectedRelease.id, selectedRelease.release_type);
      loadReleases();
    } catch (error) {
      console.error('Ошибка проверки платежа:', error);
      alert('Ошибка при проверке платежа');
    }
  };
  
  // Массовая публикация релизов
  const handleBulkPublish = async () => {
    if (!supabase || selectedReleaseIds.length === 0) return;
    
    if (!confirm(`Опубликовать ${selectedReleaseIds.length} релизов?`)) return;
    
    setIsPublishing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Необходима авторизация');
        return;
      }

      console.log('Публикация релизов:', selectedReleaseIds);

      // Обновляем статус всех выбранных релизов
      const updatePromises = selectedReleaseIds.map(async releaseId => {
        const release = releases.find(r => r.id === releaseId);
        if (!release) {
          console.warn('Релиз не найден:', releaseId);
          return;
        }
        
        const tableName = release.release_type === 'basic' ? 'releases_basic' : 'releases_exclusive';
        console.log(`Обновление ${release.title} (${tableName}):`, {
          id: releaseId,
          currentStatus: release.status,
          newStatus: 'published'
        });
        
        // Сначала пробуем обновить только статус
        const { data, error } = await supabase
          .from(tableName)
          .update({ status: 'published' })
          .eq('id', releaseId)
          .select();
        
        if (error) {
          console.error(`❌ Ошибка обновления ${releaseId}:`, {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            release: release
          });
          throw error;
        }
        
        console.log(`✓ Релиз ${release.title} успешно опубликован`, data);
      });
      
      await Promise.all(updatePromises);
      
      console.log('✅ Все релизы успешно опубликованы');
      alert(`Успешно опубликовано: ${selectedReleaseIds.length} релизов!`);
      setSelectedReleaseIds([]);
      loadReleases();
    } catch (error) {
      console.error('Ошибка публикации:', error);
      alert('Ошибка при публикации релизов. Проверьте консоль для деталей.');
    } finally {
      setIsPublishing(false);
    }
  };
  
  // Сохранение UPC кода для трека
  const handleSaveTrackISRC = async (trackIndex: number, isrc: string) => {
    if (!supabase || !selectedRelease) return;
    
    setSavingISRC(true);
    try {
      // Копируем треки и обновляем ISRC
      const updatedTracks = [...selectedRelease.tracks];
      updatedTracks[trackIndex] = { ...updatedTracks[trackIndex], isrc };
      
      const tableName = selectedRelease.release_type === 'basic' ? 'releases_basic' : 'releases_exclusive';
      
      const { error } = await supabase
        .from(tableName)
        .update({ tracks: updatedTracks })
        .eq('id', selectedRelease.id);
      
      if (error) throw error;
      
      alert('ISRC код сохранен');
      setEditingTrackISRC(null);
      loadFullRelease(selectedRelease.id, selectedRelease.release_type);
    } catch (error) {
      console.error('Ошибка сохранения ISRC:', error);
      alert('Ошибка при сохранении ISRC кода');
    } finally {
      setSavingISRC(false);
    }
  };
  
  // Сохранение имени артиста
  const handleSaveArtistName = async () => {
    if (!supabase || !selectedRelease || !artistNameInput.trim()) return;
    
    setSavingArtistName(true);
    try {
      const tableName = selectedRelease.release_type === 'basic' ? 'releases_basic' : 'releases_exclusive';
      
      const { error } = await supabase
        .from(tableName)
        .update({ artist_name: artistNameInput.trim() })
        .eq('id', selectedRelease.id);
      
      if (error) throw error;
      
      alert('Имя артиста обновлено');
      setEditingArtistName(false);
      loadFullRelease(selectedRelease.id, selectedRelease.release_type);
      loadReleases();
    } catch (error) {
      console.error('Ошибка сохранения имени артиста:', error);
      alert('Ошибка при сохранении имени артиста');
    } finally {
      setSavingArtistName(false);
    }
  };
  
  // Сохранение UPC кода релиза
  const handleSaveReleaseUPC = async () => {
    if (!supabase || !selectedRelease || !releaseUPCInput.trim()) return;
    
    setSavingReleaseUPC(true);
    try {
      const tableName = selectedRelease.release_type === 'basic' ? 'releases_basic' : 'releases_exclusive';
      
      const { error } = await supabase
        .from(tableName)
        .update({ upc: releaseUPCInput.trim() })
        .eq('id', selectedRelease.id);
      
      if (error) throw error;
      
      alert('UPC код обновлен');
      setEditingReleaseUPC(false);
      loadFullRelease(selectedRelease.id, selectedRelease.release_type);
      loadReleases();
    } catch (error) {
      console.error('Ошибка сохранения UPC кода:', error);
      alert('Ошибка при сохранении UPC кода');
    } finally {
      setSavingReleaseUPC(false);
    }
  };
  
  // Temporary test - remove filtering
  const sorted = useMemo(() => releases, [releases]);
  
  // Выбрать/снять выбор со всех релизов
  const toggleSelectAll = () => {
    if (selectedReleaseIds.length === sorted.length) {
      setSelectedReleaseIds([]);
    } else {
      setSelectedReleaseIds(sorted.map(r => r.id));
    }
  };
  
  // Переключить выбор релиза
  const toggleSelectRelease = (releaseId: string) => {
    setSelectedReleaseIds(prev => 
      prev.includes(releaseId) 
        ? prev.filter(id => id !== releaseId)
        : [...prev, releaseId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-zinc-500 animate-pulse">Загрузка...</div>
      </div>
    );
  }

  // Main render
  return (
    <div>
      <div className="flex flex-col lg:flex-row gap-6 mb-6">
        {/* Левая часть - заголовок и режимы */}
        <div className="flex-1">
          <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Управление релизами</h2>
          <p className="text-sm text-zinc-500 mb-4">
            Найдено: {sorted.length} из {releases.length}
          </p>
          
          {/* Переключатель режимов */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setViewMode('moderation');
                setStatusFilter('pending');
              }}
              className={`px-4 py-2 rounded-xl font-bold transition ${
                viewMode === 'moderation' 
                  ? 'bg-[#6050ba] text-white' 
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10'
              }`}
            >
              Модерация
            </button>
            <button
              onClick={() => {
                setViewMode('archive');
                setStatusFilter('all');
              }}
              className={`px-4 py-2 rounded-xl font-bold transition ${
                viewMode === 'archive' 
                  ? 'bg-[#6050ba] text-white' 
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10'
              }`}
            >
              Архив
            </button>
          </div>
        </div>
        
        {/* Правая часть - поиск и фильтры */}
        <div className="w-full lg:w-96 relative">
          <div className="space-y-3">
            {/* Поиск */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию, артисту, email..."
                className="w-full bg-black/30 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm placeholder:text-zinc-500 focus:border-[#6050ba]/50 focus:outline-none transition"
              />
              <svg 
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <circle cx="11" cy="11" r="8" strokeWidth="2"/>
                <path d="m21 21-4.35-4.35" strokeWidth="2"/>
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2"/>
                    <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2"/>
                  </svg>
                </button>
              )}
            </div>

            {/* Кнопка показать фильтры */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-between px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-sm hover:border-[#6050ba]/50 transition"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" strokeWidth="2"/>
                </svg>
                <span>Фильтры и сортировка</span>
              </div>
              <svg 
                className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <polyline points="6 9 12 15 18 9" strokeWidth="2"/>
              </svg>
            </button>
          </div>

          {/* Выпадающая панель фильтров */}
          {showFilters && (
            <div className="absolute top-full left-0 right-0 mt-3 space-y-3 p-4 bg-[#0d0d0f] border border-white/10 rounded-xl shadow-2xl z-50">
              {/* Фильтр по статусу (только в архиве) */}
              {viewMode === 'archive' && (
                <div>
                  <label className="text-xs text-zinc-400 mb-2 block font-medium">Статус</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'all', label: 'Все', icon: '📋' },
                      { value: 'distributed', label: 'На дистрибьюции', icon: '🚀' },
                      { value: 'published', label: 'Опубликован', icon: '✅' },
                      { value: 'rejected', label: 'Отклонённые', icon: '❌' }
                    ].map((status) => (
                      <button
                        key={status.value}
                        onClick={() => setStatusFilter(status.value)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
                          statusFilter === status.value
                            ? 'bg-[#6050ba] text-white'
                            : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                        }`}
                      >
                        <span className="mr-1">{status.icon}</span>
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Фильтр по типу пользователя */}
              <div>
                <label className="text-xs text-zinc-400 mb-2 block font-medium">Тип</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'all', label: 'Все' },
                    { value: 'basic', label: 'Basic' },
                    { value: 'exclusive', label: 'Exclusive' }
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setFilterUserRole(type.value)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
                        filterUserRole === type.value
                          ? 'bg-[#6050ba] text-white'
                          : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Фильтр по жанру */}
              <div>
                <label className="text-xs text-zinc-400 mb-2 block font-medium">Жанр</label>
                <select 
                  value={filterGenre} 
                  onChange={(e) => setFilterGenre(e.target.value)} 
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-[#6050ba]/50 focus:outline-none transition"
                >
                  <option value="all">Все жанры</option>
                  {Array.from(new Set(releases.map(r => r.genre).filter(Boolean))).map((genre) => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
              </div>

              {/* Сортировка */}
              <div>
                <label className="text-xs text-zinc-400 mb-2 block font-medium">Сортировка</label>
                <div className="flex gap-2">
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value as any)} 
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-[#6050ba]/50 focus:outline-none transition"
                  >
                    <option value="date">По дате</option>
                    <option value="title">По названию</option>
                    <option value="artist">По артисту</option>
                  </select>
                  <button 
                    onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')} 
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition text-sm font-bold"
                  >
                    {order === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>

              {/* Кнопка сброса */}
              {(searchQuery || filterGenre !== 'all' || filterUserRole !== 'all' || (viewMode === 'archive' && statusFilter !== 'all')) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterGenre('all');
                    setFilterUserRole('all');
                    if (viewMode === 'archive') setStatusFilter('all');
                  }}
                  className="w-full px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition"
                >
                  Сбросить фильтры
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-zinc-500">Нет релизов{searchQuery || filterGenre !== 'all' || filterUserRole !== 'all' ? ' по заданным фильтрам' : ' на модерации'}</p>
        </div>
      ) : (
        <>
          {/* Панель массовых действий для архива */}
          {viewMode === 'archive' && (
            <div className="mb-4 p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative w-5 h-5">
                    <input 
                      type="checkbox"
                      checked={selectedReleaseIds.length === sorted.length && sorted.length > 0}
                      onChange={toggleSelectAll}
                      className="peer absolute opacity-0 w-full h-full cursor-pointer z-10"
                    />
                    <div className="w-5 h-5 rounded border-2 border-white/20 bg-white/5 peer-checked:bg-[#6050ba] peer-checked:border-[#6050ba] transition-all duration-200 group-hover:border-[#6050ba]/50 absolute inset-0"></div>
                    <svg 
                      className="w-3.5 h-3.5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-0 peer-checked:scale-100 transition-transform duration-200 pointer-events-none" 
                      viewBox="0 0 12 10" 
                      fill="none"
                    >
                      <path d="M1 5L4.5 8.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-sm font-medium group-hover:text-white transition-colors">
                    Выбрать все ({sorted.length})
                  </span>
                </label>
                {selectedReleaseIds.length > 0 && (
                  <span className="text-sm text-zinc-400">
                    Выбрано: {selectedReleaseIds.length}
                  </span>
                )}
              </div>
              
              {selectedReleaseIds.length > 0 && (
                <button
                  onClick={handleBulkPublish}
                  disabled={isPublishing}
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black rounded-xl font-bold transition flex items-center gap-2"
                >
                  {isPublishing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                      Публикуем...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="20 6 9 17 4 12" strokeWidth="3"/>
                      </svg>
                      Опубликовать выбранные
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          <div className="grid gap-4">
            {sorted.map((release) => (
            <div
              key={release.id}
              onClick={() => loadFullRelease(release.id, release.release_type)}
              className="p-5 bg-white/[0.02] border border-white/5 rounded-xl hover:border-[#6050ba]/50 transition cursor-pointer relative"
            >
              <div className="flex items-center gap-4">
                {/* Чекбокс для выбора (только в архиве) */}
                {viewMode === 'archive' && (
                  <label 
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="flex-shrink-0 cursor-pointer group relative w-5 h-5 transition-transform hover:scale-110"
                  >
                    <input
                      type="checkbox"
                      checked={selectedReleaseIds.includes(release.id)}
                      onChange={() => toggleSelectRelease(release.id)}
                      className="peer absolute opacity-0 w-full h-full cursor-pointer z-10"
                    />
                    <div className="w-5 h-5 rounded border-2 border-white/20 bg-white/5 peer-checked:bg-[#6050ba] peer-checked:border-[#6050ba] transition-all duration-200 group-hover:border-[#6050ba]/50 absolute inset-0"></div>
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
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                  {release.cover_url ? (
                    <img src={release.cover_url} alt={release.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🎵</div>
                  )}
                </div>

                {/* Информация */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-white">{release.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      release.user_role === 'basic' 
                        ? 'bg-[#6050ba]/20 text-[#9d8df1]' 
                        : 'bg-purple-500/20 text-purple-400'
                    }`}>
                      {release.user_role === 'basic' ? 'BASIC' : 'EXCLUSIVE'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      release.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      release.status === 'distributed' ? 'bg-blue-500/20 text-blue-400' :
                      release.status === 'published' ? 'bg-green-500/20 text-green-400' :
                      release.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                      release.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                      'bg-zinc-500/20 text-zinc-400'
                    }`}>
                      {release.status === 'pending' ? 'НА МОДЕРАЦИИ' :
                       release.status === 'distributed' ? 'НА ДИСТРИБЬЮЦИИ' :
                       release.status === 'published' ? 'ОПУБЛИКОВАН' :
                       release.status === 'approved' ? 'УТВЕРЖДЁН' :
                       release.status === 'rejected' ? 'ОТКЛОНЕН' : 
                       release.status.toUpperCase()}
                    </span>
                    {release.user_role === 'basic' && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        release.payment_status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        release.payment_status === 'verified' ? 'bg-emerald-500/20 text-emerald-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {release.payment_status === 'pending' ? 'Платеж на проверке' :
                         release.payment_status === 'verified' ? 'Оплачено' : 'Не оплачено'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Аватарка артиста */}
                    {release.user_avatar && (
                      <div 
                        className="w-6 h-6 rounded-lg bg-cover bg-center flex-shrink-0"
                        style={{ backgroundImage: `url(${release.user_avatar})` }}
                      />
                    )}
                    <p className="text-sm text-zinc-400">{release.artist_name}</p>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                    <span>{release.genre}</span>
                    <span>{release.tracks_count} треков</span>
                    <span>{new Date(release.created_at).toLocaleDateString('ru-RU')}</span>
                  </div>
                </div>

                {/* Стрелка */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-zinc-600">
                  <polyline points="9 18 15 12 9 6" strokeWidth="2"/>
                </svg>
              </div>
            </div>
          ))}
          </div>
        </>
      )}

      {/* Два модальных окна: информация о релизе (слева) и действия (справа) */}
      {showModal && selectedRelease && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/80 via-black/70 to-[#6050ba]/20 backdrop-blur-md p-4 gap-4 animate-in fade-in duration-200" onClick={() => setShowModal(false)}>
          {/* ЛЕВОЕ ОКНО: Информация о релизе */}
          <div className="bg-gradient-to-br from-[#0d0d0f] to-[#1a1a1f] border border-white/20 shadow-2xl shadow-[#6050ba]/10 rounded-3xl w-[800px] flex-shrink-0 max-h-[90vh] overflow-y-auto scrollbar-hide animate-in slide-in-from-left duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="p-8">
              {/* Заголовок */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="w-12 h-1 bg-gradient-to-r from-[#6050ba] to-[#9d8df1] rounded-full mb-4"></div>
                  <div className="mb-3">
                    <span className="text-sm text-zinc-500 font-medium">Название релиза:</span>
                    <h2 className="text-3xl font-black uppercase tracking-tight mt-1 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">{selectedRelease.title}</h2>
                  </div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-sm text-zinc-500 font-medium">Автор:</span>
                    <span className="font-semibold text-zinc-300">{selectedRelease.artist_name}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border-2 backdrop-blur-sm ${
                      selectedRelease.user_role === 'basic' 
                        ? 'bg-gradient-to-r from-blue-500/30 to-blue-600/20 border-blue-400/50 text-blue-300 shadow-lg shadow-blue-500/20' 
                        : 'bg-gradient-to-r from-purple-500/30 to-purple-600/20 border-purple-400/50 text-purple-300 shadow-lg shadow-purple-500/20'
                    }`}>
                      <span className="w-2 h-2 rounded-full animate-pulse" style={{background: selectedRelease.user_role === 'basic' ? '#60a5fa' : '#c084fc'}}></span>
                      {selectedRelease.user_role === 'basic' ? 'BASIC' : 'EXCLUSIVE'}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border-2 backdrop-blur-sm ${
                      selectedRelease.status === 'pending' ? 'bg-gradient-to-r from-yellow-500/30 to-yellow-600/20 border-yellow-400/50 text-yellow-300 shadow-lg shadow-yellow-500/20' :
                      selectedRelease.status === 'distributed' ? 'bg-gradient-to-r from-blue-500/30 to-blue-600/20 border-blue-400/50 text-blue-300 shadow-lg shadow-blue-500/20' :
                      selectedRelease.status === 'published' ? 'bg-gradient-to-r from-green-500/30 to-green-600/20 border-green-400/50 text-green-300 shadow-lg shadow-green-500/20' :
                      selectedRelease.status === 'approved' ? 'bg-gradient-to-r from-emerald-500/30 to-emerald-600/20 border-emerald-400/50 text-emerald-300 shadow-lg shadow-emerald-500/20' :
                      selectedRelease.status === 'rejected' ? 'bg-gradient-to-r from-red-500/30 to-red-600/20 border-red-400/50 text-red-300 shadow-lg shadow-red-500/20' :
                      'bg-gradient-to-r from-zinc-500/30 to-zinc-600/20 border-zinc-400/50 text-zinc-300 shadow-lg shadow-zinc-500/20'
                    }`}>
                      {selectedRelease.status === 'pending' ? '⏳' :
                       selectedRelease.status === 'distributed' ? '🚀' :
                       selectedRelease.status === 'published' ? '✅' :
                       selectedRelease.status === 'approved' ? '✓' :
                       selectedRelease.status === 'rejected' ? '✕' : '•'}
                      {selectedRelease.status === 'pending' ? 'НА МОДЕРАЦИИ' :
                       selectedRelease.status === 'distributed' ? 'НА ДИСТРИБЬЮЦИИ' :
                       selectedRelease.status === 'published' ? 'ОПУБЛИКОВАН' :
                       selectedRelease.status === 'approved' ? 'УТВЕРЖДЁН' :
                       selectedRelease.status === 'rejected' ? 'ОТКЛОНЕН' : 
                       selectedRelease.status?.toUpperCase() || 'НЕТ СТАТУСА'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Полная информация о релизе */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Обложка */}
                <div className="group">
                  {selectedRelease.cover_url && (
                    <div className="relative overflow-hidden rounded-2xl">
                      <img src={selectedRelease.cover_url} alt={selectedRelease.title} className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#6050ba]/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute inset-0 shadow-2xl shadow-[#6050ba]/30"></div>
                    </div>
                  )}
                </div>

                {/* Детали */}
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-xl hover:border-[#6050ba]/50 transition-all group">
                    <div className="flex items-center gap-2 mb-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#6050ba]" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      <div className="text-xs text-zinc-500">Тип аккаунта</div>
                    </div>
                    <div className="font-bold text-lg">{selectedRelease.user_role === 'basic' ? 'Basic' : 'Exclusive'}</div>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-xl hover:border-[#6050ba]/50 transition-all group">
                    <div className="flex items-center gap-2 mb-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#6050ba]" strokeWidth="2">
                        <path d="M9 18V5l12-2v13"/>
                        <circle cx="6" cy="18" r="3"/>
                        <circle cx="18" cy="16" r="3"/>
                      </svg>
                      <div className="text-xs text-zinc-500">Жанр</div>
                    </div>
                    <div className="font-bold text-lg">{selectedRelease.genre}</div>
                    {selectedRelease.subgenres?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedRelease.subgenres.map((sub: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-white/5 rounded text-xs">{sub}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedRelease.release_date && (
                    <div className="p-4 bg-white/5 rounded-xl">
                      <div className="text-xs text-zinc-500 mb-1">Дата релиза</div>
                      <div className="font-bold">{new Date(selectedRelease.release_date).toLocaleDateString('ru-RU')}</div>
                    </div>
                  )}

                  {/* UPC код (только для опубликованных релизов) */}
                  {selectedRelease.status === 'published' && (
                    <div className="p-4 bg-white/5 rounded-xl">
                      <div className="text-xs text-zinc-500 mb-1">UPC код</div>
                      {editingReleaseUPC ? (
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="text"
                            value={releaseUPCInput}
                            onChange={(e) => setReleaseUPCInput(e.target.value)}
                            placeholder="Введите UPC код"
                            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#6050ba]"
                            disabled={savingReleaseUPC}
                            autoFocus
                          />
                          <button
                            onClick={handleSaveReleaseUPC}
                            disabled={savingReleaseUPC || !releaseUPCInput.trim()}
                            className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black rounded-lg font-bold transition text-sm"
                          >
                            {savingReleaseUPC ? '...' : '✓'}
                          </button>
                          <button
                            onClick={() => {
                              setEditingReleaseUPC(false);
                              setReleaseUPCInput('');
                            }}
                            disabled={savingReleaseUPC}
                            className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition text-sm"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mt-2">
                          {selectedRelease.upc ? (
                            <>
                              <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-sm font-mono text-emerald-400 flex-1">
                                {selectedRelease.upc}
                              </div>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(selectedRelease.upc);
                                  alert('UPC код скопирован в буфер обмена');
                                }}
                                className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 rounded-lg transition text-xs font-bold flex items-center gap-1.5"
                                title="Копировать UPC код"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                                </svg>
                                Копировать
                              </button>
                              <button
                                onClick={() => {
                                  setEditingReleaseUPC(true);
                                  setReleaseUPCInput(selectedRelease.upc || '');
                                }}
                                className="px-3 py-2 bg-[#6050ba] hover:bg-[#6050ba]/80 text-white rounded-lg text-xs font-bold transition"
                                title="Изменить UPC код"
                              >
                                Изменить
                              </button>
                            </>
                          ) : (
                            <>
                              <div className="font-bold flex-1 text-zinc-500">Не указан</div>
                              <button
                                onClick={() => {
                                  setEditingReleaseUPC(true);
                                  setReleaseUPCInput('');
                                }}
                                className="px-3 py-2 bg-[#6050ba] hover:bg-[#6050ba]/80 text-white rounded-lg text-xs font-bold transition"
                                title="Добавить UPC код"
                              >
                                Добавить
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedRelease.collaborators?.length > 0 && (
                    <div className="p-4 bg-white/5 rounded-xl">
                      <div className="text-xs text-zinc-500 mb-1">Соавторы</div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedRelease.collaborators.map((collab: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-white/5 rounded text-xs">{collab}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Треки */}
              {selectedRelease.tracks && (
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6050ba] to-[#9d8df1] flex items-center justify-center shadow-lg shadow-[#6050ba]/30">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <circle cx="12" cy="12" r="2"/>
                        <path d="M12 2v7.5"/>
                        <path d="m19 5-5.23 5.23"/>
                        <path d="M22 12h-7.5"/>
                        <path d="m19 19-5.23-5.23"/>
                        <path d="M12 14.5V22"/>
                        <path d="M10.23 13.77 5 19"/>
                        <path d="M9.5 12H2"/>
                        <path d="M10.23 10.23 5 5"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Треклист</h3>
                      <p className="text-sm text-zinc-500">{selectedRelease.tracks.length} {selectedRelease.tracks.length === 1 ? 'трек' : 'треков'}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {selectedRelease.tracks.map((track: any, idx: number) => (
                      <div key={idx} className="group relative p-5 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:border-[#6050ba]/50 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-[#6050ba]/10">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6050ba]/30 to-[#9d8df1]/20 border-2 border-[#6050ba]/40 flex items-center justify-center text-lg font-black flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-[#6050ba]/20">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-lg mb-2 group-hover:text-[#9d8df1] transition-colors">{track.title}</div>
                            
                            {/* Метаданные трека */}
                            <div className="flex flex-wrap gap-2 mb-3">
                              {track.language && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-blue-500/20 to-blue-600/10 border border-blue-400/30 rounded-lg text-xs font-semibold text-blue-300">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <path d="M2 12h20"/>
                                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                                  </svg>
                                  {track.language}
                                </span>
                              )}
                              {track.hasDrugs && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-red-500/20 to-red-600/10 border border-red-400/30 rounded-lg text-xs font-bold text-red-300">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                                  </svg>
                                  Explicit
                                </span>
                              )}
                            </div>

                            {/* Дополнительная информация */}
                            {(track.version || track.producers || track.featuring) && (
                              <div className="space-y-2 mb-3">
                                {track.version && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="text-zinc-500">Версия:</span>
                                    <span className="text-zinc-300 font-medium">{track.version}</span>
                                  </div>
                                )}
                                {track.producers && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="text-zinc-500">Продюсер:</span>
                                    <span className="text-zinc-300 font-medium">
                                      {Array.isArray(track.producers) ? track.producers.join(', ') : track.producers}
                                    </span>
                                  </div>
                                )}
                                {track.featuring && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="text-zinc-500">При участии:</span>
                                    <span className="text-zinc-300 font-medium">
                                      {Array.isArray(track.featuring) ? track.featuring.join(', ') : track.featuring}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            {track.link && (
                              <a 
                                href={track.link} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#6050ba]/20 to-[#9d8df1]/10 hover:from-[#6050ba]/30 hover:to-[#9d8df1]/20 border border-[#6050ba]/30 hover:border-[#6050ba]/50 rounded-xl text-sm font-semibold text-[#9d8df1] transition-all group/link"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover/link:scale-110 transition-transform">
                                  <polygon points="5 3 19 12 5 21 5 3"/>
                                </svg>
                                Прослушать трек
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover/link:translate-x-1 transition-transform">
                                  <line x1="5" y1="12" x2="19" y2="12"/>
                                  <polyline points="12 5 19 12 12 19"/>
                                </svg>
                              </a>
                            )}
                            
                            {track.lyrics && (
                              <details className="mt-3 pt-3 border-t border-white/10 group/lyrics">
                                <summary className="cursor-pointer text-sm font-semibold text-zinc-400 hover:text-[#9d8df1] transition-colors flex items-center gap-2">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-open/lyrics:rotate-90 transition-transform">
                                    <polyline points="9 18 15 12 9 6"/>
                                  </svg>
                                  Текст песни
                                </summary>
                                <div className="mt-3 p-4 bg-black/30 border border-white/10 rounded-xl text-sm text-zinc-300 whitespace-pre-wrap max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-[#6050ba]/50 scrollbar-track-white/5">
                                  {track.lyrics}
                                </div>
                              </details>
                            )}
                            
                            {/* ISRC код - доступен для редактирования админом только у опубликованных релизов */}
                            {selectedRelease.status === 'published' && (
                              <div className="mt-3 pt-3 border-t border-white/10">
                                <div className="flex items-center gap-2">{editingTrackISRC?.trackIndex === idx ? (
                                    <div className="flex items-center gap-2 flex-1">
                                      <input
                                        type="text"
                                        value={editingTrackISRC.isrc}
                                        onChange={(e) => setEditingTrackISRC({ trackIndex: idx, isrc: e.target.value })}
                                        placeholder="Введите ISRC код"
                                        className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#6050ba]"
                                        disabled={savingISRC}
                                      />
                                      <button
                                        onClick={() => handleSaveTrackISRC(idx, editingTrackISRC.isrc)}
                                        disabled={savingISRC}
                                        className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 text-black rounded-lg text-xs font-bold transition"
                                      >
                                        {savingISRC ? '...' : '✓'}
                                      </button>
                                      <button
                                        onClick={() => setEditingTrackISRC(null)}
                                        disabled={savingISRC}
                                        className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs transition"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="text-xs text-zinc-500">ISRC код:</div>
                                      <div className="flex items-center gap-2 flex-1">
                                        {track.isrc ? (
                                          <>
                                            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs font-mono text-emerald-400 flex-1">
                                              {track.isrc}
                                            </span>
                                            <button
                                              onClick={() => {
                                                navigator.clipboard.writeText(track.isrc);
                                                alert('ISRC код скопирован в буфер обмена');
                                              }}
                                              className="px-2 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 rounded-lg transition text-xs font-bold flex items-center gap-1"
                                              title="Копировать ISRC код"
                                            >
                                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                                              </svg>
                                              Копировать
                                            </button>
                                          </>
                                        ) : (
                                          <span className="text-xs text-zinc-500 flex-1">Не указан</span>
                                        )}
                                        <button
                                          onClick={() => setEditingTrackISRC({ trackIndex: idx, isrc: track.isrc || '' })}
                                          className="px-2 py-1.5 bg-[#6050ba] hover:bg-[#6050ba]/80 text-white rounded-lg text-xs font-bold transition"
                                        >
                                          {track.isrc ? 'Изменить' : 'Добавить'}
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Страны */}
              {selectedRelease.countries?.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold mb-3">Страны распространения ({selectedRelease.countries.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedRelease.countries.map((country: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-white/5 rounded-lg text-sm">{country}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Платформы */}
              {selectedRelease.platforms?.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold mb-3">Платформы ({selectedRelease.platforms.filter((p: string) => 
                    ['Spotify', 'Apple Music', 'YouTube Music', 'VK Музыка', 'Яндекс Музыка'].includes(p)
                  ).length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedRelease.platforms
                      .filter((platform: string) => 
                        ['Spotify', 'Apple Music', 'YouTube Music', 'VK Музыка', 'Яндекс Музыка'].includes(platform)
                      )
                      .map((platform: string, idx: number) => (
                        <span key={idx} className="px-3 py-1 bg-white/5 rounded-lg text-sm">{platform}</span>
                      ))}
                  </div>
                </div>
              )}

              {/* Промо */}
              {(selectedRelease.focus_track || selectedRelease.focus_track_promo || selectedRelease.album_description) && (
                <div className="mb-6 space-y-3">
                  <h3 className="font-bold mb-3">Промо-информация</h3>
                  
                  {/* Фокус-трек и промо */}
                  {(selectedRelease.focus_track || selectedRelease.focus_track_promo) && (
                    <details className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-[#6050ba]/50 transition group">
                      <summary className="cursor-pointer font-medium flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-[#6050ba]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polygon points="10 8 16 12 10 16 10 8"/>
                          </svg>
                          Фокус-трек и промо
                        </span>
                        <svg className="w-5 h-5 text-zinc-500 group-open:rotate-180 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </summary>
                      <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
                        {selectedRelease.focus_track && (
                          <div>
                            <div className="text-xs text-zinc-500 mb-1">Фокус-трек</div>
                            <div className="font-medium text-white">{selectedRelease.focus_track}</div>
                          </div>
                        )}
                        {selectedRelease.focus_track_promo && (
                          <div>
                            <div className="text-xs text-zinc-500 mb-1">Промо-текст</div>
                            <div className="text-sm text-zinc-300 whitespace-pre-wrap break-words">{selectedRelease.focus_track_promo}</div>
                          </div>
                        )}
                      </div>
                    </details>
                  )}
                  
                  {/* Описание альбома (только если больше одного трека) */}
                  {selectedRelease.album_description && selectedRelease.tracks?.length > 1 && (
                    <details className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-[#6050ba]/50 transition group">
                      <summary className="cursor-pointer font-medium flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-[#6050ba]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                          </svg>
                          Промо альбома
                        </span>
                        <svg className="w-5 h-5 text-zinc-500 group-open:rotate-180 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </summary>
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <div className="text-sm text-zinc-300 whitespace-pre-wrap break-words">{selectedRelease.album_description}</div>
                      </div>
                    </details>
                  )}
                  
                  {/* Промо-фотографии */}
                  {selectedRelease.promo_photos && selectedRelease.promo_photos.length > 0 && (
                    <details className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-[#6050ba]/50 transition group">
                      <summary className="cursor-pointer font-medium flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-[#6050ba]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21 15 16 10 5 21"/>
                          </svg>
                          Промо-фотографии ({selectedRelease.promo_photos.length})
                        </span>
                        <svg className="w-5 h-5 text-zinc-500 group-open:rotate-180 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </summary>
                      <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                        {selectedRelease.promo_photos.map((photo: string, index: number) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                            <span className="text-xs text-zinc-500 font-mono">#{index + 1}</span>
                            <a 
                              href={photo} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-[#6050ba] hover:text-[#9d8df1] transition flex-1 truncate"
                            >
                              {photo}
                            </a>
                            <button
                              onClick={() => navigator.clipboard.writeText(photo)}
                              className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition"
                            >
                              Копировать
                            </button>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ПРАВОЕ ОКНО: Действия и платеж */}
          <div className="bg-gradient-to-br from-[#0d0d0f] to-[#1a1a1f] border border-white/20 shadow-2xl shadow-[#6050ba]/10 rounded-3xl w-[500px] flex-shrink-0 max-h-[90vh] overflow-y-auto scrollbar-hide animate-in slide-in-from-right duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              {/* Заголовок правого окна */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6050ba] to-[#9d8df1] flex items-center justify-center shadow-lg shadow-[#6050ba]/30">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M12.89 1.45l8 4A2 2 0 0 1 22 7.24v9.53a2 2 0 0 1-1.11 1.79l-8 4a2 2 0 0 1-1.79 0l-8-4a2 2 0 0 1-1.1-1.8V7.24a2 2 0 0 1 1.11-1.79l8-4a2 2 0 0 1 1.78 0z"/>
                      <polyline points="12 22 12 12"/>
                      <polyline points="12 12 2.5 6.5"/>
                      <polyline points="12 12 21.5 6.5"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Действия</h3>
                </div>
                <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/50 flex items-center justify-center flex-shrink-0 transition-all group">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="group-hover:text-red-400 transition-colors" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              {/* Для Basic релизов: проверка платежа */}
              {selectedRelease.user_role === 'basic' && selectedRelease.payment_status === 'pending' && (
                <div className="mb-6">
                  <div className="p-6 bg-gradient-to-br from-yellow-500/20 to-orange-600/10 border-2 border-yellow-400/40 rounded-2xl shadow-xl shadow-yellow-500/20">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500/30 to-yellow-600/20 flex items-center justify-center flex-shrink-0 border-2 border-yellow-400/50 shadow-lg shadow-yellow-500/30">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-yellow-300" strokeWidth="2">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                          <line x1="12" y1="9" x2="12" y2="13"/>
                          <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-yellow-300">Проверка платежа</h4>
                        <p className="text-sm text-yellow-400/70 mt-1">Подтвердите оплату для продолжения</p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="p-3 bg-white/5 rounded-xl">
                        <div className="text-xs text-zinc-500 mb-1">Сумма</div>
                        <div className="text-xl font-bold">{selectedRelease.payment_amount} ₽</div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl">
                        <div className="text-xs text-zinc-500 mb-1">Статус</div>
                        <div className="text-yellow-400 font-bold text-sm">На проверке</div>
                      </div>
                    </div>

                    {selectedRelease.payment_receipt_url ? (
                      <div>
                        <div className="text-sm font-bold mb-3">Чек оплаты:</div>
                        <a 
                          href={selectedRelease.payment_receipt_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="block hover:opacity-80 transition mb-3"
                        >
                          <img 
                            src={selectedRelease.payment_receipt_url} 
                            alt="Чек оплаты" 
                            className="w-full object-contain rounded-lg border-2 border-white/10 hover:border-yellow-500/50 transition cursor-pointer"
                          />
                        </a>
                        <div className="text-xs text-zinc-500 mb-4 text-center">
                          Открыть в полном размере
                        </div>

                        <div className="space-y-3">
                          <button
                            onClick={() => handleVerifyPayment(true)}
                            className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-xl font-black transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] flex items-center justify-center gap-2 group"
                          >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:scale-110 transition-transform">
                              <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Подтвердить платеж
                          </button>
                          <button
                            onClick={() => handleVerifyPayment(false)}
                            className="w-full px-6 py-4 bg-gradient-to-r from-red-500/30 to-red-600/20 hover:from-red-500/40 hover:to-red-600/30 border-2 border-red-500/50 hover:border-red-400 text-red-300 rounded-xl font-black transition-all flex items-center justify-center gap-2 group"
                          >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:rotate-90 transition-transform">
                              <line x1="18" y1="6" x2="6" y2="18"/>
                              <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                            Отклонить платеж
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                        <div className="text-red-400 font-bold text-sm">Чек не загружен</div>
                        <div className="text-xs text-zinc-400 mt-1">Пользователь не предоставил чек</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Кнопки действий */}
              <div className="space-y-3">
                {/* Кнопка редактирования */}
                <button
                  onClick={() => {
                    const editPath = selectedRelease.release_type === 'basic'
                      ? `/cabinet/release-basic/edit/${selectedRelease.id}?from=admin`
                      : `/cabinet/release/edit/${selectedRelease.id}?from=admin`;
                    router.push(editPath);
                  }}
                  className="w-full px-6 py-4 bg-gradient-to-r from-white/10 to-white/5 hover:from-[#6050ba]/30 hover:to-[#9d8df1]/20 border-2 border-white/20 hover:border-[#6050ba]/50 rounded-xl font-bold transition-all shadow-lg hover:shadow-[#6050ba]/30 flex items-center justify-center gap-2 group"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:rotate-12 transition-transform">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Редактировать релиз
                </button>

                {selectedRelease.status === 'pending' && (
                  <>
                    <button
                      onClick={handleApprove}
                      disabled={selectedRelease.release_type === 'basic' && selectedRelease.payment_status !== 'verified'}
                      className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:from-zinc-700 disabled:to-zinc-800 disabled:text-zinc-500 text-white rounded-xl font-black transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 disabled:shadow-none hover:scale-[1.02] flex flex-col items-center justify-center gap-1 group"
                    >
                      <span className="flex items-center gap-2">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:scale-110 transition-transform">
                          <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Утвердить и отправить на дистрибьюцию
                      </span>
                      {selectedRelease.release_type === 'basic' && selectedRelease.payment_status !== 'verified' && (
                        <span className="text-xs mt-1 opacity-70">Сначала подтвердите платеж</span>
                      )}
                    </button>

                    <div>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Причина отклонения..."
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none mb-2"
                        rows={3}
                      />
                      <button
                        onClick={handleReject}
                        disabled={!rejectionReason.trim()}
                        className="w-full px-6 py-3 bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 text-red-400 rounded-xl font-bold transition"
                      >
                        ✕ Отклонить релиз
                      </button>
                    </div>
                  </>
                )}

                {selectedRelease.status === 'distributed' && (
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-center">
                    <div className="text-blue-400 font-bold">🚀 Релиз на дистрибьюции</div>
                    {selectedRelease.approved_at && (
                      <div className="text-xs text-zinc-500 mt-1">
                        {new Date(selectedRelease.approved_at).toLocaleString('ru-RU')}
                      </div>
                    )}
                  </div>
                )}

                {selectedRelease.status === 'published' && (
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
                    <div className="text-green-400 font-bold">✅ Релиз опубликован</div>
                    {selectedRelease.published_at && (
                      <div className="text-xs text-zinc-500 mt-1">
                        {new Date(selectedRelease.published_at).toLocaleString('ru-RU')}
                      </div>
                    )}
                  </div>
                )}

                {selectedRelease.status === 'approved' && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                    <div className="text-emerald-400 font-bold">Релиз одобрен</div>
                    {selectedRelease.approved_at && (
                      <div className="text-xs text-zinc-500 mt-1">
                        {new Date(selectedRelease.approved_at).toLocaleString('ru-RU')}
                      </div>
                    )}
                  </div>
                )}

                {selectedRelease.status === 'rejected' && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <div className="text-red-400 font-bold mb-2">Релиз отклонен</div>
                    {selectedRelease.rejection_reason && (
                      <div className="text-sm text-zinc-400">
                        Причина: {selectedRelease.rejection_reason}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
