"use client";

import React, { 
  memo, 
  useState, 
  useCallback, 
  useRef, 
  useEffect,
  ReactNode,
  createContext,
  useContext,
  useMemo
} from 'react';

/**
 * InstantTabs - Система мгновенного переключения вкладок
 * 
 * Особенности:
 * 1. Keep-Alive: Вкладки НЕ размонтируются, а скрываются через CSS
 * 2. Optimistic UI: Мгновенная визуальная реакция на клик
 * 3. Lazy Loading: Первая загрузка вкладки происходит лениво
 * 4. Memory Safe: Автоматическая очистка при превышении лимита
 * 5. Prefetch on Hover: Предзагрузка при наведении
 * 
 * ⚠️ БЕЗОПАСНОСТЬ: Не ломает логику! Callback'и вызываются корректно.
 */

// ============================================================================
// ТИПЫ
// ============================================================================

interface TabConfig {
  id: string;
  label: string;
  icon?: ReactNode;
  /** Контент вкладки */
  content: ReactNode;
  /** Callback при активации вкладки (для обновления данных) */
  onActivate?: () => void;
  /** Callback при деактивации */
  onDeactivate?: () => void;
}

interface InstantTabsProps {
  tabs: TabConfig[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  /** Рендер кастомной кнопки навигации */
  renderTabButton?: (tab: TabConfig, isActive: boolean, onClick: () => void, onHover: () => void) => ReactNode;
  /** Максимальное количество вкладок в памяти (по умолчанию все) */
  maxCachedTabs?: number;
  /** Класс для контейнера контента */
  contentClassName?: string;
  /** Анимация переключения */
  transitionDuration?: number;
  /** Показывать скелетон при первой загрузке */
  showSkeleton?: boolean;
  /** Кастомный скелетон */
  skeleton?: ReactNode;
}

interface TabPanelProps {
  isActive: boolean;
  isLoaded: boolean;
  children: ReactNode;
  transitionDuration: number;
}

// ============================================================================
// CONTEXT ДЛЯ PREFETCH
// ============================================================================

interface PrefetchContextType {
  prefetchTab: (tabId: string) => void;
  isPrefetched: (tabId: string) => boolean;
}

const PrefetchContext = createContext<PrefetchContextType | null>(null);

export function usePrefetchTab() {
  const ctx = useContext(PrefetchContext);
  return ctx;
}

// ============================================================================
// TAB PANEL - Обёртка для скрытия/показа без размонтирования
// ============================================================================

const TabPanel = memo<TabPanelProps>(({ 
  isActive, 
  isLoaded, 
  children,
  transitionDuration 
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(isActive);

  // Анимация появления
  useEffect(() => {
    if (isActive && !shouldRender) {
      setShouldRender(true);
    }
  }, [isActive, shouldRender]);

  // Не рендерим если ещё не загружено
  if (!isLoaded && !isActive) {
    return null;
  }

  return (
    <div
      ref={ref}
      className="instant-tab-panel"
      style={{
        display: isActive ? 'block' : 'none',
        // Используем visibility вместо display для сохранения размеров
        // visibility: isActive ? 'visible' : 'hidden',
        // position: isActive ? 'relative' : 'absolute',
        // opacity: isActive ? 1 : 0,
        // pointerEvents: isActive ? 'auto' : 'none',
        // transition: `opacity ${transitionDuration}ms ease-out`,
        // Оптимизация: GPU слой только для активной вкладки
        willChange: isActive ? 'auto' : 'auto',
        contain: isActive ? 'none' : 'strict',
      }}
      aria-hidden={!isActive}
      data-active={isActive}
    >
      {children}
    </div>
  );
});

TabPanel.displayName = 'TabPanel';

// ============================================================================
// DEFAULT SKELETON
// ============================================================================

const DefaultSkeleton = memo(() => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6050ba]"></div>
  </div>
));

