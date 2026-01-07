"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Генерируем звёзды вне компонента
function generateStars() {
  return [...Array(100)].map((_, i) => ({
    id: i,
    width: Math.random() * 3 + 1,
    height: Math.random() * 3 + 1,
    left: Math.random() * 100,
    top: Math.random() * 100,
    opacity: Math.random() * 0.8 + 0.2,
    animDuration: Math.random() * 3 + 2,
    animDelay: Math.random() * 2,
  }));
}

const STARS = generateStars();

export default function HomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      router.replace('/feed');
    }, 2500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black overflow-hidden">
      {/* Звёздный фон */}
      <div className="absolute inset-0">
        {mounted && STARS.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              width: star.width + 'px',
              height: star.height + 'px',
              left: star.left + '%',
              top: star.top + '%',
              opacity: star.opacity,
              animation: `twinkle ${star.animDuration}s ease-in-out infinite`,
              animationDelay: star.animDelay + 's',
            }}
          />
        ))}
      </div>

      <div 
        className="text-center relative z-10 transition-opacity duration-500"
        style={{ opacity: mounted ? 1 : 0 }}
      >
        {/* Контейнер для Сатурна */}
        <div className="relative w-48 h-48 mx-auto mb-8 flex items-center justify-center">
          {/* Свечение планеты */}
          <div 
            className="absolute rounded-full blur-3xl opacity-30"
            style={{
              width: '100%',
              height: '100%',
              background: 'radial-gradient(circle, #6050ba 0%, transparent 70%)',
              transform: 'scale(1.5)',
            }}
          />
          
          {/* Планета Сатурн */}
          <div 
            className="absolute w-24 h-24 rounded-full overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #8b7dd8 0%, #6050ba 30%, #4a3d8f 60%, #2d2557 100%)',
              boxShadow: `
                inset -8px -8px 20px rgba(0,0,0,0.4),
                inset 8px 8px 20px rgba(255,255,255,0.1),
                0 0 40px rgba(96,80,186,0.5),
                0 0 80px rgba(96,80,186,0.3)
              `,
              animation: mounted ? 'planetPulse 4s ease-in-out infinite' : 'none',
            }}
          >
            {/* Атмосферные полосы на планете */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute w-full h-2 bg-gradient-to-r from-transparent via-white/20 to-transparent top-[20%] blur-[1px]" />
              <div className="absolute w-full h-3 bg-gradient-to-r from-transparent via-white/15 to-transparent top-[40%] blur-[2px]" />
              <div className="absolute w-full h-2 bg-gradient-to-r from-transparent via-white/10 to-transparent top-[65%] blur-[1px]" />
            </div>
            {/* Блик на планете */}
            <div 
              className="absolute w-8 h-8 rounded-full top-3 left-3"
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)',
              }}
            />
          </div>

          {/* Кольцо Сатурна - заднее */}
          {mounted && (
          <div 
            className="absolute"
            style={{
              width: '180px',
              height: '180px',
              left: '50%',
              top: '50%',
              marginLeft: '-90px',
              marginTop: '-90px',
              animation: 'ringRotate 8s linear infinite',
              transformStyle: 'preserve-3d',
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                borderRadius: '50%',
                border: '12px solid transparent',
                borderTopColor: 'rgba(139, 125, 216, 0.3)',
                borderBottomColor: 'rgba(139, 125, 216, 0.3)',
                transform: 'rotateX(75deg)',
                boxShadow: '0 0 20px rgba(96,80,186,0.3)',
              }}
            />
          </div>
          )}

          {/* Кольцо Сатурна - переднее (проходит перед планетой) */}
          {mounted && (
          <div 
            className="absolute z-20"
            style={{
              width: '180px',
              height: '180px',
              left: '50%',
              top: '50%',
              marginLeft: '-90px',
              marginTop: '-90px',
              animation: 'ringRotate 8s linear infinite',
              transformStyle: 'preserve-3d',
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                borderRadius: '50%',
                border: '4px solid transparent',
                background: `conic-gradient(from 0deg, 
                  transparent 0deg, 
                  transparent 160deg, 
                  rgba(139, 125, 216, 0.8) 180deg, 
                  transparent 200deg, 
                  transparent 360deg
                )`,
                WebkitMask: 'radial-gradient(transparent 65%, black 66%, black 75%, transparent 76%)',
                mask: 'radial-gradient(transparent 65%, black 66%, black 75%, transparent 76%)',
                transform: 'rotateX(75deg)',
                filter: 'blur(0.5px)',
              }}
            />
          </div>
          )}

          {/* Второе внешнее кольцо */}
          {mounted && (
          <div 
            className="absolute"
            style={{
              width: '200px',
              height: '200px',
              left: '50%',
              top: '50%',
              marginLeft: '-100px',
              marginTop: '-100px',
              animation: 'ringRotate 12s linear infinite reverse',
              transformStyle: 'preserve-3d',
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                borderRadius: '50%',
                border: '6px solid transparent',
                borderTopColor: 'rgba(96, 80, 186, 0.2)',
                borderBottomColor: 'rgba(96, 80, 186, 0.2)',
                transform: 'rotateX(75deg)',
              }}
            />
          </div>
          )}

          {/* Частицы вокруг кольца */}
          {mounted && [...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-purple-300"
              style={{
                left: '50%',
                top: '50%',
                marginLeft: '-2px',
                marginTop: '-2px',
                animation: `orbitParticle ${6 + i * 0.3}s linear infinite`,
                animationDelay: `${i * 0.3}s`,
                opacity: 0.6,
                transformOrigin: 'center center',
              }}
            />
          ))}
        </div>

        {/* Текст логотипа с эффектом */}
        <div 
          className="text-4xl font-black italic relative"
          style={{
            animation: 'textGlow 3s ease-in-out infinite',
          }}
        >
          <span className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">thq</span>
          <span className="text-[#6050ba] drop-shadow-[0_0_15px_rgba(96,80,186,0.8)]"> label</span>
        </div>
        
        {/* Анимированный текст загрузки */}
        <div className="flex items-center justify-center gap-1 mt-6">
          <p className="text-sm uppercase tracking-widest text-zinc-500">Загрузка</p>
          <span className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span 
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[#6050ba]"
                style={{
                  animation: 'loadingDot 1.4s ease-in-out infinite',
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </span>
        </div>
      </div>

      {/* CSS анимации */}
      <style jsx>{`
        @keyframes ringRotate {
          from {
            transform: rotateZ(0deg);
          }
          to {
            transform: rotateZ(360deg);
          }
        }

        @keyframes planetPulse {
          0%, 100% {
            transform: scale(1);
            filter: brightness(1);
          }
          50% {
            transform: scale(1.02);
            filter: brightness(1.1);
          }
        }

        @keyframes orbitParticle {
          0% {
            transform: rotateX(75deg) rotateZ(0deg) translateX(95px);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          90% {
            opacity: 0.8;
          }
          100% {
            transform: rotateX(75deg) rotateZ(360deg) translateX(95px);
            opacity: 0;
          }
        }

        @keyframes twinkle {
          0%, 100% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        @keyframes textGlow {
          0%, 100% {
            filter: drop-shadow(0 0 5px rgba(96,80,186,0.5));
          }
          50% {
            filter: drop-shadow(0 0 20px rgba(96,80,186,0.8));
          }
        }

        @keyframes loadingDot {
          0%, 80%, 100% {
            transform: scale(0.6);
            opacity: 0.4;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
