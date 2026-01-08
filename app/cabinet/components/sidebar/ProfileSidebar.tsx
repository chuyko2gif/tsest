'use client';
import React from 'react';
import Link from 'next/link';
import { UserRole, ROLE_CONFIG } from '../../lib/types';
import { SilverStarsGroup } from '@/components/ui/SilverStars';

interface ProfileSidebarProps {
  user: any;
  nickname: string;
  memberId: string;
  role: UserRole;
  avatar: string;
  activeTab: 'releases' | 'finance' | 'settings';
  unreadTicketsCount: number;
  onTabChange: (tab: 'releases' | 'finance' | 'settings') => void;
  onTabHover?: (tab: string) => void; // HOVER PREFETCH: предзагрузка при наведении
  onShowAvatarModal: () => void;
  onSupportToggle: () => void;
  showToast: () => void;
  isLight?: boolean; // deprecated, будет удален
}

export default function ProfileSidebar({
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
}: ProfileSidebarProps) {
  const config = ROLE_CONFIG[role];

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

  return (
    <>
      {/* Декоративные серебряные звёзды */}
      <SilverStarsGroup variant="sidebar" />
      
      {/* Профиль */}
      <div className="mb-6">
        {/* Аватар + Ник + Роль в одну строку */}
        <div className="flex items-center gap-4 mb-4">
          {/* Аватар - кликабельный с эффектом медленного скролла */}
          <button 
            onClick={onShowAvatarModal}
            className={`relative w-20 h-20 flex-shrink-0 rounded-xl ${avatar ? '' : `bg-gradient-to-br ${config.color}`} flex items-center justify-center text-3xl font-black border-2 ${config.borderColor} ${role === 'exclusive' ? 'ring-2 ring-[#fbbf24] ring-offset-2 ring-offset-[#0d0d0f]' : role === 'admin' ? 'ring-2 ring-[#ff6b81] ring-offset-2 ring-offset-[#0d0d0f]' : ''} overflow-hidden cursor-pointer hover:opacity-80 transition-opacity group`}
            style={{ 
              boxShadow: `0 0 30px ${config.glowColor}`,
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
            }}
          >
            {avatar ? (
              <img 
                src={avatar} 
                alt="Avatar" 
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <span>
                {nickname.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-xs font-bold" style={{ color: '#ffffff' }}>Изменить</span>
            </div>
          </button>

          {/* Никнейм и роль */}
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-black mb-2 text-left truncate">{nickname}</h3>
            
            {/* Статус */}
            <div 
              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${config.bgColor} ${config.textColor} border ${config.borderColor} ${role === 'exclusive' ? 'animate-pulse' : ''}`}
              style={{ boxShadow: `0 0 15px ${config.glowColor}` }}
            >
              <span>{config.shortLabel}</span>
            </div>
          </div>
        </div>

        {/* ID участника с копированием */}
        <div className="mt-4 flex items-center gap-2">
          <span className="sidebar-member-id px-3 py-1.5 rounded-xl text-[10px] font-mono backdrop-blur-sm">
            {memberId || 'Загрузка...'}
          </span>
          <button 
            onClick={() => copyToClipboard(memberId)}
            className="sidebar-copy-btn px-2.5 py-1.5 rounded-xl transition group backdrop-blur-sm"
            title="Копировать тэг"
            disabled={!memberId}
          >
            <svg className="w-4 h-4 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>

        <p className="text-[10px] text-muted mt-3 text-left">{user?.email}</p>
      </div>

      {/* Разделитель */}
      <div className="sidebar-divider h-[1px] mb-4"></div>

      {/* Навигация */}
      <nav className="space-y-2">
        {/* РЕЛИЗЫ - ПЕРВЫМИ! */}
        <button 
          onClick={() => onTabChange('releases')}
          onMouseEnter={() => onTabHover?.('releases')}
          onTouchStart={() => onTabHover?.('releases')}
          className={`sidebar-nav-btn w-full text-left py-3.5 px-5 rounded-2xl ${activeTab === 'releases' ? 'active' : ''}`}
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 sidebar-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <span className="text-sm font-bold">Релизы</span>
          </div>
        </button>
        
        {/* ФИНАНСЫ */}
        <button 
          onClick={() => onTabChange('finance')}
          onMouseEnter={() => onTabHover?.('finance')}
          onTouchStart={() => onTabHover?.('finance')}
          className={`sidebar-nav-btn w-full text-left py-3.5 px-5 rounded-2xl ${activeTab === 'finance' ? 'active' : ''}`}
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 sidebar-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-bold">Финансы</span>
          </div>
        </button>
        
        {/* Кнопка поддержки */}
        <button 
          onClick={onSupportToggle} 
          className="sidebar-nav-btn relative w-full text-left py-3.5 px-5 rounded-2xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 sidebar-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="text-sm font-bold">Поддержка</span>
            </div>
            {unreadTicketsCount > 0 && (
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full transition-all duration-300 ease-in-out">
                {unreadTicketsCount}
              </span>
            )}
          </div>
        </button>

        {/* Кнопка настроек - ПОСЛЕДНЯЯ */}
        <button 
          onClick={() => onTabChange('settings')}
          onMouseEnter={() => onTabHover?.('settings')}
          onTouchStart={() => onTabHover?.('settings')}
          className={`sidebar-nav-btn w-full text-left py-3.5 px-5 rounded-2xl ${activeTab === 'settings' ? 'active' : ''}`}
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
            className="sidebar-admin-btn w-full block text-left py-3.5 px-5 rounded-2xl hover:scale-[1.02] cursor-pointer"
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

      {/* Завершающий элемент */}
      <div className="sidebar-footer mt-6 pt-4">
        <p className="text-[9px] text-center">
          thqlabel © 2026
        </p>
      </div>
    </>
  );
}