DefaultSkeleton.displayName = 'DefaultSkeleton';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function InstantTabsComponent({
  tabs,
  activeTab,
  onTabChange,
  renderTabButton,
  maxCachedTabs = tabs.length,
  contentClassName = '',
  transitionDuration = 150,
  showSkeleton = true,
  skeleton
}: InstantTabsProps) {
  // Трекинг загруженных вкладок
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(() => new Set([activeTab]));
  const [loadOrder, setLoadOrder] = useState<string[]>([activeTab]);
  const previousTabRef = useRef<string>(activeTab);
  const isFirstRender = useRef(true);

  // Prefetch функция
  const prefetchTab = useCallback((tabId: string) => {
    setLoadedTabs(prev => {
      if (prev.has(tabId)) return prev;
      const next = new Set(prev);
      next.add(tabId);
      return next;
    });
    setLoadOrder(prev => {
      if (prev.includes(tabId)) return prev;
      return [...prev, tabId];
    });
  }, []);

  // Проверка prefetch
  const isPrefetched = useCallback((tabId: string) => {
    return loadedTabs.has(tabId);
  }, [loadedTabs]);

  // Context value
  const prefetchContextValue = useMemo(() => ({
    prefetchTab,
    isPrefetched
  }), [prefetchTab, isPrefetched]);

  // При смене активной вкладки
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const prevTab = previousTabRef.current;
    
    // Загружаем новую вкладку если ещё не загружена
    if (!loadedTabs.has(activeTab)) {
      setLoadedTabs(prev => new Set([...prev, activeTab]));
      setLoadOrder(prev => [...prev.filter(t => t !== activeTab), activeTab]);
    } else {
      // Обновляем порядок - активная в конец (LRU)
      setLoadOrder(prev => [...prev.filter(t => t !== activeTab), activeTab]);
    }

    // Вызываем callback'и
    const activeTabConfig = tabs.find(t => t.id === activeTab);
    const prevTabConfig = tabs.find(t => t.id === prevTab);

    if (prevTabConfig?.onDeactivate) {
      prevTabConfig.onDeactivate();
    }
    
    if (activeTabConfig?.onActivate) {
      activeTabConfig.onActivate();
    }

    previousTabRef.current = activeTab;

    // Очистка старых вкладок если превышен лимит
    if (loadOrder.length > maxCachedTabs) {
      const tabsToRemove = loadOrder.slice(0, loadOrder.length - maxCachedTabs);
      setLoadedTabs(prev => {
        const next = new Set(prev);
        tabsToRemove.forEach(t => {
          if (t !== activeTab) next.delete(t);
        });
        return next;
      });
      setLoadOrder(prev => prev.filter(t => !tabsToRemove.includes(t) || t === activeTab));
    }
  }, [activeTab, tabs, loadedTabs, loadOrder, maxCachedTabs]);

  // Обработчик клика с optimistic UI
  const handleTabClick = useCallback((tabId: string) => {
    if (tabId === activeTab) return;
    
    // Optimistic: мгновенно переключаем
    onTabChange(tabId);
  }, [activeTab, onTabChange]);

  // Обработчик hover для prefetch
  const handleTabHover = useCallback((tabId: string) => {
    // Prefetch при hover
    if (!loadedTabs.has(tabId)) {
      prefetchTab(tabId);
    }
  }, [loadedTabs, prefetchTab]);

  // Рендер кнопок навигации
  const renderNavigation = useCallback(() => {
    if (renderTabButton) {
      return tabs.map(tab => (
        <React.Fragment key={tab.id}>
          {renderTabButton(
            tab,
            activeTab === tab.id,
            () => handleTabClick(tab.id),
            () => handleTabHover(tab.id)
          )}
        </React.Fragment>
      ));
    }
    
    // Дефолтные кнопки
    return tabs.map(tab => (
      <button
        key={tab.id}
        onClick={() => handleTabClick(tab.id)}
        onMouseEnter={() => handleTabHover(tab.id)}
        onTouchStart={() => handleTabHover(tab.id)}
        className={`instant-tab-button ${activeTab === tab.id ? 'active' : ''}`}
        aria-selected={activeTab === tab.id}
        role="tab"
      >
        {tab.icon}
        <span>{tab.label}</span>
      </button>
    ));
  }, [tabs, activeTab, handleTabClick, handleTabHover, renderTabButton]);

  // Скелетон для загрузки
  const skeletonElement = skeleton || <DefaultSkeleton />;

  return (
    <PrefetchContext.Provider value={prefetchContextValue}>
      <div className={`instant-tabs-content ${contentClassName}`} role="tabpanel">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          const isLoaded = loadedTabs.has(tab.id);

          return (
            <TabPanel
              key={tab.id}
              isActive={isActive}
              isLoaded={isLoaded}
              transitionDuration={transitionDuration}
            >
              {isLoaded ? (
                tab.content
              ) : (
                showSkeleton ? skeletonElement : null
              )}
            </TabPanel>
          );
        })}
      </div>
    </PrefetchContext.Provider>
  );
}

