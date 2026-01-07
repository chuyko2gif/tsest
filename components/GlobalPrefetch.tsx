"use client";

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * GlobalPrefetch - ТУРБО prefetch для мгновенных переходов
 * 
 * Стратегия:
 * 1. При наведении на ссылку - мгновенный prefetch
 * 2. При появлении ссылки в viewport - фоновый prefetch
 * 3. Кэширование уже загруженных URL
 * 4. Throttling для экономии ресурсов на слабых устройствах
 */

// Глобальный кэш загруженных URL
const prefetchedUrls = new Set<string>();

// Очередь для prefetch с приоритетами
const prefetchQueue: { url: string; priority: number }[] = [];
let isProcessingQueue = false;

// Детекция слабого устройства
const isLowEndDevice = typeof window !== 'undefined' && (
  navigator.hardwareConcurrency <= 4 ||
  (navigator as any).deviceMemory <= 4
);

// Throttle для экономии ресурсов
function throttle<T extends (...args: any[]) => any>(fn: T, delay: number): T {
  let lastCall = 0;
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return fn(...args);
    }
  }) as T;
}

export function GlobalPrefetch() {
  const router = useRouter();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);

  const executePrefetch = useCallback((url: string) => {
    if (prefetchedUrls.has(url)) return;
    
    prefetchedUrls.add(url);
    
    // Используем requestIdleCallback для фонового prefetch
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        router.prefetch(url);
      }, { timeout: 2000 });
    } else {
      setTimeout(() => router.prefetch(url), 100);
    }
  }, [router]);

  const processQueue = useCallback(() => {
    if (isProcessingQueue || prefetchQueue.length === 0) return;
    
    isProcessingQueue = true;
    
    // Сортируем по приоритету
    prefetchQueue.sort((a, b) => b.priority - a.priority);
    
    const process = () => {
      if (prefetchQueue.length === 0) {
        isProcessingQueue = false;
        return;
      }

      const item = prefetchQueue.shift();
      if (item) {
        executePrefetch(item.url);
      }

      // Обрабатываем следующий с задержкой
      setTimeout(process, 100);
    };

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(process, { timeout: 3000 });
    } else {
      setTimeout(process, 200);
    }
  }, [executePrefetch]);

  const prefetchUrl = useCallback((url: string, priority: number = 1) => {
    // Проверяем что это внутренняя ссылка и ещё не загружена
    if (
      !url || 
      prefetchedUrls.has(url) ||
      (!url.startsWith('/') && !url.startsWith(window.location.origin))
    ) {
      return;
    }

    // Нормализуем URL
    const normalizedUrl = url.startsWith('/') ? url : new URL(url).pathname;
    
    if (prefetchedUrls.has(normalizedUrl)) return;

    // На слабых устройствах добавляем в очередь
    if (isLowEndDevice) {
      prefetchQueue.push({ url: normalizedUrl, priority });
      processQueue();
    } else {
      // На мощных устройствах - сразу prefetch
      executePrefetch(normalizedUrl);
    }
  }, [executePrefetch, processQueue]);

  useEffect(() => {
    // Throttled обработчик наведения
    const handleMouseOver = throttle((e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link?.href) {
        prefetchUrl(link.href, 10); // Высокий приоритет для hover
      }
    }, 50);

    // Обработчик касания для мобильных
    const handleTouchStart = throttle((e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link?.href) {
        prefetchUrl(link.href, 10);
      }
    }, 100);

    // Intersection Observer для prefetch ссылок в viewport
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const link = entry.target as HTMLAnchorElement;
            if (link.href) {
              prefetchUrl(link.href, 1); // Низкий приоритет для viewport
            }
          }
        });
      },
      { 
        rootMargin: isLowEndDevice ? '100px' : '200px',
        threshold: 0 
      }
    );

    // Функция для наблюдения за всеми ссылками
    const observeLinks = throttle(() => {
      document.querySelectorAll('a[href]').forEach((link) => {
        const href = link.getAttribute('href');
        if (href && (href.startsWith('/') || href.startsWith(window.location.origin))) {
          if (!prefetchedUrls.has(href)) {
            observerRef.current?.observe(link);
          }
        }
      });
    }, 500);

    // MutationObserver для новых ссылок
    mutationObserverRef.current = new MutationObserver(
      throttle(() => observeLinks(), 1000)
    );

    // Слушаем события
    document.addEventListener('mouseover', handleMouseOver, { passive: true });
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    
    // Запускаем наблюдение
    observeLinks();
    mutationObserverRef.current.observe(document.body, { 
      childList: true, 
      subtree: true 
    });

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('touchstart', handleTouchStart);
      observerRef.current?.disconnect();
      mutationObserverRef.current?.disconnect();
    };
  }, [prefetchUrl]);

  return null;
}

// Экспорт для ручного вызова prefetch
export function manualPrefetch(url: string) {
  if (!prefetchedUrls.has(url)) {
    prefetchedUrls.add(url);
  }
}

// Очистка кэша prefetch
export function clearPrefetchCache() {
  prefetchedUrls.clear();
}

export default GlobalPrefetch;
