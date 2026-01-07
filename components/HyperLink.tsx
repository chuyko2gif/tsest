"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, ComponentProps, memo, MouseEvent, TouchEvent } from 'react';

type LinkProps = ComponentProps<typeof Link>;

// Глобальный кэш для предотвращения повторных prefetch
const prefetchCache = new Set<string>();

/**
 * HyperLink - МГНОВЕННЫЕ переходы
 * 
 * Стратегия максимальной скорости:
 * 1. Prefetch при mousedown (ДО клика!) - экономит 50-100ms
 * 2. Prefetch при touchstart (мобильные)
 * 3. Prefetch при hover с очень малой задержкой
 * 4. Интеллектуальный кэш prefetch-запросов
 * 5. Опциональный instant-режим с визуальным feedback
 */
const HyperLink = memo(({ 
  href, 
  children, 
  className,
  style,
  onMouseEnter,
  onMouseDown,
  onTouchStart,
  onClick,
  prefetch = true,
  instant = false, // Мгновенный режим - переход начинается на mousedown
  ...props 
}: LinkProps & { instant?: boolean }) => {
  const router = useRouter();
  const prefetchedRef = useRef(false);
  const isNavigating = useRef(false);
  
  // Получаем нормализованный URL
  const getUrl = useCallback(() => {
    if (typeof href === 'string') return href;
    return href.pathname || '';
  }, [href]);

  // Мгновенный prefetch
  const doPrefetch = useCallback(() => {
    if (prefetchedRef.current) return;
    
    const url = getUrl();
    if (!url || prefetchCache.has(url)) {
      prefetchedRef.current = true;
      return;
    }
    
    // Добавляем в кэш и делаем prefetch
    prefetchCache.add(url);
    prefetchedRef.current = true;
    
    // Используем queueMicrotask для мгновенного выполнения
    queueMicrotask(() => {
      router.prefetch(url);
    });
  }, [getUrl, router]);

  // MouseDown - самый ранний момент для prefetch!
  const handleMouseDown = useCallback((e: MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0) return; // Только левая кнопка
    
    doPrefetch();
    
    // В instant-режиме начинаем навигацию сразу
    if (instant && !isNavigating.current) {
      isNavigating.current = true;
      const url = getUrl();
      if (url) {
        // Визуальный feedback
        const target = e.currentTarget;
        target.style.opacity = '0.7';
        target.style.transform = 'scale(0.98)';
        
        // Мгновенный переход
        requestAnimationFrame(() => {
          router.push(url);
        });
      }
    }
    
    onMouseDown?.(e);
  }, [doPrefetch, instant, getUrl, router, onMouseDown]);

  // MouseEnter - prefetch при наведении
  const handleMouseEnter = useCallback((e: MouseEvent<HTMLAnchorElement>) => {
    doPrefetch();
    onMouseEnter?.(e);
  }, [doPrefetch, onMouseEnter]);

  // TouchStart - prefetch при касании (мобильные)
  const handleTouchStart = useCallback((e: TouchEvent<HTMLAnchorElement>) => {
    doPrefetch();
    
    // В instant-режиме на мобильных
    if (instant && !isNavigating.current) {
      isNavigating.current = true;
      const url = getUrl();
      if (url) {
        const target = e.currentTarget;
        target.style.opacity = '0.7';
        
        // Небольшая задержка для визуального feedback на мобильных
        setTimeout(() => {
          router.push(url);
        }, 50);
      }
    }
    
    onTouchStart?.(e);
  }, [doPrefetch, instant, getUrl, router, onTouchStart]);

  // Click - обычная навигация если не instant-режим
  const handleClick = useCallback((e: MouseEvent<HTMLAnchorElement>) => {
    // В instant-режиме уже перешли на mousedown
    if (instant && isNavigating.current) {
      e.preventDefault();
      return;
    }
    
    onClick?.(e);
  }, [instant, onClick]);

  return (
    <Link 
      href={href} 
      prefetch={prefetch}
      className={className}
      style={style}
      onMouseEnter={handleMouseEnter}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Link>
  );
});

HyperLink.displayName = 'HyperLink';

export { HyperLink };
export default HyperLink;
