"use client";

import { useEffect, useCallback, useRef, memo } from 'react';

/**
 * ULTRA PERFORMANCE BOOSTER 🚀
 * 
 * Экстремальные оптимизации для старых ПК и телефонов:
 * 1. Отложенная загрузка некритических ресурсов
 * 2. Агрессивное упрощение на слабых устройствах
 * 3. Frame rate limiting для экономии CPU
 * 4. Memory cleanup для предотвращения утечек
 * 5. Connection-aware loading
 * 6. Battery-aware оптимизации
 * 7. Viewport-based rendering
 */

// Типы производительности
type PerfLevel = 'ultra-low' | 'low' | 'medium' | 'high';

// Детекция уровня производительности
function detectPerformanceLevel(): PerfLevel {
  if (typeof window === 'undefined') return 'medium';
  
  const cores = navigator.hardwareConcurrency || 2;
  const memory = (navigator as any).deviceMemory || 2;
  const connection = (navigator as any).connection;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isOldDevice = /Android [0-5]\.|iPhone OS [0-9]_|iPad.*OS [0-9]_/i.test(navigator.userAgent);
  const isVeryLowEnd = /Redmi|POCO|Realme|Samsung Galaxy A[0-2]|Nokia [0-5]/i.test(navigator.userAgent);
  
  // Проверяем сохранение данных
  const saveData = connection?.saveData || false;
  const slowConnection = connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g';
  
  // Ультра-низкий уровень
  if (cores <= 2 || memory <= 1 || isVeryLowEnd || isOldDevice || saveData || slowConnection) {
    return 'ultra-low';
  }
  
  // Низкий уровень
  if (cores <= 4 || memory <= 2 || (isMobile && cores <= 4)) {
    return 'low';
  }
  
  // Средний
  if (cores <= 6 || memory <= 4 || isMobile) {
    return 'medium';
  }
  
  return 'high';
}

// Глобальные переменные
let perfLevel: PerfLevel = 'medium';
let isInitialized = false;

// Применение оптимизаций к DOM
function applyOptimizations(level: PerfLevel) {
  const html = document.documentElement;
  const body = document.body;
  
  // Удаляем старые классы
  html.classList.remove('perf-ultra-low', 'perf-low', 'perf-medium', 'perf-high');
  html.classList.add(`perf-${level}`);
  html.setAttribute('data-perf-level', level);
  
  // GPU ускорение
  body.style.transform = 'translateZ(0)';
  body.style.backfaceVisibility = 'hidden';
  
  // CSS переменные для адаптивных анимаций
  const cssVars: Record<PerfLevel, Record<string, string>> = {
    'ultra-low': {
      '--anim-duration': '0.1s',
      '--transition-duration': '0.1s',
      '--blur-amount': '4px',
      '--shadow-opacity': '0.2',
      '--orb-opacity': '0',
      '--grid-opacity': '0',
      '--particle-count': '0',
    },
    'low': {
      '--anim-duration': '0.15s',
      '--transition-duration': '0.15s',
      '--blur-amount': '8px',
      '--shadow-opacity': '0.3',
      '--orb-opacity': '0.3',
      '--grid-opacity': '0.3',
      '--particle-count': '2',
    },
    'medium': {
      '--anim-duration': '0.25s',
      '--transition-duration': '0.2s',
      '--blur-amount': '16px',
      '--shadow-opacity': '0.5',
      '--orb-opacity': '0.6',
      '--grid-opacity': '0.6',
      '--particle-count': '5',
    },
    'high': {
      '--anim-duration': '0.4s',
      '--transition-duration': '0.3s',
      '--blur-amount': '24px',
      '--shadow-opacity': '1',
      '--orb-opacity': '1',
      '--grid-opacity': '1',
      '--particle-count': '10',
    },
  };
  
  Object.entries(cssVars[level]).forEach(([key, value]) => {
    html.style.setProperty(key, value);
  });
  
  // Инжектим критические стили
  injectCriticalStyles(level);
}

