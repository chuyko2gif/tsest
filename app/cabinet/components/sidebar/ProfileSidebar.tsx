'use client';
import React from 'react';
import Link from 'next/link';
import { UserRole, ROLE_CONFIG } from '../../lib/types';

interface ProfileSidebarProps {
  user: any;
  nickname: string;
  memberId: string;
  role: UserRole;
  avatar: string;
  activeTab: 'releases' | 'finance' | 'settings';
  unreadTicketsCount: number;
  onTabChange: (tab: 'releases' | 'finance' | 'settings') => void;
  onShowAvatarModal: () => void;
  onSupportToggle: () => void;
  showToast: () => void;
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
  onShowAvatarModal,
  onSupportToggle,
  showToast,
}: ProfileSidebarProps) {
  const config = ROLE_CONFIG[role];

  // DEBUG: Логируем memberId
  React.useEffect(() => {
    console.log('📊 ProfileSidebar получил memberId:', memberId);
  }, [memberId]);

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
      {/* Профиль */}
      <div className="mb-6">
        {/* Аватар - кликабельный */}
        <div className="relative mb-5 flex justify-start">
          <button 
            onClick={onShowAvatarModal}
            className={`relative w-20 h-20 rounded-xl ${avatar ? 'bg-cover bg-center' : `bg-gradient-to-br ${config.color}`} flex items-center justify-center text-3xl font-black border-2 ${config.borderColor} ${role === 'exclusive' ? 'ring-2 ring-[#fbbf24] ring-offset-2 ring-offset-[#0d0d0f]' : role === 'admin' ? 'ring-2 ring-[#ff6b81] ring-offset-2 ring-offset-[#0d0d0f]' : ''} overflow-hidden cursor-pointer hover:opacity-80 transition-opacity group`}
            style={{ 
              boxShadow: `0 0 30px ${config.glowColor}`,
              backgroundImage: avatar ? `url(${avatar})` : 'none'
            }}
          >
            {!avatar && nickname.charAt(0).toUpperCase()}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-bold">Изменить</span>
            </div>
          </button>
        </div>

        {/* Никнейм */}
        <h3 className="text-xl font-black mb-3 text-left">{nickname}</h3>

        {/* Статус */}
        <div 
          className={`inline-flex items-center px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider ${config.bgColor} ${config.textColor} border ${config.borderColor} ${role === 'exclusive' ? 'animate-pulse' : ''}`}
          style={{ boxShadow: `0 0 15px ${config.glowColor}` }}
        >
          <span>{config.shortLabel}</span>
        </div>

        {/* ID участника с копированием */}
        <div className="mt-4 flex items-center gap-2">
          <span className="px-3 py-1.5 bg-black/40 rounded-lg text-[10px] font-mono text-zinc-400 border border-white/5">
            {memberId || 'Загрузка...'}
          </span>
          <button 
            onClick={() => copyToClipboard(memberId)}
            className="px-2.5 py-1.5 bg-white/5 hover:bg-[#6050ba]/30 rounded-lg transition group"
            title="Копировать тэг"
            disabled={!memberId}
          >
            <svg className="w-4 h-4 text-zinc-400 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>

        <p className="text-[10px] text-zinc-600 mt-3 text-left">{user?.email}</p>
      </div>

      {/* Разделитель */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4"></div>

      {/* Навигация */}
      <nav className="space-y-2">
        {[
          { id: 'releases', label: 'Релизы' },
          { id: 'finance', label: 'Финансы' },
          { id: 'settings', label: 'Настройки' },
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => onTabChange(item.id as any)} 
            className={`w-full text-left py-3.5 px-5 rounded-xl transition-all duration-200 border ${
              activeTab === item.id 
                ? 'bg-[#6050ba] text-white shadow-lg shadow-[#6050ba]/30 border-[#6050ba] scale-[1.02]' 
                : 'text-zinc-300 bg-white/[0.02] hover:bg-white/[0.08] hover:text-white hover:border-white/10 border-white/5 hover:scale-[1.01] cursor-pointer'
            }`}
          >
            <span className="text-sm font-bold">{item.label}</span>
          </button>
        ))}
        
        {/* Кнопка поддержки */}
        <button 
          onClick={onSupportToggle} 
          className="relative w-full text-left py-3.5 px-5 rounded-xl transition-all duration-200 border text-zinc-300 bg-white/[0.02] hover:bg-white/[0.08] hover:text-white hover:border-white/10 border-white/5 hover:scale-[1.01] cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">Поддержка</span>
            {unreadTicketsCount > 0 && (
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full transition-all duration-300 ease-in-out">
                {unreadTicketsCount}
              </span>
            )}
          </div>
        </button>
        
        {/* Админ ссылка */}
        {(role === 'admin' || role === 'owner') && (
          <Link 
            href="/admin"
            className={`w-full block text-left py-3.5 px-5 rounded-xl transition-all duration-200 border ${role === 'owner' ? 'text-purple-300 bg-purple-500/5 hover:bg-purple-500/10 hover:text-purple-200 border-purple-500/20 hover:border-purple-500/30' : 'text-[#ff6b81] bg-red-500/5 hover:bg-[#ff4757]/10 hover:text-red-400 border-red-500/20 hover:border-red-500/30'} hover:scale-[1.01] cursor-pointer`}
          >
            <span className="text-sm font-bold">Админ панель</span>
          </Link>
        )}
      </nav>

      {/* Завершающий элемент */}
      <div className="mt-6 pt-4 border-t border-white/5">
        <p className="text-[9px] text-zinc-700 text-center">
          thqlabel © 2025
        </p>
      </div>
    </>
  );
}
