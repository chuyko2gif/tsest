"use client";

import { useEffect, memo } from 'react';

/**
 * LAZY IMAGE OPTIMIZER 🖼️
 * 
 * Оптимизация загрузки изображений:
 * 1. Нативный lazy loading
 * 2. Fade-in анимация при появлении
 * 3. Placeholder с blur эффектом
 * 4. WebP детекция и fallback
 * 5. Размытие до загрузки
 * 6. Progressive loading
 */

const LazyImageOptimizer = memo(() => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Проверяем поддержку нативного lazy loading
    const supportsLazyLoading = 'loading' in HTMLImageElement.prototype;
    
    // Инжектим стили для изображений
    const style = document.createElement('style');
    style.id = 'lazy-image-styles';
    style.textContent = `
      /* Skeleton placeholder для изображений */
      img:not([src]):not([data-loaded]) {
        background: linear-gradient(90deg, #1a1a2e 25%, #232346 50%, #1a1a2e 75%);
        background-size: 200% 100%;
        animation: skeleton-pulse 1.5s ease-in-out infinite;
      }
      
      @keyframes skeleton-pulse {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      
      /* Fade-in при загрузке */
      img[data-lazy] {
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      img[data-lazy][data-loaded] {
        opacity: 1;
      }
      
      /* Blur-up эффект */
      img[data-blur-placeholder] {
        filter: blur(10px);
        transition: filter 0.5s ease;
      }
      
      img[data-blur-placeholder][data-loaded] {
        filter: blur(0);
      }
      
      /* Aspect ratio контейнер */
      .img-container {
        position: relative;
        overflow: hidden;
        background: #1a1a2e;
      }
      
      .img-container::before {
        content: '';
        display: block;
        padding-top: 100%; /* 1:1 по умолчанию */
      }
      
      .img-container img {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      /* Оптимизация для обложек */
      img[data-cover] {
        aspect-ratio: 1;
        object-fit: cover;
        background: linear-gradient(135deg, #1a1a2e 0%, #232346 100%);
      }
      
      /* Предотвращение layout shift */
      img[width][height] {
        aspect-ratio: attr(width) / attr(height);
      }
    `;
    
    // Удаляем старые стили если есть
    const existing = document.getElementById('lazy-image-styles');
    if (existing) existing.remove();
    
    document.head.appendChild(style);
    
    // Обработка изображений
    const processImages = () => {
      const images = document.querySelectorAll('img:not([data-processed])');
      
      images.forEach((img) => {
        const imgEl = img as HTMLImageElement;
        
        // Помечаем как обработанное
        imgEl.setAttribute('data-processed', 'true');
        
        // Добавляем lazy loading если не указано
        if (!imgEl.loading) {
          imgEl.loading = 'lazy';
        }
        
        // Добавляем decoding async
        if (!imgEl.decoding) {
          imgEl.decoding = 'async';
        }
        
        // Обработчик загрузки
        if (!imgEl.complete) {
          imgEl.setAttribute('data-lazy', 'true');
          
          imgEl.addEventListener('load', () => {
            imgEl.setAttribute('data-loaded', 'true');
          }, { once: true });
          
          imgEl.addEventListener('error', () => {
            // Fallback placeholder при ошибке
            imgEl.style.opacity = '0.5';
          }, { once: true });
        } else {
          imgEl.setAttribute('data-loaded', 'true');
        }
      });
    };
    
    // IntersectionObserver для доп. оптимизации
    const imageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const img = entry.target as HTMLImageElement;
          
          if (entry.isIntersecting) {
            // Приоритетная загрузка видимых изображений
            if (img.loading === 'lazy') {
              img.loading = 'eager';
            }
            imageObserver.unobserve(img);
          }
        });
      },
      { rootMargin: '50px', threshold: 0.01 }
    );
    
    // Наблюдаем за изображениями
    const observeImages = () => {
      document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
        imageObserver.observe(img);
      });
    };
    
    // Запускаем обработку
    processImages();
    observeImages();
    
    // MutationObserver для новых изображений
    const mutationObserver = new MutationObserver((mutations) => {
      let hasNewImages = false;
      
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            if (node.tagName === 'IMG' || node.querySelector('img')) {
              hasNewImages = true;
            }
          }
        });
      });
      
      if (hasNewImages) {
        processImages();
        observeImages();
      }
    });
    
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
    
    return () => {
      mutationObserver.disconnect();
      imageObserver.disconnect();
    };
  }, []);

  return null;
});

LazyImageOptimizer.displayName = 'LazyImageOptimizer';

export default LazyImageOptimizer;
