"use client";
import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

// Летающие 3D фигуры (квадраты и круги)
export const FloatingShapes = () => {
  const { themeName } = useTheme();
  const [shapes, setShapes] = useState<any[]>([]);
  
  useEffect(() => {
    setShapes(Array.from({ length: 30 }, (_, i) => ({
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
            border: themeName === 'light' ? '1px solid rgba(0, 0, 0, 0.1)' : '1px solid rgba(96, 80, 186, 0.2)',
            background: themeName === 'light' ? 'rgba(0, 0, 0, 0.02)' : 'rgba(96, 80, 186, 0.03)',
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
export const FloatingParticles = () => {
  const { themeName } = useTheme();
  const [particles, setParticles] = useState<any[]>([]);
  
  useEffect(() => {
    setParticles(Array.from({ length: 80 }, (_, i) => ({
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
          className={`absolute rounded-full ${themeName === 'light' ? 'bg-gray-800' : 'bg-[#9d8df1]'}`}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            boxShadow: themeName === 'light' ? '0 0 10px rgba(0,0,0,0.2), 0 0 20px rgba(0,0,0,0.1)' : '0 0 10px #9d8df1, 0 0 20px #6050ba',
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

// Градиентный фон с параллаксом
export const ParallaxGradient = ({ scrollY }: { scrollY: number }) => {
  const { themeName } = useTheme();
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ transform: `translateY(${scrollY * 0.3}px)` }}>
      <div className={`absolute top-0 left-1/4 w-[800px] h-[800px] ${themeName === 'light' ? 'bg-gray-300/20' : 'bg-[#6050ba]/10'} rounded-full blur-[200px] animate-pulse`} />
      <div className={`absolute bottom-1/4 right-1/4 w-[600px] h-[600px] ${themeName === 'light' ? 'bg-gray-400/15' : 'bg-[#9d8df1]/10'} rounded-full blur-[150px] animate-pulse`} style={{ animationDelay: '2s' }} />
      <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] ${themeName === 'light' ? 'bg-gray-200/10' : 'bg-[#6050ba]/5'} rounded-full blur-[250px]`} />
    </div>
  );
};

// Эффект затемнения "через стекло"
export const GlassOverlay = () => {
  const { themeName } = useTheme();
  return (
    <div className="fixed inset-0 pointer-events-none z-[1]">
      {themeName === 'dark' ? (
        <>
          {/* Основное затемнение с эффектом стекла */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[3px]" />
          {/* Дополнительное радиальное затемнение для глубины */}
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(0,0,0,0.4) 100%)',
          }} />
          {/* Эффект матового стекла */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%)',
          }} />
        </>
      ) : (
        <>
          {/* Основное осветление с эффектом стекла */}
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[3px]" />
          {/* Дополнительное радиальное осветление для глубины */}
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(255,255,255,0.3) 100%)',
          }} />
          {/* Эффект матового стекла */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.2) 100%)',
          }} />
        </>
      )}
    </div>
  );
};

// Комплексный анимированный фон
export default function AnimatedBackground() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Летающие 3D фигуры и частицы */}
      <FloatingShapes />
      <FloatingParticles />
      
      {/* Градиентный фон с параллаксом */}
      <ParallaxGradient scrollY={scrollY} />
      
      {/* Эффект затемнения через стекло */}
      <GlassOverlay />
    </>
  );
}
