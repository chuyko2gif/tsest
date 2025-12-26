// Хуки для работы с релизами
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Release, FilterState } from './types';

export function useReleases(userId?: string | null) {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [tracksMap, setTracksMap] = useState<Record<string, any[]>>({});

  useEffect(() => {
    if (!supabase || !userId) {
      setReleases([]);
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        let allReleases: Release[] = [];
        
        // Загружаем релизы из обеих таблиц
        // Для черновиков сортируем по draft_order, для остальных по created_at
        const [basicResult, exclusiveResult] = await Promise.all([
          supabase!
            .from('releases_basic')
            .select('*')
            .eq('user_id', userId)
            .order('draft_order', { ascending: true, nullsFirst: false })
            .order('created_at', { ascending: false }),
          supabase!
            .from('releases_exclusive')
            .select('*')
            .eq('user_id', userId)
            .order('draft_order', { ascending: true, nullsFirst: false })
            .order('created_at', { ascending: false })
        ]);
        
        // Помечаем релизы типом для правильного редактирования
        const basicReleases = (basicResult.data || []).map(r => ({ ...r, release_type: 'basic' as const }));
        const exclusiveReleases = (exclusiveResult.data || []).map(r => ({ ...r, release_type: 'exclusive' as const }));
        
        // Объединяем и сортируем: черновики по draft_order, остальные по дате
        allReleases = [...basicReleases, ...exclusiveReleases].sort((a, b) => {
          // Если оба черновики - сортируем по draft_order
          if (a.status === 'draft' && b.status === 'draft') {
            const orderA = (a as any).draft_order || 999999;
            const orderB = (b as any).draft_order || 999999;
            return orderA - orderB;
          }
          // Если один черновик, другой нет - черновики в конец
          if (a.status === 'draft') return 1;
          if (b.status === 'draft') return -1;
          // Для не-черновиков сортируем по дате
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        });
        
        setReleases(allReleases);
      } catch (e) {
        console.warn('Не удалось загрузить релизы артиста:', e);
        setReleases([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const reloadReleases = async () => {
    if (!supabase || !userId) {
      setReleases([]);
      return;
    }

    try {
      let allReleases: Release[] = [];
      
      const [basicResult, exclusiveResult] = await Promise.all([
        supabase!
          .from('releases_basic')
          .select('*')
          .eq('user_id', userId)
          .order('draft_order', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: false }),
        supabase!
          .from('releases_exclusive')
          .select('*')
          .eq('user_id', userId)
          .order('draft_order', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: false })
      ]);
      
      const basicReleases = (basicResult.data || []).map(r => ({ ...r, release_type: 'basic' as const }));
      const exclusiveReleases = (exclusiveResult.data || []).map(r => ({ ...r, release_type: 'exclusive' as const }));
      
      allReleases = [...basicReleases, ...exclusiveReleases].sort((a, b) => {
        if (a.status === 'draft' && b.status === 'draft') {
          const orderA = (a as any).draft_order || 999999;
          const orderB = (b as any).draft_order || 999999;
          return orderA - orderB;
        }
        if (a.status === 'draft') return 1;
        if (b.status === 'draft') return -1;
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });
      
      setReleases(allReleases);
    } catch (e) {
      console.warn('Не удалось обновить релизы:', e);
    }
  };

  const loadTracks = async (releaseId: string) => {
    if (!tracksMap[releaseId] && supabase) {
      try {
        const { data } = await supabase.from('tracks').select('*').eq('release_id', releaseId).order('created_at', { ascending: true });
        setTracksMap(prev => ({ ...prev, [releaseId]: data || [] }));
      } catch (e) {
        console.warn('Не удалось загрузить треки релиза', e);
        setTracksMap(prev => ({ ...prev, [releaseId]: [] }));
      }
    }
  };

  return { releases, loading, tracksMap, setTracksMap, loadTracks, reloadReleases };
}

export function useFilteredReleases(releases: Release[], filters: FilterState) {
  const filtered = releases.filter(r => {
    // Фильтр по архиву
    if (filters.showArchive) {
      if (r.status !== 'draft') return false;
    } else {
      if (r.status === 'draft') return false;
    }
    
    // Фильтр по статусу
    if (filters.filterStatus !== 'all' && r.status !== filters.filterStatus) return false;
    
    // Фильтр по жанру
    if (filters.filterGenre !== 'all' && r.genre !== filters.filterGenre) return false;
    
    // Поиск по названию и артисту
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const title = (r.title || '').toLowerCase();
      const artist = ((r.artist_name || r.artist) || '').toLowerCase();
      const genre = (r.genre || '').toLowerCase();
      
      if (!title.includes(query) && !artist.includes(query) && !genre.includes(query)) {
        return false;
      }
    }
    
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    // Черновики всегда сортируем по draft_order, независимо от других фильтров
    if (filters.showArchive && a.status === 'draft' && b.status === 'draft') {
      const orderA = (a as any).draft_order || 999999;
      const orderB = (b as any).draft_order || 999999;
      return orderA - orderB;
    }
    
    if (filters.sortBy === 'date') {
      const da = new Date(a.date || a.created_at || 0).getTime();
      const db = new Date(b.date || b.created_at || 0).getTime();
      return filters.order === 'asc' ? da - db : db - da;
    }
    if (filters.sortBy === 'title') {
      return filters.order === 'asc' 
        ? String(a.title).localeCompare(String(b.title)) 
        : String(b.title).localeCompare(String(a.title));
    }
    if (filters.sortBy === 'status') {
      const map: Record<string, number> = { pending: 0, draft: 1, distributed: 2, rejected: 3 };
      const oa = map[a.status] ?? 99;
      const ob = map[b.status] ?? 99;
      return filters.order === 'asc' ? oa - ob : ob - oa;
    }
    return 0;
  });

  return filters.showArchive ? sorted.slice(0, 10) : sorted;
}
