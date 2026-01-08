"use client";

import { useEffect, useCallback, useRef, memo } from 'react';

/**
 * PERFORMANCE OPTIMIZER - МАКСИМАЛЬНАЯ производительность
 * 
 * Оптимизации для слабых устройств (Redmi A5 и подобные):
 * 1. Автоматическое упрощение анимаций на слабых устройствах
 * 2. Снижение частоты обновлений (throttling)
 * 3. Lazy loading для тяжёлых элементов
 * 4. Отключение non-critical функций на слабых устройствах
 * 5. GPU-ускорение критических элементов
 * 6. Оптимизация scroll и resize событий
 * 7. Memory management для предотвращения утечек
 */

// Детекция производительности устройства
const getDevicePerformance = (): 'low' | 'medium' | 'high' => {
  if (typeof window === 'undefined') return 'medium';
  
  const cores = navigator.hardwareConcurrency || 4;
  const memory = (navigator as any).deviceMemory || 4;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isOldAndroid = /Android [0-6]\./i.test(navigator.userAgent);
  const isLowEndPhone = /Redmi|POCO|Realme|Samsung Galaxy A[0-3]/i.test(navigator.userAgent);
  
  // Очень слабые устройства
  if (cores <= 2 || memory <= 2 || isOldAndroid || isLowEndPhone) return 'low';
  
  // Средние устройства
  if (cores <= 4 || memory <= 4 || isMobile) return 'medium';
  
  // Мощные устройства
  return 'high';
};

// Глобальный флаг производительности
let devicePerformance: 'low' | 'medium' | 'high' | null = null;
let isLowEndDevice = false;
let isMediumDevice = false;

// Инициализация при первом рендере
if (typeof window !== 'undefined') {
  devicePerformance = getDevicePerformance();
  isLowEndDevice = devicePerformance === 'low';
  isMediumDevice = devicePerformance === 'medium';
}

// Экспорт для использования в других компонентах
export { isLowEndDevice, isMediumDevice, devicePerformance };

// Throttle функция с высокой производительностью
function throttle<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return ((...args: any[]) => {
    const now = Date.now();
    const remaining = delay - (now - lastCall);
    
    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCall = now;
      fn(...args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        fn(...args);
      }, remaining);
    }
  }) as T;
}

// Debounce для ещё более агрессивного throttling
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return ((...args: any[]) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
}

