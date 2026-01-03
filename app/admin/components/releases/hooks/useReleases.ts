import { useState, useEffect, useMemo, useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Release } from '../types';

interface UseReleasesReturn {
  releases: Release[];
  loading: boolean;
  loadReleases: () => Promise<void>;
  loadFullRelease: (releaseId: string, releaseType: 'basic' | 'exclusive') => Promise<Release | null>;
}

export function useReleases(supabase: SupabaseClient | null): UseReleasesReturn {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReleases = useCallback(async () => {
    if (!supabase) return;
    
    setLoading(true);
    try {
      // Загружаем ВСЕ релизы из обеих таблиц (кроме черновиков)
      let query1 = supabase
        .from('releases_basic')
        .select('*')
        .neq('status', 'draft');
      
      let query2 = supabase
        .from('releases_exclusive')
        .select('*')
        .neq('status', 'draft');
      
      const [basicResult, exclusiveResult] = await Promise.all([query1, query2]);
      
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
      
      let userProfiles: Record<string, any> = {};
      if (uniqueUserIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, display_name, email, avatar, nickname')
          .in('id', uniqueUserIds);
        
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
      
      setReleases(allReleases);
    } catch (error) {
      console.error('Ошибка загрузки релизов:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const loadFullRelease = useCallback(async (releaseId: string, releaseType: 'basic' | 'exclusive'): Promise<Release | null> => {
    if (!supabase) return null;
    
    try {
      const tableName = releaseType === 'basic' ? 'releases_basic' : 'releases_exclusive';
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', releaseId)
        .single();
      
      if (error) throw error;
      
      const userRole = releaseType === 'basic' ? 'basic' : 'exclusive';
      
      return { 
        ...data, 
        release_type: releaseType,
        user_role: userRole
      } as Release;
    } catch (error) {
      console.error('Ошибка загрузки релиза:', error);
      return null;
    }
  }, [supabase]);

  useEffect(() => {
    loadReleases();
  }, [loadReleases]);

  return {
    releases,
    loading,
    loadReleases,
    loadFullRelease
  };
}

// Хук для фильтрации и сортировки релизов
interface FilterOptions {
  viewMode: 'moderation' | 'archive' | 'create';
  statusFilter: string;
  searchQuery: string;
  filterDate: string;
  filterUserRole: string;
  sortBy: 'date' | 'title' | 'artist';
  order: 'asc' | 'desc';
}

export function useFilteredReleases(releases: Release[], options: FilterOptions) {
  const { viewMode, statusFilter, searchQuery, filterDate, filterUserRole, sortBy, order } = options;

  return useMemo(() => {
    let filtered = releases;

    // Фильтр по режиму (модерация или архив)
    if (viewMode === 'moderation') {
      filtered = filtered.filter(r => r.status === 'pending');
    } else if (viewMode === 'archive') {
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
        const matchBasic = 
          (r.title && r.title.toLowerCase().includes(query)) ||
          (r.artist_name && r.artist_name.toLowerCase().includes(query)) ||
          (r.user_email && r.user_email.toLowerCase().includes(query));
        
        const matchUPC = r.upc && r.upc.toLowerCase().includes(query);
        
        const matchIRSC = r.tracks && Array.isArray(r.tracks) && r.tracks.some((track: any) => 
          track.isrc && track.isrc.toLowerCase().includes(query)
        );
        
        return matchBasic || matchUPC || matchIRSC;
      });
    }

    // Фильтр по дате
    if (filterDate) {
      filtered = filtered.filter(r => {
        if (!r.release_date) return false;
        const releaseDateStr = r.release_date.split('T')[0];
        return releaseDateStr === filterDate;
      });
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
}
