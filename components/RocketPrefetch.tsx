"use client";

import { useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * ROCKET PREFETCH 🚀 - АГРЕССИВНАЯ предзагрузка для МГНОВЕННЫХ переходов
 * 
 * Стратегии:
 * 1. Предзагрузка при видимости ссылки (Intersection Observer)
 * 2. Предзагрузка при приближении курсора (radius detection)
 * 3. Предзагрузка соседних страниц (related pages)
 * 4. Smart caching с приоритетами
 * 5. Bandwidth-aware загрузка
 */

// Приоритетные маршруты - грузим ПЕРВЫМИ
const PRIORITY_ROUTES = [
  '/',
  '/feed',
  '/cabinet',
  '/auth',
  '/news',
];

// Связанные страницы - если на одной, грузим соседние
const RELATED_PAGES: Record<string, string[]> = {
  '/feed': ['/news', '/cabinet', '/auth'],
  '/cabinet': ['/cabinet/releases', '/cabinet/profile', '/cabinet/settings', '/cabinet/balance'],
  '/cabinet/releases': ['/cabinet/releases/drafts', '/cabinet/release-basic/create'],
  '/admin': ['/admin/users', '/admin/releases', '/admin/news', '/admin/tickets'],
  '/news': ['/feed', '/cabinet'],
};

// Кэш
const prefetchedUrls = new Set<string>();
const prefetchQueue: { url: string; priority: number }[] = [];
let isProcessing = false;

// Проверка внутренней ссылки
function isInternalUrl(url: string): boolean {
  if (!url || url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:')) return false;
  if (url.startsWith('/') && !url.startsWith('//')) return true;
  try {
    return new URL(url, window.location.origin).origin === window.location.origin;
  } catch {
    return false;
  }
}

// Нормализация URL
function normalizeUrl(url: string): string {
  try {
    const path = url.startsWith('/') ? url : new URL(url, window.location.origin).pathname;
    return path.split('?')[0].split('#')[0];
  } catch {
    return url;
  }
}

// Проверка скорости соединения
function getConnectionSpeed(): 'slow' | 'fast' {
  if (typeof navigator === 'undefined') return 'fast';
  const connection = (navigator as any).connection;
  if (!connection) return 'fast';
  
  // Slow connections: 2g, slow-2g, or effectiveType === 'slow-2g' или 'cellular'
  if (connection.saveData) return 'slow';
  if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') return 'slow';
  
  return 'fast';
}

export function RocketPrefetch() {
  const router = useRouter();
  const pathname = usePathname();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const processedLinksRef = useRef(new Set<Element>());

  // Добавление в очередь с приоритетом
  const addToQueue = useCallback((url: string, priority: number = 5) => {
    const normalized = normalizeUrl(url);
    if (prefetchedUrls.has(normalized)) return;
    
    // Проверяем есть ли уже в очереди
    const existing = prefetchQueue.findIndex(item => item.url === normalized);
    if (existing >= 0) {
      // Обновляем приоритет если новый выше
      if (priority < prefetchQueue[existing].priority) {
        prefetchQueue[existing].priority = priority;
      }
      return;
    }
    
    prefetchQueue.push({ url: normalized, priority });
    // Сортируем по приоритету (меньше = выше приоритет)
    prefetchQueue.sort((a, b) => a.priority - b.priority);
  }, []);

  // Обработка очереди
  const processQueue = useCallback(() => {
    if (isProcessing || prefetchQueue.length === 0) return;
    isProcessing = true;

    const process = () => {
      if (prefetchQueue.length === 0) {
        isProcessing = false;
        return;
      }

      const { url } = prefetchQueue.shift()!;
      if (!prefetchedUrls.has(url)) {
        prefetchedUrls.add(url);
        router.prefetch(url);
      }

      // Следующий через requestIdleCallback или микротаск
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => process(), { timeout: 100 });
      } else {
        queueMicrotask(process);
      }
    };

    process();
  }, [router]);

  // Мгновенный prefetch (высший приоритет)
  const instantPrefetch = useCallback((url: string) => {
    const normalized = normalizeUrl(url);
    if (prefetchedUrls.has(normalized)) return;
    
    prefetchedUrls.add(normalized);
    queueMicrotask(() => router.prefetch(normalized));
  }, [router]);

  // Обработка видимых ссылок
  const handleVisibleLink = useCallback((link: Element) => {
    const href = link.getAttribute('href');
    if (!href || !isInternalUrl(href)) return;
    
    // Добавляем с низким приоритетом (видимая, но не в фокусе)
    addToQueue(href, 10);
  }, [addToQueue]);

  // Настройка Intersection Observer для ссылок
  const setupObserver = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !processedLinksRef.current.has(entry.target)) {
            processedLinksRef.current.add(entry.target);
            handleVisibleLink(entry.target);
          }
        });
        processQueue();
      },
      {
        rootMargin: '100px', // Начинаем грузить до появления в viewport
        threshold: 0,
      }
    );

    // Наблюдаем за всеми ссылками
    const links = document.querySelectorAll('a[href]');
    links.forEach((link) => {
      if (!processedLinksRef.current.has(link)) {
        observerRef.current?.observe(link);
      }
    });
  }, [handleVisibleLink, processQueue]);

  // Prefetch связанных страниц
  const prefetchRelated = useCallback((currentPath: string) => {
    const related = RELATED_PAGES[currentPath];
    if (related) {
      related.forEach((url, index) => {
        addToQueue(url, 3 + index); // Приоритет 3-6
      });
      processQueue();
    }
  }, [addToQueue, processQueue]);

  // Инициализация
  useEffect(() => {
    // Проверяем скорость соединения
    const speed = getConnectionSpeed();
    if (speed === 'slow') {
      // На медленном соединении грузим только приоритетные
      PRIORITY_ROUTES.forEach((url, index) => {
        addToQueue(url, index);
      });
      processQueue();
      return;
    }

    // 1. Грузим приоритетные маршруты СРАЗУ
    PRIORITY_ROUTES.forEach((url) => {
      instantPrefetch(url);
    });

    // 2. Грузим связанные страницы
    prefetchRelated(pathname);

    // 3. Настраиваем observer для остальных ссылок
    // Небольшая задержка чтобы страница отрендерилась
    const observerTimer = setTimeout(setupObserver, 50);

    // 4. Event handlers
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]');
      if (!link || e.button !== 0) return;
      
      const href = link.getAttribute('href');
      if (href && isInternalUrl(href)) {
        instantPrefetch(href);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]');
      if (!link) return;
      
      const href = link.getAttribute('href');
      if (href && isInternalUrl(href)) {
        instantPrefetch(href);
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]');
      if (!link) return;
      
      const href = link.getAttribute('href');
      if (href && isInternalUrl(href)) {
        addToQueue(href, 1); // Высокий приоритет при наведении
        processQueue();
      }
    };

    // Listeners с capture для максимальной скорости
    const opts: AddEventListenerOptions = { passive: true, capture: true };
    document.addEventListener('mousedown', handleMouseDown, opts);
    document.addEventListener('touchstart', handleTouchStart, opts);
    document.addEventListener('mouseover', handleMouseOver, opts);

    // 5. MutationObserver для новых ссылок
    const mutationObserver = new MutationObserver(() => {
      requestAnimationFrame(setupObserver);
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(observerTimer);
      observerRef.current?.disconnect();
      mutationObserver.disconnect();
      document.removeEventListener('mousedown', handleMouseDown, opts as EventListenerOptions);
      document.removeEventListener('touchstart', handleTouchStart, opts as EventListenerOptions);
      document.removeEventListener('mouseover', handleMouseOver, opts as EventListenerOptions);
    };
  }, [pathname, instantPrefetch, prefetchRelated, setupObserver, addToQueue, processQueue]);

  // При смене страницы - prefetch связанных
  useEffect(() => {
    prefetchRelated(pathname);
    // Очищаем processed links для новой страницы
    processedLinksRef.current.clear();
    // Перенастраиваем observer
    const timer = setTimeout(setupObserver, 100);
    return () => clearTimeout(timer);
  }, [pathname, prefetchRelated, setupObserver]);

  return null;
}

export default RocketPrefetch;
