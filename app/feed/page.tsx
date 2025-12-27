"use client";
import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Релизы thq label
const RELEASES = [
  { id: 1, title: 'не в сети', artist: 'angelgrind', cover: 'https://t2.genius.com/unsafe/430x430/https%3A%2F%2Fimages.genius.com%2Fd4892b6202a4051f807a8a847f44adc0.1000x1000x1.png' },
  { id: 2, title: 'заколки & кости', artist: 'kweetee', cover: 'https://t2.genius.com/unsafe/600x600/https%3A%2F%2Fimages.genius.com%2F9fa9951f735a169c17e47baf71ab45c7.1000x1000x1.png' },
  { id: 3, title: 'механизм', artist: 'athysue', cover: 'https://t2.genius.com/unsafe/430x430/https%3A%2F%2Fimages.genius.com%2Fa4b2333f9c0768cf4f07d1252caff125.1000x1000x1.png' },
  { id: 4, title: 'девчачий рок-альбом', artist: 'тенденция', cover: 'https://images.genius.com/2fa8d85da644fad7afc1ba3d40d0d513.1000x1000x1.png' },
  { id: 5, title: 'tired of you / what pain is', artist: 'breakfall', cover: 'https://cdn-images.dzcdn.net/images/cover/7101d738b828553e74b9f0035a6dfa1a/500x500-000000-80-0-0.jpg' },
  { id: 6, title: 'LABEL', artist: 'YUUKKII', cover: 'https://t2.genius.com/unsafe/430x430/https%3A%2F%2Fimages.genius.com%2F4dbc0ecc8a3f9924cc950ec1ae1390c4.600x600x1.webp' },
  { id: 7, title: 'кейон', artist: 'ева киллер', cover: 'https://m.media-amazon.com/images/I/51knFhnMP0L._UX716_FMwebp_QL85_.jpg' },
  { id: 8, title: 'Холодно', artist: 'qqdie', cover: 'https://images.genius.com/ece70e671b3422967c2012217763c557.807x807x1.jpg' },
];

// Оптимизированный анимированный счетчик
const AnimatedCounter = memo(({ end, duration = 2500, suffix = '' }: { end: number; duration?: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    startTimeRef.current = null;
    countRef.current = 0;
    
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Плавный easeOutQuart
      const easeOut = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(end * easeOut);
      
      if (currentValue !== countRef.current) {
        countRef.current = currentValue;
        setCount(currentValue);
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };
    
    const timer = setTimeout(() => requestAnimationFrame(animate), 200);
    return () => clearTimeout(timer);
  }, [end, duration]);

  // Форматирование числа с разделителями
  const formatNumber = useCallback((num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num.toString();
  }, []);

  return <span className="tabular-nums">{formatNumber(count)}{suffix}</span>;
});

AnimatedCounter.displayName = 'AnimatedCounter';

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

