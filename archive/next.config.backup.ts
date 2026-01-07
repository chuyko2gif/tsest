import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  
  // Автоматическая очистка кэша при сборке
  cleanDistDir: true,
  
  // Полное отключение кэширования данных
  experimental: {
    // Отключаем статическую генерацию для всех страниц
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
  
  // Отключаем кэширование в dev режиме для свежих данных
  onDemandEntries: {
    // Период в мс, в течение которого страница хранится в буфере
    maxInactiveAge: 5 * 1000, // 5 секунд - моментальное обновление
    // Количество страниц, которые должны храниться одновременно
    pagesBufferLength: 1,
  },
  
  // Оптимизация производительности
  compiler: {
    // Удаляем console.log в продакшене
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Оптимизация изображений
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 31536000, // 1 год кэширования
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Оптимизация сборки
  productionBrowserSourceMaps: false, // Отключаем source maps в продакшене
  poweredByHeader: false, // Убираем заголовок X-Powered-By
  
  // Заголовки для кэширования
  async headers() {
    return [
      {
        // Отключаем кэширование HTML страниц - всегда свежий контент
        source: '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|jpg|png|webp|avif|woff|woff2|ico)).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        source: '/:all*(svg|jpg|png|webp|avif|woff|woff2|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Кэширование статических JS/CSS файлов
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // API - короткое кэширование с revalidate
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
