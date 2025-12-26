"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Популярные релизы СНГ артистов
const RELEASES = [
  { id: 1, title: 'LAMBO URUS', artist: 'MAYOT', cover: 'https://picsum.photos/seed/mayot/300/300' },
  { id: 2, title: 'CADILLAC', artist: 'MORGENSHTERN', cover: 'https://picsum.photos/seed/morgen/300/300' },
  { id: 3, title: 'JUICY', artist: 'INSTASAMKA', cover: 'https://picsum.photos/seed/insta/300/300' },
  { id: 4, title: 'BLICKY', artist: 'OG BUDA', cover: 'https://picsum.photos/seed/buda/300/300' },
  { id: 5, title: 'MONEY LONG', artist: 'KIZARU', cover: 'https://picsum.photos/seed/kizaru/300/300' },
  { id: 6, title: 'TOMMY', artist: 'BIG BABY TAPE', cover: 'https://picsum.photos/seed/bbt/300/300' },
  { id: 7, title: 'LOLLIPOP', artist: 'ПЛАТИНА', cover: 'https://picsum.photos/seed/platina/300/300' },
  { id: 8, title: 'BOUNCE', artist: 'BUSHIDO ZHO', cover: 'https://picsum.photos/seed/bushido/300/300' },
];

// Анимированный счетчик (без багов) 
const AnimatedCounter = ({ end, duration = 2500, suffix = '' }: { end: number; duration?: number; suffix?: string }) => {
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
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num.toString();
  };

  return <span className="tabular-nums">{formatNumber(count)}{suffix}</span>;
};

