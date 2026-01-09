"use client";
import "./globals-new.css";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useCallback, memo, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase/client';
import { ModalProvider } from '../components/providers/ModalProvider';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { SilverStar } from '../components/ui/SilverStars';
import { UserRole, ROLE_CONFIG } from './cabinet/lib/types';
import { useElitePerformance } from '@/lib/hooks/useElitePerformance';

// ============================================
// LAZY LOADING ТЯЖЁЛЫХ КОМПОНЕНТОВ
// ============================================
const GlobalSupportWidget = dynamic(
  () => import('../components/support/GlobalSupportWidget'),
  { ssr: false }
);
const SupportWidgetProvider = dynamic(
  () => import('../components/support/SupportWidgetProvider'),
  { ssr: false }
);
const CacheBuster = dynamic(
  () => import('../components/CacheBuster'),
  { ssr: false }
);
const CookieCleaner = dynamic(
  () => import('../components/CookieCleaner'),
  { ssr: false }
);
// TURBO NAVIGATION - УЛЬТРА-быстрые переходы
const TurboNavigation = dynamic(
  () => import('../components/TurboNavigation'),
  { ssr: false }
);

// Отключаем автоматическое восстановление позиции скролла
if (typeof window !== 'undefined') {
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }
}


// Детекция слабого устройства для упрощения анимаций
const isLowEndDevice = typeof window !== 'undefined' && (
  navigator.hardwareConcurrency <= 4 ||
  (navigator as any).deviceMemory <= 4 ||
  /Android.*Chrome\/[.0-9]* Mobile/.test(navigator.userAgent)
);

