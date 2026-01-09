import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* TURBO OPTIMIZED CONFIG - МАКСИМАЛЬНАЯ скорость переходов */
  devIndicators: false,
  
  // Очистка при сборке
  cleanDistDir: true,
  
  // =============================================
  // TURBO ПРОИЗВОДИТЕЛЬНОСТЬ
  // =============================================
  experimental: {
    // ⚠️ КРИТИЧНО: ОТКЛЮЧАЕМ optimizeCss - он удаляет GPU-хаки!
    // cssnano минификатор считает transform: translateZ(0) "бесполезным" и удаляет
    // В результате в production теряется изоляция GPU-слоёв
    optimizeCss: false,
    
    // МАКСИМАЛЬНОЕ КЭШИРОВАНИЕ - страницы летают
    staleTimes: {
      dynamic: 120,  // 2 минуты для динамики - МГНОВЕННЫЕ повторные визиты
      static: 600,   // 10 минут для статики - страницы в памяти
    },
    
    // Tree-shaking для тяжёлых пакетов - КРИТИЧНО для bundle size
    // Это позволяет загружать только используемые части библиотек
    optimizePackageImports: [
      'lucide-react',
      '@supabase/supabase-js',
      'framer-motion',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      '@dnd-kit/utilities',
      'react-easy-crop',
      'exceljs',
      'jszip',           // Добавлено: ZIP архивы
      'date-fns',        // Если используется
      '@headlessui/react', // Если используется
    ],
    
    // Параллельная загрузка роутов
    ppr: false, // Partial Prerendering - отключаем пока не стабильно
  },
  
  // GZIP/Brotli сжатие - уменьшает трафик на 70%
  compress: true,
  
  // Стабильный build ID для кэширования
  generateBuildId: async () => {
    return process.env.BUILD_ID || `build-${Date.now()}`;
  },
  
  // Dev server оптимизация - БОЛЬШЕ страниц в памяти
  onDemandEntries: {
    maxInactiveAge: 120 * 1000, // 2 минуты - держим страницы дольше
    pagesBufferLength: 10, // Буфер для 10 страниц
  },
  
  reactStrictMode: false, // Отключаем в prod для скорости
  poweredByHeader: false,

  // ⚠️ Игнорировать ESLint ошибки при build
  // Это позволяет билдить даже если есть lint ошибки
  // Ошибки всё равно показываются в IDE
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ⚠️ Игнорировать TypeScript ошибки при build (опционально)
  // Раскомментировать если нужно срочно задеплоить
  // typescript: {
  //   ignoreBuildErrors: true,
  // },

  // Turbopack для быстрой разработки
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // Compiler оптимизации
  compiler: {
    // Удаляем console.log в продакшене
    removeConsole: process.env.NODE_ENV === 'production',
    // Удаляем React devtools в продакшене
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },
  
  // =============================================
  // ОПТИМИЗАЦИЯ ИЗОБРАЖЕНИЙ - КРИТИЧНО ДЛЯ МОБИЛЬНЫХ
  // =============================================
  images: {
    // ⚠️ КРИТИЧНО ДЛЯ PRODUCTION: Отключаем оптимизацию на сервере
    // Хостинг пытается пережимать 3000px исходники "на лету"
    // Это вызывает лаги GPU при декодировании огромных изображений
    unoptimized: process.env.NODE_ENV === 'production',
    
    // Современные форматы - AVIF на 50% меньше WebP
    formats: ['image/avif', 'image/webp'],
    
    // Размеры для разных экранов - покрываем Redmi A5 и выше
    deviceSizes: [320, 420, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // Долгий кэш для изображений - год!
    minimumCacheTTL: 31536000,
    
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    
    // Разрешаем внешние домены (Supabase storage)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
      },
    ],
  },
  
  // Без source maps в production
  productionBrowserSourceMaps: false,
  
  // =============================================
  // ЗАГОЛОВКИ КЭШИРОВАНИЯ - КЛЮЧ К СКОРОСТИ
  // =============================================
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    
    return [
      // HTML страницы - БЕЗ КЭША чтобы всегда получать свежую версию
      // Это критично для обновлений - клиент получает новый HTML с новыми ссылками на JS
      {
        source: '/((?!_next/static|_next/image|api|favicon.ico|.*\\.(?:svg|jpg|png|webp|avif|woff|woff2|ico)).*)',
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
          // Prefetch hint
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
      
      // Статичные ассеты (изображения, шрифты) - максимальный кэш
      {
        source: '/:all*(svg|jpg|png|webp|avif|woff|woff2|ico|mp3|wav)',
        headers: [
          {
            key: 'Cache-Control',
            value: isDev 
              ? 'public, max-age=3600'
              : 'public, max-age=31536000, immutable',
          },
        ],
      },
      
      // Next.js static assets (JS/CSS с хэшами) - максимальный кэш
      // Эти файлы имеют уникальные хэши, поэтому можно кэшировать вечно
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: isDev
              ? 'public, max-age=3600'
              : 'public, max-age=31536000, immutable',
          },
        ],
      },
      
      // API - без кэша
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-cache, no-store, must-revalidate',
          },
          // CORS для API
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
      
      // Оптимизированные изображения Next.js
      {
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ];
  },
};
