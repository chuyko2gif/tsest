"use client";

import { useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * TURBO NAVIGATION v2.0 - РАКЕТНАЯ навигация
 * 
 * Стратегия МАКСИМАЛЬНОЙ скорости для слабых устройств:
 * 1. Предзагрузка КРИТИЧЕСКИХ страниц при старте (приоритет)
 * 2. Мгновенный prefetch при mousedown (ДО click!) - экономит 50-100ms
 * 3. Prefetch при движении мыши к ссылке (предсказание)
 * 4. Prefetch ВСЕХ ссылок на странице (фоновый режим)
 * 5. Idle-time prefetch - загружаем когда браузер свободен
 * 6. Touch-оптимизация для мобильных
 * 7. Memory-efficient кэш с LRU вытеснением
 */

// Детекция производительности устройства
const isLowEndDevice = typeof window !== 'undefined' && (
  navigator.hardwareConcurrency <= 4 ||
  (navigator as any).deviceMemory <= 4 ||
  /Android.*Chrome\/[.0-9]* Mobile/.test(navigator.userAgent) ||
  /Redmi|POCO|Realme/i.test(navigator.userAgent)
);

// Глобальный кэш - храним навсегда в сессии (LRU на слабых устройствах)
const prefetchedUrls = new Set<string>();
const prefetchQueue: string[] = [];
let isProcessing = false;
const MAX_CACHE_SIZE = isLowEndDevice ? 20 : 50; // Ограничиваем на слабых устройствах

// КРИТИЧЕСКИЕ маршруты - грузим первыми
const CRITICAL_ROUTES = [
  '/',
  '/feed',
  '/cabinet',
  '/auth',
];

// ВСЕ маршруты сайта для фоновой предзагрузки
const ALL_ROUTES = [
  '/news',
  '/contacts',
  '/faq',
  '/offer',
  '/about',
  '/auth/register',
  '/cabinet/releases',
  '/cabinet/releases/drafts',
  '/cabinet/release-basic/create',
  '/cabinet/profile',
  '/cabinet/settings',
  '/cabinet/analytics',
  '/cabinet/balance',
  '/admin',
  '/admin/users',
  '/admin/releases',
  '/admin/news',
  '/admin/tickets',
  '/dashboard',
];

// Проверка внутренней ссылки
function isInternal(url: string): boolean {
  if (!url || url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:')) return false;
  if (url.startsWith('/') && !url.startsWith('//')) return true;
  try {
    return new URL(url, window.location.origin).origin === window.location.origin;
  } catch {
    return false;
  }
}

// Нормализация URL
function normalize(url: string): string {
  try {
    const path = url.startsWith('/') ? url : new URL(url, window.location.origin).pathname;
    return path.split('?')[0].split('#')[0];
  } catch {
    return url;
  }
}

export function TurboNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const lastMousePos = useRef({ x: 0, y: 0 });
  const idleCallbackId = useRef<number>(0);

  // LRU кэш - удаляем старые записи на слабых устройствах
  const addToCache = useCallback((url: string) => {
    if (prefetchedUrls.has(url)) return false;
    
    // LRU вытеснение на слабых устройствах
    if (isLowEndDevice && prefetchedUrls.size >= MAX_CACHE_SIZE) {
      const firstItem = prefetchedUrls.values().next().value;
      if (firstItem) prefetchedUrls.delete(firstItem);
    }
    
    prefetchedUrls.add(url);
    return true;
  }, []);

  // Мгновенный prefetch - без задержек
  const prefetch = useCallback((url: string) => {
    const normalized = normalize(url);
    if (!addToCache(normalized)) return;
    
    // Микротаск - быстрее чем setTimeout(0)
    queueMicrotask(() => router.prefetch(normalized));
  }, [router, addToCache]);

  // Batch prefetch - обрабатываем очередь
  const processPrefetchQueue = useCallback(() => {
    if (isProcessing || prefetchQueue.length === 0) return;
    isProcessing = true;
    
    const process = () => {
      if (prefetchQueue.length === 0) {
        isProcessing = false;
        return;
      }
      
      const url = prefetchQueue.shift()!;
      if (!prefetchedUrls.has(url)) {
        prefetchedUrls.add(url);
        router.prefetch(url);
      }
      
      // Следующий через микротаск
      queueMicrotask(process);
    };
    
    process();
  }, [router]);

  // Prefetch ВСЕХ ссылок на странице
  const prefetchAllLinks = useCallback(() => {
    const links = document.querySelectorAll('a[href]');
    
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && isInternal(href)) {
        const normalized = normalize(href);
        if (!prefetchedUrls.has(normalized) && !prefetchQueue.includes(normalized)) {
          prefetchQueue.push(normalized);
        }
      }
    });
    
    processPrefetchQueue();
  }, [processPrefetchQueue]);

  // Mousedown - prefetch ДО клика!
  const handleMouseDown = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a[href]');
    if (!link || e.button !== 0) return; // Только левая кнопка
    
    const href = link.getAttribute('href');
    if (href && isInternal(href)) {
      prefetch(href);
    }
  }, [prefetch]);

  // Mouseover - prefetch при наведении
  const handleMouseOver = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a[href]');
    if (!link) return;
    
    const href = link.getAttribute('href');
    if (href && isInternal(href)) {
      prefetch(href);
    }
  }, [prefetch]);

  // Touchstart - prefetch при касании (мобильные)
  const handleTouchStart = useCallback((e: TouchEvent) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a[href]');
    if (!link) return;
    
    const href = link.getAttribute('href');
    if (href && isInternal(href)) {
      prefetch(href);
    }
  }, [prefetch]);

  // Mouse move - предсказываем куда движется курсор
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    
    // Скорость движения
    const speed = Math.sqrt(dx * dx + dy * dy);
    if (speed < 5) return; // Слишком медленно
    
    // Предсказываем позицию через 150мс
    const futureX = e.clientX + dx * 5;
    const futureY = e.clientY + dy * 5;
    
    const element = document.elementFromPoint(
      Math.max(0, Math.min(futureX, window.innerWidth - 1)),
      Math.max(0, Math.min(futureY, window.innerHeight - 1))
    );
    
    if (!element) return;
    
    const link = element.closest('a[href]');
    if (!link) return;
    
    const href = link.getAttribute('href');
    if (href && isInternal(href)) {
      prefetch(href);
    }
  }, [prefetch]);

  // Focus - prefetch при keyboard navigation
  const handleFocus = useCallback((e: FocusEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName !== 'A') return;
    
    const href = target.getAttribute('href');
    if (href && isInternal(href)) {
      prefetch(href);
    }
  }, [prefetch]);

  // Инициализация
  useEffect(() => {
    // 1. КРИТИЧЕСКИЕ маршруты - грузим СРАЗУ (высокий приоритет)
    CRITICAL_ROUTES.forEach(route => {
      if (!prefetchedUrls.has(route)) {
        router.prefetch(route);
        prefetchedUrls.add(route);
      }
    });
    
    // 2. Остальные маршруты - в очередь для фоновой загрузки
    ALL_ROUTES.forEach(route => {
      if (!prefetchedUrls.has(route) && !prefetchQueue.includes(route)) {
        prefetchQueue.push(route);
      }
    });
    
    // На слабых устройствах не грузим всё сразу - только по мере необходимости
    if (!isLowEndDevice) {
      processPrefetchQueue();
    }
    
    // 3. Prefetch всех ссылок на текущей странице через requestIdleCallback
    // Используем idle time для фоновой загрузки
    const scheduleIdlePrefetch = () => {
      if ('requestIdleCallback' in window) {
        idleCallbackId.current = (window as any).requestIdleCallback(
          (deadline: { timeRemaining: () => number }) => {
            // Грузим пока есть свободное время
            if (deadline.timeRemaining() > 10) {
              prefetchAllLinks();
            }
            // Продолжаем если есть ещё что грузить
            if (prefetchQueue.length > 0) {
              scheduleIdlePrefetch();
            }
          },
          { timeout: isLowEndDevice ? 2000 : 1000 }
        );
      } else {
        // Fallback для старых браузеров
        setTimeout(prefetchAllLinks, isLowEndDevice ? 500 : 100);
      }
    };
    
    scheduleIdlePrefetch();
    
    // 4. Event listeners с capture для максимальной скорости
    const opts: AddEventListenerOptions = { passive: true, capture: true };
    
    document.addEventListener('mousedown', handleMouseDown, opts);
    document.addEventListener('mouseover', handleMouseOver, opts);
    document.addEventListener('touchstart', handleTouchStart, opts);
    
    // На слабых устройствах отключаем тяжёлые обработчики
    if (!isLowEndDevice) {
      document.addEventListener('mousemove', handleMouseMove, opts);
    }
    document.addEventListener('focusin', handleFocus, opts);
    
    // 5. Observer для новых ссылок (throttled на слабых устройствах)
    let mutationTimeout: ReturnType<typeof setTimeout>;
    const observer = new MutationObserver(() => {
      // Debounce mutations на слабых устройствах
      clearTimeout(mutationTimeout);
      mutationTimeout = setTimeout(() => {
        requestAnimationFrame(prefetchAllLinks);
      }, isLowEndDevice ? 200 : 50);
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => {
      if (idleCallbackId.current && 'cancelIdleCallback' in window) {
        (window as any).cancelIdleCallback(idleCallbackId.current);
      }
      clearTimeout(mutationTimeout);
      document.removeEventListener('mousedown', handleMouseDown, opts as EventListenerOptions);
      document.removeEventListener('mouseover', handleMouseOver, opts as EventListenerOptions);
      document.removeEventListener('touchstart', handleTouchStart, opts as EventListenerOptions);
      if (!isLowEndDevice) {
        document.removeEventListener('mousemove', handleMouseMove, opts as EventListenerOptions);
      }
      document.removeEventListener('focusin', handleFocus, opts as EventListenerOptions);
      observer.disconnect();
    };
  }, [handleMouseDown, handleMouseOver, handleTouchStart, handleMouseMove, handleFocus, prefetchAllLinks, processPrefetchQueue, router]);

  // При смене страницы - prefetch новых ссылок
  useEffect(() => {
    const timer = setTimeout(prefetchAllLinks, 50);
    return () => clearTimeout(timer);
  }, [pathname, prefetchAllLinks]);

  return null;
}

export default TurboNavigation;
