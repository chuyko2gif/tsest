"use client";
import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useTheme } from '@/contexts/ThemeContext';
import { SilverStarsGroup } from '@/components/ui/SilverStars';

// Релизы thq label
const RELEASES = [
  { id: 1, title: 'НЕ В СЕТИ', artist: 'angelgrind', cover: 'https://t2.genius.com/unsafe/430x430/https%3A%2F%2Fimages.genius.com%2Fd4892b6202a4051f807a8a847f44adc0.1000x1000x1.png' },
  { id: 2, title: 'ЗАКОЛКИ & КОСТИ', artist: 'kweetee', cover: 'https://t2.genius.com/unsafe/600x600/https%3A%2F%2Fimages.genius.com%2F9fa9951f735a169c17e47baf71ab45c7.1000x1000x1.png' },
  { id: 3, title: 'МЕХАНИЗМ', artist: 'athygue', cover: 'https://t2.genius.com/unsafe/430x430/https%3A%2F%2Fimages.genius.com%2Fa4b2333f9c0768cf4f07d1252caff125.1000x1000x1.png' },
  { id: 4, title: 'ДЕВЧАЧИЙ РОК-АЛЬБОМ', artist: 'тенденция', cover: 'https://images.genius.com/2fa8d85da644fad7afc1ba3d40d0d513.1000x1000x1.png' },
  { id: 5, title: 'TIRED OF YOU / WHAT PAIN IS', artist: 'breakfall', cover: 'https://cdn-images.dzcdn.net/images/cover/7101d738b828553e74b9f0035a6dfa1a/500x500-000000-80-0-0.jpg' },
  { id: 6, title: 'hate&love', artist: 'frommee', cover: 'https://t2.genius.com/unsafe/430x430/https%3A%2F%2Fimages.genius.com%2F43f01d20830d2acedb8267d3ea7a21e8.1000x1000x1.png' },
  { id: 7, title: 'кейон', artist: 'ева киллер', cover: 'https://m.media-amazon.com/images/I/51knFhnMP0L._UX716_FMwebp_QL85_.jpg' },
  { id: 8, title: 'Холодно', artist: 'qqdie', cover: 'https://images.genius.com/ece70e671b3422967c2012217763c557.807x807x1.jpg' },
];

// Услуги лейбла с иконками
const SERVICES = [
  { name: 'Дистрибуция на все платформы', icon: 'globe' },
  { name: 'Маркетинг и PR', icon: 'megaphone' },
  { name: 'Синхронизация с соцсетями', icon: 'share' },
  { name: 'Защита авторских прав', icon: 'shield' },
  { name: 'Аналитика и отчетность', icon: 'chart' },
  { name: 'Продвижение в плейлистах', icon: 'playlist' },
  { name: 'Создание контента', icon: 'video' },
  { name: 'Консультации по развитию карьеры', icon: 'users' },
];

// SVG иконки для услуг
const ServiceIcon = ({ type, className }: { type: string; className?: string }) => {
  const icons: Record<string, React.ReactElement> = {
    globe: <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="1.5"/><path strokeLinecap="round" strokeWidth="1.5" d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    megaphone: <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>,
    share: <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>,
    shield: <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>,
    chart: <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
    playlist: <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>,
    video: <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>,
    users: <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>,
  };
  return icons[type] || null;
};

// Оптимизированный анимированный счетчик
const AnimatedCounter = memo(({ end, duration = 2500, suffix = '', delay = 0 }: { end: number; duration?: number; suffix?: string; delay?: number }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const endRef = useRef(end);
  const durationRef = useRef(duration);

  useEffect(() => {
    endRef.current = end;
    durationRef.current = duration;
  });

  useEffect(() => {
    startTimeRef.current = null;
    countRef.current = 0;
    setCount(0);
    
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / durationRef.current, 1);
      
      // Плавный easeOutQuart
      const easeOut = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(endRef.current * easeOut);
      
      if (currentValue !== countRef.current) {
        countRef.current = currentValue;
        setCount(currentValue);
      }
      
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setCount(endRef.current);
      }
    };
    
    const timer = setTimeout(() => {
      rafRef.current = requestAnimationFrame(animate);
    }, delay);
    
    return () => {
      clearTimeout(timer);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [delay]);

  // Форматирование числа с разделителями
  const formatNumber = useCallback((num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num.toString();
  }, []);

  return <span className="tabular-nums">{formatNumber(count)}{suffix}</span>;
});

AnimatedCounter.displayName = 'AnimatedCounter';

// Функция для очистки Markdown-разметки из текста
const cleanMarkdown = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/^#{1,6}\s+/gm, '') // Удаляем заголовки (# ## ### и т.д.)
    .replace(/\*\*(.+?)\*\*/g, '$1') // Удаляем жирный текст
    .replace(/\*(.+?)\*/g, '$1') // Удаляем курсив
    .replace(/`(.+?)`/g, '$1') // Удаляем код
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Заменяем ссылки на текст
    .replace(/^>\s+/gm, '') // Удаляем цитаты
    .replace(/^-\s+/gm, '') // Удаляем маркеры списка
    .replace(/\n+/g, ' ') // Заменяем переносы строк на пробелы
    .trim();
};

// Функция для детерминированных псевдослучайных значений
const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

