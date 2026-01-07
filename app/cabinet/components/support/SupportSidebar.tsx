'use client';

import React, { useState, useEffect } from 'react';
import SupportContent from './SupportContent';
import { useTheme } from '@/contexts/ThemeContext';

interface SupportSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  unreadCount: number;
  onUpdateUnreadCount?: () => void;
  isMobile?: boolean;
}

export default function SupportSidebar({ isOpen, onClose, onOpen, unreadCount, onUpdateUnreadCount, isMobile = false }: SupportSidebarProps) {
  const [isWidgetHidden, setIsWidgetHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { themeName } = useTheme();
  const isLight = themeName === 'light';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Блокировка скролла body когда виджет открыт
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Виджет поддержки - скрыт на мобилке */}
      {!isOpen && !isWidgetHidden && !isMobile && (
        <div className="fixed bottom-6 right-6 z-[9999]">
          <div 
            onClick={onOpen}
            className={`relative backdrop-blur-md rounded-full shadow-2xl p-3 cursor-pointer transition-all hover:scale-110 group ${
              isLight 
                ? 'bg-gradient-to-br from-[#6050ba] to-[#8b7dd8] hover:from-[#7060ca] hover:to-[#9b8de8] border border-[#6050ba]/30' 
                : 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-white/20'
            }`}
            style={{ boxShadow: isLight ? '0 8px 32px 0 rgba(96, 80, 186, 0.4)' : '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}
            title="Открыть поддержку"
          >
            <svg className="w-6 h-6" style={{ color: '#ffffff' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-[20px] px-1 text-[10px] font-bold bg-red-500 rounded-full border-2 border-zinc-900 transition-all duration-300 ease-in-out" style={{ color: '#ffffff' }}>
                {unreadCount}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998]"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className="fixed top-0 right-0 h-full w-[380px] z-[9999] transform transition-all duration-500 ease-in-out"
        style={{
          background: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(24, 24, 27, 0.7)',
          borderLeft: isLight ? '1px solid rgba(96, 80, 186, 0.2)' : '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: isLight ? '0 8px 32px 0 rgba(96, 80, 186, 0.2)' : '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b backdrop-blur-md ${isLight ? 'border-gray-200 bg-white/60' : 'border-white/10 bg-zinc-900/40'}`}>
          <h2 className={`text-base font-bold flex items-center gap-2 ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Поддержка
            {unreadCount > 0 && (
              <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-red-500 rounded-full transition-all duration-300 ease-in-out" style={{ color: '#ffffff' }}>
                {unreadCount}
              </span>
            )}
          </h2>
          
          <button
            onClick={onClose}
            className="p-2.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-all duration-200 border border-red-500/20 hover:border-red-500/40"
            title="Закрыть"
          >
            <svg className="w-5 h-5 text-red-400 hover:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-65px)] overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <SupportContent onClose={onClose} onUpdateUnreadCount={onUpdateUnreadCount} isLight={isLight} />
        </div>
      </div>
    </>
  );
}
