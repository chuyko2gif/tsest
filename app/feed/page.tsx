"use client";
import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Релизы thq label
const RELEASES = [
  { id: 1, title: 'НЕ В СЕТИ', artist: 'angelgrind', cover: 'https://t2.genius.com/unsafe/430x430/https%3A%2F%2Fimages.genius.com%2Fd4892b6202a4051f807a8a847f44adc0.1000x1000x1.png' },
  { id: 2, title: 'ЗАКОЛКИ & КОСТИ', artist: 'kweetee', cover: 'https://t2.genius.com/unsafe/600x600/https%3A%2F%2Fimages.genius.com%2F9fa9951f735a169c17e47baf71ab45c7.1000x1000x1.png' },
  { id: 3, title: 'МЕХАНИЗМ', artist: 'athygue', cover: 'https://t2.genius.com/unsafe/430x430/https%3A%2F%2Fimages.genius.com%2Fa4b2333f9c0768cf4f07d1252caff125.1000x1000x1.png' },
  { id: 4, title: 'ДЕВЧАЧИЙ РОК-АЛЬБОМ', artist: 'тенденция', cover: 'https://images.genius.com/2fa8d85da644fad7afc1ba3d40d0d513.1000x1000x1.png' },
  { id: 5, title: 'TIRED OF YOU / WHAT PAIN IS', artist: 'breakfall', cover: 'https://cdn-images.dzcdn.net/images/cover/7101d738b828553e74b9f0035a6dfa1a/500x500-000000-80-0-0.jpg' },
  { id: 6, title: 'LABEL', artist: 'YUUKKII', cover: 'https://t2.genius.com/unsafe/430x430/https%3A%2F%2Fimages.genius.com%2F4dbc0ecc8a3f9924cc950ec1ae1390c4.600x600x1.webp' },
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
  const icons: Record<string, JSX.Element> = {
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
const FloatingShapes = memo(() => {
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
            border: '1px solid rgba(96, 80, 186, 0.15)',
            background: 'rgba(96, 80, 186, 0.02)',
            animation: `float-shape ${shape.duration}s ease-in-out infinite`,
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
const FloatingParticles = memo(() => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const particles = useMemo(() => 
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: seededRandom(i + 600) * 100,
      y: seededRandom(i + 700) * 100,
      size: 2 + seededRandom(i + 800) * 3,
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
          className="absolute rounded-full bg-[#9d8df1]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            boxShadow: '0 0 8px rgba(157, 141, 241, 0.5)',
            animation: `particle-fly ${p.duration}s ease-in-out infinite`,
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
          animation: `float-card ${6 + index}s ease-in-out infinite`,
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
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div 
        className="relative max-w-3xl w-full rounded-3xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(145deg, rgba(26, 26, 46, 0.95) 0%, rgba(22, 33, 62, 0.95) 100%)',
          boxShadow: '0 25px 80px -20px rgba(96, 80, 186, 0.5), 0 0 0 1px rgba(157, 141, 241, 0.2)',
        }}
      >
        {/* Декоративные элементы */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#9d8df1] to-transparent" />
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#6050ba]/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[#9d8df1]/20 rounded-full blur-3xl" />
        
        <div className="relative p-6 md:p-8">
          {/* Заголовок */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6050ba] to-[#9d8df1] flex items-center justify-center shadow-lg shadow-[#6050ba]/30">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-wider">
                Услуги <span className="text-[#9d8df1]">Лейбла</span>
              </h3>
              <p className="text-xs text-white/50">Полный спектр услуг для артистов</p>
            </div>
          </div>

          {/* Список услуг */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SERVICES.map((service, index) => (
              <div 
                key={index}
                className="group relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] cursor-default overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                  border: '1px solid rgba(157, 141, 241, 0.15)',
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
                <p className="relative text-white/90 text-sm font-semibold group-hover:text-white transition-colors">{service.name}</p>
                
                {/* Стрелка */}
                <svg className="relative ml-auto w-4 h-4 text-white/20 group-hover:text-[#9d8df1] group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [servicesModalOpen, setServicesModalOpen] = useState(false);
  const [news, setNews] = useState<any[]>([]);
  const rafRef = useRef<number | null>(null);
  const [showIntro, setShowIntro] = useState(true);

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
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    }
    
    // Таймер для скрытия intro и показа контента
    const introTimer = setTimeout(() => {
      setShowIntro(false);
      setMounted(true);
    }, 1500);
    
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
      {/* Intro анимация с большим логотипом */}
      {showIntro && (
        <div 
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center animate-[fade-out_0.4s_ease-out_1.1s_forwards]"
          style={{
            background: 'linear-gradient(to bottom, #08080a 0%, #0d0d1a 50%, #08080a 100%)',
          }}
        >
          <img 
            src="/logo.png" 
            alt="thqlabel" 
            className="w-[70vw] max-w-[900px] h-auto"
            style={{
              filter: 'drop-shadow(0 0 80px rgba(96,80,186,0.9))',
              animation: 'intro-scale 0.8s cubic-bezier(0.34,1.56,0.64,1), intro-float 2s ease-in-out 0.5s infinite',
            }}
          />
          {/* Спиннер загрузки */}
          <div className="mt-8 flex items-center gap-3 animate-[fade-in_0.5s_ease-out_0.3s_both]">
            <div className="relative w-5 h-5">
              <div className="absolute inset-0 rounded-full border-2 border-[#9d8df1]/20" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#9d8df1] animate-spin" />
            </div>
            <span className="text-white/50 text-xs uppercase tracking-widest font-bold animate-pulse">Загрузка</span>
          </div>
          <style jsx>{`
            @keyframes intro-scale {
              0% { opacity: 0; transform: scale(0.7); }
              100% { opacity: 1; transform: scale(1); }
            }
            @keyframes intro-float {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-15px); }
            }
            @keyframes fade-in {
              0% { opacity: 0; }
              100% { opacity: 1; }
            }
            @keyframes fade-out {
              0% { opacity: 1; }
              100% { opacity: 0; visibility: hidden; }
            }
          `}</style>
        </div>
      )}
      
      {/* Модальное окно услуг */}
      <ServicesModal isOpen={servicesModalOpen} onClose={() => setServicesModalOpen(false)} />

      {/* Летающие 3D фигуры и частицы */}
      <FloatingShapes />
      <FloatingParticles />
      
      {/* Усиленный градиентный фон */}
      <div className="fixed inset-0 pointer-events-none" style={{ transform: 'translateZ(0)' }}>
        <div 
          className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#6050ba]/12 rounded-full" 
          style={{ filter: 'blur(150px)', animation: 'gradient-pulse 8s ease-in-out infinite' }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#9d8df1]/12 rounded-full" 
          style={{ filter: 'blur(120px)', animation: 'gradient-pulse 8s ease-in-out infinite 2s' }}
        />
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#c4b5fd]/08 rounded-full" 
          style={{ filter: 'blur(180px)', animation: 'gradient-pulse 10s ease-in-out infinite 1s' }}
        />
        <style jsx>{`
          @keyframes gradient-pulse {
            0%, 100% { opacity: 0.8; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.1); }
          }
        `}</style>
      </div>

      {/* Основной контент */}
      <div className="relative z-20 w-full h-screen px-4 md:px-6 lg:px-8">
        
        {/* Grid layout - фиксированная высота экрана */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 h-full py-2">
          
          {/* Левая колонка - Текст, кнопки и релизы (компактно) */}
          <div className="lg:col-span-3 flex flex-col h-full">
            <div className={`transition-all duration-1000 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              {/* Текст и кнопки с стеклянным эффектом */}
              <div className="backdrop-blur-sm bg-white/5 rounded-2xl p-3 lg:p-4 border border-white/10 shadow-2xl">
                <h1 className="text-lg md:text-xl lg:text-2xl font-black bg-gradient-to-r from-white via-[#c4b5fd] to-white bg-clip-text text-transparent mb-2 lg:mb-3 leading-tight">
                  Продвигаем вашу музыку на новый уровень
                </h1>
                <p className="text-[10px] md:text-xs lg:text-sm text-white/90 mb-3 lg:mb-4 leading-relaxed">
                  Полный спектр услуг для артистов: дистрибуция, маркетинг, PR и синхронизация.
                </p>

                {/* Кнопки в одну строку */}
                <div className="flex gap-2 lg:gap-3">
                  <Link 
                    href="/cabinet"
                    className="flex-1 px-4 lg:px-5 py-2.5 lg:py-3 rounded-xl text-xs lg:text-sm font-bold uppercase tracking-wider transition-all hover:scale-105 hover:shadow-2xl text-white shadow-lg text-center"
                    style={{
                      background: 'linear-gradient(135deg, #6050ba 0%, #9d8df1 100%)',
                      boxShadow: '0 10px 40px rgba(96, 80, 186, 0.4)',
                    }}
                  >
                    Кабинет
                  </Link>
                  
                  <button 
                    onClick={() => setServicesModalOpen(true)}
                    className="group relative flex-1 px-4 lg:px-5 py-2.5 lg:py-3 rounded-xl text-xs lg:text-sm font-bold uppercase tracking-wider transition-all hover:scale-105 text-white overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, rgba(157, 141, 241, 0.2) 0%, rgba(96, 80, 186, 0.3) 100%)',
                      border: '1px solid rgba(157, 141, 241, 0.5)',
                      boxShadow: '0 0 20px rgba(157, 141, 241, 0.3), inset 0 0 20px rgba(157, 141, 241, 0.1)',
                    }}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-1.5">
                      <svg className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Услуги
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#9d8df1]/0 via-[#9d8df1]/30 to-[#9d8df1]/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  </button>
                </div>
              </div>
            </div>

            {/* Релизы - чуть больше */}
            <div className={`mt-3 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="backdrop-blur-sm bg-white/5 rounded-2xl p-3 lg:p-4 border border-white/10 shadow-xl">
                <h2 className="text-[11px] font-black bg-gradient-to-r from-[#9d8df1] to-[#c4b5fd] bg-clip-text text-transparent uppercase mb-2">
                  Популярные Релизы
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {RELEASES.slice(0, 6).map((release) => (
                    <div 
                      key={release.id}
                      className="group rounded-xl overflow-hidden transition-all hover:scale-105 hover:shadow-2xl"
                      style={{
                        background: 'rgba(96, 80, 186, 0.15)',
                        border: '1px solid rgba(157, 141, 241, 0.3)',
                        boxShadow: '0 4px 15px rgba(96, 80, 186, 0.2)',
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
                      <div className="p-2 bg-gradient-to-b from-black/60 to-black/80">
                        <p className="text-[10px] font-bold text-white truncate leading-tight">{release.title}</p>
                        <p className="text-[9px] text-[#c4b5fd] font-semibold truncate leading-tight">{release.artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Центральная колонка - Логотип и информация */}
          <div className="lg:col-span-6 flex flex-col justify-center items-center">
            {/* Логотип чуть выше центра */}
            <div className={`relative mb-4 transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
              <div 
                className="absolute inset-0 blur-[100px] opacity-70 bg-gradient-to-br from-[#6050ba] via-[#9d8df1] to-[#c4b5fd]" 
                style={{ animation: 'logo-glow 4s ease-in-out infinite' }} 
              />
              <img 
                src="/logo.png" 
                alt="thqlabel" 
                className="relative z-10 w-full max-w-[500px] lg:max-w-[650px] h-auto object-contain"
                style={{ 
                  filter: 'drop-shadow(0 0 50px rgba(96,80,186,0.9))',
                  animation: 'logo-float 6s ease-in-out infinite, logo-pulse 3s ease-in-out infinite',
                }}
                loading="eager"
                decoding="async"
              />
            </div>

            {/* Кнопка "Лейбл ждёт тебя" под логотипом */}
            <div className={`mb-4 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
              <div className="inline-flex items-center gap-2 text-[10px] text-white uppercase tracking-wider font-black px-4 py-2 border-2 border-[#9d8df1]/80 rounded-full bg-gradient-to-r from-[#6050ba]/30 to-[#9d8df1]/30 shadow-xl backdrop-blur-sm">
                <span className="relative">
                  <span className="w-1.5 h-1.5 rounded-full bg-white block animate-pulse" />
                  <span className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                </span>
                Лейбл ждёт тебя
              </div>
            </div>

            {/* Информация под логотипом - по центру снизу */}
            <div className={`text-center w-full transition-all duration-1000 delay-[1200ms] ${mounted ? 'opacity-100' : 'opacity-0'}`}>
              <p className="text-white text-xs md:text-sm mb-3 leading-relaxed max-w-xl mx-auto">
                Дистрибуция музыки на все платформы мира. Мы помогаем артистам стать услышанными.
              </p>
              
              {/* Статистика */}
              <div className="flex flex-wrap justify-center gap-6 md:gap-8 lg:gap-10 mb-3">
                <div className="text-center">
                  <div className="text-2xl md:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#a89ef5] via-[#c4b5fd] to-white">
                    <AnimatedCounter end={150} suffix="+" delay={2200} />
                  </div>
                  <div className="text-[9px] text-white/70 uppercase tracking-wider font-bold">Релизов</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#a89ef5] via-[#c4b5fd] to-white">
                    <AnimatedCounter end={50} suffix="+" delay={2200} />
                  </div>
                  <div className="text-[9px] text-white/70 uppercase tracking-wider font-bold">Артистов</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#a89ef5] via-[#c4b5fd] to-white">
                    <AnimatedCounter end={1000000} suffix="+" delay={2200} />
                  </div>
                  <div className="text-[9px] text-white/70 uppercase tracking-wider font-bold">Прослушиваний</div>
                </div>
              </div>              {/* Футер ссылки */}
              <div className="flex flex-wrap justify-center gap-2">
                <Link 
                  href="/faq"
                  className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-[#6050ba]/20 hover:border-[#9d8df1]/40 transition-all hover:scale-105"
                >
                  <svg className="w-4 h-4 text-[#9d8df1] group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-white/70 group-hover:text-white text-xs font-bold uppercase tracking-wider transition-colors">FAQ</span>
                </Link>
                <Link 
                  href="/contacts"
                  className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-[#6050ba]/20 hover:border-[#9d8df1]/40 transition-all hover:scale-105"
                >
                  <svg className="w-4 h-4 text-[#9d8df1] group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-white/70 group-hover:text-white text-xs font-bold uppercase tracking-wider transition-colors">Контакты</span>
                </Link>
                <Link 
                  href="/news"
                  className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-[#6050ba]/20 hover:border-[#9d8df1]/40 transition-all hover:scale-105"
                >
                  <svg className="w-4 h-4 text-[#9d8df1] group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  <span className="text-white/70 group-hover:text-white text-xs font-bold uppercase tracking-wider transition-colors">Новости</span>
                </Link>
              </div>
              
              {/* Копирайт */}
              <div className="mt-3 text-center">
                <p className="text-white/30 text-[9px] font-medium tracking-wider">
                  © 2025 <span className="text-[#9d8df1]/50">thqlabel</span>. Все права защищены.
                </p>
              </div>
            </div>
          </div>

          {/* Правая колонка - Новости */}
          <div className="lg:col-span-3">
            <div className={`transition-all duration-1000 delay-400 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <h2 className="text-xs font-black text-white mb-1.5 uppercase">
                Новости
              </h2>
              <div className="space-y-2">
                {news.length > 0 ? news.map((item) => (
                  <Link
                    key={item.id}
                    href={`/news?id=${item.id}`}
                    className="group block p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-[#6050ba]/15 hover:border-[#9d8df1]/40 transition-all hover:scale-[1.02]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-[#6050ba]/50 to-[#9d8df1]/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[#9d8df1] font-bold text-[10px] mb-0.5">
                          {new Date(item.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                        </div>
                        <h3 className="text-white font-bold text-xs group-hover:text-[#c4b5fd] transition-colors line-clamp-1">
                          {item.title}
                        </h3>
                      </div>
                      <svg className="w-4 h-4 text-white/20 group-hover:text-[#9d8df1] group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                )) : (
                  <>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-[#6050ba]/50 to-[#9d8df1]/50 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="text-[#9d8df1] font-bold text-[10px] mb-0.5">28 окт</div>
                          <h3 className="text-white font-bold text-xs">Анонс нового альбома</h3>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-[#6050ba]/50 to-[#9d8df1]/50 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="text-[#9d8df1] font-bold text-[10px] mb-0.5">25 окт</div>
                          <h3 className="text-white font-bold text-xs">"Luna" на премию</h3>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-[#6050ba]/50 to-[#9d8df1]/50 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="text-[#9d8df1] font-bold text-[10px] mb-0.5">20 окт</div>
                          <h3 className="text-white font-bold text-xs">Расширение сети</h3>
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