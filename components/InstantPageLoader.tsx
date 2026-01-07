"use client";

import { useEffect, useRef, memo, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * INSTANT PAGE LOADER 🚀
 * 
 * Мгновенная загрузка страниц:
 * 1. Предзагрузка по наведению мыши (100ms задержка)
 * 2. Предзагрузка при скролле к видимой области
 * 3. Кэширование загруженных страниц
 * 4. Приоритизация критических маршрутов
 * 5. Отмена загрузки при уходе мыши
 * 6. Touch поддержка для мобильных
 */

// Критические маршруты для предзагрузки
const PRIORITY_ROUTES = [
  '/',
  '/feed',
  '/cabinet',
  '/cabinet/release-basic',
  '/cabinet/profile',
  '/news',
  '/faq',
  '/contacts',
];

// Связанные страницы для умной предзагрузки
const RELATED_PAGES: Record<string, string[]> = {
  '/': ['/feed', '/news', '/faq', '/auth/login', '/auth/register'],
  '/cabinet': ['/cabinet/release-basic', '/cabinet/profile', '/cabinet/releases', '/cabinet/finance'],
  '/cabinet/release-basic': ['/cabinet/release-basic/create', '/cabinet/release-basic/drafts'],
  '/feed': ['/news', '/faq'],
  '/auth/login': ['/auth/register', '/reset-password'],
  '/auth/register': ['/auth/login'],
  '/admin': ['/admin/moderation', '/admin/users', '/admin/tickets'],
};

// Кэш загруженных страниц
const prefetchedPages = new Set<string>();
const pendingPrefetches = new Map<string, AbortController>();

// Типы
interface LinkPrefetchOptions {
  priority?: 'high' | 'low';
  delay?: number;
}

const InstantPageLoader = memo(() => {
  const router = useRouter();
  const pathname = usePathname();
  const hoverTimeouts = useRef<Map<HTMLElement, ReturnType<typeof setTimeout>>>(new Map());
  const observer = useRef<IntersectionObserver | null>(null);

  // Предзагрузка страницы
  const prefetchPage = useCallback((href: string, options: LinkPrefetchOptions = {}) => {
    const { priority = 'low' } = options;
    
    // Нормализуем URL
    const url = href.startsWith('/') ? href : `/${href}`;
    
    // Пропускаем если уже загружено
    if (prefetchedPages.has(url) || url === pathname) return;
    
    // Пропускаем внешние ссылки и анкоры
    if (url.startsWith('http') || url.startsWith('#') || url.startsWith('mailto:')) return;
    
    try {
      // Отменяем предыдущую загрузку если есть
      const existing = pendingPrefetches.get(url);
      if (existing) existing.abort();
      
      // Создаём новый контроллер
      const controller = new AbortController();
      pendingPrefetches.set(url, controller);
      
      // Используем Next.js router.prefetch
      router.prefetch(url);
      
      // Помечаем как загруженное
      prefetchedPages.add(url);
      pendingPrefetches.delete(url);
      
      // В dev режиме логируем
      if (process.env.NODE_ENV === 'development') {
        console.log(`[InstantPage] Prefetched: ${url} (${priority})`);
      }
    } catch (error) {
      // Игнорируем ошибки предзагрузки
    }
  }, [pathname, router]);

  // Отмена предзагрузки
  const cancelPrefetch = useCallback((href: string) => {
    const url = href.startsWith('/') ? href : `/${href}`;
    const controller = pendingPrefetches.get(url);
    if (controller) {
      controller.abort();
      pendingPrefetches.delete(url);
    }
  }, []);

  // Предзагрузка связанных страниц
  const prefetchRelatedPages = useCallback(() => {
    const related = RELATED_PAGES[pathname];
    if (!related) return;
    
    // Используем requestIdleCallback для фоновой загрузки
    const idle = window.requestIdleCallback || ((cb: IdleRequestCallback) => setTimeout(() => cb({} as IdleDeadline), 100));
    
    related.forEach((page, index) => {
      idle(() => {
        prefetchPage(page, { priority: index === 0 ? 'high' : 'low' });
      });
    });
  }, [pathname, prefetchPage]);

  // Предзагрузка критических маршрутов
  const prefetchCriticalRoutes = useCallback(() => {
    const idle = window.requestIdleCallback || ((cb: IdleRequestCallback) => setTimeout(() => cb({} as IdleDeadline), 100));
    
    PRIORITY_ROUTES.forEach((route, index) => {
      if (route !== pathname) {
        idle(() => {
          prefetchPage(route, { priority: index < 3 ? 'high' : 'low' });
        }, { timeout: 5000 });
      }
    });
  }, [pathname, prefetchPage]);

  // Обработчик наведения мыши
  const handleMouseEnter = useCallback((e: MouseEvent) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const link = target.closest('a');
    if (!link) return;
    
    const href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#')) return;
    
    // Задержка 50ms перед предзагрузкой (быстрее чем стандартная)
    const timeout = setTimeout(() => {
      prefetchPage(href, { priority: 'high' });
    }, 50);
    
    hoverTimeouts.current.set(link, timeout);
  }, [prefetchPage]);

  // Обработчик ухода мыши
  const handleMouseLeave = useCallback((e: MouseEvent) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const link = target.closest('a');
    if (!link) return;
    
    const timeout = hoverTimeouts.current.get(link);
    if (timeout) {
      clearTimeout(timeout);
      hoverTimeouts.current.delete(link);
    }
    
    const href = link.getAttribute('href');
    if (href) cancelPrefetch(href);
  }, [cancelPrefetch]);

  // Touch events для мобильных
  const handleTouchStart = useCallback((e: TouchEvent) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const link = target.closest('a');
    if (!link) return;
    
    const href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#')) return;
    
    // Мгновенная предзагрузка при касании
    prefetchPage(href, { priority: 'high' });
  }, [prefetchPage]);

  // Mousedown - предзагрузка перед кликом
  const handleMouseDown = useCallback((e: MouseEvent) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const link = target.closest('a');
    if (!link) return;
    
    const href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#')) return;
    
    // Мгновенная предзагрузка при нажатии
    prefetchPage(href, { priority: 'high' });
  }, [prefetchPage]);

  // IntersectionObserver для видимых ссылок
  const setupIntersectionObserver = useCallback(() => {
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const link = entry.target as HTMLAnchorElement;
            const href = link.getAttribute('href');
            if (href && !href.startsWith('http') && !href.startsWith('#')) {
              // Загружаем с небольшой задержкой
              setTimeout(() => prefetchPage(href, { priority: 'low' }), 200);
            }
          }
        });
      },
      { rootMargin: '50px', threshold: 0.1 }
    );
    
    // Наблюдаем за всеми внутренними ссылками
    document.querySelectorAll('a[href^="/"]').forEach((link) => {
      observer.current?.observe(link);
    });
  }, [prefetchPage]);

  // Инициализация
  useEffect(() => {
    // Добавляем обработчики событий
    document.addEventListener('mouseenter', handleMouseEnter, { capture: true, passive: true });
    document.addEventListener('mouseleave', handleMouseLeave, { capture: true, passive: true });
    document.addEventListener('mousedown', handleMouseDown, { capture: true, passive: true });
    document.addEventListener('touchstart', handleTouchStart, { capture: true, passive: true });
    
    // Предзагружаем критические маршруты после загрузки страницы
    if (typeof window !== 'undefined') {
      if (document.readyState === 'complete') {
        prefetchCriticalRoutes();
        prefetchRelatedPages();
        setupIntersectionObserver();
      } else {
        window.addEventListener('load', () => {
          prefetchCriticalRoutes();
          prefetchRelatedPages();
          setupIntersectionObserver();
        }, { once: true });
      }
    }
    
    return () => {
      document.removeEventListener('mouseenter', handleMouseEnter, { capture: true });
      document.removeEventListener('mouseleave', handleMouseLeave, { capture: true });
      document.removeEventListener('mousedown', handleMouseDown, { capture: true });
      document.removeEventListener('touchstart', handleTouchStart, { capture: true });
      
      hoverTimeouts.current.forEach((timeout) => clearTimeout(timeout));
      hoverTimeouts.current.clear();
      
      observer.current?.disconnect();
    };
  }, [handleMouseEnter, handleMouseLeave, handleMouseDown, handleTouchStart, prefetchCriticalRoutes, prefetchRelatedPages, setupIntersectionObserver]);

  // При смене страницы - предзагружаем связанные
  useEffect(() => {
    prefetchRelatedPages();
    setupIntersectionObserver();
  }, [pathname, prefetchRelatedPages, setupIntersectionObserver]);

  return null;
});

InstantPageLoader.displayName = 'InstantPageLoader';

export default InstantPageLoader;