// Компонент оптимизации
const PerformanceOptimizer = memo(() => {
  const rafId = useRef<number>(0);
  const isScrolling = useRef(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Применение CSS классов в зависимости от устройства
  const applyPerformanceClasses = useCallback(() => {
    const html = document.documentElement;
    const body = document.body;
    
    // Очищаем предыдущие классы
    html.classList.remove('perf-low', 'perf-medium', 'perf-high', 'is-scrolling');
    
    // Добавляем класс производительности
    html.classList.add(`perf-${devicePerformance}`);
    
    // GPU ускорение для body
    body.style.transform = 'translateZ(0)';
    body.style.backfaceVisibility = 'hidden';
    
    // На слабых устройствах
    if (isLowEndDevice) {
      // Отключаем сложные эффекты через CSS переменные
      html.style.setProperty('--animation-duration', '0.15s');
      html.style.setProperty('--transition-duration', '0.15s');
      html.style.setProperty('--blur-amount', '8px');
      html.style.setProperty('--shadow-opacity', '0.3');
      
      // Добавляем атрибут для CSS селекторов
      html.setAttribute('data-perf', 'low');
    } else if (isMediumDevice) {
      html.style.setProperty('--animation-duration', '0.25s');
      html.style.setProperty('--transition-duration', '0.2s');
      html.style.setProperty('--blur-amount', '16px');
      html.style.setProperty('--shadow-opacity', '0.5');
      html.setAttribute('data-perf', 'medium');
    } else {
      html.style.setProperty('--animation-duration', '0.4s');
      html.style.setProperty('--transition-duration', '0.3s');
      html.style.setProperty('--blur-amount', '24px');
      html.style.setProperty('--shadow-opacity', '1');
      html.setAttribute('data-perf', 'high');
    }
  }, []);

  // Оптимизация скролла - отключаем тяжёлые эффекты во время скролла
  const handleScrollStart = useCallback(() => {
    if (isScrolling.current) return;
    isScrolling.current = true;
    
    // Добавляем класс для CSS оптимизаций во время скролла
    document.documentElement.classList.add('is-scrolling');
    
    // На слабых устройствах скрываем тяжёлые элементы
    if (isLowEndDevice) {
      const heavyElements = document.querySelectorAll('.heavy-animation, .complex-gradient');
      heavyElements.forEach(el => {
        (el as HTMLElement).style.visibility = 'hidden';
      });
    }
  }, []);

  const handleScrollEnd = useCallback(() => {
    isScrolling.current = false;
    document.documentElement.classList.remove('is-scrolling');
    
    // Возвращаем видимость
    if (isLowEndDevice) {
      const heavyElements = document.querySelectorAll('.heavy-animation, .complex-gradient');
      heavyElements.forEach(el => {
        (el as HTMLElement).style.visibility = 'visible';
      });
    }
  }, []);

  // Умный обработчик скролла
  const handleScroll = useCallback(() => {
    handleScrollStart();
    
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    
    // Задержка окончания скролла в зависимости от устройства
    const delay = isLowEndDevice ? 100 : isMediumDevice ? 75 : 50;
    scrollTimeout.current = setTimeout(handleScrollEnd, delay);
  }, [handleScrollStart, handleScrollEnd]);

  // Оптимизация resize
  // eslint-disable-next-line react-hooks/use-memo
  const handleResize = useCallback(debounce(() => {
    // Пересчитываем только критические элементы
    const event = new CustomEvent('optimized-resize');
    window.dispatchEvent(event);
  }, isLowEndDevice ? 200 : 100), []);

  // Intersection Observer для lazy-rendering
  const setupIntersectionObserver = useCallback(() => {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target as HTMLElement;
          
          if (entry.isIntersecting) {
            // Элемент видим - включаем рендеринг
            target.style.contentVisibility = 'visible';
            target.classList.add('is-visible');
          } else if (isLowEndDevice) {
            // На слабых устройствах агрессивно отключаем невидимые элементы
            target.style.contentVisibility = 'hidden';
            target.classList.remove('is-visible');
          }
        });
      },
      {
        rootMargin: isLowEndDevice ? '50px' : '100px', // Меньший margin на слабых устройствах
        threshold: 0,
      }
    );

    // Наблюдаем за элементами с классом lazy-render
    const lazyElements = document.querySelectorAll('.lazy-render, [data-lazy]');
    lazyElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Предотвращение memory leaks - очистка старых обработчиков
  const cleanupMemory = useCallback(() => {
    // Удаляем старые MutationObserver записи
    if ((window as any).__perfObservers) {
      (window as any).__perfObservers.forEach((obs: MutationObserver) => obs.disconnect());
    }
    (window as any).__perfObservers = [];
  }, []);

  // Оптимизация анимаций через requestAnimationFrame
  const optimizeAnimations = useCallback(() => {
    if (isLowEndDevice) {
      // Уменьшаем частоту CSS анимаций на слабых устройствах
      const style = document.createElement('style');
      style.id = 'perf-optimizer-styles';
      style.textContent = `
        /* Оптимизация для слабых устройств */
        [data-perf="low"] * {
          animation-duration: 0.15s !important;
          transition-duration: 0.15s !important;
        }
        
        [data-perf="low"] .orb-animation,
        [data-perf="low"] .complex-gradient,
        [data-perf="low"] .heavy-animation {
          animation: none !important;
          opacity: 0.5 !important;
        }
        
        [data-perf="low"] .backdrop-blur-heavy {
          backdrop-filter: blur(8px) !important;
          -webkit-backdrop-filter: blur(8px) !important;
        }
        
        /* Во время скролла отключаем тяжёлые эффекты */
        .is-scrolling .heavy-animation,
        .is-scrolling .complex-gradient {
          animation-play-state: paused !important;
          opacity: 0.7;
        }
        
        .is-scrolling [style*="blur"] {
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }
        
        /* Средние устройства */
        [data-perf="medium"] .orb-animation {
          animation-duration: 30s !important;
        }
        
        [data-perf="medium"] .heavy-animation {
          opacity: 0.8 !important;
        }
      `;
      
      const existing = document.getElementById('perf-optimizer-styles');
      if (existing) existing.remove();
      document.head.appendChild(style);
    }
  }, []);

  // Основная инициализация
  useEffect(() => {
    // Определяем производительность устройства
    devicePerformance = getDevicePerformance();
    isLowEndDevice = devicePerformance === 'low';
    isMediumDevice = devicePerformance === 'medium';
    
    // Применяем классы
    applyPerformanceClasses();
    
    // Оптимизируем анимации
    optimizeAnimations();
    
    // Настраиваем intersection observer
    const cleanupObserver = setupIntersectionObserver();
    
    // Throttled scroll handler
    const throttledScroll = throttle(handleScroll, isLowEndDevice ? 32 : 16);
    
    // Event listeners с passive для максимальной производительности
    window.addEventListener('scroll', throttledScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    
    // Очистка памяти
    cleanupMemory();
    
    // Логируем информацию о производительности (только в dev)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[PerformanceOptimizer] Device performance: ${devicePerformance}`);
      console.log(`[PerformanceOptimizer] Cores: ${navigator.hardwareConcurrency}, Memory: ${(navigator as any).deviceMemory || 'unknown'}GB`);
    }
    
    return () => {
      window.removeEventListener('scroll', throttledScroll);
      window.removeEventListener('resize', handleResize);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      if (cleanupObserver) cleanupObserver();
      cancelAnimationFrame(rafId.current);
    };
  }, [applyPerformanceClasses, optimizeAnimations, setupIntersectionObserver, handleScroll, handleResize, cleanupMemory]);

  return null;
});

PerformanceOptimizer.displayName = 'PerformanceOptimizer';

export default PerformanceOptimizer;
