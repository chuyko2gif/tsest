"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';

export default function HomePage() {
  const router = useRouter();
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  const [introReady, setIntroReady] = useState(false);
  
  useEffect(() => {
    // Прокрутка в самый верх
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    
    // Запускаем intro анимацию
    requestAnimationFrame(() => {
      setIntroReady(true);
    });
    
    // Редирект на /feed
    const timer = setTimeout(() => {
      router.replace('/feed');
    }, 1800);
    
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="min-h-screen overflow-hidden relative">
      {/* Intro анимация */}
      <div 
        className={`intro-screen fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-500 ${
          introReady ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Голографический фон - только для светлой темы */}
        <div className="intro-holographic absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 intro-gradient-1" />
          <div className="absolute inset-0 intro-gradient-2" />
          <div className="absolute inset-0 intro-shimmer" />
          <div className="intro-blob-1" />
          <div className="intro-blob-2" />
          <div className="intro-blob-3" />
        </div>
        
        {/* Градиентные пятна - для тёмной темы */}
        <div className="intro-dark-spots absolute inset-0 pointer-events-none">
          <div className="absolute w-96 h-96 rounded-full top-[10%] left-[15%] bg-[radial-gradient(circle,rgba(96,80,186,0.2)_0%,transparent_60%)] blur-[60px]" />
          <div className="absolute w-80 h-80 rounded-full bottom-[20%] right-[15%] bg-[radial-gradient(circle,rgba(157,141,241,0.2)_0%,transparent_60%)] blur-[50px]" />
        </div>
        
        {/* Звёзды/блёстки */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
          {Array.from({ length: 60 }, (_, i) => {
            const size = (i % 3) + 2;
            const left = ((i * 37) % 100);
            const top = ((i * 23) % 100);
            const delay = (i % 20) * 0.12;
            return (
              <div
                key={i}
                className="intro-star absolute rounded-full"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  left: `${left}%`,
                  top: `${top}%`,
                  animationDelay: `${delay}s`,
                }}
              />
            );
          })}
        </div>

        {/* Центральный контейнер */}
        <div className="flex flex-col items-center justify-center relative z-10">
          {/* Контейнер для Сатурна */}
          <div 
            className="relative flex items-center justify-center"
            style={{
              width: '350px',
              height: '350px',
              opacity: introReady ? 1 : 0,
              transform: introReady ? 'scale(1)' : 'scale(0.5)',
              transition: 'opacity 0.8s cubic-bezier(0.34,1.56,0.64,1), transform 0.8s cubic-bezier(0.34,1.56,0.64,1)',
            }}
          >
            {/* БОЛЬШОЕ ЛОГО - ПОВЕРХ ВСЕГО */}
            <img 
              src="/logo.png" 
              alt="thq" 
              className={`intro-logo absolute z-30 object-contain ${isLight ? 'invert brightness-0' : ''}`}
              style={{
                width: '400px',
                height: '400px',
                animation: introReady ? 'logo-glow-intro 2s ease-in-out infinite' : 'none',
              }}
            />

            {/* Мощное внешнее свечение */}
            <div 
              className="intro-outer-glow absolute rounded-full blur-3xl pointer-events-none"
              style={{
                width: '200px',
                height: '200px',
                animation: introReady ? 'glow-pulse 3s ease-in-out infinite' : 'none',
              }}
            />
            
            {/* Планета Сатурн - маленькая, за лого */}
            <div 
              className="intro-planet absolute rounded-full overflow-hidden z-10"
              style={{
                width: '120px',
                height: '120px',
                animation: introReady ? 'planet-pulse 4s ease-in-out infinite' : 'none',
              }}
            >
              {/* Яркий блик */}
              <div 
                className="absolute w-8 h-8 rounded-full top-2 left-2 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.3) 30%, transparent 70%)',
                }}
              />
            </div>

            {/* Контейнер для колец */}
            <div 
              className="absolute z-20"
              style={{
                width: '280px',
                height: '80px',
                perspective: '1000px',
              }}
            >
              {/* Основное кольцо */}
              <div
                className="intro-ring-1 absolute inset-0"
                style={{
                  borderRadius: '50%',
                  border: '16px solid transparent',
                  animation: introReady ? 'ring-spin 8s linear infinite' : 'none',
                }}
              />
              {/* Второе кольцо */}
              <div
                className="intro-ring-2 absolute"
                style={{
                  top: '-12px',
                  left: '-12px',
                  right: '-12px',
                  bottom: '-12px',
                  borderRadius: '50%',
                  border: '8px solid transparent',
                  animation: introReady ? 'ring-spin 12s linear infinite reverse' : 'none',
                }}
              />
              {/* Третье пунктирное кольцо */}
              <div
                className="intro-ring-3 absolute"
                style={{
                  top: '-25px',
                  left: '-25px',
                  right: '-25px',
                  bottom: '-25px',
                  borderRadius: '50%',
                  animation: introReady ? 'ring-spin 16s linear infinite' : 'none',
                }}
              />
            </div>

            {/* Летающие частицы */}
            {introReady && [...Array(10)].map((_, i) => (
              <div
                key={i}
                className="intro-particle absolute w-2 h-2 rounded-full"
                style={{
                  animationName: 'particle-orbit',
                  animationDuration: `${5 + i * 0.6}s`,
                  animationTimingFunction: 'linear',
                  animationIterationCount: 'infinite',
                  animationDelay: `${i * 0.5}s`,
                }}
              />
            ))}
          </div>

         
          
          {/* Анимированные точки загрузки */}
          <div 
            className="flex items-center justify-center gap-2 mt-4"
            style={{ 
              opacity: introReady ? 1 : 0,
              transform: introReady ? 'translateY(0)' : 'translateY(10px)',
              transition: 'opacity 0.5s ease-out 0.5s, transform 0.5s ease-out 0.5s',
            }}
          >
            <span className="intro-loading-text text-xs uppercase tracking-[0.3em] font-bold">Загрузка</span>
            <span className="flex gap-1 ml-1">
              {[0, 1, 2].map((i) => (
                <span 
                  key={i}
                  className="intro-loading-dot w-1.5 h-1.5 rounded-full"
                  style={{
                    animationName: introReady ? 'loading-dot' : 'none',
                    animationDuration: '1.4s',
                    animationTimingFunction: 'ease-in-out',
                    animationIterationCount: 'infinite',
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