// Красивый анимированный фон с поддержкой тем - МЕМОИЗИРОВАННЫЙ
const AnimatedBackground = memo(() => {
  const { themeName } = useTheme();
  
  // На слабых устройствах упрощаем фон
  const simplified = isLowEndDevice;
  
  const backgrounds: Record<string, string> = useMemo(() => ({
    dark: simplified ? `
      radial-gradient(ellipse 80% 50% at 50% -20%, rgba(96, 80, 186, 0.3), transparent),
      #08080a
    ` : `
      radial-gradient(ellipse 80% 50% at 50% -20%, rgba(96, 80, 186, 0.4), transparent),
      radial-gradient(ellipse 60% 40% at 100% 100%, rgba(157, 141, 241, 0.3), transparent),
      radial-gradient(ellipse 60% 40% at 0% 100%, rgba(96, 80, 186, 0.25), transparent),
      radial-gradient(ellipse 50% 30% at 70% 60%, rgba(124, 109, 216, 0.2), transparent),
      #08080a
    `,
    light: simplified ? `
      linear-gradient(135deg, rgba(255, 200, 220, 0.3) 0%, rgba(200, 220, 255, 0.3) 100%),
      #f8f6ff
    ` : `
      linear-gradient(135deg, 
        rgba(255, 200, 220, 0.4) 0%, 
        rgba(200, 220, 255, 0.4) 25%,
        rgba(220, 255, 240, 0.3) 50%,
        rgba(255, 240, 200, 0.3) 75%,
        rgba(240, 200, 255, 0.4) 100%
      ),
      radial-gradient(ellipse 80% 60% at 20% 20%, rgba(255, 180, 200, 0.5), transparent),
      radial-gradient(ellipse 60% 50% at 80% 30%, rgba(180, 200, 255, 0.5), transparent),
      radial-gradient(ellipse 70% 50% at 50% 80%, rgba(200, 255, 220, 0.4), transparent),
      radial-gradient(ellipse 50% 40% at 30% 60%, rgba(255, 220, 180, 0.3), transparent),
      #f8f6ff
    `,
    midnight: `
      radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.4), transparent),
      radial-gradient(ellipse 60% 40% at 100% 100%, rgba(129, 140, 248, 0.3), transparent),
      #0d0d1a
    `,
    sunset: `
      radial-gradient(ellipse 80% 50% at 50% -20%, rgba(251, 146, 60, 0.3), transparent),
      radial-gradient(ellipse 60% 40% at 100% 100%, rgba(244, 114, 182, 0.25), transparent),
      linear-gradient(to bottom, #7c2d12, #831843)
    `,
    ocean: `
      radial-gradient(ellipse 80% 50% at 50% -20%, rgba(34, 211, 238, 0.3), transparent),
      radial-gradient(ellipse 60% 40% at 100% 100%, rgba(6, 182, 212, 0.25), transparent),
      #0a1628
    `,
    forest: `
      radial-gradient(ellipse 80% 50% at 50% -20%, rgba(34, 197, 94, 0.3), transparent),
      radial-gradient(ellipse 60% 40% at 100% 100%, rgba(22, 163, 74, 0.25), transparent),
      #0a1a0a
    `,
  }), [simplified]);
  
  return (
    <>
      {/* Основной фиксированный фон - GPU ускоренный */}
      <div 
        className="fixed inset-0"
        style={{ 
          zIndex: -10,
          background: backgrounds[themeName] || backgrounds.dark,
          willChange: 'auto',
          contain: 'strict',
        }}
      />
      
      {/* Голографический эффект - только на мощных устройствах и в светлой теме */}
      {!simplified && themeName === 'light' && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -8 }}>
          <div 
            className="absolute w-full h-full"
            style={{
              background: `
                radial-gradient(ellipse 100% 80% at 30% 20%, rgba(255, 180, 200, 0.35), transparent 50%),
                radial-gradient(ellipse 80% 60% at 70% 80%, rgba(180, 220, 255, 0.35), transparent 50%),
                radial-gradient(ellipse 90% 70% at 80% 30%, rgba(200, 255, 220, 0.3), transparent 50%),
                radial-gradient(ellipse 70% 50% at 20% 70%, rgba(255, 220, 180, 0.3), transparent 50%)
              `,
              animation: 'holographic-shift 15s ease-in-out infinite',
            }}
          />
          <div 
            className="absolute w-full h-full"
            style={{
              background: `
                radial-gradient(ellipse 60% 40% at 60% 40%, rgba(230, 200, 255, 0.25), transparent 50%),
                radial-gradient(ellipse 50% 35% at 40% 60%, rgba(200, 230, 255, 0.25), transparent 50%)
              `,
              animation: 'holographic-shift 20s ease-in-out infinite reverse',
            }}
          />
        </div>
      )}
      
      {/* Анимированные орбы - упрощённые на слабых устройствах */}
      {!simplified && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -5, contain: 'strict' }}>
          <div 
            className="absolute rounded-full"
            style={{
              width: '600px',
              height: '600px',
              top: '-10%',
              left: '-5%',
              background: themeName === 'light' 
                ? 'radial-gradient(circle, rgba(255, 180, 220, 0.4) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(96, 80, 186, 0.4) 0%, transparent 70%)',
              filter: 'blur(40px)',
              animation: 'orb-float-1 25s ease-in-out infinite',
              willChange: 'transform',
            }}
          />
          <div 
            className="absolute rounded-full"
            style={{
              width: '500px',
              height: '500px',
              bottom: '-5%',
              right: '-10%',
              background: themeName === 'light'
                ? 'radial-gradient(circle, rgba(180, 200, 255, 0.5) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(157, 141, 241, 0.5) 0%, transparent 70%)',
              filter: 'blur(50px)',
              animation: 'orb-float-2 30s ease-in-out infinite',
              willChange: 'transform',
            }}
          />
          <div 
            className="absolute rounded-full"
            style={{
              width: '400px',
              height: '400px',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: themeName === 'light'
                ? 'radial-gradient(circle, rgba(200, 255, 220, 0.35) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(96, 80, 186, 0.25) 0%, transparent 70%)',
              filter: 'blur(60px)',
              animation: 'orb-float-3 20s ease-in-out infinite',
              willChange: 'transform',
            }}
          />
        </div>
      )}

      {/* Светящиеся точки - только на мощных устройствах */}
      {!simplified && themeName !== 'light' && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -3, contain: 'strict' }}>
          <div className="absolute w-2 h-2 rounded-full bg-[#9d8df1]" style={{ left: '10%', top: '20%', boxShadow: '0 0 20px 5px rgba(157, 141, 241, 0.6)', animation: 'star-twinkle 3s ease-in-out infinite' }} />
          <div className="absolute w-3 h-3 rounded-full bg-[#9d8df1]" style={{ left: '80%', top: '15%', boxShadow: '0 0 25px 8px rgba(157, 141, 241, 0.5)', animation: 'star-twinkle 4s ease-in-out infinite 1s' }} />
          <div className="absolute w-2 h-2 rounded-full bg-[#9d8df1]" style={{ left: '25%', top: '70%', boxShadow: '0 0 20px 5px rgba(157, 141, 241, 0.6)', animation: 'star-twinkle 3.5s ease-in-out infinite 0.5s' }} />
          <div className="absolute w-2 h-2 rounded-full bg-[#9d8df1]" style={{ left: '70%', top: '80%', boxShadow: '0 0 20px 5px rgba(157, 141, 241, 0.5)', animation: 'star-twinkle 4.5s ease-in-out infinite 2s' }} />
          <div className="absolute w-1.5 h-1.5 rounded-full bg-[#9d8df1]" style={{ left: '50%', top: '40%', boxShadow: '0 0 15px 4px rgba(157, 141, 241, 0.6)', animation: 'star-twinkle 3s ease-in-out infinite 1.5s' }} />
          <div className="absolute w-2 h-2 rounded-full bg-[#9d8df1]" style={{ left: '90%', top: '50%', boxShadow: '0 0 20px 5px rgba(157, 141, 241, 0.5)', animation: 'star-twinkle 4s ease-in-out infinite 0.8s' }} />
          <div className="absolute w-1.5 h-1.5 rounded-full bg-[#9d8df1]" style={{ left: '5%', top: '60%', boxShadow: '0 0 15px 4px rgba(157, 141, 241, 0.6)', animation: 'star-twinkle 3.5s ease-in-out infinite 2.5s' }} />
          <div className="absolute w-2 h-2 rounded-full bg-[#9d8df1]" style={{ left: '35%', top: '30%', boxShadow: '0 0 20px 5px rgba(157, 141, 241, 0.5)', animation: 'star-twinkle 4s ease-in-out infinite 1.2s' }} />
        </div>
      )}
      
      {/* Сетка - адаптивная под тему, скрыта на слабых устройствах */}
      {!simplified && (
        <div 
          className="fixed inset-0 pointer-events-none"
          style={{ 
            zIndex: -2,
            backgroundImage: themeName === 'light'
              ? 'linear-gradient(rgba(96, 80, 186, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(96, 80, 186, 0.04) 1px, transparent 1px)'
              : 'linear-gradient(rgba(157, 141, 241, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(157, 141, 241, 0.03) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            opacity: themeName === 'light' ? 0.5 : 1,
            contain: 'strict',
          }}
        />
      )}
    </>
  );
});

