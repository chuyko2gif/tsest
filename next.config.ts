import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  
  // Автоматическая очистка кэша при сборке
  cleanDistDir: true,
  
  // Отключаем кэширование в dev режиме для свежих данных
  onDemandEntries: {
    // Период в мс, в течение которого страница хранится в буфере
    maxInactiveAge: 15 * 1000, // 15 секунд
    // Количество страниц, которые должны храниться одновременно
    pagesBufferLength: 2,
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
        // Кэширование данных API
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
