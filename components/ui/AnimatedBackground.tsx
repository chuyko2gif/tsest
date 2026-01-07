"use client";
import React, { useState, useEffect, useMemo, memo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

// Функция для генерации детерминированных значений на основе индекса
const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

// Хук для определения мобильного устройства
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile, { passive: true });
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
};

// Оптимизированные летающие 3D фигуры
export const FloatingShapes = memo(() => {
  const { themeName } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // На мобильных - 6 фигур, на ПК - 10
  const shapeCount = isMobile ? 6 : 10;
  
  const shapes = useMemo(() => 
    Array.from({ length: shapeCount }, (_, i) => ({
      id: i,
      x: seededRandom(i + 1) * 100,
      y: seededRandom(i + 100) * 100,
      size: isMobile ? 25 + seededRandom(i + 200) * 35 : 30 + seededRandom(i + 200) * 50,
      duration: isMobile ? 30 + seededRandom(i + 300) * 20 : 20 + seededRandom(i + 300) * 20,
      delay: seededRandom(i + 400) * -15,
      type: seededRandom(i + 500) > 0.5 ? 'circle' : 'square',
    })),
  [shapeCount, isMobile]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {shapes.map(shape => (
        <div
          key={shape.id}
          className={`absolute ${shape.type === 'circle' ? 'rounded-full' : 'rounded-lg'}`}
          style={{
            left: `${shape.x}%`,
            top: `${shape.y}%`,
            width: shape.size,
            height: shape.size,
            border: themeName === 'light' ? '1px solid rgba(0, 0, 0, 0.15)' : '1px solid rgba(96, 80, 186, 0.15)',
            background: themeName === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(96, 80, 186, 0.02)',
            animationName: 'float-shape',
            animationDuration: `${shape.duration}s`,
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
            animationDelay: `${shape.delay}s`,
            willChange: 'auto',
            transform: 'translate3d(0,0,0)',
            backfaceVisibility: 'hidden',
          }}
        />
      ))}
      <style jsx>{`
        @keyframes float-shape {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(15px, -20px, 0); }
        }
      `}</style>
    </div>
  );
});

FloatingShapes.displayName = 'FloatingShapes';

// Оптимизированные частицы - минимум на мобильных
export const FloatingParticles = memo(() => {
  const { themeName } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // На мобильных - 8 частиц, на ПК - 18
  const particleCount = isMobile ? 8 : 18;
  
  const particles = useMemo(() => 
    Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: seededRandom(i + 600) * 100,
      y: seededRandom(i + 700) * 100,
      size: isMobile ? 2 + seededRandom(i + 800) * 2 : 2 + seededRandom(i + 800) * 3,
      duration: isMobile ? 40 + seededRandom(i + 900) * 20 : 25 + seededRandom(i + 900) * 25,
      delay: seededRandom(i + 1000) * -20,
      opacity: 0.3 + seededRandom(i + 1100) * 0.3,
    })),
  [particleCount, isMobile]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map(p => (
        <div
          key={p.id}
          className={`absolute rounded-full ${themeName === 'light' ? 'bg-black' : 'bg-[#9d8df1]'}`}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: themeName === 'light' ? p.opacity * 0.5 : p.opacity,
            boxShadow: isMobile ? 'none' : (themeName === 'light' ? '0 0 4px rgba(0,0,0,0.15)' : '0 0 6px rgba(157, 141, 241, 0.4)'),
            animationName: 'particle-fly',
            animationDuration: `${p.duration}s`,
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
            animationDelay: `${p.delay}s`,
            willChange: 'auto',
            transform: 'translate3d(0,0,0)',
          }}
        />
      ))}
      <style jsx>{`
        @keyframes particle-fly {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(25px, -30px, 0); }
        }
      `}</style>
    </div>
  );
});

FloatingParticles.displayName = 'FloatingParticles';

// Оптимизированный градиентный фон
export const ParallaxGradient = memo(() => {
  const { themeName } = useTheme();
  const isMobile = useIsMobile();
  
  // На мобильных - без blur для производительности
  const blurAmount = isMobile ? 80 : 150;
  
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ transform: 'translate3d(0,0,0)' }}>
      <div 
        className={`absolute top-0 left-1/4 ${isMobile ? 'w-[300px] h-[300px]' : 'w-[600px] h-[600px]'} ${themeName === 'light' ? 'bg-gray-300/15' : 'bg-[#6050ba]/08'} rounded-full`}
        style={{ 
          filter: `blur(${blurAmount}px)`,
          willChange: 'auto',
        }}
      />
      {!isMobile && (
        <div 
          className={`absolute bottom-1/4 right-1/4 w-[500px] h-[500px] ${themeName === 'light' ? 'bg-gray-400/10' : 'bg-[#9d8df1]/08'} rounded-full`}
          style={{ 
            filter: 'blur(120px)',
            willChange: 'auto',
          }}
        />
      )}
    </div>
  );
});

ParallaxGradient.displayName = 'ParallaxGradient';

// Оптимизированный эффект стекла - упрощён для мобильных
export const GlassOverlay = memo(() => {
  const { themeName } = useTheme();
  const isMobile = useIsMobile();
  
  // На мобильных - без backdrop-filter (очень тяжёлый для GPU)
  if (isMobile) {
    return (
      <div className="fixed inset-0 pointer-events-none z-[1]" style={{ transform: 'translate3d(0,0,0)' }}>
        <div className={`absolute inset-0 ${themeName === 'dark' ? 'bg-black/50' : 'bg-white/40'}`} />
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 pointer-events-none z-[1]" style={{ transform: 'translate3d(0,0,0)' }}>
      {themeName === 'dark' ? (
        <>
          <div 
            className="absolute inset-0 bg-black/40" 
            style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }} 
          />
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(0,0,0,0.3) 100%)',
          }} />
        </>
      ) : (
        <>
          <div 
            className="absolute inset-0 bg-white/30" 
            style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }} 
          />
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(255,255,255,0.2) 100%)',
          }} />
        </>
      )}
    </div>
  );
});

GlassOverlay.displayName = 'GlassOverlay';

// Оптимизированный комплексный анимированный фон
const AnimatedBackground = memo(() => {
  const [isVisible, setIsVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Проверяем мобильное устройство
    setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    
    // Проверяем настройки пользователя на уменьшенную анимацию
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    // Отложенное появление для оптимизации First Paint
    const timer = requestAnimationFrame(() => {
      setIsVisible(true);
    });
    
    return () => {
      cancelAnimationFrame(timer);
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Если пользователь предпочитает уменьшенную анимацию - показываем только статичный фон
  if (reducedMotion) {
    return <GlassOverlay />;
  }

  if (!isVisible) {
    return null;
  }

  // На мобильных - упрощённый фон без частиц
  if (isMobile) {
    return (
      <>
        <ParallaxGradient />
        <GlassOverlay />
      </>
    );
  }

  return (
    <>
      <FloatingShapes />
      <FloatingParticles />
      <ParallaxGradient />
      <GlassOverlay />
    </>
  );
});

AnimatedBackground.displayName = 'AnimatedBackground';

export default AnimatedBackground;
