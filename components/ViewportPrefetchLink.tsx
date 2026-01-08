"use client";

import React, { useRef, useEffect, useCallback, memo } from 'react';
import Link, { LinkProps } from 'next/link';
import { useRouter } from 'next/navigation';

/**
 * ViewportPrefetchLink - УЛЬТРА-ОПТИМИЗИРОВАННАЯ ссылка
 * 
 * КРИТИЧЕСКАЯ ОПТИМИЗАЦИЯ ДЛЯ СЛАБЫХ УСТРОЙСТВ:
 * - Начинает prefetch когда ссылка появляется в viewport (300px margin)
 * - Мгновенный переход при клике (код уже загружен)
 * - Не блокирует основной поток (requestIdleCallback)
 * - Минимальное потребление памяти (один observer на все ссылки)
 * 
 * БЕЗОПАСНОСТЬ: Не меняет логику переходов, только добавляет prefetch
 */

interface ViewportPrefetchLinkProps extends Omit<LinkProps, 'prefetch'> {
  children: React.ReactNode;
  className?: string;
  /** Приоритет prefetch - загружать сразу при появлении */
  priority?: boolean;
  /** Отключить prefetch */
  noPrefetch?: boolean;
  /** Callback при наведении */
  onMouseEnter?: React.MouseEventHandler<HTMLAnchorElement>;
  /** Дополнительные атрибуты */
  [key: string]: any;
}

// Глобальный Set для отслеживания уже prefetched URL
const prefetchedUrls = new Set<string>();

// Глобальный IntersectionObserver (один на все ссылки для экономии ресурсов)
let globalObserver: IntersectionObserver | null = null;
const observedElements = new Map<Element, () => void>();

function getGlobalObserver(): IntersectionObserver {
  if (globalObserver) return globalObserver;
  
  globalObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const callback = observedElements.get(entry.target);
          if (callback) {
            // Используем requestIdleCallback для неблокирующей загрузки
            if ('requestIdleCallback' in window) {
              (window as any).requestIdleCallback(callback, { timeout: 2000 });
            } else {
              setTimeout(callback, 100);
            }
            // Отписываемся после первого появления
            globalObserver?.unobserve(entry.target);
            observedElements.delete(entry.target);
          }
        }
      });
    },
    {
      // Начинаем prefetch за 300px до появления в viewport
      rootMargin: '300px',
      threshold: 0,
    }
  );
  
  return globalObserver;
}

/**
 * ViewportPrefetchLink - ссылка с prefetch при появлении в viewport
 */
export const ViewportPrefetchLink = memo(function ViewportPrefetchLink({
  children,
  className,
  href,
  priority = false,
  noPrefetch = false,
  onMouseEnter,
  ...props
}: ViewportPrefetchLinkProps) {
  const router = useRouter();
  const linkRef = useRef<HTMLAnchorElement>(null);
  
  // Нормализуем href к строке
  const hrefString = typeof href === 'string' ? href : href.pathname || '';

  // Функция prefetch
  const doPrefetch = useCallback(() => {
    if (prefetchedUrls.has(hrefString)) return;
    
    prefetchedUrls.add(hrefString);
    router.prefetch(hrefString);
  }, [hrefString, router]);

  // Viewport-based prefetch
  useEffect(() => {
    if (noPrefetch) return;
    
    const element = linkRef.current;
    if (!element) return;

    // Priority - prefetch сразу
    if (priority) {
      doPrefetch();
      return;
    }

    // Регистрируем в глобальном observer
    const observer = getGlobalObserver();
    observedElements.set(element, doPrefetch);
    observer.observe(element);

    return () => {
      observer.unobserve(element);
      observedElements.delete(element);
    };
  }, [doPrefetch, priority, noPrefetch]);

  // Hover prefetch (дополнительно, если не сработал viewport)
  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!noPrefetch) {
      doPrefetch();
    }
    onMouseEnter?.(e);
  }, [doPrefetch, noPrefetch, onMouseEnter]);

  return (
    <Link
      ref={linkRef}
      href={href}
      className={className}
      prefetch={false} // Отключаем встроенный prefetch, используем свой
      onMouseEnter={handleMouseEnter}
      {...props}
    >
      {children}
    </Link>
  );
});

ViewportPrefetchLink.displayName = 'ViewportPrefetchLink';

/**
 * Хук для массового prefetch маршрутов при появлении в viewport
 */
export function useViewportPrefetch(routes: string[]) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Prefetch все маршруты когда контейнер виден
          const prefetchRoutes = () => {
            routes.forEach((route) => {
              if (!prefetchedUrls.has(route)) {
                prefetchedUrls.add(route);
                router.prefetch(route);
              }
            });
          };

          if ('requestIdleCallback' in window) {
            (window as any).requestIdleCallback(prefetchRoutes, { timeout: 3000 });
          } else {
            setTimeout(prefetchRoutes, 200);
          }

          observer.disconnect();
        }
      },
      { rootMargin: '200px', threshold: 0 }
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, [routes, router]);

  return containerRef;
}

/**
 * Утилита для очистки кэша prefetch (при необходимости)
 */
export function clearPrefetchCache() {
  prefetchedUrls.clear();
}

/**
 * Проверить, был ли URL уже prefetched
 */
export function isPrefetched(url: string): boolean {
  return prefetchedUrls.has(url);
}

export default ViewportPrefetchLink;
