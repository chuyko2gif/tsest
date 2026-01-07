// UI Components
export * from './ui';

// Icons & Flags
export * from './icons';

// Support
export * from './support';

// Providers
export * from './providers';

// Cache Management
export { default as CacheBuster } from './CacheBuster';

// Prefetch & Smart Navigation
export { default as PrefetchRoutes, usePrefetchRoutes, usePrefetchOnHover } from './PrefetchRoutes';
export { default as GlobalPrefetch } from './GlobalPrefetch';
export { default as SmartLink } from './SmartLink';
// INSTANT NAVIGATION - мгновенные переходы
export { 
  default as InstantNavigation, 
  CriticalRoutesPrefetch, 
  useInstantNavigate,
  useNavigation,
  NavigationProvider 
} from './InstantNavigation';
export { default as TurboLink, useInstantLink } from './TurboLink';
// HYPER LINK - ракетные переходы
export { default as HyperLink } from './HyperLink';
// TURBO NAVIGATION v2 - максимальная скорость
export { default as TurboNavigation } from './TurboNavigation';
// PERFORMANCE OPTIMIZER - оптимизация для слабых устройств
export { 
  default as PerformanceOptimizer,
  isLowEndDevice,
  isMediumDevice,
  devicePerformance
} from './PerformanceOptimizer';
// ROCKET PREFETCH - агрессивная предзагрузка
export { default as RocketPrefetch } from './RocketPrefetch';
// ULTRA PERFORMANCE BOOSTER - экстремальная оптимизация
export { default as UltraPerformanceBooster, detectPerformanceLevel } from './UltraPerformanceBooster';
// INSTANT PAGE LOADER - мгновенная загрузка страниц
export { default as InstantPageLoader } from './InstantPageLoader';
// LAZY IMAGE OPTIMIZER - оптимизация изображений
export { default as LazyImageOptimizer } from './LazyImageOptimizer';
// SKELETON STYLES - стили для skeleton-лоадеров
export { default as SkeletonStyles } from './SkeletonStyles';