"use client";

import React, { useState, useEffect, useRef, memo, useCallback } from 'react';

interface CoverImageProps {
  src: string | null | undefined;
  alt?: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
  priority?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'thumb';
  /** Качество изображения 1-100 */
  quality?: number;
  /** Использовать оптимизированное изображение */
  optimized?: boolean;
  /** Использовать lazy loading */
  lazy?: boolean;
}

/**
 * CoverImage - УЛЬТРА-ОПТИМИЗИРОВАННЫЙ компонент для обложек
 * 
 * Особенности:
 * - Глобальный кэш в памяти
 * - Blur placeholder для плавного появления
 * - Intersection Observer для lazy loading
 * - Поддержка WebP/AVIF
 * - Оптимизация для слабых устройств (Redmi A5)
 */

// Глобальный кэш загруженных изображений - ОГРАНИЧЕННЫЙ РАЗМЕР
const imageCache = new Map<string, string>();
const MAX_CACHE_SIZE = 100; // Максимум 100 изображений в кэше

// Кэш для blur data URL (микро-превью) - ОГРАНИЧЕННЫЙ РАЗМЕР
const blurCache = new Map<string, string>();
const MAX_BLUR_CACHE_SIZE = 50;

// Функция очистки старых записей из кэша (LRU-подобная)
function limitCacheSize<K, V>(cache: Map<K, V>, maxSize: number) {
  if (cache.size > maxSize) {
    // Удаляем первые (самые старые) записи
    const keysToDelete = Array.from(cache.keys()).slice(0, cache.size - maxSize);
    keysToDelete.forEach(key => cache.delete(key));
  }
}

// Размеры для оптимизации
const SIZE_MAP = {
  thumb: 64,
  sm: 128,
  md: 256,
  lg: 512,
};

// Проверка, является ли URL внешним (Supabase и т.д.)
function isExternalUrl(src: string): boolean {
  return src.startsWith('http://') || src.startsWith('https://');
}

// Генерация оптимизированного URL - БЕЗОПАСНАЯ ВЕРСИЯ
function getOptimizedUrl(src: string, width: number, quality: number = 75): string {
  // Если уже оптимизированный URL или data URL - возвращаем как есть
  if (!src || src.startsWith('data:') || src.includes('/_next/image')) {
    return src;
  }
  
  // Для внешних URL (Supabase и т.д.) - используем напрямую без Next.js оптимизации
  // Это избегает ошибок с JSON parse когда Next.js не может обработать URL
  if (isExternalUrl(src)) {
    return src;
  }
  
  // Для локальных изображений используем Next.js Image Optimization API
  const encodedSrc = encodeURIComponent(src);
  return `/_next/image?url=${encodedSrc}&w=${width}&q=${quality}`;
}