export const InstantTabs = memo(InstantTabsComponent);

// ============================================================================
// ХУКИ ДЛЯ ИНТЕГРАЦИИ
// ============================================================================

/**
 * Хук для создания конфигурации вкладок с keep-alive
 */
export function useInstantTabs<T extends string>(
  initialTab: T,
  options?: {
    persistKey?: string;
    onTabChange?: (tab: T) => void;
  }
) {
  const [activeTab, setActiveTab] = useState<T>(() => {
    if (options?.persistKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(options.persistKey);
      if (saved) return saved as T;
    }
    return initialTab;
  });

  const handleTabChange = useCallback((tab: T) => {
    setActiveTab(tab);
    if (options?.persistKey) {
      localStorage.setItem(options.persistKey, tab);
    }
    options?.onTabChange?.(tab);
  }, [options]);

  return {
    activeTab,
    setActiveTab: handleTabChange,
    isActive: (tab: T) => activeTab === tab,
  };
}

/**
 * Хук для prefetch данных при hover
 */
export function useTabDataPrefetch<T>(
  tabId: string,
  fetchFn: () => Promise<T>,
  options?: {
    staleTime?: number;
    enabled?: boolean;
  }
) {
  const prefetchCtx = usePrefetchTab();
  const cacheRef = useRef<{ data: T | null; timestamp: number }>({ data: null, timestamp: 0 });
  const fetchingRef = useRef(false);
  const staleTime = options?.staleTime ?? 30000; // 30 секунд по умолчанию

  const prefetch = useCallback(async () => {
    const now = Date.now();
    
    // Проверяем кэш
    if (cacheRef.current.data && (now - cacheRef.current.timestamp) < staleTime) {
      return cacheRef.current.data;
    }

    // Предотвращаем дублирование запросов
    if (fetchingRef.current) return null;
    fetchingRef.current = true;

    try {
      const data = await fetchFn();
      cacheRef.current = { data, timestamp: now };
      return data;
    } finally {
      fetchingRef.current = false;
    }
  }, [fetchFn, staleTime]);

  const getCachedData = useCallback(() => {
    return cacheRef.current.data;
  }, []);

  const invalidateCache = useCallback(() => {
    cacheRef.current = { data: null, timestamp: 0 };
  }, []);

  return {
    prefetch,
    getCachedData,
    invalidateCache,
    isCached: () => cacheRef.current.data !== null,
  };
}

// ============================================================================
// ADMIN TABS WRAPPER (готовый для admin/page.tsx)
// ============================================================================

interface AdminTabsWrapperProps {
  activeTab: string;
  tabs: { id: string; label: string; icon: ReactNode }[];
  onTabChange: (tabId: string) => void;
  children: Record<string, ReactNode>;
  isLoading?: boolean;
}

export const AdminTabsWrapper = memo(function AdminTabsWrapper({
  activeTab,
  tabs,
  onTabChange,
  children,
  isLoading
}: AdminTabsWrapperProps) {
  const tabConfigs = useMemo(() => 
    tabs.map(tab => ({
      ...tab,
      content: children[tab.id] || null,
    })),
    [tabs, children]
  );

  if (isLoading) {
    return <DefaultSkeleton />;
  }

  return (
    <InstantTabs
      tabs={tabConfigs}
      activeTab={activeTab}
      onTabChange={onTabChange}
      transitionDuration={100}
    />
  );
});

// ============================================================================
// EXPORTS
// ============================================================================

export default InstantTabs;