// Инжект критических стилей для оптимизации
function injectCriticalStyles(level: PerfLevel) {
  const existingStyle = document.getElementById('ultra-perf-styles');
  if (existingStyle) existingStyle.remove();
  
  const style = document.createElement('style');
  style.id = 'ultra-perf-styles';
  
  if (level === 'ultra-low') {
    style.textContent = `
      /* ULTRA-LOW: Минимальные эффекты */
      [data-perf-level="ultra-low"] * {
        animation-duration: 0.1s !important;
        transition-duration: 0.1s !important;
        animation-timing-function: linear !important;
      }
      
      [data-perf-level="ultra-low"] .orb-animation,
      [data-perf-level="ultra-low"] .complex-gradient,
      [data-perf-level="ultra-low"] .heavy-animation,
      [data-perf-level="ultra-low"] .floating-particle {
        display: none !important;
      }
      
      [data-perf-level="ultra-low"] [style*="backdrop-filter"],
      [data-perf-level="ultra-low"] .backdrop-blur-xl,
      [data-perf-level="ultra-low"] .backdrop-blur-2xl,
      [data-perf-level="ultra-low"] .backdrop-blur-3xl {
        backdrop-filter: blur(4px) !important;
        -webkit-backdrop-filter: blur(4px) !important;
      }
      
      [data-perf-level="ultra-low"] .shadow-2xl,
      [data-perf-level="ultra-low"] .shadow-xl {
        box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
      }
      
      [data-perf-level="ultra-low"] img {
        image-rendering: optimizeSpeed;
      }
      
      /* Отключаем все keyframe анимации на ультра-низком */
      @media (prefers-reduced-motion: no-preference) {
        [data-perf-level="ultra-low"] *::before,
        [data-perf-level="ultra-low"] *::after {
          animation: none !important;
        }
      }
    `;
  } else if (level === 'low') {
    style.textContent = `
      /* LOW: Упрощённые эффекты */
      [data-perf-level="low"] * {
        animation-duration: 0.15s !important;
        transition-duration: 0.15s !important;
      }
      
      [data-perf-level="low"] .orb-animation {
        animation-duration: 60s !important;
        opacity: 0.3 !important;
      }
      
      [data-perf-level="low"] [style*="backdrop-filter"] {
        backdrop-filter: blur(8px) !important;
        -webkit-backdrop-filter: blur(8px) !important;
      }
      
      [data-perf-level="low"] .complex-gradient {
        opacity: 0.5 !important;
      }
    `;
  }
  
  // Общие оптимизации для всех уровней
  style.textContent += `
    /* Оптимизация скролла */
    .is-scrolling * {
      pointer-events: none !important;
    }
    .is-scrolling [style*="backdrop-filter"] {
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }
    
    /* GPU ускорение для интерактивных элементов */
    a, button, [role="button"], input, select, textarea {
      transform: translateZ(0);
      will-change: opacity;
    }
    
    /* Мгновенный feedback */
    a:active, button:active {
      transform: scale(0.98) translateZ(0);
      transition: transform 0.05s ease !important;
    }
    
    /* Content visibility для ленивого рендеринга */
    .lazy-section {
      content-visibility: auto;
      contain-intrinsic-size: auto 500px;
    }
    
    /* Оптимизация изображений */
    img[loading="lazy"] {
      content-visibility: auto;
    }
  `;
  
  document.head.appendChild(style);
}