// Генерация placeholder blur
function generateBlurPlaceholder(): string {
  // SVG blur placeholder - очень лёгкий
  return `data:image/svg+xml;base64,${btoa(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8">
      <filter id="b" color-interpolation-filters="sRGB">
        <feGaussianBlur stdDeviation="1"/>
      </filter>
      <rect width="100%" height="100%" filter="url(#b)" fill="#6050ba" opacity="0.3"/>
    </svg>`
  )}`;
}

// Компонент обёрнут в memo для предотвращения лишних ререндеров
export const CoverImage = memo(function CoverImage({ 
  src, 
  alt = '', 
  className = '',
  fallbackIcon,
  priority = false,
  size = 'md',
  quality = 75,
  optimized = true,
  lazy = true,
}: CoverImageProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // Определяем оптимальный размер
  const targetWidth = SIZE_MAP[size] || SIZE_MAP.md;

  const loadImage = useCallback(() => {
    if (!src) return;
    
    setStatus('loading');
    
    // Оптимизированный URL
    const optimizedSrc = optimized 
      ? getOptimizedUrl(src, targetWidth * 2, quality) // 2x для retina
      : src;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    // Используем decode() для плавного появления
    img.src = optimizedSrc;
    
    img.onload = async () => {
      try {
        // Ждём декодирования для плавности
        await img.decode?.();
      } catch {}
      
      // Сохраняем в кэш с лимитом размера
      imageCache.set(src, optimizedSrc);
      limitCacheSize(imageCache, MAX_CACHE_SIZE);
      setCurrentSrc(optimizedSrc);
      setStatus('loaded');
    };
    
    img.onerror = () => {
      // Пробуем оригинал если оптимизация не сработала
      if (optimized && optimizedSrc !== src) {
        const fallbackImg = new Image();
        fallbackImg.crossOrigin = 'anonymous';
        fallbackImg.onload = () => {
          imageCache.set(src, src);
          setCurrentSrc(src);
          setStatus('loaded');
        };
        fallbackImg.onerror = () => setStatus('error');
        fallbackImg.src = src;
      } else {
        setStatus('error');
      }
    };
  }, [src, optimized, targetWidth, quality]);

  useEffect(() => {
    if (!src) {
      setStatus('error');
      return;
    }

    // Если уже в кэше - показываем МГНОВЕННО
    const cachedSrc = imageCache.get(src);
    if (cachedSrc) {
      setCurrentSrc(cachedSrc);
      setStatus('loaded');
      return;
    }

    // Для priority - грузим сразу, иначе ждём intersection
    if (priority) {
      loadImage();
      return;
    }

    // Lazy loading через Intersection Observer
    if (lazy && containerRef.current) {
      // Отключаем предыдущий observer
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            loadImage();
            observerRef.current?.disconnect();
          }
        },
        { 
          rootMargin: '200px', // Начинаем грузить за 200px до появления
          threshold: 0 
        }
      );

      observerRef.current.observe(containerRef.current);
    } else {
      loadImage();
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [src, priority, lazy, loadImage]);

  // Размеры иконки-заглушки
  const iconSizes = {
    thumb: 'text-sm',
    sm: 'text-xl',
    md: 'text-2xl sm:text-3xl',
    lg: 'text-3xl sm:text-4xl'
  };

  // Ошибка или нет src
  if (status === 'error' || !src) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-purple-500/10 to-pink-500/10 ${className}`}>
        {fallbackIcon || (
          <div className={`${iconSizes[size]} opacity-40`}>🎵</div>
        )}
      </div>
    );
  }

  const blurPlaceholder = generateBlurPlaceholder();

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        // Blur placeholder как фон - показывается сразу
        backgroundImage: status !== 'loaded' ? `url(${blurPlaceholder})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: 'rgba(96, 80, 186, 0.1)',
      }}
    >
      {/* Изображение */}
      {currentSrc && (
        <img
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            status === 'loaded' ? 'opacity-100' : 'opacity-0'
          }`}
          draggable="false"
          // Улучшаем производительность рендеринга
          style={{ 
            willChange: status === 'loading' ? 'opacity' : 'auto',
            contentVisibility: 'auto',
          }}
        />
      )}
      
      {/* Минимальный loading indicator для priority */}
      {status === 'loading' && priority && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`${iconSizes[size]} opacity-30`}>🎵</div>
        </div>
      )}
    </div>
  );
});

// Displayname для DevTools
CoverImage.displayName = 'CoverImage';

/**
 * Предзагрузка списка обложек в фоне - ОПТИМИЗИРОВАННАЯ ВЕРСИЯ
 * Использует requestIdleCallback для загрузки без блокировки UI
 */
export function usePreloadCovers(urls: (string | null | undefined)[], options?: { priority?: boolean }) {
  useEffect(() => {
    const validUrls = urls.filter((url): url is string => !!url && !imageCache.has(url));
    
    if (validUrls.length === 0) return;

    const loadImage = (url: string) => {
      if (imageCache.has(url)) return;
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => imageCache.set(url, url);
      // Используем оптимизированный URL
      img.src = getOptimizedUrl(url, SIZE_MAP.md, 60);
    };

    if (options?.priority) {
      // Priority - грузим сразу
      validUrls.forEach(loadImage);
    } else {
      // Используем requestIdleCallback для фоновой загрузки
      const loadNext = (index: number) => {
        if (index >= validUrls.length) return;
        
        const callback = () => {
          loadImage(validUrls[index]);
          // Грузим следующую с небольшой задержкой
          setTimeout(() => loadNext(index + 1), 50);
        };

        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(callback, { timeout: 1000 });
        } else {
          setTimeout(callback, 100);
        }
      };

      loadNext(0);
    }
  }, [urls.join(','), options?.priority]);
}

/**
 * Очистка кэша (при необходимости освободить память)
 */
export function clearImageCache() {
  imageCache.clear();
}

/**
 * Получить размер кэша
 */
export function getImageCacheSize(): number {
  return imageCache.size;
}

/**
 * Проверить, есть ли изображение в кэше
 */
export function isImageCached(url: string): boolean {
  return imageCache.has(url);
}

export default CoverImage;
