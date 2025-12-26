'use client';
import React, { useEffect, useState } from 'react';

interface NotificationModalProps {
  show: boolean;
  message: string;
  type: 'success' | 'error';
  onClose?: () => void;
  duration?: number;
}

export default function NotificationModal({ show, message, type, onClose, duration = 3000 }: NotificationModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          if (onClose) onClose();
        }, 400);
      }, duration);
      
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [show, onClose, duration]);
  
  if (!show) return null;
  
  const isSuccess = type === 'success';
  
  return (
    <div className={`
      fixed top-8 left-1/2 -translate-x-1/2 z-[9999]
      transition-all duration-400 ease-out
      ${isVisible 
        ? 'opacity-100 translate-y-0 scale-100' 
        : 'opacity-0 -translate-y-8 scale-95'
      }
    `}>
      <div className={`
        relative
        px-6 py-4 rounded-2xl
        backdrop-blur-2xl backdrop-saturate-150
        shadow-[0_8px_32px_0_rgba(0,0,0,0.12),0_2px_8px_0_rgba(0,0,0,0.08)]
        border border-white/10
        min-w-[380px] max-w-[90vw]
        ${isSuccess 
          ? 'bg-gradient-to-br from-emerald-500/15 via-emerald-400/10 to-emerald-500/5' 
          : 'bg-gradient-to-br from-red-500/15 via-red-400/10 to-red-500/5'
        }
        before:absolute before:inset-0 before:rounded-2xl before:p-[1px]
        ${isSuccess
          ? 'before:bg-gradient-to-br before:from-emerald-400/30 before:to-transparent'
          : 'before:bg-gradient-to-br before:from-red-400/30 before:to-transparent'
        }
        before:-z-10
      `}>
        {/* Glow effect */}
        <div className={`
          absolute inset-0 rounded-2xl blur-xl -z-20
          ${isSuccess ? 'bg-emerald-500/20' : 'bg-red-500/20'}
        `} />
        
        <div className="flex items-center gap-4">
          {/* Icon with animated ring */}
          <div className="relative">
            <div className={`
              w-11 h-11 rounded-full 
              flex items-center justify-center flex-shrink-0
              ${isSuccess 
                ? 'bg-gradient-to-br from-emerald-400/40 to-emerald-500/20' 
                : 'bg-gradient-to-br from-red-400/40 to-red-500/20'
              }
              shadow-lg
            `}>
              {/* Animated ring */}
              <div className={`
                absolute inset-0 rounded-full
                ${isSuccess ? 'bg-emerald-400/20' : 'bg-red-400/20'}
                animate-ping
              `} style={{ animationDuration: '2s' }} />
              
              {isSuccess ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="relative z-10 text-emerald-200">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="relative z-10 text-red-200">
                  <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className={`
              text-sm font-bold tracking-tight mb-0.5
              ${isSuccess ? 'text-emerald-100' : 'text-red-100'}
            `}>
              {isSuccess ? 'Успешно' : 'Ошибка'}
            </div>
            <div className={`
              text-sm leading-snug
              ${isSuccess ? 'text-emerald-200/90' : 'text-red-200/90'}
            `}>
              {message}
            </div>
          </div>
          
          {/* Close button */}
          {onClose && (
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => onClose(), 400);
              }}
              className={`
                w-8 h-8 rounded-lg flex items-center justify-center
                transition-all duration-200
                ${isSuccess
                  ? 'hover:bg-emerald-500/20 text-emerald-300/70 hover:text-emerald-200'
                  : 'hover:bg-red-500/20 text-red-300/70 hover:text-red-200'
                }
              `}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
