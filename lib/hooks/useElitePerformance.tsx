"use client";

/**
 * 💎 ELITE PERFORMANCE OPTIMIZER
 * 
 * Инициализирует все продвинутые оптимизации:
 * 1. Passive Event Listeners - мгновенный скролл
 * 2. Reduce Motion - для пользователей с настройкой
 * 3. Connection-aware loading - адаптация под сеть
 * 4. Memory pressure handling - очистка при нехватке памяти
 * 
 * Target: <10% GPU idle, 60 FPS scroll
 */

import { useEffect, useRef } from 'react';
import { initGlobalPassiveListeners } from './usePassiveEvents';

// Флаг инициализации (singleton)
let isInitialized = false;

/**
 * Инициализация всех performance оптимизаций
 */
function initElitePerformance() {
  if (typeof window === 'undefined' || isInitialized) return;
  isInitialized = true;
  
  // 1. 🔇 Passive Event Listeners
  initGlobalPassiveListeners();
  
  // 2. 📉 Reduce unnecessary animations
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    document.documentElement.classList.add('reduce-motion');
  }
  
  // 3. 🌐 Connection-aware optimizations
  const connection = (navigator as any).connection;
  if (connection) {
    const handleConnectionChange = () => {
      const isSlowConnection = connection.saveData || 
        connection.effectiveType === 'slow-2g' || 
        connection.effectiveType === '2g';
      
      document.documentElement.classList.toggle('slow-connection', isSlowConnection);
      
      // На медленном соединении отключаем тяжёлые эффекты
      if (isSlowConnection) {
        document.documentElement.style.setProperty('--blur-amount', '0px');
        document.documentElement.style.setProperty('--animation-duration', '0s');
      }
    };
    
    connection.addEventListener('change', handleConnectionChange);
    handleConnectionChange();
  }
  
  // 4. 💾 Memory pressure handling - проверяем только один раз при загрузке
  // УБРАЛИ постоянный setInterval - он грузил CPU!
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    const usedRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    
    // При использовании >80% памяти включаем режим экономии
    if (usedRatio > 0.8) {
      document.documentElement.classList.add('low-memory');
    }
  }
  
  // 5. 🖼 Image loading optimization
  if ('loading' in HTMLImageElement.prototype) {
    // Native lazy loading поддерживается
    document.documentElement.classList.add('native-lazy');
  }
  
  // 6. 📐 Layout optimization hints
  const style = document.createElement('style');
  style.id = 'elite-performance-styles';
  style.textContent = `
    /* 🚀 Elite Performance CSS */
    
    /* Reduce motion для пользователей с настройкой */
    .reduce-motion *,
    .reduce-motion *::before,
    .reduce-motion *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
    
    /* Slow connection - отключаем тяжёлые эффекты */
    .slow-connection .backdrop-blur-sm,
    .slow-connection .backdrop-blur,
    .slow-connection .backdrop-blur-md,
    .slow-connection .backdrop-blur-lg,
    .slow-connection .backdrop-blur-xl,
    .slow-connection [class*="backdrop-filter"],
    .slow-connection [style*="backdrop-filter"] {
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }
    
    /* Low memory mode */
    .low-memory img:not([loading="eager"]) {
      content-visibility: auto;
    }
    
    .low-memory .decorative,
    .low-memory [class*="particle"],
    .low-memory [class*="sparkle"] {
      display: none !important;
    }
    
    /* Content-visibility для виртуализации */
    .virtualized-item {
      content-visibility: auto;
      contain-intrinsic-size: auto 100px;
    }
    
    /* GPU layer hints - browser decides */
    .gpu-layer {
      will-change: auto;
      transform: translateZ(0);
      backface-visibility: hidden;
    }
    
    /* Interactivity hints */
    @media (hover: hover) {
      .hover-optimize:hover {
        will-change: transform, box-shadow;
      }
    }
  `;
  document.head.appendChild(style);
  
  // 7. 🎯 IntersectionObserver для lazy elements
  if ('IntersectionObserver' in window) {
    const lazyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            el.classList.add('is-visible');
            el.style.contentVisibility = 'visible';
            lazyObserver.unobserve(el);
          }
        });
      },
      { rootMargin: '100px' }
    );
    
    // Наблюдаем за элементами с классом lazy-render
    document.querySelectorAll('.lazy-render').forEach(el => {
      lazyObserver.observe(el);
    });
    
    // Экспортируем для использования в компонентах
    (window as any).__lazyObserver = lazyObserver;
  }
  
  console.log('💎 Elite Performance initialized');
}

/**
 * Хук для использования в layout.tsx
 * Инициализирует все оптимизации один раз
 */
export function useElitePerformance() {
  const initialized = useRef(false);
  
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      initElitePerformance();
    }
  }, []);
}

/**
 * Компонент-обёртка (альтернатива хуку)
 */
export function ElitePerformanceProvider({ children }: { children: React.ReactNode }) {
  useElitePerformance();
  return <>{children}</>;
}

export default useElitePerformance;