export default function FeedPage() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  const rafRef = useRef<number | null>(null);

  // Мемоизированные данные
  const capybaraMessages = useMemo(() => [
    'Ок капибара 😎',
    'Капибара одобряет! 👍',
    'А ты хорош! ✨',
    'Капи капи! 💜',
    'Музыка кайф 🎵',
    'thq топ! 🚀',
  ], []);

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
    setMounted(true);
    
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
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [checkMobile]);

  return (
    <main className="min-h-screen overflow-hidden relative">
      {/* Контейнер для релизов */}
      <div className="absolute inset-0 pointer-events-none" style={{ contain: 'layout' }}>
        {/* Летающие карточки релизов */}
        {mounted && RELEASES.map((release, i) => (
          <FloatingReleaseCard key={release.id} release={release} index={i} isMobile={isMobile} />
        ))}
      </div>

      {/* Летающие 3D фигуры и частицы */}
      <FloatingShapes />
      <FloatingParticles />
      
      {/* Оптимизированный градиентный фон - без параллакса */}
      <div className="fixed inset-0 pointer-events-none" style={{ transform: 'translateZ(0)' }}>
        <div 
          className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#6050ba]/08 rounded-full" 
          style={{ filter: 'blur(150px)', animation: 'gradient-pulse 8s ease-in-out infinite' }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#9d8df1]/08 rounded-full" 
          style={{ filter: 'blur(120px)', animation: 'gradient-pulse 8s ease-in-out infinite 2s' }}
        />
        <style jsx>{`
          @keyframes gradient-pulse {
            0%, 100% { opacity: 0.8; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>

      {/* HERO секция */}
      <section className="relative z-20 min-h-screen flex flex-col items-center justify-center px-6 pt-32">
        
        {/* Заголовок */}
        <div className={`text-center mb-8 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          
          {/* Большой логотип */}
          <div className="relative mb-12 flex justify-center">
            <img 
              src="/logo.png" 
              alt="thqlabel" 
              className="h-40 md:h-48 lg:h-56 w-auto object-contain drop-shadow-[0_0_60px_rgba(96,80,186,0.6)] relative z-10"
              style={{ transform: 'scale(2.2)', transformOrigin: 'center' }}
              loading="eager"
              decoding="async"
            />
            {/* Декоративные элементы */}
            <div className="absolute -top-8 -right-8 w-16 h-16 border-t-2 border-r-2 border-[#6050ba]/50 pointer-events-none" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
            <div className="absolute -bottom-8 -left-8 w-16 h-16 border-b-2 border-l-2 border-[#9d8df1]/50 pointer-events-none" style={{ animation: 'pulse 2s ease-in-out infinite 0.5s' }} />
          </div>
          
          {/* Лейбл ждёт тебя - компактный */}
          <div className="mb-4">
            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] text-white uppercase tracking-[0.2em] font-black px-4 py-2 border-2 border-[#9d8df1] rounded-full bg-[#6050ba]/20 shadow-lg shadow-[#6050ba]/50">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              Лейбл ждёт тебя
            </span>
          </div>
          
          <p className="text-white text-base sm:text-lg md:text-xl max-w-xl mx-auto leading-relaxed mb-6 px-4 font-medium">
            Дистрибуция музыки на <span className="text-white font-bold">все платформы</span> мира. 
            <br/>Мы помогаем артистам стать <span className="text-[#c4b5fd] font-bold">услышанными</span>.
          </p>

          {/* Статистика сразу видна */}
          <div className={`flex flex-wrap justify-center gap-8 md:gap-12 mb-10 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#9d8df1] to-[#6050ba]">
                <AnimatedCounter end={150} suffix="+" />
              </div>
              <div className="text-xs sm:text-sm text-white uppercase tracking-widest mt-2 font-bold">Релизов</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#9d8df1] to-[#6050ba]">
                <AnimatedCounter end={50} suffix="+" />
              </div>
              <div className="text-xs sm:text-sm text-white uppercase tracking-widest mt-2 font-bold">Артистов</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#9d8df1] to-[#6050ba]">
                <AnimatedCounter end={1000000} suffix="+" duration={3000} />
              </div>
              <div className="text-xs sm:text-sm text-white uppercase tracking-widest mt-2 font-bold">Прослушиваний</div>
            </div>
          </div>
        </div>

        {/* Кнопки */}
        <div className={`flex flex-col sm:flex-row gap-4 mb-16 transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <Link 
            href={user ? "/cabinet" : "/auth"}
            className="group relative px-10 py-5 rounded-2xl text-sm font-black uppercase tracking-widest transition-all duration-300 hover:scale-105 flex items-center justify-center gap-3 overflow-hidden text-white"
            style={{
              background: 'linear-gradient(135deg, #6050ba 0%, #9d8df1 100%)',
              boxShadow: '0 10px 40px -10px rgba(96, 80, 186, 0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          >
            <span className="relative z-10">{user ? 'Кабинет' : 'Войти'}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-[#9d8df1] to-[#6050ba] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Link>
          
          <Link 
            href="/news"
            className="group px-10 py-5 bg-white/5 border border-white/10 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-white/10 hover:border-[#6050ba]/50 transition-all hover:scale-105 flex items-center justify-center gap-3 backdrop-blur-sm text-white"
          >
            <span>Новости</span>
          </Link>
        </div>

        {/* Платформы */}
        <div className={`text-center transition-all duration-1000 delay-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-xs sm:text-sm text-white uppercase tracking-widest mb-6 font-bold">Дистрибуция на платформы</p>
          <div className="flex flex-wrap gap-4 md:gap-6 justify-center">
            {[
              { name: 'Spotify', color: 'hover:text-green-400 hover:border-green-400/30 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]' },
              { name: 'Apple Music', color: 'hover:text-pink-400 hover:border-pink-400/30 hover:shadow-[0_0_20px_rgba(236,72,153,0.3)]' },
              { name: 'YouTube Music', color: 'hover:text-red-400 hover:border-red-400/30 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]' },
              { name: 'Яндекс Музыка', color: 'hover:text-yellow-400 hover:border-yellow-400/30 hover:shadow-[0_0_20px_rgba(250,204,21,0.3)]' },
              { name: 'VK Music', color: 'hover:text-blue-400 hover:border-blue-400/30 hover:shadow-[0_0_20px_rgba(96,165,250,0.3)]' },
            ].map((platform) => (
              <div 
                key={platform.name}
                className={`px-4 py-2.5 rounded-full border border-white/20 bg-white/10 text-white text-sm font-semibold transition-all duration-300 cursor-pointer hover:scale-110 ${platform.color}`}
              >
                {platform.name}
              </div>
            ))}
          </div>
        </div>

        {/* Ссылки внизу */}
        <div className={`flex flex-wrap justify-center gap-6 mt-16 mb-10 transition-all duration-1000 delay-900 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          {[
            { href: '/faq', label: 'FAQ' },
            { href: '/contacts', label: 'Контакты' },
          ].map((link) => (
            <Link 
              key={link.href}
              href={link.href} 
              className="text-white hover:text-[#c4b5fd] text-sm font-bold uppercase tracking-widest transition-all hover:scale-105"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}