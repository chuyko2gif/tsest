"use client";

import { useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * TURBO NAVIGATION - УЛЬТРА-БЫСТРАЯ навигация
 * 
 * Стратегия максимальной скорости:
 * 1. Предзагрузка ВСЕХ страниц сайта при старте
 * 2. Мгновенный prefetch при mousedown (до click!)
 * 3. Prefetch при движении мыши к ссылке
 * 4. Prefetch ВСЕХ ссылок на странице сразу
 * 5. Перехват кликов для мгновенного перехода
 */

// Глобальный кэш - храним навсегда в сессии
const prefetchedUrls = new Set<string>();
const prefetchQueue: string[] = [];
let isProcessing = false;

// ВСЕ маршруты сайта для предзагрузки
const ALL_ROUTES = [
  '/',
  '/feed',
  '/news',
  '/contacts',
  '/faq',
  '/offer',
  '/about',
  '/auth',
  '/auth/register',
  '/cabinet',
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

  // Мгновенный prefetch - без задержек
  const prefetch = useCallback((url: string) => {
    const normalized = normalize(url);
    if (prefetchedUrls.has(normalized)) return;
    
    prefetchedUrls.add(normalized);
    // Микротаск - быстрее чем setTimeout(0)
    queueMicrotask(() => router.prefetch(normalized));
  }, [router]);

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
    // 1. Предзагружаем ВСЕ критические маршруты сразу
    ALL_ROUTES.forEach(route => {
      if (!prefetchedUrls.has(route)) {
        prefetchQueue.push(route);
      }
    });
    processPrefetchQueue();
    
    // 2. Prefetch всех ссылок на текущей странице
    // Небольшая задержка чтобы страница отрендерилась
    const timer = setTimeout(prefetchAllLinks, 100);
    
    // 3. Event listeners с capture для максимальной скорости
    const opts: AddEventListenerOptions = { passive: true, capture: true };
    
    document.addEventListener('mousedown', handleMouseDown, opts);
    document.addEventListener('mouseover', handleMouseOver, opts);
    document.addEventListener('touchstart', handleTouchStart, opts);
    document.addEventListener('mousemove', handleMouseMove, opts);
    document.addEventListener('focusin', handleFocus, opts);
    
    // 4. Observer для новых ссылок
    const observer = new MutationObserver(() => {
      // Debounce через RAF
      requestAnimationFrame(prefetchAllLinks);
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleMouseDown, opts as EventListenerOptions);
      document.removeEventListener('mouseover', handleMouseOver, opts as EventListenerOptions);
      document.removeEventListener('touchstart', handleTouchStart, opts as EventListenerOptions);
      document.removeEventListener('mousemove', handleMouseMove, opts as EventListenerOptions);
      document.removeEventListener('focusin', handleFocus, opts as EventListenerOptions);
      observer.disconnect();
    };
  }, [handleMouseDown, handleMouseOver, handleTouchStart, handleMouseMove, handleFocus, prefetchAllLinks, processPrefetchQueue]);

  // При смене страницы - prefetch новых ссылок
  useEffect(() => {
    const timer = setTimeout(prefetchAllLinks, 50);
    return () => clearTimeout(timer);
  }, [pathname, prefetchAllLinks]);

  return null;
}

export default TurboNavigation;