// Оптимизированные летающие 3D фигуры (уменьшено количество)
const FloatingShapes = memo(({ isLight }: { isLight?: boolean }) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Детерминированные значения для SSR
  const shapes = useMemo(() => 
    Array.from({ length: 10 }, (_, i) => ({
      id: i,
      x: seededRandom(i + 1) * 100,
      y: seededRandom(i + 100) * 100,
      size: 25 + seededRandom(i + 200) * 50,
      duration: 18 + seededRandom(i + 300) * 20,
      delay: seededRandom(i + 400) * -15,
      type: seededRandom(i + 500) > 0.5 ? 'circle' : 'square',
    })),
  []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" style={{ contain: 'strict' }}>
      {shapes.map(shape => (
        <div
          key={shape.id}
          className={`absolute ${shape.type === 'circle' ? 'rounded-full' : 'rounded-lg'}`}
          style={{
            left: `${shape.x}%`,
            top: `${shape.y}%`,
            width: shape.size,
            height: shape.size,
            border: isLight 
              ? '1px solid rgba(96, 80, 186, 0.2)'
              : '1px solid rgba(96, 80, 186, 0.15)',
            background: isLight 
              ? 'rgba(255, 255, 255, 0.4)'
              : 'rgba(96, 80, 186, 0.02)',
            backdropFilter: isLight ? 'blur(8px)' : 'none',
            animationName: 'float-shape',
            animationDuration: `${shape.duration}s`,
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            animationDelay: `${shape.delay}s`,
            willChange: 'transform',
            transform: 'translateZ(0)',
          }}
        />
      ))}
      <style jsx>{`
        @keyframes float-shape {
          0%, 100% { transform: translate3d(0, 0, 0); }
          25% { transform: translate3d(25px, -30px, 0); }
          50% { transform: translate3d(-15px, 25px, 0); }
          75% { transform: translate3d(30px, 15px, 0); }
        }
      `}</style>
    </div>
  );
});

FloatingShapes.displayName = 'FloatingShapes';

// Оптимизированные летающие частицы (уменьшено количество с 40 до 20)
const FloatingParticles = memo(({ isLight }: { isLight?: boolean }) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const particles = useMemo(() => 
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: seededRandom(i + 600) * 100,
      y: seededRandom(i + 700) * 100,
      size: 2 + seededRandom(i + 800) * 4,
      duration: 25 + seededRandom(i + 900) * 25,
      delay: seededRandom(i + 1000) * -20,
      opacity: 0.3 + seededRandom(i + 1100) * 0.4,
    })),
  []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" style={{ contain: 'strict' }}>
      {particles.map(p => (
        <div
          key={p.id}
          className={`absolute rounded-full ${isLight ? 'bg-black' : 'bg-[#9d8df1]'}`}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: isLight ? p.size * 1.2 : p.size,
            height: isLight ? p.size * 1.2 : p.size,
            opacity: isLight ? 0.25 : 1,
            border: undefined,
            boxShadow: isLight 
              ? '0 0 3px rgba(0,0,0,0.2)'
              : '0 0 8px rgba(157, 141, 241, 0.5)',
            background: isLight 
              ? 'rgba(0,0,0,0.6)'
              : undefined,
            animationName: isLight ? 'sparkle-float' : 'particle-fly',
            animationDuration: `${p.duration}s`,
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            animationDelay: `${p.delay}s`,
            willChange: 'transform, opacity',
            transform: 'translateZ(0)',
          }}
        />
      ))}
      <style jsx>{`
        @keyframes particle-fly {
          0%, 100% { transform: translate3d(0, 0, 0); opacity: 0.3; }
          25% { transform: translate3d(45px, -60px, 0); opacity: 0.7; }
          50% { transform: translate3d(-30px, 45px, 0); opacity: 0.4; }
          75% { transform: translate3d(60px, 30px, 0); opacity: 0.6; }
        }
        @keyframes sparkle-float {
          0%, 100% { 
            transform: translate3d(0, 0, 0) scale(1); 
            opacity: 0.5;
            box-shadow: 0 0 2px rgba(100,80,140,0.4), 0 0 5px rgba(180,140,220,0.3);
          }
          25% { 
            transform: translate3d(20px, -30px, 0) scale(1.2); 
            opacity: 0.8;
            box-shadow: 0 0 3px rgba(100,80,140,0.5), 0 0 8px rgba(180,140,220,0.4);
          }
          50% { 
            transform: translate3d(-12px, 20px, 0) scale(1.1); 
            opacity: 0.6;
          }
          75% { 
            transform: translate3d(25px, 12px, 0) scale(1.3); 
            opacity: 0.9;
            box-shadow: 0 0 4px rgba(100,80,140,0.5), 0 0 10px rgba(140,180,220,0.4);
          }
        }
      `}</style>
    </div>
  );
});

FloatingParticles.displayName = 'FloatingParticles';

