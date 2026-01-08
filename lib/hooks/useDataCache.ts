"use client";

import { useCallback, useRef, useState, useEffect } from 'react';

/**
 * useDataCache - Легковесная система кэширования данных для МГНОВЕННЫХ переходов
 * 
 * Особенности:
 * 1. Глобальный кэш - данные доступны между компонентами
 * 2. Stale-While-Revalidate - показываем кэш сразу, обновляем в фоне
 * 3. Prefetch on Hover - загрузка данных до клика
 * 4. Умное обновление - не грузим если данные свежие
 * 
 * Использование:
 * const { data, isLoading, prefetch, refresh } = useDataCache('users-list', fetchUsers);
 */

// Глобальный кэш данных
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  isLoading: boolean;
}

const globalCache = new Map<string, CacheEntry<any>>();
const pendingRequests = new Map<string, Promise<any>>();
const subscribers = new Map<string, Set<() => void>>();

// Время жизни кэша по умолчанию (5 минут)
const DEFAULT_STALE_TIME = 5 * 60 * 1000;

// Уведомление подписчиков об изменении
function notifySubscribers(key: string) {
  const subs = subscribers.get(key);
  if (subs) {
    subs.forEach(cb => cb());
  }
}

// ============================================================================
// Основной хук useDataCache
// ============================================================================

interface UseDataCacheOptions<T> {
  /** Время жизни кэша в мс (по умолчанию 5 минут) */
  staleTime?: number;
  /** Автоматически загружать при монтировании */
  enabled?: boolean;
  /** Callback при успешной загрузке */
  onSuccess?: (data: T) => void;
  /** Callback при ошибке */
  onError?: (error: Error) => void;
  /** Начальные данные */
  initialData?: T;
}

export function useDataCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseDataCacheOptions<T> = {}
) {
  const {
    staleTime = DEFAULT_STALE_TIME,
    enabled = true,
    onSuccess,
    onError,
    initialData,
  } = options;

  const [, forceUpdate] = useState({});
  const mountedRef = useRef(true);
  const fetcherRef = useRef(fetcher);
  
  // Обновляем fetcher в useEffect чтобы избежать ошибки "Cannot update ref during render"
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  // Подписываемся на изменения
  useEffect(() => {
    mountedRef.current = true;
    
    const callback = () => {
      if (mountedRef.current) {
        forceUpdate({});
      }
    };
    
    if (!subscribers.has(key)) {
      subscribers.set(key, new Set());
    }
    subscribers.get(key)!.add(callback);
    
    return () => {
      mountedRef.current = false;
      subscribers.get(key)?.delete(callback);
    };
  }, [key]);

  // Получаем данные из кэша
  const getCached = useCallback((): CacheEntry<T> | undefined => {
    return globalCache.get(key);
  }, [key]);

  // Проверка свежести данных
  const isStale = useCallback((): boolean => {
    const cached = getCached();
    if (!cached) return true;
    return Date.now() - cached.timestamp > staleTime;
  }, [getCached, staleTime]);

  // Основная функция загрузки
  const fetchData = useCallback(async (force = false): Promise<T | null> => {
    const cached = getCached();
    
    // Если есть свежий кэш и не форсируем - возвращаем кэш
    if (!force && cached && !isStale()) {
      return cached.data;
    }

    // Если уже есть pending запрос - ждём его
    const pending = pendingRequests.get(key);
    if (pending) {
      return pending;
    }

    // Устанавливаем loading
    if (cached) {
      globalCache.set(key, { ...cached, isLoading: true });
    } else {
      globalCache.set(key, { data: initialData as T, timestamp: 0, isLoading: true });
    }
    notifySubscribers(key);

    // Создаём запрос
    const promise = fetcherRef.current()
      .then(data => {
        globalCache.set(key, { data, timestamp: Date.now(), isLoading: false });
        pendingRequests.delete(key);
        notifySubscribers(key);
        onSuccess?.(data);
        return data;
      })
      .catch(error => {
        // При ошибке сохраняем старые данные если есть
        const oldCached = getCached();
        if (oldCached) {
          globalCache.set(key, { ...oldCached, isLoading: false });
        } else {
          globalCache.delete(key);
        }
        pendingRequests.delete(key);
        notifySubscribers(key);
        onError?.(error);
        throw error;
      });

    pendingRequests.set(key, promise);
    return promise;
  }, [key, getCached, isStale, initialData, onSuccess, onError]);

  // Prefetch - загружаем в фоне без возврата ошибок
  const prefetch = useCallback(() => {
    const cached = getCached();
    if (!cached || isStale()) {
      fetchData().catch(() => {}); // Игнорируем ошибки prefetch
    }
  }, [getCached, isStale, fetchData]);

  // Refresh - принудительное обновление
  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // Мутация - обновление данных локально (optimistic update)
  const mutate = useCallback((data: T | ((prev: T | undefined) => T)) => {
    const cached = getCached();
    const newData = typeof data === 'function' 
      ? (data as (prev: T | undefined) => T)(cached?.data)
      : data;
    
    globalCache.set(key, { 
      data: newData, 
      timestamp: Date.now(), 
      isLoading: false 
    });
    notifySubscribers(key);
  }, [key, getCached]);

  // Автозагрузка при монтировании
  useEffect(() => {
    if (enabled) {
      const cached = getCached();
      if (!cached || isStale()) {
        fetchData().catch(() => {});
      }
    }
  }, [enabled, fetchData, getCached, isStale]);

  const cached = getCached();

  return {
    data: cached?.data ?? initialData,
    isLoading: cached?.isLoading ?? false,
    isStale: isStale(),
    isCached: !!cached,
    prefetch,
    refresh,
    mutate,
  };
}

