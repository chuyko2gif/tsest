"use client";

import React, { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react';

/**
 * SmartCoverImage - УЛЬТРА-ОПТИМИЗИРОВАННЫЙ компонент для обложек
 * 
 * КРИТИЧЕСКАЯ ОПТИМИЗАЦИЯ ДЛЯ СЛАБЫХ УСТРОЙСТВ:
 * - В UI везде показываем СЖАТЫЕ thumbnails (макс 512px)
 * - Для скачивания админом используем cover_url_original
 * - Глобальный кэш в памяти предотвращает повторные загрузки
 * - Intersection Observer для lazy loading с 300px margin
 * - Blur placeholder для плавного появления
 * - GPU-ускорение через will-change и transform
 * 
 * БЕЗОПАСНОСТЬ: НЕ меняет логику, только оптимизирует рендеринг
 */

interface SmartCoverImageProps {
  /** URL обложки (сжатой или обычной) */
  src: string | null | undefined;
  /** URL оригинала (для скачивания админом) */
  originalSrc?: string | null | undefined;
  alt?: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
  /** Загружать сразу без lazy loading */
  priority?: boolean;
  /** Размер для оптимизации */
  size?: 'thumb' | 'sm' | 'md' | 'lg' | 'xl';
  /** Качество 1-100 */
  quality?: number;
  /** Отключить lazy loading */
  eager?: boolean;
  /** Callback при загрузке */
  onLoad?: () => void;
  /** Callback при ошибке */
  onError?: () => void;
  /** Режим скачивания - использовать оригинал */
  forDownload?: boolean;
}

// Глобальный кэш загруженных изображений - ОГРАНИЧЕННЫЙ РАЗМЕР
const imageCache = new Map<string, string>();
const loadingPromises = new Map<string, Promise<string>>();
const MAX_CACHE_SIZE = 100;

// Функция очистки старых записей из кэша
function limitCacheSize<K, V>(cache: Map<K, V>, maxSize: number) {
  if (cache.size > maxSize) {
    const keysToDelete = Array.from(cache.keys()).slice(0, cache.size - maxSize);
    keysToDelete.forEach(key => cache.delete(key));
  }
}

// Размеры для разных устройств
const SIZE_MAP = {
  thumb: 64,   // Миниатюры в списках
  sm: 128,     // Маленькие карточки
  md: 256,     // Средние карточки
  lg: 384,     // Большие карточки
  xl: 512,     // Детальный просмотр (но не оригинал!)
} as const;

// Blur placeholder SVG - кэшируется браузером
const BLUR_PLACEHOLDER = `data:image/svg+xml;base64,${btoa(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8">
    <filter id="b" color-interpolation-filters="sRGB">
      <feGaussianBlur stdDeviation="1.5"/>
    </filter>
    <rect width="100%" height="100%" filter="url(#b)" fill="#6050ba" opacity="0.25"/>
  </svg>`
)}`;

/**
 * Генерация оптимизированного URL через Next.js Image Optimization
 * Возвращает оригинальный URL если уже оптимизирован или внешний
 */
function getOptimizedUrl(src: string, width: number, quality: number = 75): string {
  if (!src) return '';
  
  // Уже оптимизированный или data URL - возвращаем как есть
  if (src.startsWith('data:') || src.includes('/_next/image')) {
    return src;
  }
  
  // Внешние URL (Supabase) - возвращаем как есть
  // Next.js Image Optimization может не работать с некоторыми внешними URL
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }
  
  // Локальные изображения - используем Next.js оптимизацию
  const encodedSrc = encodeURIComponent(src);
  return `/_next/image?url=${encodedSrc}&w=${width}&q=${quality}`;
}

/**
 * Предзагрузка изображения с кэшированием
 */
function preloadImage(url: string): Promise<string> {
  // Уже в кэше
  if (imageCache.has(url)) {
    return Promise.resolve(imageCache.get(url)!);
  }
  
  // Уже загружается
  if (loadingPromises.has(url)) {
    return loadingPromises.get(url)!;
  }
  
  const promise = new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = async () => {
      try {
        // Ждём decode для плавности
        await img.decode?.();
      } catch {}
      
      imageCache.set(url, url);
      limitCacheSize(imageCache, MAX_CACHE_SIZE); // Ограничиваем размер кэша
      loadingPromises.delete(url);
      resolve(url);
    };
    
    img.onerror = () => {
      loadingPromises.delete(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
  
  loadingPromises.set(url, promise);
  return promise;
}

/**
 * SmartCoverImage - главный компонент
 * Показывает сжатые версии для производительности,
 * но сохраняет доступ к оригиналам для скачивания
 */
export const SmartCoverImage = memo(function SmartCoverImage({
  src,
  originalSrc,
  alt = '',
  className = '',
  fallbackIcon,
  priority = false,
  size = 'md',
  quality = 75,
  eager = false,
  onLoad,
  onError,
  forDownload = false,
}: SmartCoverImageProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const mountedRef = useRef(true);

  // Определяем оптимальный размер
  const targetWidth = SIZE_MAP[size] || SIZE_MAP.md;
  
  // Определяем какой URL использовать
  // Для скачивания - оригинал, для UI - оптимизированный
  const displayUrl = useMemo(() => {
    if (!src) return null;
    if (forDownload && originalSrc) return originalSrc;
    return getOptimizedUrl(src, targetWidth * 2, quality); // 2x для Retina
  }, [src, originalSrc, forDownload, targetWidth, quality]);

  // Функция загрузки
  const loadImage = useCallback(async () => {
    if (!displayUrl || !mountedRef.current) return;
    
    // Проверяем кэш
    const cached = imageCache.get(displayUrl);
    if (cached) {
      setLoadedSrc(cached);
      setStatus('loaded');
      onLoad?.();
      return;
    }
    
    setStatus('loading');
    
    try {
      const loaded = await preloadImage(displayUrl);
      if (mountedRef.current) {
        setLoadedSrc(loaded);
        setStatus('loaded');
        onLoad?.();
      }
    } catch {
      // Fallback на оригинальный URL
      if (mountedRef.current && src && displayUrl !== src) {
        try {
          const original = await preloadImage(src);
          if (mountedRef.current) {
            setLoadedSrc(original);
            setStatus('loaded');
            onLoad?.();
          }
        } catch {
          if (mountedRef.current) {
            setStatus('error');
            onError?.();
          }
        }
      } else if (mountedRef.current) {
        setStatus('error');
        onError?.();
      }
    }
  }, [displayUrl, src, onLoad, onError]);

  // Lifecycle
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      observerRef.current?.disconnect();
    };
  }, []);

  // Загрузка изображения
  useEffect(() => {
    if (!displayUrl) {
      setStatus('error');
      return;
    }

    // Уже в кэше - показываем МГНОВЕННО
    const cached = imageCache.get(displayUrl);
    if (cached) {
      setLoadedSrc(cached);
      setStatus('loaded');
      return;
    }

    // Priority или eager - грузим сразу
    if (priority || eager) {
      loadImage();
      return;
    }

    // Lazy loading через Intersection Observer
    if (containerRef.current) {
      observerRef.current?.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            loadImage();
            observerRef.current?.disconnect();
          }
        },
        { 
          rootMargin: '300px', // Начинаем грузить за 300px до появления
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
  }, [displayUrl, priority, eager, loadImage]);

  // Размеры fallback иконки
  const iconSizes = {
    thumb: 'text-sm',
    sm: 'text-xl',
    md: 'text-2xl sm:text-3xl',
    lg: 'text-3xl sm:text-4xl',
    xl: 'text-4xl sm:text-5xl',
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

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        // GPU-ускорение для плавности
        transform: 'translateZ(0)',
        // Blur placeholder - показывается МГНОВЕННО
        backgroundImage: status !== 'loaded' ? `url(${BLUR_PLACEHOLDER})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: 'rgba(96, 80, 186, 0.1)',
        // Содержимое не меняется часто - можно кэшировать
        contentVisibility: 'auto',
      }}
    >
      {/* Изображение */}
      {loadedSrc && (
        <img
          src={loadedSrc}
          alt={alt}
          loading={priority || eager ? 'eager' : 'lazy'}
          decoding="async"
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            status === 'loaded' ? 'opacity-100' : 'opacity-0'
          }`}
          draggable="false"
          style={{ 
            // GPU-ускорение для анимации opacity
            willChange: status === 'loading' ? 'opacity' : 'auto',
          }}
        />
      )}
      
      {/* Минимальный loading indicator только для priority */}
      {status === 'loading' && priority && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`${iconSizes[size]} opacity-30 animate-pulse`}>🎵</div>
        </div>
      )}
    </div>
  );
});

SmartCoverImage.displayName = 'SmartCoverImage';

/**
 * Хук для получения URL оригинала обложки
 * Используется админом для скачивания
 */
export function useOriginalCoverUrl(coverUrl?: string | null, coverUrlOriginal?: string | null): string | null {
  // Если есть cover_url_original - используем его
  // Иначе fallback на cover_url
  return coverUrlOriginal || coverUrl || null;
}

/**
 * Предзагрузка списка обложек в фоне
 * Использует requestIdleCallback для загрузки без блокировки UI
 */
export function usePreloadSmartCovers(
  urls: (string | null | undefined)[],
  options?: { priority?: boolean; size?: 'thumb' | 'sm' | 'md' | 'lg' | 'xl' }
) {
  useEffect(() => {
    const size = options?.size || 'md';
    const width = SIZE_MAP[size];
    
    const validUrls = urls
      .filter((url): url is string => !!url)
      .map(url => getOptimizedUrl(url, width * 2, 75))
      .filter(url => !imageCache.has(url));
    
    if (validUrls.length === 0) return;

    if (options?.priority) {
      // Priority - грузим сразу параллельно
      validUrls.forEach(url => preloadImage(url).catch(() => {}));
    } else {
      // Фоновая загрузка по одному
      let index = 0;
      
      const loadNext = () => {
        if (index >= validUrls.length) return;
        
        const callback = () => {
          preloadImage(validUrls[index]).catch(() => {}).finally(() => {
            index++;
            setTimeout(loadNext, 50); // Небольшая задержка между загрузками
          });
        };

        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(callback, { timeout: 2000 });
        } else {
          setTimeout(callback, 100);
        }
      };

      loadNext();
    }
  }, [urls.join(','), options?.priority, options?.size]);
}

/**
 * Утилиты для работы с кэшем
 */
export const SmartImageCache = {
  /** Очистить весь кэш */
  clear: () => {
    imageCache.clear();
    loadingPromises.clear();
  },
  
  /** Размер кэша */
  size: () => imageCache.size,
  
  /** Проверить наличие в кэше */
  has: (url: string) => imageCache.has(url),
  
  /** Предзагрузить изображение */
  preload: preloadImage,
};

export default SmartCoverImage;
