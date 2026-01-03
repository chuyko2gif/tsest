"use client";
import "./globals.css";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ModalProvider } from '../components/providers/ModalProvider';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import GlobalSupportWidget from '../components/support/GlobalSupportWidget';
import SupportWidgetProvider from '../components/support/SupportWidgetProvider';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Отключаем автоматическое восстановление позиции скролла
if (typeof window !== 'undefined') {
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }
}

// Красивый анимированный фон с поддержкой тем
const AnimatedBackground = () => {
  const { themeName } = useTheme();
  
  const backgrounds: Record<string, string> = {
    dark: `
      radial-gradient(ellipse 80% 50% at 50% -20%, rgba(96, 80, 186, 0.4), transparent),
      radial-gradient(ellipse 60% 40% at 100% 100%, rgba(157, 141, 241, 0.3), transparent),
      radial-gradient(ellipse 60% 40% at 0% 100%, rgba(96, 80, 186, 0.25), transparent),
      radial-gradient(ellipse 50% 30% at 70% 60%, rgba(124, 109, 216, 0.2), transparent),
      #08080a
    `,
    light: `
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
  };
  
  return (
    <>
      {/* Основной фиксированный фон */}
      <div 
        className="fixed inset-0 transition-all duration-500"
        style={{ 
          zIndex: -10,
          background: backgrounds[themeName] || backgrounds.dark,
        }}
      />
      
      {/* Голографический эффект для светлой темы */}
      {themeName === 'light' && (
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
      
      {/* Анимированные орбы - разные для темной и светлой тем */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -5 }}>
        <div 
          className="absolute rounded-full transition-all duration-500"
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
          }}
        />
        <div 
          className="absolute rounded-full transition-all duration-500"
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
          }}
        />
        <div 
          className="absolute rounded-full transition-all duration-500"
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
          }}
        />
      </div>

      {/* Светящиеся точки - скрыты в светлой теме */}
      {themeName !== 'light' && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -3 }}>
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
      
      {/* Сетка - адаптивная под тему */}
      <div 
        className="fixed inset-0 pointer-events-none transition-opacity duration-500"
        style={{ 
          zIndex: -2,
          backgroundImage: themeName === 'light'
            ? 'linear-gradient(rgba(96, 80, 186, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(96, 80, 186, 0.04) 1px, transparent 1px)'
            : 'linear-gradient(rgba(157, 141, 241, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(157, 141, 241, 0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          opacity: themeName === 'light' ? 0.5 : 1,
        }}
      />
    </>
  );
};

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

function BodyContent({ children, pathname }: { children: React.ReactNode; pathname: string }) {
  const { themeName } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const updateTimeoutRef = useRef<NodeJS.Timeout>(undefined);
  const pathnameRef = useRef(pathname);

  // Синхронизируем ref с prop
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
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
            {/* Левые вкладки - Главная и Договор ПО */}
            <div className="hidden md:flex items-center gap-1 flex-shrink-0">
              <Link 
                href="/feed" 
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

            {/* Лого - по центру */}
            <Link href="/feed" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 group flex-shrink-0" style={{ width: '128px', height: '77px' }}>
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
            </Link>

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
              
              
              {NAV_ITEMS.map((item, index) => {
                const isActive = pathname === item.href;
                return (
                  <Link 
                    key={item.href}
                    ref={(el) => { navRefs.current[index] = el; }}
                    href={item.href}
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

            {/* Мобильное меню - гамбургер */}
            <div className="md:hidden">
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

      {/* Мобильное меню - боковая панель */}
      {pathname !== '/' && pathname !== '/auth' && pathname !== '/admin' && (
        <>
          {/* Затемнение */}
          <div 
            className={`md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-all duration-300 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Боковая панель */}
          <div 
            className={`md:hidden fixed top-0 right-0 bottom-0 z-50 w-72 transform transition-all duration-500 ease-out glass-morphism-sidebar ${
              mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="flex flex-col h-full p-6 relative overflow-hidden">
              {/* Декоративный фон с эффектом глубины */}
              <div className="absolute inset-0 opacity-30 pointer-events-none">
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full" style={{ background: 'radial-gradient(circle, rgba(157,141,241,0.4) 0%, transparent 70%)', filter: 'blur(60px)' }} />
                <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full" style={{ background: 'radial-gradient(circle, rgba(96,80,186,0.3) 0%, transparent 70%)', filter: 'blur(50px)' }} />
              </div>

              {/* Заголовок с кнопкой закрытия */}
              <div className="flex items-center justify-between mb-8 pb-5 border-b relative z-10" style={{ borderColor: themeName === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(157,141,241,0.2)' }}>
                <div className="flex items-center gap-3 flex-1 pr-2">
                  <div className="relative group flex-shrink-0">
                    <img 
                      src="/logo.png" 
                      alt="thqlabel" 
                      className="h-10 w-auto relative z-10 transition-transform duration-300 group-hover:scale-110"
                      style={{ filter: themeName === 'light' ? 'invert(1) brightness(0)' : undefined }}
                    />
                    {themeName !== 'light' && (
                      <div className="absolute inset-0 blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'linear-gradient(135deg, #6050ba, #9d8df1)' }}></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="text-lg font-black bg-gradient-to-r from-[#6050ba] via-[#8070da] to-[#9d8df1] bg-clip-text text-transparent block animate-gradient leading-tight">Навигация</span>
                    <span className="text-[8px] font-semibold whitespace-nowrap" style={{ color: themeName === 'light' ? '#999' : '#666' }}>ГЛАВНОЕ МЕНЮ</span>
                  </div>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:rotate-90 active:scale-95 group relative overflow-hidden"
                  style={{
                    background: themeName === 'light' 
                      ? 'linear-gradient(135deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.05) 100%)' 
                      : 'linear-gradient(135deg, rgba(96,80,186,0.3), rgba(157,141,241,0.2))',
                    color: themeName === 'light' ? '#000' : '#9d8df1',
                    boxShadow: themeName === 'light' ? '0 2px 8px rgba(0,0,0,0.1)' : '0 4px 16px rgba(96,80,186,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <svg className="w-6 h-6 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Навигация с иконками и 3D эффектами */}
              <nav className="flex-1 space-y-3 overflow-y-auto pr-2 relative z-10" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(157,141,241,0.3) transparent' }}>
                {/* Левые вкладки - Главная и Договор ПО */}
                {LEFT_NAV_ITEMS.map((item, index) => {
                  const isActive = pathname === item.href;
                  const leftIcons: Record<string, string> = {
                    '/feed': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>',
                    '/offer': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>',
                  };
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 py-4 px-5 rounded-2xl font-bold text-sm uppercase tracking-wide transition-all duration-500 relative overflow-hidden group"
                      style={{
                        background: isActive 
                          ? themeName === 'light'
                            ? 'linear-gradient(135deg, rgba(96,80,186,0.15) 0%, rgba(157,141,241,0.1) 100%)'
                            : 'linear-gradient(135deg, #6050ba 0%, #7c6dd6 50%, #8070da 100%)'
                          : themeName === 'light' 
                            ? 'rgba(0,0,0,0.04)' 
                            : 'rgba(255,255,255,0.04)',
                        color: isActive 
                          ? themeName === 'light' ? '#6050ba' : '#fff'
                          : themeName === 'light' ? '#666' : '#a1a1aa',
                        border: themeName === 'light' 
                          ? isActive 
                            ? '2px solid rgba(96,80,186,0.3)' 
                            : '2px solid rgba(0,0,0,0.04)'
                          : isActive 
                            ? '2px solid rgba(157,141,241,0.5)'
                            : '2px solid rgba(255,255,255,0.04)',
                        boxShadow: isActive 
                          ? themeName === 'light'
                            ? '0 4px 20px rgba(96,80,186,0.2), inset 0 1px 0 rgba(255,255,255,0.5)'
                            : '0 10px 30px rgba(96,80,186,0.5), 0 0 20px rgba(157,141,241,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
                          : 'none',
                        boxSizing: 'border-box',
                        animation: mobileMenuOpen ? `slide-in-right 0.4s ease-out ${index * 0.08}s backwards` : 'none',
                      }}
                    >
                      {isActive && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" style={{ animationDuration: '2.5s' }}></div>
                          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                        </>
                      )}
                      <div className="relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" dangerouslySetInnerHTML={{ __html: leftIcons[item.href] || '' }} />
                      <span className="relative z-10 flex-1">{item.label}</span>
                      <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${isActive ? 'bg-gradient-to-r from-[#6050ba] to-[#9d8df1] scale-100' : 'scale-0'}`} />
                    </Link>
                  );
                })}

                {/* Разделитель */}
                <div className="h-px mx-4 my-2" style={{ background: themeName === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(157,141,241,0.2)' }} />

                {/* Основные вкладки */}
                {NAV_ITEMS.map((item, index) => {
                  const isActive = pathname === item.href;
                  const icons: Record<string, string> = {
                    '/cabinet': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>',
                    '/news': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>',
                    '/contacts': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>',
                    '/faq': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>'
                  };
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 py-4 px-5 rounded-2xl font-bold text-sm uppercase tracking-wide transition-all duration-500 relative overflow-hidden group"
                      style={{
                        background: isActive 
                          ? themeName === 'light'
                            ? 'linear-gradient(135deg, rgba(96,80,186,0.15) 0%, rgba(157,141,241,0.1) 100%)'
                            : 'linear-gradient(135deg, #6050ba 0%, #7c6dd6 50%, #8070da 100%)'
                          : themeName === 'light' 
                            ? 'rgba(0,0,0,0.04)' 
                            : 'rgba(255,255,255,0.04)',
                        color: isActive 
                          ? themeName === 'light' ? '#6050ba' : '#fff'
                          : themeName === 'light' ? '#666' : '#a1a1aa',
                        border: themeName === 'light' 
                          ? isActive 
                            ? '2px solid rgba(96,80,186,0.3)' 
                            : '2px solid rgba(0,0,0,0.04)'
                          : isActive 
                            ? '2px solid rgba(157,141,241,0.5)'
                            : '2px solid rgba(255,255,255,0.04)',
                        boxShadow: isActive 
                          ? themeName === 'light'
                            ? '0 4px 20px rgba(96,80,186,0.2), inset 0 1px 0 rgba(255,255,255,0.5)'
                            : '0 10px 30px rgba(96,80,186,0.5), 0 0 20px rgba(157,141,241,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
                          : 'none',
                        boxSizing: 'border-box',
                        animation: mobileMenuOpen ? `slide-in-right 0.4s ease-out ${index * 0.08}s backwards` : 'none',
                      }}
                    >
                      {isActive && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" style={{ animationDuration: '2.5s' }}></div>
                          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                        </>
                      )}
                      <div className="relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" dangerouslySetInnerHTML={{ __html: icons[item.href as keyof typeof icons] || '' }} />
                      <span className="relative z-10 flex-1">{item.label}</span>
                      <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${isActive ? 'bg-gradient-to-r from-[#6050ba] to-[#9d8df1] scale-100' : 'scale-0'}`} />
                    </Link>
                  );
                })}
              </nav>

              {/* Нижняя часть с градиентом */}
              <div className="pt-5 mt-5 border-t relative z-10" style={{ borderColor: themeName === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(157,141,241,0.2)' }}>
                <div className="text-center space-y-3 p-4 rounded-2xl" style={{
                  background: themeName === 'light'
                    ? 'linear-gradient(135deg, rgba(96,80,186,0.08) 0%, rgba(157,141,241,0.05) 100%)'
                    : 'linear-gradient(135deg, rgba(96,80,186,0.15) 0%, rgba(157,141,241,0.1) 100%)',
                  border: themeName === 'light' ? '1px solid rgba(96,80,186,0.1)' : '1px solid rgba(157,141,241,0.2)',
                }}>
                  <div className="flex items-center justify-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#6050ba] to-[#9d8df1] animate-pulse" style={{ boxShadow: '0 0 10px rgba(157,141,241,0.8)' }} />
                    <span className="font-black text-sm bg-gradient-to-r from-[#6050ba] via-[#8070da] to-[#9d8df1] bg-clip-text text-transparent animate-gradient">thqlabel</span>
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#9d8df1] to-[#6050ba] animate-pulse" style={{ boxShadow: '0 0 10px rgba(96,80,186,0.8)', animationDelay: '0.5s' }} />
                  </div>
                  <p className="text-[10px] font-semibold" style={{ color: themeName === 'light' ? '#999' : '#666' }}>
                    © 2025 Все права защищены
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#6050ba] to-transparent opacity-30" />
                    <span className="text-[8px] font-bold" style={{ color: themeName === 'light' ? '#bbb' : '#555' }}>MUSIC LABEL</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#9d8df1] to-transparent opacity-30" />
                  </div>
                </div>
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

      {/* Глобальный виджет поддержки - скрыт на странице feed */}
      {pathname !== '/feed' && <GlobalSupportWidget />}
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
        <title>thqlabel</title>
        <meta name="description" content="thq label - Современный музыкальный лейбл" />
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