AnimatedBackground.displayName = 'AnimatedBackground';

const NAV_ITEMS = [
  { href: '/cabinet', label: 'Кабинет' },
  { href: '/news', label: 'Новости' },
  { href: '/contacts', label: 'Контакты' },
  { href: '/faq', label: 'FAQ' },
];

// Левые вкладки для мобильного меню
const LEFT_NAV_ITEMS = [
  { href: '/feed', label: 'Главная' },
  { href: '/offer', label: 'Договор ПО' },
];

// Мемоизированный компонент навигации для предотвращения ререндеров
const NavLink = memo(({ href, label, isActive, themeName, navRef }: {
  href: string;
  label: string;
  isActive: boolean;
  themeName: string;
  navRef: (el: HTMLAnchorElement | null) => void;
}) => (
  <Link
    ref={navRef}
    href={href}
    prefetch={true}
    className={`nav-link relative px-6 py-2 text-[10px] uppercase tracking-[0.15em] font-bold transition-all duration-300 ${
      themeName === 'light' ? 'hover:text-[#8a63d2]' : 'hover:text-white'
    }`}
    style={{
      color: isActive 
        ? (themeName === 'light' ? '#8a63d2' : '#fff') 
        : (themeName === 'light' ? '#3d3660' : '#999'),
    }}
  >
    {label}
  </Link>
));

NavLink.displayName = 'NavLink';