// Компонент оптимизатора
const UltraPerformanceBooster = memo(() => {
  const isScrolling = useRef(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameCount = useRef(0);
  const lastFrameTime = useRef(0);
  const rafIdRef = useRef<number>(0);

  // Оптимизация во время скролла
  const handleScrollStart = useCallback(() => {
    if (isScrolling.current) return;
    isScrolling.current = true;
    document.documentElement.classList.add('is-scrolling');
  }, []);

  const handleScrollEnd = useCallback(() => {
    isScrolling.current = false;
    document.documentElement.classList.remove('is-scrolling');
  }, []);

  const handleScroll = useCallback(() => {
    handleScrollStart();
    
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    
    const delay = perfLevel === 'ultra-low' ? 50 : perfLevel === 'low' ? 100 : 150;
    scrollTimeout.current = setTimeout(handleScrollEnd, delay);
  }, [handleScrollStart, handleScrollEnd]);

  // Frame rate monitoring и throttling
  const monitorFrameRate = useCallback(function frameMonitor() {
    const now = performance.now();
    
    if (lastFrameTime.current) {
      const delta = now - lastFrameTime.current;
      
      // Если frame rate падает ниже 30fps (33ms per frame)
      if (delta > 33 && perfLevel !== 'ultra-low') {
        frameCount.current++;
        
        // Если несколько фреймов подряд медленные - понижаем уровень
        if (frameCount.current > 10) {
          console.log('[UltraPerf] Low FPS detected, reducing quality');
          const levels: PerfLevel[] = ['ultra-low', 'low', 'medium', 'high'];
          const currentIndex = levels.indexOf(perfLevel);
          if (currentIndex > 0) {
            perfLevel = levels[currentIndex - 1];
            applyOptimizations(perfLevel);
          }
          frameCount.current = 0;
        }
      } else {
        frameCount.current = Math.max(0, frameCount.current - 1);
      }
    }
    
    lastFrameTime.current = now;
    
    // Продолжаем мониторинг только на не ultra-low
    if (perfLevel !== 'ultra-low') {
      rafIdRef.current = requestAnimationFrame(frameMonitor);
    }
  }, []);

  // Очистка памяти
  const cleanupMemory = useCallback(() => {
    // Удаляем отсоединённые DOM элементы
    const detachedElements = document.querySelectorAll('[data-detached="true"]');
    detachedElements.forEach(el => el.remove());
    
    // Сигнал для garbage collector
    if ((window as any).gc) {
      (window as any).gc();
    }
  }, []);

  // Инициализация
  useEffect(() => {
    if (isInitialized) return;
    isInitialized = true;
    
    // Определяем уровень производительности
    perfLevel = detectPerformanceLevel();
    
    // Применяем оптимизации
    applyOptimizations(perfLevel);
    
    // Логируем в dev режиме
    if (process.env.NODE_ENV === 'development') {
      console.log(`[UltraPerf] Performance level: ${perfLevel}`);
      console.log(`[UltraPerf] Cores: ${navigator.hardwareConcurrency}, Memory: ${(navigator as any).deviceMemory || 'unknown'}GB`);
    }
    
    // Запускаем мониторинг FPS (только не на ultra-low)
    if (perfLevel !== 'ultra-low') {
      requestAnimationFrame(monitorFrameRate);
    }
    
    // Scroll optimization с passive listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Периодическая очистка памяти (каждые 30 сек)
    const memoryCleanupInterval = setInterval(cleanupMemory, 30000);
    
    // Battery API - если батарея низкая, снижаем качество
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        if (battery.level < 0.2 && !battery.charging && perfLevel !== 'ultra-low') {
          console.log('[UltraPerf] Low battery, reducing quality');
          perfLevel = 'low';
          applyOptimizations(perfLevel);
        }
        
        battery.addEventListener('levelchange', () => {
          if (battery.level < 0.15 && !battery.charging) {
            perfLevel = 'ultra-low';
            applyOptimizations(perfLevel);
          }
        });
      }).catch(() => {});
    }
    
    // Network change detection
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', () => {
        if (connection.saveData || connection.effectiveType === 'slow-2g') {
          perfLevel = 'ultra-low';
          applyOptimizations(perfLevel);
        }
      });
    }
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(memoryCleanupInterval);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, [handleScroll, monitorFrameRate, cleanupMemory]);

  return null;
});

UltraPerformanceBooster.displayName = 'UltraPerformanceBooster';

// Экспорты
export { perfLevel, detectPerformanceLevel };
export default UltraPerformanceBooster;
