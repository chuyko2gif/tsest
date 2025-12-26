"use client";
import "./globals.css";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ModalProvider } from '../components/ModalProvider';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import GlobalSupportWidget from '../components/GlobalSupportWidget';
import SupportWidgetProvider from '../components/SupportWidgetProvider';

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
      radial-gradient(ellipse 80% 50% at 50% -20%, rgba(96, 80, 186, 0.1), transparent),
      radial-gradient(ellipse 60% 40% at 100% 100%, rgba(157, 141, 241, 0.08), transparent),
      #ffffff
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
      
      {/* Анимированные орбы */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -5 }}>
        <div 
          className="absolute rounded-full"
          style={{
            width: '600px',
            height: '600px',
            top: '-10%',
            left: '-5%',
            background: 'radial-gradient(circle, rgba(96, 80, 186, 0.4) 0%, transparent 70%)',
            filter: 'blur(40px)',
            animation: 'orb-float-1 25s ease-in-out infinite',
          }}
        />
        <div 
          className="absolute rounded-full"
          style={{
            width: '500px',
            height: '500px',
            bottom: '-5%',
            right: '-10%',
            background: 'radial-gradient(circle, rgba(157, 141, 241, 0.5) 0%, transparent 70%)',
            filter: 'blur(50px)',
            animation: 'orb-float-2 30s ease-in-out infinite',
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
            background: 'radial-gradient(circle, rgba(96, 80, 186, 0.25) 0%, transparent 70%)',
            filter: 'blur(60px)',
            animation: 'orb-float-3 20s ease-in-out infinite',
          }}
        />
      </div>

      {/* Светящиеся точки */}
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
      
      {/* Сетка */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{ 
          zIndex: -2,
          backgroundImage: 'linear-gradient(rgba(157, 141, 241, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(157, 141, 241, 0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
    </>
  );
};

function BodyContent({ children, pathname }: { children: React.ReactNode; pathname: string }) {
  const { themeName } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0 });
  
  const navItems = [
    { href: '/cabinet', label: 'Кабинет' },
    { href: '/news', label: 'Новости' },
    { href: '/contacts', label: 'Контакты' },
    { href: '/faq', label: 'FAQ' },
  ];

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  useEffect(() => {
    if (!mounted) return;
    
    const activeIndex = navItems.findIndex(item => item.href === pathname);
    if (activeIndex !== -1 && navRefs.current[activeIndex]) {
      const activeEl = navRefs.current[activeIndex];
      const parent = activeEl?.parentElement;
      if (activeEl && parent) {
        const left = activeEl.offsetLeft;
        const width = activeEl.offsetWidth;
        setSliderStyle({ left: left + 4, width: width - 8 });
      }
    }
  }, [pathname, mounted]);

  return (
    <>
      {/* Красивый анимированный фон - ВЕЗДЕ */}
      <AnimatedBackground />

      {/* Навигация */}
      {pathname !== '/' && pathname !== '/auth' && pathname !== '/admin' && (
        <header 
          className="fixed top-0 w-full z-50 transition-all duration-500"
          style={{
            background: scrolled 
              ? themeName === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(8, 8, 10, 0.95)' 
              : themeName === 'light' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(8, 8, 10, 0.6)',
            backdropFilter: 'blur(20px)',
            borderBottom: themeName === 'light' ? '1px solid rgba(0, 0, 0, 0.1)' : '1px solid rgba(96, 80, 186, 0.15)',
            height: '70px',
          }}
        >
          <div className="px-6 md:px-10 h-full flex justify-between items-center">
            {/* Лого - визуально большое через scale с правильным свечением */}
            <Link href="/feed" className="relative group flex-shrink-0" style={{ width: '128px', height: '77px' }}>
              <img 
                src="/logo.png" 
                alt="thqlabel" 
                className="absolute left-0 top-1/2 h-12 w-auto object-contain transition-all duration-300 group-hover:brightness-125"
                style={{ transform: 'translateY(-50%) scale(1.6)', transformOrigin: 'left center' }}
              />
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 w-32 h-20 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" 
                style={{
                  background: 'radial-gradient(circle, rgba(96, 80, 186, 0.5) 0%, transparent 70%)',
                }}
              />
            </Link>

            {/* Навигация с плавным ползунком */}
            <nav className="relative flex items-center rounded-2xl" style={{
              background: themeName === 'light' 
                ? 'linear-gradient(135deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.02) 100%)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
              border: themeName === 'light' ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
              boxShadow: themeName === 'light' 
                ? 'inset 0 1px 0 rgba(0,0,0,0.1), 0 4px 20px rgba(0,0,0,0.1)'
                : 'inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 20px rgba(0,0,0,0.3)',
            }}>
              {/* Анимированный ползунок на точных координатах (скрыт на главной странице feed) */}
              {mounted && sliderStyle.width > 0 && pathname !== '/feed' && (
                <div 
                  className="absolute rounded-xl transition-all duration-300 ease-out"
                  style={{
                    left: `${sliderStyle.left}px`,
                    top: '4px',
                    bottom: '4px',
                    width: `${sliderStyle.width}px`,
                    background: themeName === 'light'
                      ? 'linear-gradient(135deg, rgba(96, 80, 186, 0.2) 0%, rgba(157, 141, 241, 0.2) 100%)'
                      : 'linear-gradient(135deg, rgba(96, 80, 186, 0.6) 0%, rgba(157, 141, 241, 0.4) 100%)',
                    border: themeName === 'light' ? '1px solid rgba(96, 80, 186, 0.3)' : '1px solid rgba(157, 141, 241, 0.4)',
                    animation: 'slider-glow 2s ease-in-out infinite',
                  }}
                />
              )}
              
              {navItems.map((item, index) => {
                const isActive = pathname === item.href;
                return (
                  <Link 
                    key={item.href}
                    ref={(el) => { navRefs.current[index] = el; }}
                    href={item.href}
                    className="relative px-5 md:px-7 py-3 md:py-3.5 text-[10px] md:text-[11px] uppercase tracking-[0.15em] font-black transition-all duration-300 z-10"
                    style={{
                      color: isActive 
                        ? themeName === 'light' ? '#000' : '#fff'
                        : themeName === 'light' ? '#666' : '#a1a1aa',
                      textShadow: isActive 
                        ? themeName === 'light' ? '0 0 10px rgba(0,0,0,0.2)' : '0 0 10px rgba(255,255,255,0.8)'
                        : 'none',
                    }}
                  >
                    <span className="relative">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>
      )}
      
      {/* Контент */}
      <div className="relative" style={{ zIndex: 1 }}>
        <ModalProvider>
          {children}
        </ModalProvider>
      </div>

      {/* Глобальный виджет поддержки */}
      <GlobalSupportWidget />
    </>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname === '/admin';

  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <title>thqlabel</title>
        <meta name="description" content="THQ Label - Современный музыкальный лейбл" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.ico?v=2" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon.png?v=2" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon.png?v=2" />
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