function BodyContent({ children, pathname }: { children: React.ReactNode; pathname: string }) {
  const { themeName } = useTheme();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const updateTimeoutRef = useRef<NodeJS.Timeout>(undefined);
  const pathnameRef = useRef(pathname);
  
  // 💎 ELITE PERFORMANCE - инициализация всех оптимизаций
  useElitePerformance();
  
  // Состояние для данных пользователя (мобильное меню)
  const [mobileUserData, setMobileUserData] = useState<{
    nickname: string;
    email: string;
    role: UserRole;
    avatar: string;
    memberId: string;
  } | null>(null);

  // Загрузка данных пользователя для мобильного меню
  useEffect(() => {
    const loadUserData = async () => {
      if (!supabase) return;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('nickname, role, avatar, member_id, email')
            .eq('id', user.id)
            .single();
          
          if (profile) {
            setMobileUserData({
              nickname: profile.nickname || user.email?.split('@')[0] || 'User',
              email: profile.email || user.email || '',
              role: (profile.role as UserRole) || 'basic',
              avatar: profile.avatar || '',
              memberId: profile.member_id || '',
            });
          }
        }
      } catch (error) {
        console.error('Error loading user data for mobile menu:', error);
      }
    };
    
    loadUserData();
    
    if (!supabase) return;
    
    // Подписка на изменения авторизации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUserData();
    });
    
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Отслеживание активности пользователя
  useEffect(() => {
    if (!supabase) return;
    
    let activityTimeout: NodeJS.Timeout;
    let lastUpdate = 0;
    const UPDATE_INTERVAL = 60000; // Обновляем каждую минуту при активности
    
    const updateActivity = async () => {
      if (!supabase) return;
      const now = Date.now();
      if (now - lastUpdate < UPDATE_INTERVAL) return;
      lastUpdate = now;
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          fetch('/api/user/activity', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          }).catch(() => {}); // Игнорируем ошибки
        }
      } catch {}
    };
    
    // Обновляем активность при загрузке
    updateActivity();
    
    // Обновляем при активности пользователя
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => {
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(updateActivity, 1000);
    };
    
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });
    
    // Периодическое обновление каждые 5 минут
    const interval = setInterval(updateActivity, 5 * 60 * 1000);
    
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(interval);
      clearTimeout(activityTimeout);
    };
  }, []);

  // Синхронизируем ref с prop
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    // 🔇 PASSIVE listener для мгновенного скролла
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Обновление позиции слайдера - только при изменении pathname
  useEffect(() => {
    if (!mounted) return;
    
    // Очищаем предыдущий таймаут
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Запускаем обновление с задержкой (debounce)
    updateTimeoutRef.current = setTimeout(() => {
      const activeIndex = NAV_ITEMS.findIndex(item => item.href === pathnameRef.current);
      if (activeIndex !== -1 && navRefs.current[activeIndex]) {
        const activeEl = navRefs.current[activeIndex];
        if (activeEl) {
          const left = activeEl.offsetLeft + 4;
          const width = activeEl.offsetWidth - 8;
          
          // Используем функциональное обновление
          setSliderStyle(prev => {
            if (Math.abs(prev.left - left) < 1 && Math.abs(prev.width - width) < 1 && prev.opacity === 1) {
              return prev;
            }
            return { left, width, opacity: 1 };
          });
        }
      }
    }, 150);
    
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [pathname, mounted]);

  // Отдельный эффект для resize - запускается только один раз
  useEffect(() => {
    if (!mounted) return;
    
    const handleResize = () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      updateTimeoutRef.current = setTimeout(() => {
        const activeIndex = NAV_ITEMS.findIndex(item => item.href === pathnameRef.current);
        if (activeIndex !== -1 && navRefs.current[activeIndex]) {
          const activeEl = navRefs.current[activeIndex];
          if (activeEl) {
            const left = activeEl.offsetLeft + 4;
            const width = activeEl.offsetWidth - 8;
            setSliderStyle({ left, width, opacity: 1 });
          }
        }
      }, 100);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [mounted]);

  return (
    <>
      {/* Красивый анимированный фон - ВЕЗДЕ */}
      <AnimatedBackground />

      {/* Навигация */}
      {pathname !== '/' && pathname !== '/auth' && pathname !== '/admin' && pathname !== '/feed' && (
        <header 
          className="fixed top-0 w-full z-50 transition-all duration-500"
          style={{
            height: '70px',
            background: themeName === 'light' 
              ? 'rgba(255, 255, 255, 0.72)'
              : scrolled 
                ? 'rgba(8, 8, 10, 0.3)' 
                : 'transparent',
            backdropFilter: themeName === 'light' ? 'blur(28px) saturate(180%)' : (scrolled ? 'blur(30px) saturate(150%)' : 'none'),
            WebkitBackdropFilter: themeName === 'light' ? 'blur(28px) saturate(180%)' : (scrolled ? 'blur(30px) saturate(150%)' : 'none'),
            borderBottom: themeName === 'light'
              ? '1px solid rgba(255, 255, 255, 0.8)'
              : scrolled 
                ? '1px solid rgba(157, 141, 241, 0.08)'
                : '1px solid transparent',
            boxShadow: themeName === 'light'
              ? '0 8px 32px rgba(138, 99, 210, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1)'
              : scrolled 
                ? '0 4px 20px rgba(0, 0, 0, 0.15)'
                : 'none',
          }}
          suppressHydrationWarning
        >
          <div className="px-4 sm:px-6 md:px-10 h-full flex items-center relative">
            {/* Контейнер для кнопки профиля на мобильных - СЛЕВА (используется через Portal в /cabinet) */}
            <div id="mobile-profile-button-portal" className="md:hidden flex items-center" />

            {/* Левые вкладки - Главная и Договор ПО */}
            <div className="hidden md:flex items-center gap-1 flex-shrink-0">
              <Link 
                href="/feed"
                prefetch={true}
                className={`px-4 py-2 text-[10px] uppercase tracking-[0.12em] font-bold transition-all duration-300 rounded-xl ${themeName === 'light' ? 'hover:bg-[#8a63d2]/10' : 'hover:bg-white/10'}`}
                style={{
                  color: pathname === '/feed' 
                    ? (themeName === 'light' ? '#8a63d2' : '#fff') 
                    : (themeName === 'light' ? '#3d3660' : '#999'),
                }}
              >
                Главная
              </Link>
              <Link 
                href="/offer"
                prefetch={true}
                className={`px-4 py-2 text-[10px] uppercase tracking-[0.12em] font-bold transition-all duration-300 rounded-xl ${themeName === 'light' ? 'hover:bg-[#8a63d2]/10' : 'hover:bg-white/10'}`}
                style={{
                  color: pathname === '/offer' 
                    ? (themeName === 'light' ? '#8a63d2' : '#fff') 
                    : (themeName === 'light' ? '#3d3660' : '#999'),
                }}
              >
                Договор ПО
              </Link>
            </div>

            {/* Лого - по центру (возврат на предыдущую страницу) */}
            <button 
              onClick={() => router.back()} 
              className="header-logo absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 group flex-shrink-0 transition-opacity duration-200 cursor-pointer" 
              style={{ width: '128px', height: '77px', background: 'transparent', border: 'none' }}
            >
              <img 
                src="/logo.png" 
                alt="thqlabel" 
                className={`absolute left-1/2 top-1/2 h-12 w-auto object-contain transition-all duration-300 ${themeName !== 'light' ? 'group-hover:brightness-125' : ''}`}
                style={{ 
                  transform: 'translate(-50%, -50%) scale(1.6)', 
                  transformOrigin: 'center center',
                  filter: themeName === 'light' ? 'invert(1) brightness(0)' : undefined
                }}
              />
              {themeName !== 'light' && (
                <div 
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-20 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" 
                  style={{
                    background: 'radial-gradient(circle, rgba(96, 80, 186, 0.5) 0%, transparent 70%)',
                  }}
                />
              )}
            </button>

            {/* Навигация с плавным ползунком - скрывается на мобилке, справа */}
            <nav className="hidden md:flex relative items-center rounded-2xl p-1 ml-auto" suppressHydrationWarning>

              {/* Glass Morphism слайдер в стиле iOS с эффектом капли */}
              <div 
                className="absolute rounded-2xl overflow-visible"
                style={{
                  left: `${sliderStyle.left}px`,
                  top: '2px',
                  bottom: '2px',
                  width: `${sliderStyle.width}px`,
                  transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  opacity: sliderStyle.width > 0 ? 1 : 0,
                  pointerEvents: 'none',
                  background: themeName === 'light'
                    ? 'linear-gradient(135deg, rgba(138, 99, 210, 0.2) 0%, rgba(167, 139, 250, 0.15) 100%)'
                    : 'linear-gradient(135deg, rgba(96,80,186,0.35) 0%, rgba(80,65,160,0.3) 50%, rgba(70,55,140,0.25) 100%)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  boxShadow: themeName === 'light'
                    ? '0 4px 20px rgba(138, 99, 210, 0.25), inset 0 1px 0 rgba(255,255,255,0.9), 0 0 0 1px rgba(138, 99, 210, 0.15)'
                    : '0 2px 8px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1), inset 0 -1px 2px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.08)',
                  border: themeName === 'light'
                    ? '1px solid rgba(138, 99, 210, 0.2)'
                    : '1px solid rgba(255,255,255,0.08)',
                  transform: 'translateZ(0) perspective(1000px)',
                }}
              />
              
              {/* Серебряные звёзды летят за слайдером с разными задержками */}
              <div 
                className="absolute -top-3 pointer-events-none"
                style={{
                  left: `${sliderStyle.left + (sliderStyle.width * 0.2)}px`,
                  transition: 'left 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  opacity: sliderStyle.width > 0 ? 1 : 0,
                }}
              >
                <SilverStar size={16} delay={0} />
              </div>
              <div 
                className="absolute -top-2 pointer-events-none"
                style={{
                  left: `${sliderStyle.left + (sliderStyle.width * 0.85)}px`,
                  transition: 'left 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  opacity: sliderStyle.width > 0 ? 1 : 0,
                }}
              >
                <SilverStar size={11} delay={0.2} />
              </div>
              <div 
                className="absolute -bottom-3 pointer-events-none"
                style={{
                  left: `${sliderStyle.left + (sliderStyle.width * 0.5)}px`,
                  transition: 'left 1.1s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  opacity: sliderStyle.width > 0 ? 1 : 0,
                }}
              >
                <SilverStar size={13} delay={0.4} />
              </div>
              <div 
                className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
                style={{
                  left: `${sliderStyle.left + sliderStyle.width + 5}px`,
                  transition: 'left 1.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  opacity: sliderStyle.width > 0 ? 1 : 0,
                }}
              >
                <SilverStar size={9} delay={0.6} />
              </div>
              <div 
                className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
                style={{
                  left: `${sliderStyle.left - 12}px`,
                  transition: 'left 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  opacity: sliderStyle.width > 0 ? 1 : 0,
                }}
              >
                <SilverStar size={10} delay={0.8} />
              </div>
              
              
              {NAV_ITEMS.map((item, index) => {
                const isActive = pathname === item.href;
                return (
                  <Link 
                    key={item.href}
                    ref={(el) => { navRefs.current[index] = el; }}
                    href={item.href}
                    prefetch={true}
                    className="relative px-4 md:px-5 lg:px-7 py-2.5 md:py-3 lg:py-3.5 text-[9px] md:text-[10px] lg:text-[11px] uppercase tracking-[0.15em] font-black transition-all duration-500 z-10 group"
                    style={{
                      color: isActive 
                        ? (themeName === 'light' ? '#8a63d2' : '#ffffff')
                        : themeName === 'light' ? '#3d3660' : '#999',
                      textShadow: isActive 
                        ? (themeName === 'light' 
                            ? '0 1px 2px rgba(138, 99, 210, 0.3)'
                            : '0 -1px 1px rgba(0,0,0,0.8), 0 1px 2px rgba(255,255,255,0.5), 0 2px 4px rgba(255,255,255,0.3), 0 4px 16px rgba(96,80,186,0.5)')
                        : 'none',
                      transform: isActive ? 'translateZ(10px)' : 'scale(1)',
                      fontWeight: isActive ? '900' : '800',
                      letterSpacing: isActive ? '0.18em' : '0.15em',
                      filter: 'none',
                    }}
                  >
                    <span className="relative">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* Мобильное меню - гамбургер (всегда справа) */}
            <div className="md:hidden ml-auto">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="relative w-10 h-10 flex flex-col items-center justify-center gap-1.5 group"
                aria-label="Меню"
              >
                <span className={`w-6 h-0.5 bg-current transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} style={{ color: themeName === 'light' ? '#2a2550' : '#fff' }} />
                <span className={`w-6 h-0.5 bg-current transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`} style={{ color: themeName === 'light' ? '#2a2550' : '#fff' }} />
                <span className={`w-6 h-0.5 bg-current transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} style={{ color: themeName === 'light' ? '#2a2550' : '#fff' }} />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Мобильное меню - боковая панель СПРАВА (Редизайн как MobileSidebar) */}
      {pathname !== '/' && pathname !== '/auth' && pathname !== '/admin' && (
        <>
          {/* Backdrop - Liquid Glass blur */}
          <div 
            className={`liquid-glass-backdrop md:hidden fixed inset-0 z-[200] transition-all duration-500 ${
              mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Slide-in Panel - Liquid Glass Style (СПРАВА) */}
          <div 
            className={`liquid-glass-modal md:hidden fixed top-0 right-0 bottom-0 z-[201] w-[85%] max-w-[320px] !rounded-r-none transform transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
              mobileMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
            }`}
          >
            <div className="flex flex-col h-full p-5 overflow-y-auto relative z-10">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <span className="mobile-sidebar-title text-sm font-bold uppercase tracking-wider">
                  Профиль
                </span>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:rotate-90 active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, rgba(96,80,186,0.3), rgba(157,141,241,0.2))',
                    color: '#9d8df1',
                    boxShadow: '0 4px 16px rgba(96,80,186,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Профиль пользователя */}
              {mobileUserData ? (
                <div className="mb-6">
                  {/* Аватар + Ник + Роль */}
                  <div className="flex items-center gap-4 mb-4">
                    <Link 
                      href="/cabinet"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`relative w-16 h-16 flex-shrink-0 rounded-xl ${mobileUserData.avatar ? '' : `bg-gradient-to-br ${ROLE_CONFIG[mobileUserData.role].color}`} flex items-center justify-center text-2xl font-black border-2 ${ROLE_CONFIG[mobileUserData.role].borderColor} ${mobileUserData.role === 'exclusive' ? 'ring-2 ring-[#fbbf24] ring-offset-2 ring-offset-[#0d0d0f]' : mobileUserData.role === 'admin' ? 'ring-2 ring-[#ff6b81] ring-offset-2 ring-offset-[#0d0d0f]' : ''} overflow-hidden cursor-pointer hover:opacity-80 transition-opacity group`}
                      style={{ 
                        boxShadow: `0 0 20px ${ROLE_CONFIG[mobileUserData.role].glowColor}`,
                      }}
                    >
                      {mobileUserData.avatar ? (
                        <img 
                          src={mobileUserData.avatar} 
                          alt="Avatar" 
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <span className="text-white">
                          {mobileUserData.nickname.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">Открыть</span>
                      </div>
                    </Link>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-black mb-1.5 text-left truncate text-white">
                        {mobileUserData.nickname}
                      </h3>
                      
                      <div 
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${ROLE_CONFIG[mobileUserData.role].bgColor} ${ROLE_CONFIG[mobileUserData.role].textColor} border ${ROLE_CONFIG[mobileUserData.role].borderColor} ${mobileUserData.role === 'exclusive' ? 'animate-pulse' : ''}`}
                        style={{ boxShadow: `0 0 12px ${ROLE_CONFIG[mobileUserData.role].glowColor}` }}
                      >
                        <span>{ROLE_CONFIG[mobileUserData.role].shortLabel}</span>
                      </div>
                    </div>
                  </div>

                  {/* ID участника */}
                  {mobileUserData.memberId && (
                    <div className="flex items-center gap-2">
                      <span className="sidebar-member-id px-2.5 py-1 rounded-lg text-[9px] font-mono">
                        {mobileUserData.memberId}
                      </span>
                      <button 
                        onClick={() => {
                          if (navigator?.clipboard?.writeText) {
                            navigator.clipboard.writeText(mobileUserData.memberId);
                          }
                        }}
                        className="sidebar-copy-btn px-2 py-1 rounded-lg transition"
                        title="Копировать тэг"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  )}

                  <p className="text-[10px] text-zinc-400 mt-2 text-left truncate">
                    {mobileUserData.email}
                  </p>
                </div>
              ) : (
                <div className="mb-6">
                  <Link 
                    href="/auth"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#6050ba] to-[#9d8df1] text-white font-bold text-sm text-center block"
                  >
                    Войти в аккаунт
                  </Link>
                </div>
              )}

              {/* Разделитель */}
              <div className="sidebar-divider h-[1px] mb-4" />

              {/* Навигация */}
              <nav className="space-y-2 flex-1">
                {/* Главная */}
                <Link 
                  href="/feed"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`sidebar-nav-btn w-full text-left py-3 px-4 rounded-xl block ${pathname === '/feed' ? 'active' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 sidebar-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span className="text-sm font-bold">Главная</span>
                  </div>
                </Link>

                {/* Кабинет */}
                <Link 
                  href="/cabinet"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`sidebar-nav-btn w-full text-left py-3 px-4 rounded-xl block ${pathname === '/cabinet' ? 'active' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 sidebar-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-sm font-bold">Кабинет</span>
                  </div>
                </Link>
                
                {/* Новости */}
                <Link 
                  href="/news"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`sidebar-nav-btn w-full text-left py-3 px-4 rounded-xl block ${pathname === '/news' ? 'active' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 sidebar-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                    <span className="text-sm font-bold">Новости</span>
                  </div>
                </Link>
                
                {/* Контакты */}
                <Link 
                  href="/contacts"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`sidebar-nav-btn w-full text-left py-3 px-4 rounded-xl block ${pathname === '/contacts' ? 'active' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 sidebar-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-bold">Контакты</span>
                  </div>
                </Link>

                {/* FAQ */}
                <Link 
                  href="/faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`sidebar-nav-btn w-full text-left py-3 px-4 rounded-xl block ${pathname === '/faq' ? 'active' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 sidebar-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-bold">FAQ</span>
                  </div>
                </Link>

                {/* Разделитель */}
                <div className="sidebar-divider h-[1px] my-2" />

                {/* Договор ПО */}
                <Link 
                  href="/offer"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`sidebar-nav-btn w-full text-left py-3 px-4 rounded-xl block ${pathname === '/offer' ? 'active' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 sidebar-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm font-bold">Договор ПО</span>
                  </div>
                </Link>
                
                {/* Админ панель (только для админов/владельцев) */}
                {mobileUserData && (mobileUserData.role === 'admin' || mobileUserData.role === 'owner') && (
                  <Link 
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="sidebar-admin-btn w-full block text-left py-3 px-4 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span className="text-sm font-bold">Админ панель</span>
                    </div>
                  </Link>
                )}
              </nav>

              {/* Footer */}
              <div className="sidebar-footer mt-4 pt-4">
                <p className="text-[9px] text-center text-zinc-500">
                  thqlabel © 2026
                </p>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Контент */}
      <div className="relative md:overflow-x-visible overflow-x-hidden" style={{ zIndex: 1 }}>
        <ModalProvider>
          {children}
        </ModalProvider>
      </div>

      {/* Глобальный виджет поддержки - только в кабинете */}
      {pathname.startsWith('/cabinet') && <GlobalSupportWidget />}
    </>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname === '/admin';

  // КРИТИЧЕСКИЙ БЛОКИРУЮЩИЙ СКРИПТ - выполняется ДО рендера
  // Читает тему из localStorage/cookie и применяет стили МГНОВЕННО
  const themeInitScript = `
    (function() {
      var savedTheme = null;
      try {
        savedTheme = localStorage.getItem('thqlabel_theme');
      } catch(e) {}
      
      if (!savedTheme) {
        try {
          var cookies = document.cookie.split(';');
          for (var i = 0; i < cookies.length; i++) {
            var c = cookies[i].trim();
            if (c.indexOf('thqlabel_theme=') === 0) {
              savedTheme = c.substring(15);
              break;
            }
          }
        } catch(e) {}
      }
      
      var html = document.documentElement;
      if (savedTheme === 'light') {
        html.classList.add('light');
        html.style.background = 'linear-gradient(135deg,#e8e0f0 0%,#f0e8f8 25%,#e0e8f8 50%,#f0e0f0 75%,#e8e0f0 100%)';
        html.style.backgroundAttachment = 'fixed';
      } else {
        html.classList.remove('light');
        html.style.background = '#08080a';
      }
    })();
  `;

  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        {/* ПЕРВЫМ - блокирующий скрипт для темы */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        
        {/* АГРЕССИВНОЕ ОТКЛЮЧЕНИЕ КЭШИРОВАНИЯ */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate, max-age=0, s-maxage=0, proxy-revalidate, private" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <meta httpEquiv="X-Cache" content="MISS" />
        <meta name="cache-control" content="no-cache, no-store, must-revalidate" />
        
        <title>thqlabel</title>
        <meta name="description" content="thq label - Современный музыкальный лейбл" />
        
        {/* Preconnect для ускорения загрузки внешних ресурсов */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://supabase.co" />
        
        {/* Preload критических ресурсов */}
        <link rel="preload" href="/logo.png" as="image" />
        
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.ico?v=2" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon.png?v=2" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon.png?v=2" />
        {/* CSS fallback для тем - если JS отключён */}
        <style dangerouslySetInnerHTML={{ __html: `
          html { background: #08080a; }
          body { background: transparent; margin: 0; }
          html.light { background: linear-gradient(135deg, #e8e0f0 0%, #f0e8f8 25%, #e0e8f8 50%, #f0e0f0 75%, #e8e0f0 100%); background-attachment: fixed; }
        `}} />
        <style>{`
          @keyframes orb-float-1 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(50px, -30px) scale(1.1); }
            66% { transform: translate(-30px, 50px) scale(0.9); }
          }
          @keyframes orb-float-2 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(-40px, 40px) scale(1.05); }
            66% { transform: translate(40px, -20px) scale(0.95); }
          }
          @keyframes orb-float-3 {
            0%, 100% { transform: translate(-50%, -50%) scale(1); }
            50% { transform: translate(-50%, -50%) scale(1.2); }
          }
          @keyframes star-twinkle {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.5); }
          }
          @keyframes slider-glow {
            0%, 100% { box-shadow: 0 0 20px rgba(96, 80, 186, 0.6), 0 0 40px rgba(96, 80, 186, 0.3); }
            50% { box-shadow: 0 0 30px rgba(157, 141, 241, 0.8), 0 0 60px rgba(96, 80, 186, 0.5); }
          }
        `}</style>
      </head>
      <body className="antialiased min-h-screen" suppressHydrationWarning>
        <ThemeProvider>
          <NotificationProvider>
            <SupportWidgetProvider>
              <CookieCleaner />
              <CacheBuster />
              {/* TURBO NAVIGATION - УЛЬТРА-быстрые переходы */}
              <TurboNavigation />
              <BodyContent pathname={pathname}>
                {children}
              </BodyContent>
            </SupportWidgetProvider>
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}