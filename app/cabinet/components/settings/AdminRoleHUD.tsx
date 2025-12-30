'use client';
import React, { useState, useEffect } from 'react';
import { UserRole, ROLE_CONFIG } from '../../lib/types';
import { supabase } from '../../lib/supabase';

// Добавляем стили для плавных анимаций
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes popIn {
      0% {
        opacity: 0;
        transform: scale(0.7) translateY(15px);
      }
      60% {
        transform: scale(1.03) translateY(-2px);
      }
      100% {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }
    
    @keyframes slideOutBounce {
      0% {
        opacity: 1;
        transform: translateX(0) rotate(0) scale(1);
      }
      100% {
        opacity: 0;
        transform: translateX(100px) rotate(5deg) scale(0.5);
      }
    }

    @keyframes expandPanel {
      0% {
        opacity: 0;
        transform: translateY(20px) scale(0.9);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    
    .admin-hud-panel {
      will-change: transform, opacity;
    }
    
    .admin-hud-button {
      will-change: transform, opacity;
    }
  `;
  if (!document.head.querySelector('style[data-admin-hud-animations]')) {
    style.setAttribute('data-admin-hud-animations', 'true');
    document.head.appendChild(style);
  }
}


interface AdminRoleHUDProps {
  currentRole: UserRole;
  originalRole: string | null;
  userId: string;
  onRoleChange?: () => void;
}

export default function AdminRoleHUD({ currentRole, originalRole, userId, onRoleChange }: AdminRoleHUDProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isChangingRole, setIsChangingRole] = useState(false);

  if (!originalRole || (originalRole !== 'admin' && originalRole !== 'owner')) {
    return null;
  }

  const availableRoles: UserRole[] = originalRole === 'owner' 
    ? ['owner', 'admin', 'exclusive', 'basic']
    : ['admin', 'exclusive', 'basic'];

  const handleRoleSwitch = async (newRole: UserRole) => {
    if (!supabase || !userId || isChangingRole) return;
    
    setIsChangingRole(true);
    try {
      const updates: any = { role: newRole };
      
      if (!originalRole) {
        updates.original_role = currentRole;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;

      if (onRoleChange) {
        onRoleChange();
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error('Ошибка смены роли:', err);
    } finally {
      setIsChangingRole(false);
    }
  };

  const currentConfig = ROLE_CONFIG[currentRole];

  return (
    <div className="fixed bottom-6 right-[88px] z-[9998]">
      {/* Плавающая панель - прикреплена рядом с виджетом поддержки */}
      <div 
        className={`transition-all duration-500 ease-out ${
          isExpanded ? 'w-80' : 'w-auto'
        }`}
      >
        {/* Свернутое состояние - кнопка */}
        {!isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className={`admin-hud-button group relative px-5 py-3 bg-gradient-to-br ${currentConfig.color} border-2 ${currentConfig.borderColor} rounded-2xl shadow-2xl hover:scale-105 transition-all duration-300 backdrop-blur-xl`}
            style={{ 
              boxShadow: `0 0 30px ${currentConfig.glowColor}, 0 10px 40px rgba(0,0,0,0.5)`,
              animation: 'popIn 0.5s ease-out forwards'
            }}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{currentConfig.icon}</span>
                <div className="text-left">
                  <div className="text-xs font-bold text-white uppercase tracking-wider">
                    Режим тестирования
                  </div>
                  <div className={`text-[10px] ${currentConfig.textColor} font-medium`}>
                    {currentConfig.shortLabel}
                  </div>
                </div>
              </div>
              
              {/* Индикатор что это тестовая роль */}
              {currentRole !== originalRole && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse border-2 border-[#0d0d0f]"></div>
              )}
            </div>
          </button>
        )}

        {/* Развернутое состояние - панель управления */}
        {isExpanded && (
          <div 
            className="admin-hud-panel bg-[#0d0d0f]/95 backdrop-blur-2xl border-2 border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            style={{ 
              boxShadow: '0 0 40px rgba(0,0,0,0.8), 0 20px 60px rgba(0,0,0,0.6)',
              animation: 'expandPanel 0.3s ease-out forwards'
            }}
          >
            {/* Заголовок */}
            <div className={`px-4 py-3 bg-gradient-to-r ${currentConfig.color} border-b border-white/10 flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{currentConfig.icon}</span>
                <div>
                  <h3 className="text-sm font-bold text-white">Режим тестирования</h3>
                  <p className="text-[9px] text-white/70">
                    Истинная роль: {originalRole === 'owner' ? '♛ Owner' : '★ Admin'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Список ролей */}
            <div className="p-4 space-y-2">
              <p className="text-[10px] text-zinc-400 mb-3 uppercase tracking-wider font-medium">
                Переключиться на роль:
              </p>
              
              {availableRoles.map((role) => {
                const roleConfig = ROLE_CONFIG[role];
                const isActive = role === currentRole;
                
                return (
                  <button
                    key={role}
                    onClick={() => !isActive && handleRoleSwitch(role)}
                    disabled={isActive || isChangingRole}
                    className={`w-full px-4 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-300 ${
                      isActive
                        ? `bg-gradient-to-r ${roleConfig.color} ${roleConfig.textColor} border-2 ${roleConfig.borderColor} cursor-default`
                        : 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                    style={isActive ? { boxShadow: `0 0 20px ${roleConfig.glowColor}` } : undefined}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{roleConfig.icon}</span>
                        <span>{roleConfig.shortLabel}</span>
                      </div>
                      {isActive && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Кнопка возврата к оригинальной роли */}
            {currentRole !== originalRole && (
              <div className="px-4 pb-4">
                <button
                  onClick={() => handleRoleSwitch(originalRole as UserRole)}
                  disabled={isChangingRole}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white text-xs font-bold uppercase tracking-wider hover:shadow-lg hover:shadow-purple-500/50 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                  </svg>
                  Вернуться к {originalRole === 'owner' ? 'Owner' : 'Admin'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Анимация загрузки при смене роли */}
      {isChangingRole && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto pt-16 pb-8">
          <div className="bg-[#0d0d0f] border-2 border-purple-500/50 rounded-2xl p-8 flex flex-col items-center gap-4">
            <svg className="animate-spin h-12 w-12 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-sm font-bold text-white">Переключение роли...</p>
          </div>
        </div>
      )}
    </div>
  );
}
