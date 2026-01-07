"use client";

import React, { useState, useEffect, useMemo, memo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

// ========================================
// HELPER FUNCTIONS
// ========================================

// Seeded random for consistent SSR/client rendering
const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

// Hook to detect mobile devices
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

// ========================================
// FLOATING SHAPES COMPONENT
// Geometric shapes floating in the background
// ========================================
const FloatingShapes = memo(({ isLight, count = 10 }: { isLight: boolean; count?: number }) => {
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const shapeCount = isMobile ? Math.min(count, 6) : count;
  
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
              ? '1px solid rgba(139, 92, 246, 0.15)'
              : '1px solid rgba(96, 80, 186, 0.15)',
            background: isLight 
              ? 'rgba(255, 255, 255, 0.3)'
              : 'rgba(96, 80, 186, 0.02)',
            backdropFilter: isLight ? 'blur(8px)' : 'none',
            animation: `float-shape ${shape.duration}s ease-in-out infinite`,
            animationDelay: `${shape.delay}s`,
            willChange: 'transform',
            transform: 'translateZ(0)',
          }}
        />
      ))}
    </div>
  );
});

FloatingShapes.displayName = 'FloatingShapes';

// ========================================
// FLOATING PARTICLES COMPONENT
// Small glowing particles
// ========================================
const FloatingParticles = memo(({ isLight, count = 30 }: { isLight: boolean; count?: number }) => {
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const particleCount = isMobile ? Math.min(count, 12) : count;
  
  const particles = useMemo(() => 
    Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: seededRandom(i + 600) * 100,
      y: seededRandom(i + 700) * 100,
      size: isMobile ? 2 + seededRandom(i + 800) * 2 : 2 + seededRandom(i + 800) * 4,
      duration: isMobile ? 40 + seededRandom(i + 900) * 20 : 25 + seededRandom(i + 900) * 25,
      delay: seededRandom(i + 1000) * -20,
      opacity: 0.3 + seededRandom(i + 1100) * 0.4,
    })),
  [particleCount, isMobile]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" style={{ contain: 'strict' }}>
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: isLight ? p.size * 1.5 : p.size,
            height: isLight ? p.size * 1.5 : p.size,
            opacity: 1,
            border: isLight ? '1px solid rgba(0, 0, 0, 0.2)' : undefined,
            boxShadow: isLight 
              ? '0 0 2px rgba(0, 0, 0, 0.2), 0 0 6px rgba(0, 0, 0, 0.15)'
              : '0 0 8px rgba(157, 141, 241, 0.5)',
            background: isLight 
              ? 'rgba(0, 0, 0, 0.6)'
              : '#9d8df1',
            animation: isLight ? `sparkle-float ${p.duration}s ease-in-out infinite` : `particle-fly ${p.duration}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
            willChange: 'transform, opacity',
            transform: 'translateZ(0)',
          }}
        />
      ))}
    </div>
  );
});

FloatingParticles.displayName = 'FloatingParticles';

// ========================================
// HOLOGRAPHIC BACKGROUND (Light Theme)
// Pastel rainbow gradients with shimmer
// ========================================
const HolographicBackground = memo(() => {
  const isMobile = useIsMobile();
  
  return (
    <div className="fixed inset-0 pointer-events-none z-0" style={{ transform: 'translateZ(0)' }}>
      {/* Main soft gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(135deg, 
              rgba(255,200,210,0.3) 0%, 
              rgba(255,230,200,0.25) 20%, 
              rgba(230,255,230,0.25) 40%, 
              rgba(200,230,255,0.3) 60%, 
              rgba(230,200,240,0.3) 80%, 
              rgba(255,200,210,0.3) 100%
            )
          `,
          animation: 'holographic-shift 20s ease-in-out infinite',
        }}
      />
      
      {/* Soft rainbow radials */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 15% 25%, rgba(255,180,210,0.35) 0%, transparent 50%),
            radial-gradient(ellipse at 85% 75%, rgba(180,210,255,0.35) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(210,180,240,0.3) 0%, transparent 60%)
          `,
          animation: 'holographic-glow 15s ease-in-out infinite',
        }}
      />
      
      {/* Shimmer overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(45deg, 
              transparent 0%, 
              rgba(255,255,255,0.2) 30%, 
              transparent 50%, 
              rgba(255,255,255,0.15) 70%, 
              transparent 100%
            )
          `,
          backgroundSize: '300% 300%',
          animation: 'shimmer-bg 12s linear infinite',
        }}
      />
      
      {/* Floating blobs */}
      {!isMobile && (
        <>
          <div 
            className="absolute w-[500px] h-[500px] rounded-full"
            style={{
              top: '-10%',
              left: '-10%',
              background: 'radial-gradient(circle, rgba(255,150,180,0.3) 0%, rgba(255,200,150,0.15) 50%, transparent 70%)',
              filter: 'blur(80px)',
              animation: 'float-blob 25s ease-in-out infinite',
            }}
          />
          <div 
            className="absolute w-[450px] h-[450px] rounded-full"
            style={{
              bottom: '-5%',
              right: '-10%',
              background: 'radial-gradient(circle, rgba(150,200,255,0.3) 0%, rgba(200,150,240,0.15) 50%, transparent 70%)',
              filter: 'blur(70px)',
              animation: 'float-blob 30s ease-in-out infinite reverse',
            }}
          />
          <div 
            className="absolute w-[350px] h-[350px] rounded-full"
            style={{
              top: '40%',
              right: '20%',
              background: 'radial-gradient(circle, rgba(150,240,200,0.2) 0%, rgba(240,240,150,0.1) 50%, transparent 70%)',
              filter: 'blur(60px)',
              animation: 'float-blob 22s ease-in-out infinite 3s',
            }}
          />
        </>
      )}
      
      {/* Sparkles/Stars */}
      {Array.from({ length: isMobile ? 20 : 40 }, (_, i) => (
        <div
          key={i}
          className="absolute rounded-full intro-star"
          style={{
            width: `${(i % 3) + 2}px`,
            height: `${(i % 3) + 2}px`,
            left: `${(i * 37) % 100}%`,
            top: `${(i * 23) % 100}%`,
            animationDelay: `${(i % 10) * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
});

HolographicBackground.displayName = 'HolographicBackground';

// ========================================
// DEEP SPACE BACKGROUND (Dark Theme)
// Animated nebula with metallic waves
// ========================================
const DeepSpaceBackground = memo(() => {
  const isMobile = useIsMobile();
  
  return (
    <div className="fixed inset-0 pointer-events-none z-0" style={{ transform: 'translateZ(0)' }}>
      {/* Nebula gradients */}
      {!isMobile && (
        <>
          <div 
            className="absolute w-[600px] h-[600px] rounded-full"
            style={{
              top: '-15%',
              left: '-10%',
              background: 'radial-gradient(circle, rgba(96, 80, 186, 0.15) 0%, rgba(96, 80, 186, 0.05) 50%, transparent 70%)',
              filter: 'blur(100px)',
              animation: 'float-blob 30s ease-in-out infinite',
            }}
          />
          <div 
            className="absolute w-[500px] h-[500px] rounded-full"
            style={{
              bottom: '-10%',
              right: '-10%',
              background: 'radial-gradient(circle, rgba(157, 141, 241, 0.12) 0%, rgba(157, 141, 241, 0.04) 50%, transparent 70%)',
              filter: 'blur(80px)',
              animation: 'float-blob 35s ease-in-out infinite reverse',
            }}
          />
          <div 
            className="absolute w-[400px] h-[400px] rounded-full"
            style={{
              top: '30%',
              right: '15%',
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 60%)',
              filter: 'blur(70px)',
              animation: 'float-blob 28s ease-in-out infinite 5s',
            }}
          />
        </>
      )}
      
      {/* Stars */}
      {Array.from({ length: isMobile ? 30 : 60 }, (_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: `${1 + seededRandom(i) * 2}px`,
            height: `${1 + seededRandom(i) * 2}px`,
            left: `${seededRandom(i + 100) * 100}%`,
            top: `${seededRandom(i + 200) * 100}%`,
            opacity: 0.3 + seededRandom(i + 300) * 0.5,
            boxShadow: '0 0 4px rgba(255, 255, 255, 0.5)',
            animation: `twinkle ${2 + seededRandom(i + 400) * 3}s ease-in-out infinite`,
            animationDelay: `${seededRandom(i + 500) * 5}s`,
          }}
        />
      ))}
    </div>
  );
});

DeepSpaceBackground.displayName = 'DeepSpaceBackground';

// ========================================
// PARALLAX GRADIENT COMPONENT
// Large soft gradient orbs
// ========================================
const ParallaxGradient = memo(({ isLight }: { isLight: boolean }) => {
  const isMobile = useIsMobile();
  const blurAmount = isMobile ? 80 : 150;
  
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ transform: 'translate3d(0,0,0)' }}>
      <div 
        className={`absolute top-0 left-1/4 ${isMobile ? 'w-[300px] h-[300px]' : 'w-[600px] h-[600px]'} rounded-full`}
        style={{ 
          background: isLight 
            ? 'rgba(139, 92, 246, 0.08)'
            : 'rgba(96, 80, 186, 0.08)',
          filter: `blur(${blurAmount}px)`,
          willChange: 'auto',
        }}
      />
      {!isMobile && (
        <div 
          className={`absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full`}
          style={{ 
            background: isLight
              ? 'rgba(167, 139, 250, 0.06)'
              : 'rgba(157, 141, 241, 0.06)',
            filter: 'blur(120px)',
            willChange: 'auto',
          }}
        />
      )}
    </div>
  );
});

ParallaxGradient.displayName = 'ParallaxGradient';

// ========================================
// GLASS OVERLAY COMPONENT
// Subtle blur overlay
// ========================================
const GlassOverlay = memo(({ isLight }: { isLight: boolean }) => {
  const isMobile = useIsMobile();
  
  // Simplified for mobile (no backdrop-filter - too heavy for GPU)
  if (isMobile) {
    return (
      <div className="fixed inset-0 pointer-events-none z-[1]" style={{ transform: 'translate3d(0,0,0)' }}>
        <div className={`absolute inset-0 ${isLight ? 'bg-white/30' : 'bg-black/40'}`} />
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 pointer-events-none z-[1]" style={{ transform: 'translate3d(0,0,0)' }}>
      <div 
        className={`absolute inset-0 ${isLight ? 'bg-white/20' : 'bg-black/30'}`}
        style={{ backdropFilter: 'blur(1px)', WebkitBackdropFilter: 'blur(1px)' }} 
      />
    </div>
  );
});

GlassOverlay.displayName = 'GlassOverlay';

// ========================================
// MAIN PAGE BACKGROUND COMPONENT
// ========================================
export interface PageBackgroundProps {
  /** Override theme detection */
  forceTheme?: 'light' | 'dark';
  /** Which effects to include */
  variant?: 'full' | 'minimal' | 'shapes-only' | 'particles-only';
  /** Number of floating shapes */
  shapeCount?: number;
  /** Number of particles */
  particleCount?: number;
  /** Show glass overlay */
  showOverlay?: boolean;
  /** Custom className */
  className?: string;
}

const PageBackground = memo(({
  forceTheme,
  variant = 'full',
  shapeCount = 10,
  particleCount = 30,
  showOverlay = true,
  className = '',
}: PageBackgroundProps) => {
  const { themeName } = useTheme();
  const isLight = forceTheme ? forceTheme === 'light' : themeName === 'light';
  
  // Minimal variant - just gradient
  if (variant === 'minimal') {
    return (
      <div className={`fixed inset-0 pointer-events-none z-0 ${className}`}>
        <ParallaxGradient isLight={isLight} />
      </div>
    );
  }
  
  // Shapes only
  if (variant === 'shapes-only') {
    return (
      <div className={`fixed inset-0 pointer-events-none z-0 ${className}`}>
        <FloatingShapes isLight={isLight} count={shapeCount} />
      </div>
    );
  }
  
  // Particles only
  if (variant === 'particles-only') {
    return (
      <div className={`fixed inset-0 pointer-events-none z-0 ${className}`}>
        <FloatingParticles isLight={isLight} count={particleCount} />
      </div>
    );
  }
  
  // Full variant - all effects
  return (
    <div className={`fixed inset-0 pointer-events-none z-0 ${className}`}>
      {/* Theme-specific main background */}
      {isLight ? (
        <HolographicBackground />
      ) : (
        <DeepSpaceBackground />
      )}
      
      {/* Floating geometric shapes */}
      <FloatingShapes isLight={isLight} count={shapeCount} />
      
      {/* Floating particles */}
      <FloatingParticles isLight={isLight} count={particleCount} />
      
      {/* Parallax gradient orbs */}
      <ParallaxGradient isLight={isLight} />
      
      {/* Glass overlay */}
      {showOverlay && <GlassOverlay isLight={isLight} />}
    </div>
  );
});

PageBackground.displayName = 'PageBackground';

export default PageBackground;

// Named exports for individual components
export {
  FloatingShapes,
  FloatingParticles,
  HolographicBackground,
  DeepSpaceBackground,
  ParallaxGradient,
  GlassOverlay,
};
