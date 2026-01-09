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

// Глобальный кэш - ОГРАНИЧЕННЫЙ РАЗМЕР для предотвращения утечки памяти
const prefetchedUrls = new Set<string>();
const prefetchQueue: string[] = [];
let isProcessing = false;
const MAX_PREFETCH_CACHE = 50;

// Очистка кэша если слишком большой
function limitPrefetchCache() {
  if (prefetchedUrls.size > MAX_PREFETCH_CACHE) {
    const arr = Array.from(prefetchedUrls);
    arr.slice(0, arr.length - MAX_PREFETCH_CACHE).forEach(url => prefetchedUrls.delete(url));
  }
}

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
  // lastMousePos больше не используется - mousemove убран для экономии CPU

  // Мгновенный prefetch - без задержек
  const prefetch = useCallback((url: string) => {
    const normalized = normalize(url);
    if (prefetchedUrls.has(normalized)) return;
    
    prefetchedUrls.add(normalized);
    limitPrefetchCache(); // Ограничиваем размер кэша
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
        limitPrefetchCache(); // Ограничиваем размер кэша
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

  // УБРАН handleMouseMove - слишком ресурсоёмкий, грузил CPU на каждое движение мыши

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
    // 1. Предзагружаем только основные маршруты (не все сразу)
    const CRITICAL_ROUTES = ['/feed', '/cabinet', '/news', '/auth'];
    CRITICAL_ROUTES.forEach(route => {
      if (!prefetchedUrls.has(route)) {
        prefetchQueue.push(route);
      }
    });
    processPrefetchQueue();
    
    // 2. Prefetch всех ссылок на текущей странице - только один раз!
    const timer = setTimeout(prefetchAllLinks, 500);
    
    // 3. Event listeners - только критичные, без mousemove (слишком тяжело)
    const opts: AddEventListenerOptions = { passive: true, capture: true };
    
    document.addEventListener('mousedown', handleMouseDown, opts);
    document.addEventListener('mouseover', handleMouseOver, opts);
    document.addEventListener('touchstart', handleTouchStart, opts);
    // УБРАН mousemove - слишком нагружает CPU
    document.addEventListener('focusin', handleFocus, opts);
    
    // УБРАН MutationObserver - вызывал бесконечный цикл prefetch
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleMouseDown, opts as EventListenerOptions);
      document.removeEventListener('mouseover', handleMouseOver, opts as EventListenerOptions);
      document.removeEventListener('touchstart', handleTouchStart, opts as EventListenerOptions);
      document.removeEventListener('focusin', handleFocus, opts as EventListenerOptions);
    };
  }, [handleMouseDown, handleMouseOver, handleTouchStart, handleFocus, prefetchAllLinks, processPrefetchQueue]);

  // При смене страницы - prefetch новых ссылок
  useEffect(() => {
    const timer = setTimeout(prefetchAllLinks, 50);
    return () => clearTimeout(timer);
  }, [pathname, prefetchAllLinks]);

  return null;
}

export default TurboNavigation;
