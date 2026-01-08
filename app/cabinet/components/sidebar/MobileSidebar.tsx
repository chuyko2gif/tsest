'use client';
import React, { useEffect } from 'react';
import Link from 'next/link';
import { UserRole, ROLE_CONFIG } from '../../lib/types';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  nickname: string;
  memberId: string;
  role: UserRole;
  avatar: string;
  activeTab: 'releases' | 'finance' | 'settings';
  unreadTicketsCount: number;
  onTabChange: (tab: 'releases' | 'finance' | 'settings') => void;
  onTabHover?: (tab: string) => void; // HOVER PREFETCH
  onShowAvatarModal: () => void;
  onSupportToggle: () => void;
  showToast: () => void;
  isLight?: boolean; // deprecated
}

export default function MobileSidebar({
  isOpen,
  onClose,
  user,
  nickname,
  memberId,
  role,
  avatar,
  activeTab,
  unreadTicketsCount,
  onTabChange,
  onTabHover,
  onShowAvatarModal,
  onSupportToggle,
  showToast,
}: MobileSidebarProps) {
  const config = ROLE_CONFIG[role];

  // Блокируем скролл body при открытии и скрываем элементы хедера
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.setAttribute('data-mobile-sidebar-open', 'true');
    } else {
      document.body.style.overflow = '';
      document.body.removeAttribute('data-mobile-sidebar-open');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.removeAttribute('data-mobile-sidebar-open');
    };
  }, [isOpen]);

  const copyToClipboard = (text: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    showToast();
  };

  const handleTabChange = (tab: 'releases' | 'finance' | 'settings') => {
    onTabChange(tab);
    onClose();
  };

  const handleSupportClick = () => {
    onSupportToggle();
    onClose();
  };

  return (
    <>
      {/* Backdrop - Liquid Glass blur */}
      <div 
        className={`liquid-glass-backdrop lg:hidden fixed inset-0 z-[200] transition-all duration-500 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Slide-in Panel - Liquid Glass Style */}
      <div 
        className={`liquid-glass-modal lg:hidden fixed top-0 left-0 bottom-0 z-[201] w-[85%] max-w-[320px] !rounded-l-none transform transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
        }`}
      >
        <div className="flex flex-col h-full p-5 overflow-y-auto relative z-10">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 text-white/60 hover:text-white group"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
            }}
            aria-label="Закрыть меню"
          >
            <svg 
              className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div className="flex items-center mb-6">
            <span className="mobile-sidebar-title text-sm font-bold uppercase tracking-wider">
              Профиль
            </span>
          </div>

          {/* Профиль */}
          <div className="mb-6">
            {/* Аватар + Ник + Роль */}
            <div className="flex items-center gap-4 mb-4">
              <button 
                onClick={() => {
                  onShowAvatarModal();
                  onClose();
                }}
                className={`relative w-16 h-16 flex-shrink-0 rounded-xl ${avatar ? '' : `bg-gradient-to-br ${config.color}`} flex items-center justify-center text-2xl font-black border-2 ${config.borderColor} ${role === 'exclusive' ? 'ring-2 ring-[#fbbf24] ring-offset-2 ring-offset-[#0d0d0f]' : role === 'admin' ? 'ring-2 ring-[#ff6b81] ring-offset-2 ring-offset-[#0d0d0f]' : ''} overflow-hidden cursor-pointer hover:opacity-80 transition-opacity group`}
                style={{ 
                  boxShadow: `0 0 20px ${config.glowColor}`,
                }}
              >
                {avatar ? (
                  <img 
                    src={avatar} 
                    alt="Avatar" 
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <span className="text-white">
                    {nickname.charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-[10px] font-bold" style={{ color: '#ffffff' }}>Изменить</span>
                </div>
              </button>

              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-black mb-1.5 text-left truncate text-heading">
                  {nickname}
                </h3>
                
                <div 
                  className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${config.bgColor} ${config.textColor} border ${config.borderColor} ${role === 'exclusive' ? 'animate-pulse' : ''}`}
                  style={{ boxShadow: `0 0 12px ${config.glowColor}` }}
                >
                  <span>{config.shortLabel}</span>
                </div>
              </div>
            </div>

            {/* ID участника */}
            <div className="flex items-center gap-2">
              <span className="sidebar-member-id px-2.5 py-1 rounded-lg text-[9px] font-mono">
                {memberId || 'Загрузка...'}
              </span>
              <button 
                onClick={() => copyToClipboard(memberId)}
                className="sidebar-copy-btn px-2 py-1 rounded-lg transition"
                title="Копировать тэг"
                disabled={!memberId}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>

            <p className="text-[10px] text-zinc-400 mt-2 text-left truncate">
              {user?.email}
            </p>
          </div>

          {/* Разделитель */}
          <div className="sidebar-divider h-[1px] mb-4" />

          {/* Навигация */}
          <nav className="space-y-2 flex-1">
            {/* Релизы */}
            <button 
              onClick={() => handleTabChange('releases')}
              onTouchStart={() => onTabHover?.('releases')}
              className={`sidebar-nav-btn w-full text-left py-3 px-4 rounded-xl ${activeTab === 'releases' ? 'active' : ''}`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 sidebar-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <span className="text-sm font-bold">Релизы</span>
              </div>
            </button>
            
            {/* Финансы */}
            <button 
              onClick={() => handleTabChange('finance')}
              onTouchStart={() => onTabHover?.('finance')}
              className={`sidebar-nav-btn w-full text-left py-3 px-4 rounded-xl ${activeTab === 'finance' ? 'active' : ''}`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 sidebar-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-bold">Финансы</span>
              </div>
            </button>
            
            {/* Поддержка */}
            <button 
              onClick={handleSupportClick} 
              className="sidebar-nav-btn relative w-full text-left py-3 px-4 rounded-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 sidebar-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <span className="text-sm font-bold">Поддержка</span>
                </div>
                {unreadTicketsCount > 0 && (
                  <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                    {unreadTicketsCount}
                  </span>
                )}
              </div>
            </button>

            {/* Настройки */}
            <button 
              onClick={() => handleTabChange('settings')}
              onTouchStart={() => onTabHover?.('settings')}
              className={`sidebar-nav-btn w-full text-left py-3 px-4 rounded-xl ${activeTab === 'settings' ? 'active' : ''}`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 sidebar-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-bold">Настройки</span>
              </div>
            </button>
            
            {/* Админ ссылка */}
            {(role === 'admin' || role === 'owner') && (
              <Link 
                href="/admin"
                onClick={onClose}
                className="sidebar-admin-btn w-full block text-left py-3 px-4 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-sm font-bold">Админ панель</span>
                </div>
              </Link>
            )}
          </nav>

          {/* Footer */}
          <div className="sidebar-footer mt-4 pt-4">
            <p className="text-[9px] text-center">
              thqlabel © 2026
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
