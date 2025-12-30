"use client";
import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { SupabaseClient } from '@supabase/supabase-js';
import AudioPlayer from '@/components/AudioPlayer';

interface Release {
  id: string;
  custom_id?: string;
  created_at: string;
  release_date?: string;
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
  upc?: string;
  tracks?: any[];
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
  const [filterDate, setFilterDate] = useState<string>(''); // Фильтр по дате (YYYY-MM-DD)
  const [filterUserRole, setFilterUserRole] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'artist'>('date');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  
  // Состояния для кастомного календаря
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  
  // Состояния для массового выбора в архиве
  const [selectedReleaseIds, setSelectedReleaseIds] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Toast уведомления
  const [toast, setToast] = useState<{show: boolean, message: string, type: 'success' | 'error' | 'info'}>({show: false, message: '', type: 'success'});
  
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({show: true, message, type});
    setTimeout(() => setToast({show: false, message: '', type: 'success'}), 3000);
  };
  
  // Состояния для IRSC кодов треков и UPC кода релиза
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
  
  // Состояние для модального окна подтверждения удаления
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState<'single' | 'bulk'>('single');
  const [deleteCount, setDeleteCount] = useState(0);
  
  // Состояние для Portal (client-side only)
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Блокировка скролла body когда модальное окно открыто
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
    loadReleases();
  }, []); // Загружать только один раз при монтировании компонента
  
  // Сбрасывать выбор при смене режима
  useEffect(() => {
    setSelectedReleaseIds([]);
  }, [viewMode]);

  const loadReleases = async () => {
    if (!supabase) return;
    
    setLoading(true);
    try {
      console.log('Loading all releases...');
      
      // Загружаем ВСЕ релизы из обеих таблиц (кроме черновиков)
      // Фильтрация будет происходить на клиенте в useMemo
      let query1 = supabase
        .from('releases_basic')
        .select('*')
        .neq('status', 'draft'); // Исключаем только черновики
      
      let query2 = supabase
        .from('releases_exclusive')
        .select('*')
        .neq('status', 'draft'); // Исключаем только черновики
      
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
        status: 'distributed',
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
      showToast('Релиз успешно утверждён!', 'success');
      setShowModal(false);
      setSelectedRelease(null);
      loadReleases();
    } catch (error: any) {
      console.error('Ошибка утверждения:', error);
      showToast(`Ошибка при утверждении релиза: ${error.message || 'Неизвестная ошибка'}`, 'error');
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

  const handleDeleteRelease = async () => {
    if (!supabase || !selectedRelease) return;
    
    setDeleteType('single');
    setDeleteCount(1);
    setShowDeleteConfirm(true);
  };
  
  const confirmDeleteRelease = async () => {
    if (!supabase || !selectedRelease) return;
    
    setShowDeleteConfirm(false);
    
    try {
      const tableName = selectedRelease.release_type === 'basic' ? 'releases_basic' : 'releases_exclusive';
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', selectedRelease.id);
      
      if (error) throw error;
      
      alert('Релиз успешно удалён');
      setShowModal(false);
      setSelectedRelease(null);
      loadReleases();
    } catch (error) {
      console.error('Ошибка удаления релиза:', error);
      alert('Ошибка при удалении релиза');
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
  
  // Массовое удаление релизов
  const handleBulkDelete = async () => {
    if (!supabase || selectedReleaseIds.length === 0) return;
    
    setDeleteType('bulk');
    setDeleteCount(selectedReleaseIds.length);
    setShowDeleteConfirm(true);
  };
  
  const confirmBulkDelete = async () => {
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
      
      alert(`Успешно удалено: ${selectedReleaseIds.length} релизов!`);
      setSelectedReleaseIds([]);
      loadReleases();
    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert('Ошибка при удалении релизов');
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
      
      showToast('IRSC код сохранен', 'success');
      setEditingTrackISRC(null);
      loadFullRelease(selectedRelease.id, selectedRelease.release_type);
    } catch (error) {
      console.error('Ошибка сохранения IRSC:', error);
      showToast('Ошибка при сохранении IRSC кода', 'error');
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
      
      showToast('Имя артиста обновлено', 'success');
      setEditingArtistName(false);
      loadFullRelease(selectedRelease.id, selectedRelease.release_type);
      loadReleases();
    } catch (error) {
      console.error('Ошибка сохранения имени артиста:', error);
      showToast('Ошибка при сохранении имени артиста', 'error');
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
      
      showToast('UPC код обновлен', 'success');
      setEditingReleaseUPC(false);
      loadFullRelease(selectedRelease.id, selectedRelease.release_type);
      loadReleases();
    } catch (error) {
      console.error('Ошибка сохранения UPC кода:', error);
      showToast('Ошибка при сохранении UPC кода', 'error');
    } finally {
      setSavingReleaseUPC(false);
    }
  };
  
  // Фильтрация и сортировка релизов
  const sorted = useMemo(() => {
    let filtered = releases;

    // Фильтр по режиму (модерация или архив)
    if (viewMode === 'moderation') {
      filtered = filtered.filter(r => r.status === 'pending');
    } else {
      // В архиве показываем все, кроме pending
      filtered = filtered.filter(r => r.status !== 'pending');
    }

    // Фильтр по статусу (только в архиве)
    if (viewMode === 'archive' && statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Поиск
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => {
        // Поиск по основным полям
        const matchBasic = 
          (r.title && r.title.toLowerCase().includes(query)) ||
          (r.artist_name && r.artist_name.toLowerCase().includes(query)) ||
          (r.user_email && r.user_email.toLowerCase().includes(query)) ||
          (r.user_name && r.user_name.toLowerCase().includes(query));
        
        // Поиск по UPC коду
        const matchUPC = r.upc && r.upc.toLowerCase().includes(query);
        
        // Поиск по IRSC кодам в треках
        const matchIRSC = r.tracks && Array.isArray(r.tracks) && r.tracks.some((track: any) => 
          track.isrc && track.isrc.toLowerCase().includes(query)
        );
        
        return matchBasic || matchUPC || matchIRSC;
      });
    }

    // Фильтр по дате
    if (filterDate) {
      console.log('Filtering by date:', filterDate);
      filtered = filtered.filter(r => {
        // Ищем только в поле release_date (дата релиза, указанная пользователем)
        if (!r.release_date) {
          console.log('Release without release_date:', r.id, r.title);
          return false;
        }
        
        // Создаем даты в формате YYYY-MM-DD для сравнения
        const releaseDateStr = r.release_date.split('T')[0]; // Берем только дату без времени
        const selectedDateStr = filterDate;
        
        console.log('Comparing:', releaseDateStr, 'with', selectedDateStr, 'for release:', r.title);
        
        return releaseDateStr === selectedDateStr;
      });
      console.log('Filtered releases count:', filtered.length);
    }

    // Фильтр по типу пользователя
    if (filterUserRole !== 'all') {
      filtered = filtered.filter(r => r.user_role === filterUserRole);
    }

    // Сортировка
    const sortedFiltered = [...filtered].sort((a, b) => {
      if (sortBy === 'date') {
        return order === 'desc' 
          ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          : new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === 'title') {
        return order === 'desc'
          ? b.title.localeCompare(a.title)
          : a.title.localeCompare(b.title);
      } else if (sortBy === 'artist') {
        return order === 'desc'
          ? b.artist_name.localeCompare(a.artist_name)
          : a.artist_name.localeCompare(b.artist_name);
      }
      return 0;
    });

    return sortedFiltered;
  }, [releases, viewMode, statusFilter, searchQuery, filterDate, filterUserRole, sortBy, order]);
  
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
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 mb-4 sm:mb-6">
        {/* Левая часть - заголовок и режимы */}
        <div className="flex-1">
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight mb-2 text-center lg:text-left">Управление релизами</h2>
          <p className="text-xs sm:text-sm text-zinc-500 mb-3 sm:mb-4">
            Найдено: {sorted.length} из {releases.length}
          </p>
          
          {/* Переключатель режимов */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setViewMode('moderation');
                setStatusFilter('pending');
              }}
              className={`px-3 sm:px-4 py-2 rounded-xl text-sm font-bold transition ${
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
              className={`px-3 sm:px-4 py-2 rounded-xl text-sm font-bold transition ${
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
            {/* Кнопка обновления и поиск */}
            <div className="flex gap-2">
              {/* Кнопка обновления */}
              <button
                onClick={loadReleases}
                disabled={loading}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition flex items-center gap-2 disabled:opacity-50 flex-shrink-0"
                title="Обновить список релизов"
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {/* Поиск */}
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={(e) => e.target.blur()}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape' || e.key === 'Enter') {
                      e.currentTarget.blur();
                    }
                  }}
                  placeholder="Поиск..."
                  className="w-full bg-black/30 border border-white/10 rounded-xl pl-9 sm:pl-11 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm placeholder:text-zinc-500 focus:border-[#6050ba]/50 focus:outline-none transition"
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
            <div className="absolute top-full left-0 right-0 mt-3 space-y-4 p-5 bg-gradient-to-br from-[#0d0d0f] to-[#1a1a1f] border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl z-50">
              {/* Фильтр по статусу (только в архиве) */}
              {viewMode === 'archive' && (
                <div className="space-y-2">
                  <label className="text-xs text-zinc-400 uppercase tracking-wider font-bold flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Статус релиза
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`group relative px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        statusFilter === 'all'
                          ? 'bg-gradient-to-r from-[#6050ba] to-[#8070da] text-white shadow-lg shadow-[#6050ba]/30'
                          : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                        Все
                      </div>
                    </button>
                    <button
                      onClick={() => setStatusFilter('distributed')}
                      className={`group relative px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        statusFilter === 'distributed'
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                          : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-blue-400'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        На дистрибьюции
                      </div>
                    </button>
                    <button
                      onClick={() => setStatusFilter('published')}
                      className={`group relative px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        statusFilter === 'published'
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30'
                          : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-green-400'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Опубликован
                      </div>
                    </button>
                    <button
                      onClick={() => setStatusFilter('rejected')}
                      className={`group relative px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        statusFilter === 'rejected'
                          ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30'
                          : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-red-400'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Отклонённые
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Фильтр по типу пользователя */}
              <div className="space-y-2">
                <label className="text-xs text-zinc-400 uppercase tracking-wider font-bold flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Тип подписки
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'all', label: 'Все' },
                    { value: 'basic', label: 'Basic' },
                    { value: 'exclusive', label: 'Exclusive' }
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setFilterUserRole(type.value)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        filterUserRole === type.value
                          ? 'bg-gradient-to-r from-[#6050ba] to-[#8070da] text-white shadow-lg shadow-[#6050ba]/30'
                          : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Фильтр по дате */}
              <div className="space-y-2">
                <label className="text-xs text-zinc-400 uppercase tracking-wider font-bold flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Дата релиза
                </label>
                <div className="relative inline-block w-full">
                  <div 
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="w-full inline-flex px-4 py-2.5 bg-gradient-to-br from-white/[0.07] to-white/[0.03] rounded-xl border border-white/10 cursor-pointer items-center gap-2 text-sm hover:border-[#6050ba]/50 transition"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#9d8df1]">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
                      <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
                      <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
                      <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
                    </svg>
                    <span className={filterDate ? 'text-white' : 'text-zinc-500'}>
                      {filterDate ? new Date(filterDate + 'T00:00:00').toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Выберите дату релиза'}
                    </span>
                    {filterDate && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setFilterDate(''); }}
                        className="ml-auto text-zinc-400 hover:text-white transition"
                        title="Очистить дату"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  {showCalendar && (() => {
                    const safeMonth = Math.max(0, Math.min(11, calendarMonth));
                    const safeYear = Math.max(2020, Math.min(2100, calendarYear));
                    return (
                    <div className="absolute z-50 mt-1 p-3 bg-[#0d0d0f] border border-[#6050ba]/30 rounded-xl shadow-2xl w-72">
                      <div className="flex items-center justify-between mb-3">
                        <button onClick={() => {
                          if (safeMonth === 0) {
                            setCalendarMonth(11);
                            setCalendarYear(safeYear - 1);
                          } else {
                            setCalendarMonth(safeMonth - 1);
                          }
                        }} className="p-1 hover:bg-white/5 rounded-md">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="15 18 9 12 15 6" strokeWidth="2"/></svg>
                        </button>
                        <div className="font-bold text-sm">{new Date(safeYear, safeMonth).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}</div>
                        <button onClick={() => {
                          if (safeMonth === 11) {
                            setCalendarMonth(0);
                            setCalendarYear(safeYear + 1);
                          } else {
                            setCalendarMonth(safeMonth + 1);
                          }
                        }} className="p-1 hover:bg-white/5 rounded-md">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="9 18 15 12 9 6" strokeWidth="2"/></svg>
                        </button>
                      </div>
                      <div className="grid grid-cols-7 gap-0.5 mb-1">
                        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                          <div key={day} className="text-center text-[10px] text-zinc-500 font-bold py-1">{day}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-0.5">
                        {(() => {
                          const firstDay = new Date(safeYear, safeMonth, 1).getDay();
                          const daysInMonth = new Date(safeYear, safeMonth + 1, 0).getDate();
                          const startDay = firstDay === 0 ? 6 : firstDay - 1;
                          const days = [];
                          
                          // Пустые ячейки до начала месяца
                          for (let i = 0; i < startDay; i++) {
                            days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
                          }
                          
                          // Дни месяца
                          for (let day = 1; day <= daysInMonth; day++) {
                            const month = safeMonth + 1;
                            const monthStr = month < 10 ? `0${month}` : `${month}`;
                            const dayStr = day < 10 ? `0${day}` : `${day}`;
                            const dateStr = `${safeYear}-${monthStr}-${dayStr}`;
                            const isSelected = filterDate === dateStr;
                            
                            days.push(
                              <button 
                                key={`day-${day}`} 
                                onClick={() => { setFilterDate(dateStr); setShowCalendar(false); }}
                                className={`w-8 h-8 rounded-md text-xs font-medium transition-all ${
                                  isSelected 
                                    ? 'bg-gradient-to-br from-[#6050ba] to-[#9d8df1] text-white' 
                                    : 'text-white hover:bg-white/10'
                                }`}
                              >
                                {day}
                              </button>
                            );
                          }
                          
                          return days;
                        })()}
                      </div>
                    </div>
                    );
                  })()}
                </div>
                {filterDate && (
                  <div className="text-xs text-zinc-500 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Показаны релизы с датой выхода {new Date(filterDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                )}
              </div>

              {/* Кнопка сброса */}
              {(searchQuery || filterDate || filterUserRole !== 'all' || (viewMode === 'archive' && statusFilter !== 'all')) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterDate('');
                    setFilterUserRole('all');
                    if (viewMode === 'archive') setStatusFilter('all');
                  }}
                  className="w-full mt-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-semibold text-sm transition-all border border-red-500/20 hover:border-red-500/40 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Сбросить все фильтры
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
          <div className="flex justify-center mb-4">
            <svg className="w-16 h-16 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-zinc-500">Нет релизов{searchQuery || filterDate || filterUserRole !== 'all' ? ' по заданным фильтрам' : ' на модерации'}</p>
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
                <div className="flex items-center gap-3">
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
                  
                  <button
                    onClick={handleBulkDelete}
                    disabled={isPublishing}
                    className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 disabled:bg-zinc-700 disabled:text-zinc-500 border-2 border-red-500/40 hover:border-red-500/60 text-red-400 rounded-xl font-bold transition flex items-center gap-2"
                  >
                    {isPublishing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-red-400/20 border-t-red-400 rounded-full animate-spin"></div>
                        Удаляем...
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          <line x1="10" y1="11" x2="10" y2="17"/>
                          <line x1="14" y1="11" x2="14" y2="17"/>
                        </svg>
                        Удалить выбранные
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            {sorted.map((release) => (
            <div
              key={release.id}
              onClick={() => loadFullRelease(release.id, release.release_type)}
              className="p-3 sm:p-5 bg-white/[0.02] border border-white/5 rounded-xl hover:border-[#6050ba]/50 transition cursor-pointer relative"
            >
              <div className="flex items-start gap-3 sm:gap-4">
                {/* Чекбокс для выбора (только в архиве) */}
                {viewMode === 'archive' && (
                  <label 
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="flex-shrink-0 cursor-pointer group relative w-4 h-4 sm:w-5 sm:h-5 transition-transform hover:scale-110 mt-0.5"
                  >
                    <input
                      type="checkbox"
                      checked={selectedReleaseIds.includes(release.id)}
                      onChange={() => toggleSelectRelease(release.id)}
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
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                      release.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      release.status === 'distributed' ? 'bg-blue-500/20 text-blue-400' :
                      release.status === 'published' ? 'bg-green-500/20 text-green-400' :
                      release.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                      'bg-zinc-500/20 text-zinc-400'
                    }`}>
                      {(release.status === 'pending' || release.status === 'distributed') && (
                        <svg className="animate-spin h-3 w-3 mr-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      {release.status === 'rejected' && (
                        <svg className="h-3 w-3 -mr-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      )}
                      {release.status === 'pending' ? 'НА МОДЕРАЦИИ' :
                       release.status === 'distributed' ? 'НА ДИСТРИБЬЮЦИИ' :
                       release.status === 'published' ? 'ОПУБЛИКОВАН' :
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
          ))}
          </div>
        </>
      )}

      {/* Два модальных окна: информация о релизе (слева) и действия (справа) */}
      {showModal && selectedRelease && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-black/80 via-black/70 to-[#6050ba]/20 backdrop-blur-md p-2 sm:p-4 gap-2 sm:gap-4 animate-in fade-in duration-200" onClick={() => setShowModal(false)}>
          
          {/* Toast уведомление поверх модального окна */}
          {toast.show && (
            <div className="fixed inset-0 flex items-center justify-center z-[10000] pointer-events-none">
              <div 
                className="relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 border border-emerald-400/40 rounded-2xl px-8 py-4 shadow-2xl pointer-events-auto backdrop-blur-xl animate-in fade-in zoom-in duration-300"
                style={{ boxShadow: '0 0 60px rgba(16, 185, 129, 0.3), 0 0 30px rgba(16, 185, 129, 0.2)' }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-transparent to-green-500/20 rounded-2xl" />
                <div className="relative flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500/40 blur-md rounded-full animate-pulse" />
                    <svg className="w-5 h-5 text-emerald-400 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="font-bold text-white text-base tracking-wide">{toast.message}</p>
                </div>
              </div>
            </div>
          )}

          {/* ЛЕВОЕ ОКНО: Информация о релизе */}
          <div className="bg-gradient-to-br from-[#0d0d0f] to-[#1a1a1f] border border-white/20 shadow-2xl shadow-[#6050ba]/10 rounded-2xl sm:rounded-3xl w-full lg:w-[800px] flex-shrink-0 max-h-[90vh] overflow-y-auto scrollbar-hide animate-in slide-in-from-left duration-300 relative" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 sm:p-6 lg:p-8">
              {/* Кнопка закрытия */}
              <button 
                onClick={() => setShowModal(false)} 
                className="lg:hidden absolute top-4 right-4 w-12 h-12 rounded-xl bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500/50 hover:border-red-500 flex items-center justify-center flex-shrink-0 transition-all group z-50 shadow-lg"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" stroke="#ef4444" strokeWidth="2.5"/>
                  <line x1="6" y1="6" x2="18" y2="18" stroke="#ef4444" strokeWidth="2.5"/>
                </svg>
              </button>
              
              {/* Заголовок */}
              <div className="flex items-start justify-between mb-4 sm:mb-6">
                <div className="flex-1">
                  <div className="w-8 sm:w-12 h-1 bg-gradient-to-r from-[#6050ba] to-[#9d8df1] rounded-full mb-3 sm:mb-4"></div>
                  <div className="mb-2 sm:mb-3">
                    <span className="text-xs sm:text-sm text-zinc-500 font-medium">Название релиза:</span>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-tight mt-1 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent break-words">{selectedRelease.title}</h2>
                  </div>
                  <div className="mb-2 flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm text-zinc-500 font-medium">Автор:</span>
                    <span className="text-sm sm:text-base font-semibold text-zinc-300 break-words">{selectedRelease.artist_name}</span>
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
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border-2 backdrop-blur-sm ${
                      selectedRelease.status === 'pending' ? 'bg-gradient-to-r from-yellow-500/30 to-yellow-600/20 border-yellow-400/50 text-yellow-300 shadow-lg shadow-yellow-500/20' :
                      selectedRelease.status === 'distributed' ? 'bg-gradient-to-r from-blue-500/30 to-blue-600/20 border-blue-400/50 text-blue-300 shadow-lg shadow-blue-500/20' :
                      selectedRelease.status === 'published' ? 'bg-gradient-to-r from-green-500/30 to-green-600/20 border-green-400/50 text-green-300 shadow-lg shadow-green-500/20' :
                      selectedRelease.status === 'rejected' ? 'bg-gradient-to-r from-red-500/30 to-red-600/20 border-red-400/50 text-red-300 shadow-lg shadow-red-500/20' :
                      'bg-gradient-to-r from-zinc-500/30 to-zinc-600/20 border-zinc-400/50 text-zinc-300 shadow-lg shadow-zinc-500/20'
                    }`}>
                      {selectedRelease.status === 'pending' || selectedRelease.status === 'distributed' ? (
                        <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : selectedRelease.status === 'published' ? '✅' :
                        selectedRelease.status === 'rejected' ? '✕' : '•'}
                      {selectedRelease.status === 'pending' ? 'НА МОДЕРАЦИИ' :
                       selectedRelease.status === 'distributed' ? 'НА ДИСТРИБЬЮЦИИ' :
                       selectedRelease.status === 'published' ? 'ОПУБЛИКОВАН' :
                       selectedRelease.status === 'rejected' ? 'ОТКЛОНЕН' : 
                       selectedRelease.status?.toUpperCase() || 'НЕТ СТАТУСА'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Полная информация о релизе */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
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
                    <div className="font-bold text-lg text-white">{selectedRelease.user_role === 'basic' ? 'Basic' : 'Exclusive'}</div>
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
                    <div className="font-bold text-lg text-white">{selectedRelease.genre}</div>
                    {selectedRelease.subgenres?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedRelease.subgenres.map((sub: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-white/5 rounded text-xs text-white">{sub}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedRelease.release_date && (
                    <div className="p-4 bg-white/5 rounded-xl">
                      <div className="text-xs text-zinc-500 mb-1">Дата релиза</div>
                      <div className="font-bold text-white">{new Date(selectedRelease.release_date).toLocaleDateString('ru-RU')}</div>
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
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9]/g, '');
                              setReleaseUPCInput(value);
                            }}
                            placeholder="Введите UPC код (13 символов)"
                            maxLength={13}
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
                                  showToast('UPC код скопирован', 'success');
                                }}
                                className="px-2.5 py-1.5 bg-white/5 hover:bg-[#6050ba]/30 rounded-lg transition group"
                                title="Копировать UPC код"
                              >
                                <svg className="w-4 h-4 text-zinc-400 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
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
                              <div className="flex-1 px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                  <span className="text-sm text-yellow-300">UPC код пока не добавлен</span>
                                </div>
                              </div>
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
                      <details key={idx} className="group relative bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:border-[#6050ba]/50 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-[#6050ba]/10">
                        <summary className="cursor-pointer p-5 list-none flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6050ba]/30 to-[#9d8df1]/20 border-2 border-[#6050ba]/40 flex items-center justify-center text-lg font-black text-white flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-[#6050ba]/20">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-lg text-white group-hover:text-[#9d8df1] transition-colors">{track.title}</div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {track.language && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-gradient-to-r from-blue-500/20 to-blue-600/10 border border-blue-400/30 rounded-lg text-xs font-semibold text-blue-300">
                                  {track.language}
                                </span>
                              )}
                              {track.hasDrugs && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-gradient-to-r from-red-500/20 to-red-600/10 border border-red-400/30 rounded-lg text-xs font-bold text-red-300">
                                  Explicit
                                </span>
                              )}
                            </div>
                          </div>
                          <svg className="w-5 h-5 text-zinc-400 group-open:rotate-180 transition-transform flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <polyline points="6 9 12 15 18 9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </summary>
                        <div className="px-5 pb-5">
                          <div className="pt-3 border-t border-white/10">

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

                            {/* Аудиоплеер */}
                            {(track.link || track.audio_url || track.audioFile) && (
                              <div className="mt-3">
                                <AudioPlayer
                                  releaseId={selectedRelease.id}
                                  releaseType={selectedRelease.release_type}
                                  trackIndex={idx}
                                  supabase={supabase}
                                  variant="full"
                                  className="w-full"
                                />
                              </div>
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
                                        onChange={(e) => {
                                          const value = e.target.value.replace(/[^A-Za-z0-9]/g, '');
                                          setEditingTrackISRC({ trackIndex: idx, isrc: value });
                                        }}
                                        placeholder="Введите ISRC код (12 символов)"
                                        maxLength={12}
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
                                      <div className="text-xs text-zinc-500 mb-1">ISRC код:</div>
                                      <div className="flex items-center gap-2 flex-1">
                                        {track.isrc ? (
                                          <>
                                            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs font-mono text-emerald-400 flex-1">
                                              {track.isrc}
                                            </span>
                                            <button
                                              onClick={() => {
                                                navigator.clipboard.writeText(track.isrc);
                                                showToast('ISRC код скопирован', 'success');
                                              }}
                                              className="px-2.5 py-1.5 bg-white/5 hover:bg-[#6050ba]/30 rounded-lg transition group"
                                              title="Копировать ISRC код"
                                            >
                                              <svg className="w-4 h-4 text-zinc-400 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                              </svg>
                                            </button>
                                          </>
                                        ) : (
                                          <div className="flex-1 px-2 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                            <div className="flex items-center gap-1.5">
                                              <svg className="w-3 h-3 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                              </svg>
                                              <span className="text-xs text-yellow-300">ISRC код не добавлен</span>
                                            </div>
                                          </div>
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
                      </details>
                    ))}
                  </div>
                </div>
              )}

              {/* Страны */}
              {selectedRelease.countries?.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold mb-3 text-white">Страны распространения ({selectedRelease.countries.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedRelease.countries.map((country: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-white/5 rounded-lg text-sm text-white">{country}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Платформы */}
              {selectedRelease.platforms?.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold mb-3 text-white">Платформы ({selectedRelease.platforms.filter((p: string) => 
                    ['Spotify', 'Apple Music', 'YouTube Music', 'VK Музыка', 'Яндекс Музыка'].includes(p)
                  ).length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedRelease.platforms
                      .filter((platform: string) => 
                        ['Spotify', 'Apple Music', 'YouTube Music', 'VK Музыка', 'Яндекс Музыка'].includes(platform)
                      )
                      .map((platform: string, idx: number) => (
                        <span key={idx} className="px-3 py-1 bg-white/5 rounded-lg text-sm text-white">{platform}</span>
                      ))}
                  </div>
                </div>
              )}

              {/* Промо */}
              {(selectedRelease.focus_track || selectedRelease.focus_track_promo || selectedRelease.album_description) && (
                <div className="mb-6 space-y-3">
                  <h3 className="font-bold mb-3 text-white">Промо-информация</h3>
                  
                  {/* Фокус-трек и промо */}
                  {(selectedRelease.focus_track || selectedRelease.focus_track_promo) && (
                    <details className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-[#6050ba]/50 transition group">
                      <summary className="cursor-pointer font-medium flex items-center justify-between text-white">
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
                      <summary className="cursor-pointer font-medium flex items-center justify-between text-white">
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
                      <summary className="cursor-pointer font-medium flex items-center justify-between text-white">
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

              {/* КНОПКИ ДЕЙСТВИЙ ДЛЯ МОБИЛКИ */}
              <div className="lg:hidden mt-6 pt-6 border-t border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6050ba] to-[#9d8df1] flex items-center justify-center shadow-lg shadow-[#6050ba]/30">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M12.89 1.45l8 4A2 2 0 0 1 22 7.24v9.53a2 2 0 0 1-1.11 1.79l-8 4a2 2 0 0 1-1.79 0l-8-4a2 2 0 0 1-1.1-1.8V7.24a2 2 0 0 1 1.11-1.79l8-4a2 2 0 0 1 1.78 0z"/>
                      <polyline points="12 22 12 12"/>
                      <polyline points="12 12 2.5 6.5"/>
                      <polyline points="12 12 21.5 6.5"/>
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Действия</h3>
                </div>

                {/* Для Basic релизов: проверка платежа */}
                {selectedRelease.user_role === 'basic' && selectedRelease.payment_status === 'pending' && (
                  <div className="mb-4">
                    <div className="p-4 bg-gradient-to-br from-yellow-500/20 to-orange-600/10 border-2 border-yellow-400/40 rounded-xl shadow-xl shadow-yellow-500/20">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/30 to-yellow-600/20 flex items-center justify-center flex-shrink-0 border-2 border-yellow-400/50">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-yellow-300" strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/>
                            <line x1="12" y1="17" x2="12.01" y2="17"/>
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-yellow-300 font-black text-sm mb-1">Требуется проверка платежа</h4>
                          <p className="text-xs text-yellow-200/80">Подтвердите оплату перед публикацией</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <button
                          onClick={() => handleVerifyPayment(true)}
                          className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-xl font-bold transition shadow-lg shadow-emerald-500/30"
                        >
                          ✓ Подтвердить платеж
                        </button>
                        <button
                          onClick={() => handleVerifyPayment(false)}
                          className="w-full px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-bold transition"
                        >
                          ✕ Отклонить платеж
                        </button>
                      </div>
                      {selectedRelease.payment_receipt && (
                        <div className="mt-3 p-3 bg-white/5 rounded-lg">
                          <div className="text-xs text-zinc-400 mb-2">Чек от пользователя:</div>
                          <a href={selectedRelease.payment_receipt} target="_blank" rel="noopener noreferrer" className="text-sm text-[#6050ba] hover:text-[#9d8df1] transition block truncate">
                            {selectedRelease.payment_receipt}
                          </a>
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
                    className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-white/10 to-white/5 hover:from-[#6050ba]/30 hover:to-[#9d8df1]/20 border-2 border-white/20 hover:border-[#6050ba]/50 rounded-xl font-bold transition-all shadow-lg hover:shadow-[#6050ba]/30 flex items-center justify-center gap-2 group text-sm sm:text-base"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:rotate-12 transition-transform flex-shrink-0">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Редактировать релиз
                  </button>

                  {/* Кнопка удаления (только в архиве) */}
                  {viewMode === 'archive' && (
                    <button
                      onClick={handleDeleteRelease}
                      className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-red-500/20 to-red-600/10 hover:from-red-500/30 hover:to-red-600/20 border-2 border-red-500/40 hover:border-red-500/60 rounded-xl font-bold transition-all shadow-lg hover:shadow-red-500/30 flex items-center justify-center gap-2 group text-red-300 hover:text-red-200 text-sm sm:text-base"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:scale-110 transition-transform flex-shrink-0">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                      </svg>
                      Удалить релиз
                    </button>
                  )}

                  {selectedRelease.status === 'pending' && (
                    <>
                      <button
                        onClick={handleApprove}
                        disabled={selectedRelease.release_type === 'basic' && selectedRelease.payment_status !== 'verified'}
                        className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:from-zinc-700 disabled:to-zinc-800 disabled:text-zinc-500 text-white rounded-xl font-black transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 disabled:shadow-none hover:scale-[1.02] flex flex-col items-center justify-center gap-1 group text-sm sm:text-base"
                      >
                        <span className="flex items-center gap-2">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:scale-110 transition-transform flex-shrink-0">
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
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none mb-2 text-sm"
                          rows={3}
                        />
                        <button
                          onClick={handleReject}
                          disabled={!rejectionReason.trim()}
                          className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 text-red-400 rounded-xl font-bold transition text-sm sm:text-base"
                        >
                          ✕ Отклонить релиз
                        </button>
                      </div>
                    </>
                  )}

                  {selectedRelease.status === 'distributed' && (
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-center">
                      <div className="text-blue-400 font-bold text-sm flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Релиз на дистрибьюции
                      </div>
                      {selectedRelease.approved_at && (
                        <div className="text-xs text-zinc-500 mt-1">
                          {new Date(selectedRelease.approved_at).toLocaleString('ru-RU')}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedRelease.status === 'published' && (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
                      <div className="text-green-400 font-bold text-sm">✅ Релиз опубликован</div>
                      {selectedRelease.published_at && (
                        <div className="text-xs text-zinc-500 mt-1">
                          {new Date(selectedRelease.published_at).toLocaleString('ru-RU')}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedRelease.status === 'rejected' && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <div className="text-red-400 font-bold mb-2 text-sm flex items-center gap-2">
                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                        Релиз отклонен
                      </div>
                      {selectedRelease.rejection_reason && (
                        <div className="text-xs sm:text-sm text-white">{selectedRelease.rejection_reason}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ПРАВОЕ ОКНО: Действия и платеж */}
          <div className="hidden lg:block bg-gradient-to-br from-[#0d0d0f] to-[#1a1a1f] border border-white/20 shadow-2xl shadow-[#6050ba]/10 rounded-3xl w-[500px] flex-shrink-0 max-h-[90vh] overflow-y-auto scrollbar-hide animate-in slide-in-from-right duration-300" onClick={(e) => e.stopPropagation()}>
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
                <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-xl bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500/50 hover:border-red-500 flex items-center justify-center flex-shrink-0 transition-all group shadow-lg">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" stroke="#ef4444"/>
                    <line x1="6" y1="6" x2="18" y2="18" stroke="#ef4444"/>
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
                  className="w-full px-6 py-4 bg-gradient-to-r from-white/10 to-white/5 hover:from-[#6050ba]/30 hover:to-[#9d8df1]/20 border-2 border-white/20 hover:border-[#6050ba]/50 rounded-xl font-bold transition-all shadow-lg hover:shadow-[#6050ba]/30 flex items-center justify-center gap-2 group text-white"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:rotate-12 transition-transform">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Редактировать релиз
                </button>

                {/* Кнопка скачивания Excel метаданных */}
                <button
                  onClick={async () => {
                    try {
                      const url = `/api/admin/export-release-metadata?releaseId=${selectedRelease.id}&releaseType=${selectedRelease.release_type}`;
                      const response = await fetch(url);
                      
                      if (!response.ok) {
                        throw new Error('Ошибка при генерации файла');
                      }
                      
                      const blob = await response.blob();
                      const downloadUrl = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = downloadUrl;
                      // Имя файла генерируется на сервере и берётся из Content-Disposition
                      const contentDisposition = response.headers.get('Content-Disposition');
                      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
                      const filename = filenameMatch 
                        ? filenameMatch[1] 
                        : `${selectedRelease.artist_name || 'Artist'} - ${selectedRelease.title}${selectedRelease.custom_id ? ` (${selectedRelease.custom_id})` : ''}.xlsx`;
                      a.download = filename;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(downloadUrl);
                      document.body.removeChild(a);
                      
                      showToast('Excel файл успешно скачан!', 'success');
                    } catch (error) {
                      console.error('Error downloading Excel:', error);
                      showToast('Ошибка при скачивании файла', 'error');
                    }
                  }}
                  className="w-full px-6 py-4 bg-gradient-to-r from-green-500/20 to-green-600/10 hover:from-green-500/30 hover:to-green-600/20 border-2 border-green-500/40 hover:border-green-500/60 rounded-xl font-bold transition-all shadow-lg hover:shadow-green-500/30 flex items-center justify-center gap-2 group text-white"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:scale-110 transition-transform">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Скачать метаданные (.xlsx)
                </button>

                {/* Кнопка удаления (только в архиве) */}
                {viewMode === 'archive' && (
                  <button
                    onClick={handleDeleteRelease}
                    className="w-full px-6 py-4 bg-gradient-to-r from-red-500/20 to-red-600/10 hover:from-red-500/30 hover:to-red-600/20 border-2 border-red-500/40 hover:border-red-500/60 rounded-xl font-bold transition-all shadow-lg hover:shadow-red-500/30 flex items-center justify-center gap-2 group text-white"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:scale-110 transition-transform">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      <line x1="10" y1="11" x2="10" y2="17"/>
                      <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                    Удалить релиз
                  </button>
                )}

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
                    <div className="text-blue-400 font-bold flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Релиз на дистрибьюции
                    </div>
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

                {selectedRelease.status === 'distributed' && (
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
                      <div className="text-sm text-white">
                        Причина: {selectedRelease.rejection_reason}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Красивое модальное окно подтверждения удаления */}
      {showDeleteConfirm && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-gradient-to-br from-[#0d0d0f] to-[#1a1a1f] border-2 border-red-500/30 shadow-2xl shadow-red-500/20 rounded-3xl max-w-md w-full animate-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
            {/* Header с иконкой предупреждения */}
            <div className="p-8 pb-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/30 to-rose-600/20 border-2 border-red-500/50 flex items-center justify-center animate-pulse">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-red-400" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-black text-white mb-2">
                    Подтвердите удаление
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {deleteType === 'single' 
                      ? selectedRelease 
                        ? `Вы уверены, что хотите удалить релиз "${selectedRelease.title}"?`
                        : 'Вы уверены, что хотите удалить релиз?'
                      : `Вы уверены, что хотите удалить ${deleteCount} ${deleteCount === 1 ? 'релиз' : deleteCount < 5 ? 'релиза' : 'релизов'}?`
                    }
                  </p>
                </div>
              </div>

              {/* Блок предупреждения */}
              <div className="p-4 bg-red-500/10 border-2 border-red-500/30 rounded-xl mb-6">
                <div className="flex items-start gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-red-400 flex-shrink-0 mt-0.5" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <div className="flex-1">
                    <p className="text-red-300 text-sm font-bold">Это действие необратимо!</p>
                    <p className="text-red-400/80 text-xs mt-1">Все данные релиза будут безвозвратно удалены из системы.</p>
                  </div>
                </div>
              </div>

              {/* Кнопки */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border-2 border-white/20 hover:border-white/30 rounded-xl font-bold transition-all text-white"
                >
                  Отмена
                </button>
                <button
                  onClick={deleteType === 'single' ? confirmDeleteRelease : confirmBulkDelete}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 rounded-xl font-bold transition-all shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-[1.02] text-white flex items-center justify-center gap-2 group"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:scale-110 transition-transform">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
                  Удалить
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
