"use client";

import { useEffect, useCallback } from 'react';

/**
 * Компонент для агрессивной очистки кэша
 * НЕ трогает localStorage и sessionStorage (чтобы не разлогинивать)
 */
export default function CacheBuster() {
  const clearAllCaches = useCallback(async () => {
    if (typeof window === 'undefined') return;
    
    try {
      // 1. Очищаем Service Worker кэш
      if ('caches' in window) {
        try {
          const names = await caches.keys();
          await Promise.all(names.map(name => caches.delete(name)));
        } catch (e) {
          // Cache clearing failed silently
        }
      }
      
      // 2. Отключаем и удаляем Service Workers
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map(r => r.unregister()));
        } catch (e) {
          // Service worker unregistration failed silently
        }
      }
      
      // 3. Очищаем fetch/HTTP кэш (форсированная перезагрузка ресурсов)
      if ('performance' in window && (performance as any).clearResourceTimings) {
        (performance as any).clearResourceTimings();
      }
    } catch (e) {
      // Silent fail
    }
  }, []);

  useEffect(() => {
    // Очищаем ТОЛЬКО при монтировании - один раз
    clearAllCaches();
    
    // УБРАЛИ постоянную очистку - она грузила CPU:
    // - clearInterval каждые 30 сек
    // - handleFocus при каждом возврате на вкладку
    // - visibilitychange listener
    
    return () => {};
  }, [clearAllCaches]);

  return (
    <>
      <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate, max-age=0" />
      <meta httpEquiv="Pragma" content="no-cache" />
      <meta httpEquiv="Expires" content="-1" />
    </>
  );
}
