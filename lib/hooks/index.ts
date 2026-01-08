export * from './useSupportWidget';

// Data Caching - SWR-like functionality для мгновенных переходов
export { 
  default as useDataCache,
  useDataCache as useCachedData,
  usePrefetchOnHover,
  clearAllCache,
  clearCacheKey,
  prefetchData,
  getCachedData,
  hasCachedData
} from './useDataCache';
