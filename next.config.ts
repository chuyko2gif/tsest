import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* ROCKET SPEED CONFIG 🚀 - МАКСИМАЛЬНАЯ скорость для слабых устройств */
  devIndicators: false,
  
  // Очистка при сборке
  cleanDistDir: true,
  
  // =============================================
  // TURBO ПРОИЗВОДИТЕЛЬНОСТЬ v2.0
  // =============================================
  experimental: {
    // Оптимизация CSS - критично для скорости
    optimizeCss: true,
    
    // МАКСИМАЛЬНОЕ КЭШИРОВАНИЕ - страницы летают
    staleTimes: {
      dynamic: 180,  // 3 минуты для динамики - МГНОВЕННЫЕ повторные визиты
      static: 900,   // 15 минут для статики - страницы в памяти надолго
    },
    
    // Tree-shaking для тяжёлых пакетов - КРИТИЧНО для bundle size
    optimizePackageImports: [
      'lucide-react',
      '@supabase/supabase-js',
      'framer-motion',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      '@dnd-kit/utilities',
      'react-easy-crop',
      'exceljs',
      'date-fns',
      'react-icons',
    ],
    
    // Параллельная загрузка роутов
    ppr: false, // Partial Prerendering - отключаем пока не стабильно
    
    // Turbo режим для dev
    turbo: {},
  },
  
  // GZIP/Brotli сжатие - уменьшает трафик на 70%
  compress: true,
  
  // Стабильный build ID для кэширования
  generateBuildId: async () => {
    return process.env.BUILD_ID || `build-${Date.now()}`;
  },
  
  // Dev server оптимизация - БОЛЬШЕ страниц в памяти
  onDemandEntries: {
    maxInactiveAge: 180 * 1000, // 3 минуты - держим страницы дольше
    pagesBufferLength: 15, // Буфер для 15 страниц
  },
  
  reactStrictMode: false, // Отключаем в prod для скорости
  poweredByHeader: false,
  
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
      // HTML страницы - умеренный кэш с revalidate
      {
        source: '/((?!_next/static|_next/image|api|favicon.ico|.*\\.(?:svg|jpg|png|webp|avif|woff|woff2|ico)).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: isDev 
              ? 'no-cache, no-store, must-revalidate'
              : 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
          },
          // Prefetch hint
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
      
      // Статичные ассеты - максимальный кэш
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
      
      // Next.js static assets - максимальный кэш
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
      
      // API с умеренным кэшем для GET запросов
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

export default nextConfig;