// Летающие 3D фигуры (квадраты и круги)
const FloatingShapes = () => {
  const [shapes, setShapes] = useState<any[]>([]);
  
  useEffect(() => {
    setShapes(Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 20 + Math.random() * 60,
      duration: 15 + Math.random() * 25,
      delay: Math.random() * -15,
      type: Math.random() > 0.5 ? 'circle' : 'square',
      rotateSpeed: 10 + Math.random() * 20,
    })));
  }, []);

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
            border: '1px solid rgba(96, 80, 186, 0.2)',
            background: 'rgba(96, 80, 186, 0.03)',
            animation: `float-shape ${shape.duration}s ease-in-out infinite, rotate-shape ${shape.rotateSpeed}s linear infinite`,
            animationDelay: `${shape.delay}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes float-shape {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(30px, -40px); }
          50% { transform: translate(-20px, 30px); }
          75% { transform: translate(40px, 20px); }
        }
        @keyframes rotate-shape {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// Летающие светящиеся частицы
const FloatingParticles = () => {
  const [particles, setParticles] = useState<any[]>([]);
  
  useEffect(() => {
    setParticles(Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      duration: 20 + Math.random() * 30,
      delay: Math.random() * -20,
      opacity: 0.3 + Math.random() * 0.5,
    })));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
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
            boxShadow: '0 0 10px #9d8df1, 0 0 20px #6050ba',
            animation: `particle-fly ${p.duration}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes particle-fly {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          25% { transform: translate(60px, -80px) scale(1.2); opacity: 0.8; }
          50% { transform: translate(-40px, 60px) scale(0.8); opacity: 0.5; }
          75% { transform: translate(80px, 40px) scale(1.1); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

// 3D летающие карточки релизов по всему экрану
const FloatingReleaseCard = ({ release, index }: { release: any; index: number }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ 
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  // Распределяем карточки по краям экрана, не мешая центру
  // index 0 = MAYOT, index 1 = CADILLAC (опущен ниже)
  const positions = [
    { x: '2%', y: '12%', rotate: -15 },
    { x: '88%', y: '35%', rotate: 20 },  // CADILLAC - опущен ниже
    { x: '3%', y: '50%', rotate: 10 },
    { x: '90%', y: '60%', rotate: -12 },
    { x: '2%', y: '75%', rotate: 8 },
    { x: '92%', y: '80%', rotate: -18 },
    { x: '5%', y: '32%', rotate: -8 },
    { x: '87%', y: '15%', rotate: 15 },
  ];
  
  const pos = positions[index % positions.length];

  return (
    <div
      className="fixed z-10 hidden lg:block pointer-events-none"
      style={{
        left: pos.x,
        top: pos.y,
        transform: `perspective(1000px) rotateY(${pos.rotate + mousePos.x * 0.5}deg) rotateX(${-mousePos.y * 0.3}deg)`,
        transition: 'transform 0.1s ease-out',
      }}
    >
      <div 
        className="relative w-28 h-28 xl:w-36 xl:h-36 rounded-xl overflow-hidden shadow-2xl border border-white/10 transition-all duration-500"
        style={{
          animation: `float-card ${6 + index}s ease-in-out infinite`,
          animationDelay: `${index * 0.3}s`,
          boxShadow: '0 20px 40px -15px rgba(96, 80, 186, 0.4)',
        }}
      >
        {/* Картинка обложки */}
        <img 
          src={release.cover} 
          alt={release.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent">
          <div className="absolute bottom-2 left-2 right-2">
            <p className="text-[10px] font-bold truncate">{release.title}</p>
            <p className="text-[8px] text-[#9d8df1]">{release.artist}</p>
          </div>
        </div>
        <div className="absolute inset-0 border border-[#6050ba]/20 rounded-xl" />
      </div>
      
      <style jsx>{`
        @keyframes float-card {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
      `}</style>
    </div>
  );
};

export default function FeedPage() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [scrollY, setScrollY] = useState(0);
  const [showCapybaraMsg, setShowCapybaraMsg] = useState(false);

  const capybaraMessages = [
    'Ок капибара 😎',
    'Капибара одобряет! 👍',
    'А ты хорош! ✨',
    'Капи капи! 💜',
    'Музыка кайф 🎵',
    'THQ топ! 🚀',
  ];
  const [capybaraMsg, setCapybaraMsg] = useState(capybaraMessages[0]);

  useEffect(() => {
    // Принудительная прокрутка в самый верх при монтировании компонента
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
    setMounted(true);
    
    // Проверяем авторизацию
    const checkAuth = async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkAuth();
    
    // Параллакс эффект
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="min-h-screen overflow-hidden relative">
      {/* Летающие 3D фигуры и частицы */}
      <FloatingShapes />
      <FloatingParticles />
      
      {/* Градиентный фон с параллаксом */}
      <div className="fixed inset-0 pointer-events-none" style={{ transform: `translateY(${scrollY * 0.3}px)` }}>
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-[#6050ba]/10 rounded-full blur-[200px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-[#9d8df1]/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-[#6050ba]/5 rounded-full blur-[250px]" />
      </div>

      {/* Летающие карточки релизов по всему экрану */}
      {mounted && RELEASES.map((release, i) => (
        <FloatingReleaseCard key={release.id} release={release} index={i} />
      ))}

      {/* HERO секция */}
      <section className="relative z-20 min-h-screen flex flex-col items-center justify-center px-6 pt-32">
        
        {/* Заголовок */}
        <div className={`text-center mb-8 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          
          {/* Большой логотип */}
          <div className="relative mb-12 flex justify-center">
            <img 
              src="/logo.png" 
              alt="thqlabel" 
              className="h-40 md:h-48 lg:h-56 w-auto object-contain drop-shadow-[0_0_80px_rgba(96,80,186,0.7)] relative z-10"
              style={{ transform: 'scale(2.2)', transformOrigin: 'center' }}
            />
            {/* Декоративные элементы - красивые большие квадраты */}
            <div className="absolute -top-8 -right-8 w-16 h-16 border-t-2 border-r-2 border-[#6050ba]/50 animate-pulse pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-16 h-16 border-b-2 border-l-2 border-[#9d8df1]/50 animate-pulse pointer-events-none" style={{ animationDelay: '0.5s' }} />
          </div>
          
          {/* Лейбл ждёт тебя - компактный */}
          <div className="mb-4">
            <span className="inline-flex items-center gap-1.5 text-[8px] text-[#9d8df1] uppercase tracking-[0.2em] font-bold px-3 py-1.5 border border-[#6050ba]/20 rounded-full bg-[#6050ba]/5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#9d8df1] animate-pulse" />
              Лейбл ждёт тебя
            </span>
          </div>
          
          <p className="text-zinc-400 text-base md:text-lg max-w-xl mx-auto leading-relaxed mb-6">
            Дистрибуция музыки на <span className="text-white font-semibold">все платформы</span> мира. 
            <br/>Мы помогаем артистам стать <span className="text-[#9d8df1] font-semibold">услышанными</span>.
          </p>

          {/* Статистика сразу видна */}
          <div className={`flex flex-wrap justify-center gap-8 md:gap-12 mb-10 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#9d8df1] to-[#6050ba]">
                <AnimatedCounter end={150} suffix="+" />
              </div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Релизов</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#9d8df1] to-[#6050ba]">
                <AnimatedCounter end={50} suffix="+" />
              </div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Артистов</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#9d8df1] to-[#6050ba]">
                <AnimatedCounter end={1000000} suffix="+" duration={3000} />
              </div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Прослушиваний</div>
            </div>
          </div>
        </div>

        {/* Кнопки */}
        <div className={`flex flex-col sm:flex-row gap-4 mb-16 transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <Link 
            href={user ? "/cabinet" : "/auth"}
            className="group relative px-10 py-5 rounded-2xl text-sm font-black uppercase tracking-widest transition-all duration-300 hover:scale-105 flex items-center justify-center gap-3 overflow-hidden"
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
            className="group px-10 py-5 bg-white/5 border border-white/10 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-white/10 hover:border-[#6050ba]/50 transition-all hover:scale-105 flex items-center justify-center gap-3 backdrop-blur-sm"
          >
            <span>Новости</span>
          </Link>
        </div>

        {/* Платформы */}
        <div className={`text-center transition-all duration-1000 delay-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-6">Дистрибуция на платформы</p>
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
                className={`px-4 py-2 rounded-full border border-white/10 bg-white/5 text-zinc-500 text-xs transition-all duration-300 cursor-pointer hover:scale-110 ${platform.color}`}
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
              className="text-zinc-500 hover:text-[#9d8df1] text-xs uppercase tracking-widest transition-all hover:scale-105"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}