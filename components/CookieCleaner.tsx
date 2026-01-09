'use client';

import { useEffect } from 'react';

// Версия для инвалидации кэша (НЕ для очистки auth)
const APP_VERSION = process.env.NEXT_PUBLIC_BUILD_TIME || '2026.01.09.3';

export default function CookieCleaner() {
  useEffect(() => {
    const storedVersion = localStorage.getItem('app_version');
    
    // Если версия изменилась - просто логируем (НЕ очищаем auth куки!)
    if (storedVersion !== APP_VERSION) {
      console.log(`[CookieCleaner] Версия обновлена: ${storedVersion} → ${APP_VERSION}`);
      
      // Сохраняем новую версию БЕЗ очистки auth
      localStorage.setItem('app_version', APP_VERSION);
      
      // Очищаем только кэш, НЕ auth данные
      // Это нужно для обновления JS, но пользователи останутся залогинены
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => {
            if (!name.includes('auth')) {
              caches.delete(name);
            }
          });
        });
      }
    }
  }, []);

  return null;
}