// ============================================================================
// Утилиты для работы с кэшем
// ============================================================================

/**
 * Очистить весь кэш
 */
export function clearAllCache() {
  globalCache.clear();
  pendingRequests.clear();
}

/**
 * Очистить конкретный ключ
 */
export function clearCacheKey(key: string) {
  globalCache.delete(key);
  pendingRequests.delete(key);
  notifySubscribers(key);
}

/**
 * Prefetch данные без подписки
 */
export async function prefetchData<T>(key: string, fetcher: () => Promise<T>): Promise<T | null> {
  const cached = globalCache.get(key);
  if (cached && Date.now() - cached.timestamp < DEFAULT_STALE_TIME) {
    return cached.data;
  }

  const pending = pendingRequests.get(key);
  if (pending) return pending;

  const promise = fetcher()
    .then(data => {
      globalCache.set(key, { data, timestamp: Date.now(), isLoading: false });
      pendingRequests.delete(key);
      return data;
    })
    .catch(error => {
      pendingRequests.delete(key);
      throw error;
    });

  pendingRequests.set(key, promise);
  return promise;
}

/**
 * Получить данные из кэша синхронно
 */
export function getCachedData<T>(key: string): T | undefined {
  return globalCache.get(key)?.data;
}

/**
 * Проверить есть ли данные в кэше
 */
export function hasCachedData(key: string): boolean {
  return globalCache.has(key);
}

// ============================================================================
// Хук для prefetch при hover на элементе
// ============================================================================

export function usePrefetchOnHover<T>(key: string, fetcher: () => Promise<T>) {
  const prefetched = useRef(false);
  
  const handlers = {
    onMouseEnter: () => {
      if (!prefetched.current) {
        prefetched.current = true;
        prefetchData(key, fetcher).catch(() => {});
      }
    },
    onTouchStart: () => {
      if (!prefetched.current) {
        prefetched.current = true;
        prefetchData(key, fetcher).catch(() => {});
      }
    },
  };

  return handlers;
}

export default useDataCache;
