'use client';

import { useEffect } from 'react';

// Версия автоматически обновляется при каждом билде (timestamp)
// Если BUILD_TIME не определён, используем текущее время
const APP_VERSION = process.env.NEXT_PUBLIC_BUILD_TIME || '2026.01.09.2';

export default function CookieCleaner() {
  useEffect(() => {
    const storedVersion = localStorage.getItem('app_version');
    
    // Если версия изменилась или отсутствует - очищаем всё
    if (storedVersion !== APP_VERSION) {
      console.log(`[CookieCleaner] Обновление с ${storedVersion} до ${APP_VERSION}`);
      
      // Очищаем все cookies
      document.cookie.split(';').forEach((cookie) => {
        const name = cookie.split('=')[0].trim();
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
      });
      
      // Очищаем Supabase данные из localStorage
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });
      
      // Сохраняем новую версию
      localStorage.setItem('app_version', APP_VERSION);
      
      // Перезагружаем страницу для применения изменений
      console.log('[CookieCleaner] Перезагрузка страницы...');
      window.location.reload();
    }
  }, []);

  return null;
}
