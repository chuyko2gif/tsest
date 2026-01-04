"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Список критических маршрутов для предзагрузки
 */
const CRITICAL_ROUTES = [
  '/feed',
  '/cabinet',
  '/news',
  '/contacts',
  '/faq',
  '/offer',
  '/admin',
  '/auth',
];

/**
 * Хук для предзагрузки критических маршрутов
 * Загружает страницы заранее для мгновенных переходов
 */
export function usePrefetchRoutes() {
  const router = useRouter();

  useEffect(() => {
    // Предзагружаем все критические маршруты после загрузки страницы
    const prefetchAll = () => {
      CRITICAL_ROUTES.forEach((route) => {
        router.prefetch(route);
      });
    };

    // Используем requestIdleCallback для загрузки в фоне
    if ('requestIdleCallback' in window) {
      (window as Window & { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(prefetchAll);
    } else {
      // Fallback для браузеров без requestIdleCallback
      setTimeout(prefetchAll, 100);
    }
  }, [router]);
}

/**
 * Хук для предзагрузки конкретного маршрута при наведении
 */
export function usePrefetchOnHover(route: string) {
  const router = useRouter();

  const handleMouseEnter = () => {
    router.prefetch(route);
  };

  return { onMouseEnter: handleMouseEnter };
}

/**
 * Компонент для предзагрузки всех маршрутов
 * Добавить в layout для автоматической предзагрузки
 */
export function PrefetchRoutes() {
  usePrefetchRoutes();
  return null;
}

export default PrefetchRoutes;
