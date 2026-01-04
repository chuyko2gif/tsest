import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  
  // Автоматическая очистка кэша при сборке
  cleanDistDir: true,
  
  // Оптимизация для максимальной производительности
  experimental: {
    // Оптимизация CSS
    optimizeCss: true,
    // ПОЛНОЕ ОТКЛЮЧЕНИЕ КЭШИРОВАНИЯ - всегда свежие данные
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
    // Оптимизация пакетов
    optimizePackageImports: ['lucide-react', '@supabase/supabase-js'],
  },
  
  // Сжатие для ускорения загрузки
  compress: true,
  
  // ПОЛНОЕ ОТКЛЮЧЕНИЕ КЭШИРОВАНИЯ - моментальное обновление каждую миллисекунду
  generateBuildId: async () => {
    return Date.now().toString();
  },
  
  // АГРЕССИВНОЕ ОТКЛЮЧЕНИЕ КЭШИРОВАНИЯ - 0 секунд
  onDemandEntries: {
    maxInactiveAge: 0, // 0 секунд - моментальное очищение
    pagesBufferLength: 0,
  },
  
  // Принудительное отключение оптимизации
  reactStrictMode: true,
  poweredByHeader: false,
  
  // Турбо режим для ускорения dev сервера
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
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
    minimumCacheTTL: 0, // Без кэширования
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Оптимизация сборки
  productionBrowserSourceMaps: false, // Отключаем source maps в продакшене
  
  // Заголовки для кэширования
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    
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
            // В dev режиме короткий кэш, в prod - длинный
            value: isDev ? 'no-cache, must-revalidate' : 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // JS/CSS файлы - в dev режиме без кэша!
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            // В dev режиме без кэша, в prod - с кэшем
            value: isDev ? 'no-cache, no-store, must-revalidate' : 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // API - без кэширования
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