// Оптимизированная 3D летающая карточка релиза
const FloatingReleaseCard = memo(({ release, index, isMobile }: { release: any; index: number; isMobile: boolean }) => {
  // Мемоизированные позиции
  const positions = useMemo(() => {
    const positionsDesktop = [
      { x: '6%', y: '15%', rotate: -10 },
      { x: '86%', y: '15%', rotate: 10 },
      { x: '6%', y: '35%', rotate: 8 },
      { x: '86%', y: '35%', rotate: -8 },
      { x: '6%', y: '55%', rotate: -12 },
      { x: '86%', y: '55%', rotate: 12 },
      { x: '6%', y: '75%', rotate: 10 },
      { x: '86%', y: '75%', rotate: -10 },
    ];
    
    const positionsMobile = [
      { x: '2%', y: '20%', rotate: -8 },
      { x: '75%', y: '28%', rotate: 6 },
      { x: '3%', y: '38%', rotate: -5 },
      { x: '78%', y: '50%', rotate: 7 },
      { x: '4%', y: '58%', rotate: 8 },
      { x: '76%', y: '65%', rotate: -7 },
      { x: '1%', y: '75%', rotate: 5 },
      { x: '77%', y: '82%', rotate: -6 },
    ];
    
    return isMobile ? positionsMobile : positionsDesktop;
  }, [isMobile]);
  
  const pos = positions[index % positions.length];
  
  // Статический transform без mousemove для оптимизации
  const transformStyle = useMemo(() => ({
    left: pos.x,
    top: pos.y,
    transform: `perspective(1000px) rotateY(${pos.rotate}deg) translateZ(0)`,
    zIndex: isMobile ? -1 : 10,
  }), [pos, isMobile]);

  // Показываем все 8 релизов на мобилке
  if (isMobile && index >= 8) return null;

  return (
    <div
      className="absolute pointer-events-none"
      style={transformStyle}
    >
      <div 
        className="relative w-20 h-28 sm:w-24 sm:h-32 lg:w-32 lg:h-40 xl:w-36 xl:h-44 rounded-xl sm:rounded-2xl overflow-hidden backdrop-blur-md group"
        style={{
          animationName: 'float-card',
          animationDuration: `${6 + index}s`,
          animationTimingFunction: 'ease-in-out',
          animationIterationCount: 'infinite',
          animationDelay: `${index * 0.3}s`,
          background: isMobile 
            ? 'rgba(0, 0, 0, 0.15)'
            : 'rgba(96, 80, 186, 0.08)',
          border: '1px solid rgba(157, 141, 241, 0.25)',
          boxShadow: isMobile
            ? '0 10px 25px -10px rgba(0, 0, 0, 0.15)'
            : '0 15px 50px -15px rgba(96, 80, 186, 0.4)',
          opacity: isMobile ? 0.25 : 1,
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
      >
        {/* Картинка обложки с оверлеем */}
        <div className="relative w-full h-16 sm:h-20 lg:h-28 xl:h-32 overflow-hidden">
          <img 
            src={release.cover} 
            alt={release.title}
            className="w-full h-full object-cover opacity-90"
            loading="lazy"
            decoding="async"
          />
          {/* Градиентный оверлей */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#6050ba]/20 via-transparent to-black/80" />
        </div>

        {/* Инфо блок */}
        <div className="absolute bottom-0 left-0 right-0 p-1.5 sm:p-2 lg:p-3 border-t border-[#6050ba]/30"
          style={{
            background: isMobile ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <p className="text-[8px] sm:text-[9px] lg:text-[11px] font-black text-white truncate uppercase tracking-wide">{release.title}</p>
          <p className="text-[7px] sm:text-[8px] lg:text-[10px] text-[#9d8df1] font-bold mt-0.5">{release.artist}</p>
          <div className="mt-1 sm:mt-1.5 lg:mt-2 h-0.5 w-4 sm:w-6 lg:w-8 bg-gradient-to-r from-[#9d8df1] to-transparent rounded-full" />
        </div>
      </div>
      
      <style jsx>{`
        @keyframes float-card {
          0% { transform: translate3d(0, 0, 0); }
          25% { transform: translate3d(5px, -8px, 0); }
          50% { transform: translate3d(0, -15px, 0); }
          75% { transform: translate3d(-5px, -8px, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
      `}</style>
    </div>
  );
});

FloatingReleaseCard.displayName = 'FloatingReleaseCard';

// Модальное окно для услуг
const ServicesModal = memo(({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  
  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md ${
        isLight ? 'bg-[#2a2550]/60' : 'bg-black/80'
      }`}
      onClick={onClose}
    >
      <div 
        className="relative max-w-3xl w-full rounded-3xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: isLight 
            ? 'linear-gradient(145deg, rgba(200, 196, 216, 0.98) 0%, rgba(213, 208, 229, 0.98) 100%)'
            : 'linear-gradient(145deg, rgba(26, 26, 46, 0.95) 0%, rgba(22, 33, 62, 0.95) 100%)',
          boxShadow: isLight
            ? '0 25px 80px -20px rgba(96, 80, 186, 0.4), 0 0 0 1px rgba(96, 80, 186, 0.3)'
            : '0 25px 80px -20px rgba(96, 80, 186, 0.5), 0 0 0 1px rgba(157, 141, 241, 0.2)',
        }}
      >
        {/* Декоративные элементы */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#9d8df1] to-transparent" />
        <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl ${isLight ? 'bg-[#6050ba]/15' : 'bg-[#6050ba]/20'}`} />
        <div className={`absolute -bottom-20 -left-20 w-40 h-40 rounded-full blur-3xl ${isLight ? 'bg-[#9d8df1]/15' : 'bg-[#9d8df1]/20'}`} />
        
        <div className="relative p-6 md:p-8">
          {/* Заголовок */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6050ba] to-[#9d8df1] flex items-center justify-center shadow-lg shadow-[#6050ba]/30">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className={`text-2xl font-black uppercase tracking-wider ${isLight ? 'text-[#2a2550]' : 'text-white'}`}>
                Услуги <span className="text-[#6050ba]">Лейбла</span>
              </h3>
              <p className={`text-xs ${isLight ? 'text-[#5a5580]' : 'text-white/50'}`}>Полный спектр услуг для артистов</p>
            </div>
          </div>

          {/* Список услуг */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SERVICES.map((service, index) => (
              <div 
                key={index}
                className="group relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] cursor-default overflow-hidden"
                style={{
                  background: isLight
                    ? 'linear-gradient(135deg, rgba(96,80,186,0.08) 0%, rgba(96,80,186,0.04) 100%)'
                    : 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                  border: isLight ? '1px solid rgba(96, 80, 186, 0.2)' : '1px solid rgba(157, 141, 241, 0.15)',
                }}
              >
                {/* Hover эффект */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#6050ba]/10 to-[#9d8df1]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ boxShadow: 'inset 0 0 30px rgba(157, 141, 241, 0.1)' }} />
                
                {/* Иконка */}
                <div className="relative flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#6050ba]/80 to-[#9d8df1]/80 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all shadow-lg shadow-[#6050ba]/20">
                  <ServiceIcon type={service.icon} className="w-5 h-5 text-white" />
                </div>
                
                {/* Текст */}
                <p className={`relative text-sm font-semibold transition-colors ${
                  isLight ? 'text-[#2a2550]/90 group-hover:text-[#2a2550]' : 'text-white/90 group-hover:text-white'
                }`}>{service.name}</p>
                
                {/* Стрелка */}
                <svg className={`relative ml-auto w-4 h-4 group-hover:text-[#6050ba] group-hover:translate-x-1 transition-all ${
                  isLight ? 'text-[#6050ba]/30' : 'text-white/20'
                }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            ))}
          </div>

          {/* Кнопка закрыть внизу */}
          <button
            onClick={onClose}
            className="mt-6 w-full py-3.5 rounded-xl text-white font-bold uppercase tracking-wider transition-all duration-300 hover:scale-[1.02] group relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #6050ba 0%, #9d8df1 100%)',
              boxShadow: '0 10px 30px -10px rgba(96, 80, 186, 0.5)',
            }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <svg className="w-4 h-4 group-hover:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Закрыть
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </button>
        </div>
      </div>
    </div>
  );
});

ServicesModal.displayName = 'ServicesModal';

export default function FeedPage() {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [servicesModalOpen, setServicesModalOpen] = useState(false);
  const [news, setNews] = useState<any[]>([]);
  const rafRef = useRef<number | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [introReady, setIntroReady] = useState(false);

  // Оптимизированная проверка размера экрана
  const checkMobile = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      setIsMobile(window.innerWidth < 1024);
      rafRef.current = null;
    });
  }, []);

  useEffect(() => {
    // Принудительная прокрутка в самый верх
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    
    // Запускаем intro анимацию после монтирования (для корректной работы CSS анимаций)
    requestAnimationFrame(() => {
      setIntroReady(true);
    });
    
    // Таймер для скрытия intro и показа контента
    const introTimer = setTimeout(() => {
      setShowIntro(false);
      setMounted(true);
    }, 1800);
    
    // Проверяем размер экрана
    checkMobile();
    window.addEventListener('resize', checkMobile, { passive: true });
    
    // Проверяем авторизацию
    const checkAuth = async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkAuth();

    // Загружаем новости
    const loadNews = async () => {
      if (!supabase) return;
      try {
        const { data, error } = await supabase.from('news').select('*').order('created_at', { ascending: false }).limit(3);
        if (data && !error) {
          setNews(data);
        }
      } catch (e) {
        console.error('Ошибка загрузки новостей:', e);
      }
    };
    loadNews();
    
    return () => {
      clearTimeout(introTimer);
      window.removeEventListener('resize', checkMobile);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [checkMobile]);

  return (
    <main className="min-h-screen overflow-hidden relative">
      {/* Intro анимация - использует CSS классы для темы (НЕ JS) */}
      {showIntro && (
        <div 
          className={`intro-screen fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-500 ${
            introReady ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            animation: introReady ? 'intro-fade-out 0.5s ease-out 1.5s forwards' : 'none'
          }}
        >
          {/* Тёмный фон - показывается по умолчанию (тёмная тема) */}
          <div className="intro-dark-bg absolute inset-0" />
          
          {/* Голографический фон - показывается через CSS когда html.light */}
          <div className="intro-holographic absolute inset-0 overflow-hidden">
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
          
          {/* Звёзды/блёстки - всегда показываем */}
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
      )}
      
      {/* Модальное окно услуг */}
      <ServicesModal isOpen={servicesModalOpen} onClose={() => setServicesModalOpen(false)} />

      {/* Летающие 3D фигуры и частицы */}
      <FloatingShapes isLight={isLight} />
      <FloatingParticles isLight={isLight} />
      
      {/* МЯГКИЙ ГОЛОГРАФИЧЕСКИЙ ФОН для светлой темы */}
      {isLight && (
        <div className="fixed inset-0 pointer-events-none" style={{ transform: 'translateZ(0)' }}>
          {/* Основной мягкий градиент */}
          <div 
            className="absolute inset-0"
            style={{
              background: `
                linear-gradient(135deg, 
                  rgba(255,200,210,0.2) 0%, 
                  rgba(255,230,200,0.15) 20%, 
                  rgba(230,255,230,0.15) 40%, 
                  rgba(200,230,255,0.2) 60%, 
                  rgba(230,200,240,0.2) 80%, 
                  rgba(255,200,210,0.2) 100%
                )
              `,
              animation: 'holographic-bg-shift 20s ease-in-out infinite',
            }}
          />
          {/* Мягкие радужные переливы */}
          <div 
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse at 15% 25%, rgba(255,180,210,0.25) 0%, transparent 50%),
                radial-gradient(ellipse at 85% 75%, rgba(180,210,255,0.25) 0%, transparent 50%),
                radial-gradient(ellipse at 50% 50%, rgba(210,180,240,0.2) 0%, transparent 60%)
              `,
              animation: 'holographic-bg-glow 15s ease-in-out infinite',
            }}
          />
          {/* Лёгкие блики */}
          <div 
            className="absolute inset-0"
            style={{
              background: `
                linear-gradient(45deg, 
                  transparent 0%, 
                  rgba(255,255,255,0.15) 30%, 
                  transparent 50%, 
                  rgba(255,255,255,0.1) 70%, 
                  transparent 100%
                )
              `,
              backgroundSize: '300% 300%',
              animation: 'shimmer-bg 12s linear infinite',
            }}
          />
          {/* Плавающие мягкие пятна */}
          <div 
            className="absolute w-[600px] h-[600px] rounded-full"
            style={{
              top: '-10%',
              left: '-10%',
              background: 'radial-gradient(circle, rgba(255,150,180,0.2) 0%, rgba(255,200,150,0.1) 50%, transparent 70%)',
              filter: 'blur(100px)',
              animation: 'float-bg-blob 25s ease-in-out infinite',
            }}
          />
          <div 
            className="absolute w-[550px] h-[550px] rounded-full"
            style={{
              bottom: '-5%',
              right: '-10%',
              background: 'radial-gradient(circle, rgba(150,200,255,0.2) 0%, rgba(200,150,240,0.1) 50%, transparent 70%)',
              filter: 'blur(90px)',
              animation: 'float-bg-blob 30s ease-in-out infinite reverse',
            }}
          />
          <div 
            className="absolute w-[500px] h-[500px] rounded-full"
            style={{
              top: '35%',
              right: '25%',
              background: 'radial-gradient(circle, rgba(150,240,200,0.15) 0%, rgba(240,240,150,0.08) 50%, transparent 70%)',
              filter: 'blur(80px)',
              animation: 'float-bg-blob 22s ease-in-out infinite 5s',
            }}
          />
          <style jsx>{`
            @keyframes holographic-bg-shift {
              0%, 100% { filter: hue-rotate(0deg) brightness(1); }
              50% { filter: hue-rotate(10deg) brightness(1.02); }
            }
            @keyframes holographic-bg-glow {
              0%, 100% { opacity: 0.5; }
              50% { opacity: 0.7; }
            }
            @keyframes shimmer-bg {
              0% { background-position: 300% 300%; }
              100% { background-position: -300% -300%; }
            }
            @keyframes float-bg-blob {
              0%, 100% { transform: translate(0, 0) scale(1); }
              33% { transform: translate(15px, -10px) scale(1.02); }
              66% { transform: translate(-10px, 10px) scale(0.98); }
            }
          `}</style>
        </div>
      )}
      
      {/* Усиленный градиентный фон - для тёмной темы */}
      {!isLight && (
        <div className="fixed inset-0 pointer-events-none" style={{ transform: 'translateZ(0)' }}>
          <div 
            className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#6050ba]/12 rounded-full" 
            style={{ filter: 'blur(150px)', animationName: 'gradient-pulse', animationDuration: '8s', animationTimingFunction: 'ease-in-out', animationIterationCount: 'infinite' }}
          />
          <div 
            className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#9d8df1]/12 rounded-full" 
            style={{ filter: 'blur(120px)', animationName: 'gradient-pulse', animationDuration: '8s', animationTimingFunction: 'ease-in-out', animationIterationCount: 'infinite', animationDelay: '2s' }}
        />
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#c4b5fd]/08 rounded-full" 
          style={{ filter: 'blur(180px)', animationName: 'gradient-pulse', animationDuration: '10s', animationTimingFunction: 'ease-in-out', animationIterationCount: 'infinite', animationDelay: '1s' }}
        />
        <style jsx>{`
          @keyframes gradient-pulse {
            0%, 100% { opacity: 0.8; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.1); }
          }
        `}</style>
      </div>
      )}

      {/* Основной контент */}
      <div className="relative z-20 w-full min-h-screen lg:h-screen px-4 md:px-6 lg:px-8 overflow-x-hidden overflow-y-auto lg:overflow-hidden">
        {/* Декоративные серебряные звёзды */}
        <SilverStarsGroup variant="hero" />
        
        {/* Grid layout - фиксированная высота экрана */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 lg:h-full py-2 pb-8 lg:pb-2">
          
          {/* Левая колонка - Текст, кнопки и релизы (компактно) */}
          <div className="lg:col-span-3 flex flex-col order-1 lg:order-none">
            <div className={`transition-all duration-1000 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              {/* Текст и кнопки с стеклянным эффектом */}
              <div className={`backdrop-blur-md rounded-2xl p-3 lg:p-4 shadow-2xl transition-all duration-300 ${
                isLight 
                  ? 'bg-[#d5d0e5] border border-[#b5acd0]' 
                  : 'bg-white/5 border border-white/10'
              }`}>
                <h1 className={`text-lg md:text-xl lg:text-2xl font-black mb-2 lg:mb-3 leading-tight ${
                  isLight 
                    ? 'bg-gradient-to-r from-[#4a3d8f] via-[#6050ba] to-[#4a3d8f] bg-clip-text text-transparent'
                    : 'bg-gradient-to-r from-white via-[#c4b5fd] to-white bg-clip-text text-transparent'
                }`}>
                  Продвигаем вашу музыку на новый уровень
                </h1>
                <p className={`text-[10px] md:text-xs lg:text-sm mb-3 lg:mb-4 leading-relaxed ${
                  isLight ? 'text-[#4a4270] font-medium' : 'text-white/90'
                }`} style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
                  Полный спектр услуг для артистов: дистрибуция, маркетинг, PR и синхронизация.
                </p>

                {/* Кнопки в одну строку */}
                <div className="flex gap-2 lg:gap-3">
                  <Link 
                    href="/cabinet"
                    className="flex-1 px-4 lg:px-5 py-2.5 lg:py-3 rounded-xl text-xs lg:text-sm font-bold uppercase tracking-wider transition-all hover:scale-105 hover:shadow-2xl text-white shadow-lg text-center border-2 border-[#3a2a7a]"
                    style={{
                      background: 'linear-gradient(135deg, #6050ba 0%, #9d8df1 100%)',
                      boxShadow: isLight 
                        ? '0 10px 40px rgba(96, 80, 186, 0.25)'
                        : '0 10px 40px rgba(96, 80, 186, 0.4)',
                    }}
                  >
                    Кабинет
                  </Link>
                  
                  <button 
                    onClick={() => setServicesModalOpen(true)}
                    className={`group relative flex-1 px-4 lg:px-5 py-2.5 lg:py-3 rounded-xl text-xs lg:text-sm font-bold uppercase tracking-wider transition-all hover:scale-105 overflow-hidden border-2 border-[#3a2a7a] ${
                      isLight ? 'text-white' : 'text-white'
                    }`}
                    style={{
                      background: isLight 
                        ? 'linear-gradient(135deg, #7a6cb5 0%, #9585d0 100%)'
                        : 'linear-gradient(135deg, rgba(157, 141, 241, 0.2) 0%, rgba(96, 80, 186, 0.3) 100%)',
                      boxShadow: isLight 
                        ? '0 4px 15px rgba(96, 80, 186, 0.3)'
                        : '0 0 20px rgba(157, 141, 241, 0.3), inset 0 0 20px rgba(157, 141, 241, 0.1)',
                    }}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-1.5">
                      <svg className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Услуги
                    </span>
                    <div className={`absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ${
                      isLight 
                        ? 'bg-gradient-to-r from-[#6050ba]/0 via-[#6050ba]/10 to-[#6050ba]/0'
                        : 'bg-gradient-to-r from-[#9d8df1]/0 via-[#9d8df1]/30 to-[#9d8df1]/0'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Релизы - чуть больше (скрыты на мобильных) */}
            <div className={`hidden lg:block mt-3 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className={`backdrop-blur-md rounded-2xl p-3 lg:p-4 shadow-xl transition-all duration-300 ${
                isLight 
                  ? 'bg-[#d5d0e5] border border-[#b5acd0]' 
                  : 'bg-white/5 border border-white/10'
              }`}>
                <h2 className={`text-[11px] font-black uppercase mb-2 ${
                  isLight 
                    ? 'text-[#5040a0]'
                    : 'bg-gradient-to-r from-[#9d8df1] to-[#c4b5fd] bg-clip-text text-transparent'
                }`}>
                  Популярные Релизы
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {RELEASES.slice(0, 6).map((release) => (
                    <div 
                      key={release.id}
                      className="group rounded-xl overflow-hidden transition-all hover:scale-105 hover:shadow-2xl"
                      style={{
                        background: isLight 
                          ? 'rgba(180, 170, 200, 0.7)'
                          : 'rgba(96, 80, 186, 0.15)',
                        border: isLight 
                          ? '1px solid rgba(150, 140, 180, 0.8)'
                          : '1px solid rgba(157, 141, 241, 0.3)',
                        boxShadow: isLight 
                          ? '0 4px 15px rgba(80, 64, 160, 0.15), inset 0 1px 0 rgba(255,255,255,0.3)'
                          : '0 4px 15px rgba(96, 80, 186, 0.2)',
                      }}
                    >
                      <div className="relative aspect-square overflow-hidden">
                        <img 
                          src={release.cover} 
                          alt={release.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className={`p-2 ${
                        isLight 
                          ? 'bg-[#c5bbd8]/90'
                          : 'bg-gradient-to-b from-black/60 to-black/80'
                      }`}>
                        <p className={`text-[10px] font-bold truncate leading-tight ${
                          isLight ? 'text-[#2a2050]' : 'text-white'
                        }`}>{release.title}</p>
                        <p className={`text-[9px] font-semibold truncate leading-tight ${
                          isLight ? 'text-[#5040a0]' : 'text-[#c4b5fd]'
                        }`}>{release.artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Центральная колонка - Планета Сатурн с логотипом */}
          <div className="lg:col-span-6 flex flex-col justify-center items-center order-2 lg:order-none">
            {/* Контейнер для Сатурна - БЕСКОНЕЧНАЯ АНИМАЦИЯ */}
            <div className={`relative mb-4 transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
              <div 
                className="relative flex items-center justify-center"
                style={{
                  width: '400px',
                  height: '400px',
                }}
              >
                {/* БОЛЬШОЕ ЛОГО - ПОВЕРХ ВСЕГО */}
                <img 
                  src="/logo.png" 
                  alt="thq" 
                  className={`absolute z-30 object-contain ${isLight ? 'invert brightness-0' : ''}`}
                  style={{
                    width: '500px',
                    height: '500px',
                    filter: isLight 
                      ? 'drop-shadow(0 0 25px rgba(96,80,186,0.5)) drop-shadow(0 0 50px rgba(96,80,186,0.3))'
                      : 'drop-shadow(0 0 40px rgba(255,255,255,1)) drop-shadow(0 0 60px rgba(147,112,219,0.8))',
                  }}
                />

                {/* Мощное внешнее свечение */}
                <div 
                  className="absolute rounded-full blur-[80px] pointer-events-none"
                  style={{
                    width: '300px',
                    height: '300px',
                    background: isLight 
                      ? 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, rgba(124,58,237,0.15) 40%, transparent 70%)'
                      : 'radial-gradient(circle, rgba(147,112,219,0.4) 0%, rgba(138,43,226,0.2) 40%, transparent 70%)',
                    animation: 'glow-pulse-main 4s ease-in-out infinite',
                  }}
                />
                
                {/* Планета - маленькая, за лого */}
                <div 
                  className="absolute rounded-full overflow-hidden z-10"
                  style={{
                    width: '180px',
                    height: '180px',
                    background: isLight 
                      ? `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.5) 0%, transparent 35%),
                         radial-gradient(circle at 75% 75%, rgba(109,40,217,0.3) 0%, transparent 40%),
                         linear-gradient(145deg, 
                           #e0d4ff 0%, 
                           #c4b5fd 15%, 
                           #a78bfa 30%, 
                           #8b5cf6 50%, 
                           #7c3aed 65%, 
                           #6d28d9 80%, 
                           #5b21b6 100%
                         )`
                      : `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 35%),
                         radial-gradient(circle at 75% 75%, rgba(75,0,130,0.4) 0%, transparent 40%),
                         linear-gradient(145deg, 
                           #dcd0ff 0%, 
                           #b8a4e3 15%, 
                           #9370db 30%, 
                           #8a2be2 50%, 
                           #7b68ee 65%, 
                           #6a5acd 80%, 
                           #483d8b 100%
                         )`,
                    boxShadow: isLight 
                      ? `inset -15px -15px 40px rgba(0,0,0,0.2),
                         inset 12px 12px 30px rgba(255,255,255,0.4),
                         0 0 40px rgba(139,92,246,0.4),
                         0 0 80px rgba(124,58,237,0.25)`
                      : `inset -15px -15px 40px rgba(0,0,0,0.4),
                         inset 12px 12px 30px rgba(255,255,255,0.2),
                         0 0 40px rgba(147,112,219,0.6),
                         0 0 80px rgba(138,43,226,0.4)`,
                    animation: 'planet-pulse-main 6s ease-in-out infinite',
                  }}
                >
                  {/* Яркий блик */}
                  <div 
                    className="absolute w-16 h-16 rounded-full top-3 left-3 pointer-events-none"
                    style={{
                      background: 'radial-gradient(circle at 40% 40%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.3) 40%, transparent 70%)',
                    }}
                  />
                </div>

                {/* Контейнер для колец */}
                <div 
                  className="absolute pointer-events-none z-20"
                  style={{
                    width: '380px',
                    height: '110px',
                  }}
                >
                  {/* Основное кольцо */}
                  <div
                    className="absolute inset-0"
                    style={{
                      borderRadius: '50%',
                      border: '20px solid transparent',
                      borderTopColor: isLight ? 'rgba(139,92,246,0.5)' : 'rgba(147,112,219,0.6)',
                      borderBottomColor: isLight ? 'rgba(139,92,246,0.5)' : 'rgba(147,112,219,0.6)',
                      boxShadow: isLight 
                        ? '0 0 40px rgba(124,58,237,0.2), inset 0 0 25px rgba(139,92,246,0.15)'
                        : '0 0 40px rgba(138,43,226,0.3), inset 0 0 25px rgba(147,112,219,0.2)',
                      animation: 'ring-rotate-main 10s linear infinite',
                    }}
                  />
                  {/* Второе кольцо */}
                  <div
                    className="absolute"
                    style={{
                      top: '-18px',
                      left: '-18px',
                      right: '-18px',
                      bottom: '-18px',
                      borderRadius: '50%',
                      border: '12px solid transparent',
                      borderTopColor: isLight ? 'rgba(167,139,250,0.35)' : 'rgba(186,85,211,0.4)',
                      borderBottomColor: isLight ? 'rgba(167,139,250,0.35)' : 'rgba(186,85,211,0.4)',
                      animation: 'ring-rotate-main 15s linear infinite reverse',
                    }}
                  />
                  {/* Третье пунктирное кольцо */}
                  <div
                    className="absolute"
                    style={{
                      top: '-35px',
                      left: '-35px',
                      right: '-35px',
                      bottom: '-35px',
                      borderRadius: '50%',
                      border: isLight ? '3px dashed rgba(139,92,246,0.2)' : '3px dashed rgba(218,112,214,0.25)',
                      animation: 'ring-rotate-main 20s linear infinite',
                    }}
                  />
                </div>

                {/* Летающие частицы */}
                {mounted && [...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2.5 h-2.5 rounded-full pointer-events-none"
                    style={{
                      background: isLight 
                        ? 'radial-gradient(circle, #c4b5fd 0%, #8b5cf6 100%)'
                        : 'radial-gradient(circle, #dda0dd 0%, #9370db 100%)',
                      boxShadow: isLight 
                        ? '0 0 12px rgba(167,139,250,0.7), 0 0 25px rgba(139,92,246,0.4)'
                        : '0 0 12px rgba(218,112,214,0.9), 0 0 25px rgba(147,112,219,0.6)',
                      animation: `particle-orbit-main ${6 + i * 0.7}s linear infinite`,
                      animationDelay: `${i * 0.5}s`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Кнопка "Лейбл ждёт тебя" под логотипом */}
            <div className={`mb-4 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
              <div className={`inline-flex items-center gap-2.5 text-[11px] uppercase tracking-wider font-black px-6 py-3 border-2 rounded-full ${
                isLight 
                  ? 'text-[#5040a0] border-[#a090d0] bg-[#d8d4e8]/80 shadow-md'
                  : 'text-white border-violet-500 bg-gradient-to-r from-violet-600/30 to-purple-600/30 shadow-lg shadow-violet-500/30'
              }`}>
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500 shadow-lg shadow-violet-400/50"></span>
                </span>
                Лейбл ждёт тебя
              </div>
            </div>

            {/* Информация под логотипом - по центру снизу */}
            <div className={`text-center w-full transition-all duration-1000 delay-[1200ms] ${mounted ? 'opacity-100' : 'opacity-0'}`}>
              <p className={`text-sm md:text-base mb-4 leading-relaxed max-w-xl mx-auto tracking-wide ${
                isLight 
                  ? 'text-[#5a4a9a] font-semibold'
                  : 'text-white/90 font-medium'
              }`} style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', letterSpacing: '0.02em' }}>
                <span className={isLight ? 'text-[#6050ba]' : 'text-[#c4b5fd]'}>Дистрибуция музыки</span> на все платформы мира.
                <br className="hidden sm:block" />
                <span className="opacity-80">Мы помогаем артистам стать услышанными.</span>
              </p>
              
              {/* Статистика */}
              <div className="flex flex-wrap justify-center gap-6 md:gap-8 lg:gap-10 mb-3">
                <div className="text-center">
                  <div className={`text-2xl md:text-3xl lg:text-4xl font-black text-transparent bg-clip-text ${
                    isLight 
                      ? 'bg-gradient-to-br from-[#6050ba] via-[#9d8df1] to-[#6050ba]'
                      : 'bg-gradient-to-br from-[#a89ef5] via-[#c4b5fd] to-white'
                  }`}>
                    <AnimatedCounter end={700} suffix="+" delay={2200} />
                  </div>
                  <div className={`text-[9px] uppercase tracking-wider font-bold ${
                    isLight ? 'text-gray-500' : 'text-white/70'
                  }`}>Релизов</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl md:text-3xl lg:text-4xl font-black text-transparent bg-clip-text ${
                    isLight 
                      ? 'bg-gradient-to-br from-[#6050ba] via-[#9d8df1] to-[#6050ba]'
                      : 'bg-gradient-to-br from-[#a89ef5] via-[#c4b5fd] to-white'
                  }`}>
                    <AnimatedCounter end={100} suffix="+" delay={2200} />
                  </div>
                  <div className={`text-[9px] uppercase tracking-wider font-bold ${
                    isLight ? 'text-gray-500' : 'text-white/70'
                  }`}>Артистов</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl md:text-3xl lg:text-4xl font-black text-transparent bg-clip-text ${
                    isLight 
                      ? 'bg-gradient-to-br from-[#6050ba] via-[#9d8df1] to-[#6050ba]'
                      : 'bg-gradient-to-br from-[#a89ef5] via-[#c4b5fd] to-white'
                  }`}>
                    <AnimatedCounter end={50000000} suffix="+" delay={2200} />
                  </div>
                  <div className={`text-[9px] uppercase tracking-wider font-bold ${
                    isLight ? 'text-gray-500' : 'text-white/70'
                  }`}>Прослушиваний</div>
                </div>
              </div>              {/* Футер ссылки */}
              <div className="flex flex-wrap justify-center gap-2">
                <Link 
                  href="/faq"
                  className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all hover:scale-105 backdrop-blur-sm ${
                    isLight 
                      ? 'bg-[#e8e4f3]/95 border border-[#c5bde0] shadow-sm hover:bg-[#ddd8ed] hover:border-[#9d8df1]/60'
                      : 'bg-white/5 border border-white/10 hover:bg-[#6050ba]/20 hover:border-[#9d8df1]/40'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                    isLight ? 'bg-gradient-to-br from-[#6050ba] to-[#9d8df1]' : 'bg-[#6050ba]/30'
                  }`}>
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                    isLight ? 'text-[#5a4a9a] group-hover:text-[#6050ba]' : 'text-white/70 group-hover:text-white'
                  }`}>FAQ</span>
                </Link>
                <Link 
                  href="/contacts"
                  className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all hover:scale-105 backdrop-blur-sm ${
                    isLight 
                      ? 'bg-[#e8e4f3]/95 border border-[#c5bde0] shadow-sm hover:bg-[#ddd8ed] hover:border-[#9d8df1]/60'
                      : 'bg-white/5 border border-white/10 hover:bg-[#6050ba]/20 hover:border-[#9d8df1]/40'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                    isLight ? 'bg-gradient-to-br from-[#6050ba] to-[#9d8df1]' : 'bg-[#6050ba]/30'
                  }`}>
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                    isLight ? 'text-[#5a4a9a] group-hover:text-[#6050ba]' : 'text-white/70 group-hover:text-white'
                  }`}>Контакты</span>
                </Link>
                <Link 
                  href="/news"
                  className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all hover:scale-105 backdrop-blur-sm ${
                    isLight 
                      ? 'bg-[#e8e4f3]/95 border border-[#c5bde0] shadow-sm hover:bg-[#ddd8ed] hover:border-[#9d8df1]/60'
                      : 'bg-white/5 border border-white/10 hover:bg-[#6050ba]/20 hover:border-[#9d8df1]/40'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                    isLight ? 'bg-gradient-to-br from-[#6050ba] to-[#9d8df1]' : 'bg-[#6050ba]/30'
                  }`}>
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                    isLight ? 'text-[#5a4a9a] group-hover:text-[#6050ba]' : 'text-white/70 group-hover:text-white'
                  }`}>Новости</span>
                </Link>
              </div>
              
              {/* Копирайт */}
              <div className="mt-3 text-center">
                <p className={`text-[9px] font-medium tracking-wider ${
                  isLight ? 'text-gray-400' : 'text-white/30'
                }`}>
                  © 2026 <span className={isLight ? 'text-[#6050ba]/50' : 'text-[#9d8df1]/50'}>thqlabel</span>. Все права защищены.
                </p>
              </div>
            </div>
          </div>

          {/* Правая колонка - Новости (скрыты на мобильных) */}
          <div className="hidden lg:block lg:col-span-3">
            <div className={`transition-all duration-1000 delay-400 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <h2 className={`text-xs font-black mb-1.5 uppercase ${
                isLight ? 'text-gray-800' : 'text-white'
              }`}>
                Новости
              </h2>
              <div className="space-y-2">
                {news.length > 0 ? news.map((item) => (
                  <Link
                    key={item.id}
                    href={`/news?id=${item.id}`}
                    className={`group block p-3 rounded-xl transition-all hover:scale-[1.02] backdrop-blur-sm ${
                      isLight 
                        ? 'bg-[#e8e4f3]/95 border border-[#c5bde0] shadow-sm hover:bg-[#ddd8ed] hover:border-[#9d8df1]/60'
                        : 'bg-white/5 border border-white/10 hover:bg-[#6050ba]/15 hover:border-[#9d8df1]/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform ${
                        isLight 
                          ? 'bg-gradient-to-br from-[#6050ba] to-[#9d8df1] shadow-sm shadow-violet-400/30'
                          : 'bg-gradient-to-br from-[#6050ba]/50 to-[#9d8df1]/50'
                      }`}>
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-bold text-[10px] mb-0.5 ${isLight ? 'text-[#6050ba]' : 'text-[#9d8df1]'}`}>
                          {new Date(item.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                        </div>
                        <h3 className={`font-bold text-xs transition-colors line-clamp-1 ${
                          isLight 
                            ? 'text-[#3d3d5c] group-hover:text-[#6050ba]'
                            : 'text-white group-hover:text-[#c4b5fd]'
                        }`}>
                          {item.title}
                        </h3>
                      </div>
                      <svg className={`w-4 h-4 group-hover:translate-x-0.5 transition-all ${
                        isLight 
                          ? 'text-gray-300 group-hover:text-[#9d8df1]'
                          : 'text-white/20 group-hover:text-[#9d8df1]'
                      }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                )) : (
                  <>
                    <div className={`p-3 rounded-xl backdrop-blur-sm ${
                      isLight 
                        ? 'bg-[#e8e4f3]/95 border border-[#c5bde0] shadow-sm'
                        : 'bg-white/5 border border-white/10'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                          isLight 
                            ? 'bg-gradient-to-br from-[#6050ba] to-[#9d8df1] shadow-sm shadow-violet-400/30'
                            : 'bg-gradient-to-br from-[#6050ba]/50 to-[#9d8df1]/50'
                        }`}>
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className={`font-bold text-[10px] mb-0.5 ${isLight ? 'text-[#6050ba]' : 'text-[#9d8df1]'}`}>28 окт</div>
                          <h3 className={`font-bold text-xs ${isLight ? 'text-[#3d3d5c]' : 'text-white'}`}>Анонс нового альбома</h3>
                        </div>
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl backdrop-blur-sm ${
                      isLight 
                        ? 'bg-[#e8e4f3]/95 border border-[#c5bde0] shadow-sm'
                        : 'bg-white/5 border border-white/10'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                          isLight 
                            ? 'bg-gradient-to-br from-[#6050ba] to-[#9d8df1] shadow-sm shadow-violet-400/30'
                            : 'bg-gradient-to-br from-[#6050ba]/50 to-[#9d8df1]/50'
                        }`}>
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className={`font-bold text-[10px] mb-0.5 ${isLight ? 'text-[#6050ba]' : 'text-[#9d8df1]'}`}>25 окт</div>
                          <h3 className={`font-bold text-xs ${isLight ? 'text-[#3d3d5c]' : 'text-white'}`}>"Luna" на премию</h3>
                        </div>
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl backdrop-blur-sm ${
                      isLight 
                        ? 'bg-[#e8e4f3]/95 border border-[#c5bde0] shadow-sm'
                        : 'bg-white/5 border border-white/10'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                          isLight 
                            ? 'bg-gradient-to-br from-[#6050ba] to-[#9d8df1] shadow-sm shadow-violet-400/30'
                            : 'bg-gradient-to-br from-[#6050ba]/50 to-[#9d8df1]/50'
                        }`}>
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className={`font-bold text-[10px] mb-0.5 ${isLight ? 'text-[#6050ba]' : 'text-[#9d8df1]'}`}>20 окт</div>
                          <h3 className={`font-bold text-xs ${isLight ? 'text-[#3d3d5c]' : 'text-white'}`}>Расширение сети</h3>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}