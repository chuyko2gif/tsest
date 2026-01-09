'use client';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import ThemeSelector from './ThemeSelector';
import AccountManager from './AccountManager';
import SocialLinksManager from './SocialLinksManager';
import { UserRole, ROLE_CONFIG } from '../../lib/types';
import { supabase } from '../../lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';

interface SettingsTabProps {
  user: any;
  nickname: string;
  memberId: string;
  role: UserRole;
  originalRole?: string | null;
  avatar: string;
  onSignOut: () => void;
  onShowAvatarModal: () => void;
  showToast: () => void;
  onShowNotification?: (message: string, type: 'success' | 'error') => void;
  onSupportToggle?: () => void;
}

// Стили "Liquid Glass" - мемоизированные для производительности
const useGlassStyles = (isLight: boolean) => useMemo(() => ({
  // Основная стеклянная карточка - более прозрачная
  glassCard: {
    background: isLight 
      ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.55) 0%, rgba(250, 248, 255, 0.45) 100%)'
      : 'linear-gradient(135deg, rgba(30, 27, 45, 0.6) 0%, rgba(45, 40, 70, 0.5) 100%)',
    border: isLight 
      ? '1px solid rgba(255, 255, 255, 0.7)' 
      : '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: isLight 
      ? '0 8px 32px rgba(157, 141, 241, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)' 
      : '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
  },
  // Инпуты в стиле glass
  glassInput: {
    background: isLight 
      ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(252, 250, 255, 0.4) 100%)'
      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
    border: isLight 
      ? '1px solid rgba(200, 180, 255, 0.25)' 
      : '1px solid rgba(255, 255, 255, 0.06)',
    boxShadow: isLight 
      ? 'inset 0 2px 4px rgba(157, 141, 241, 0.04)' 
      : 'inset 0 2px 4px rgba(0, 0, 0, 0.15)',
  },
  // Кнопка primary
  glassPrimaryBtn: {
    background: 'linear-gradient(135deg, rgba(128, 112, 218, 0.85) 0%, rgba(160, 144, 234, 0.8) 100%)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    boxShadow: '0 4px 20px rgba(128, 112, 218, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
  },
  // Кнопка secondary
  glassSecondaryBtn: {
    background: isLight 
      ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(248, 246, 255, 0.5) 100%)'
      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
    border: isLight 
      ? '1px solid rgba(200, 180, 255, 0.3)' 
      : '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: isLight 
      ? '0 2px 8px rgba(157, 141, 241, 0.06)' 
      : '0 2px 8px rgba(0, 0, 0, 0.15)',
  },
  // Секция внутри карточки
  glassSection: {
    background: isLight 
      ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(248, 246, 255, 0.3) 100%)'
      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.01) 100%)',
    border: isLight 
      ? '1px solid rgba(200, 180, 255, 0.15)' 
      : '1px solid rgba(255, 255, 255, 0.04)',
  },
}), [isLight]);

export default function SettingsTab({
  user,
  nickname,
  memberId,
  role,
  originalRole,
  avatar,
  onSignOut,
  onShowAvatarModal,
  showToast,
  onShowNotification,
  onSupportToggle,
}: SettingsTabProps) {
  const config = ROLE_CONFIG[role];
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  const glassStyles = useGlassStyles(isLight);
  
  // Fallback для onShowNotification
  const handleShowNotification = onShowNotification || ((message: string, type: 'success' | 'error') => {
    if (type === 'success') showToast();
  });
  
  // Смена пароля
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  
  // Смена email
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');

  // Функция для перевода английских ошибок Supabase на русский
  const translateError = (message: string): string => {
    const errorTranslations: { [key: string]: string } = {
      'A user with this email address has already been registered': 'Пользователь с этим email уже зарегистрирован',
      'User already registered': 'Пользователь уже зарегистрирован',
      'Email not confirmed': 'Email не подтверждён',
      'Invalid login credentials': 'Неверный email или пароль',
      'Email rate limit exceeded': 'Слишком много запросов. Подождите немного',
      'Password should be at least 6 characters': 'Пароль должен быть не менее 6 символов',
      'Unable to validate email address: invalid format': 'Неверный формат email',
      'New email is the same as your current email': 'Новый email совпадает с текущим',
      'Email link is invalid or has expired': 'Ссылка недействительна или истекла',
      'Token has expired or is invalid': 'Токен истёк или недействителен',
      'For security purposes, you can only request this once every 60 seconds': 'Можно запрашивать только раз в 60 секунд',
      'Signups not allowed for this instance': 'Регистрация временно недоступна',
    };
    
    // Ищем точное совпадение
    if (errorTranslations[message]) {
      return errorTranslations[message];
    }
    
    // Ищем частичное совпадение
    for (const [eng, rus] of Object.entries(errorTranslations)) {
      if (message.toLowerCase().includes(eng.toLowerCase())) {
        return rus;
      }
    }
    
    return message;
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!user?.email) {
      setPasswordError('Ошибка инициализации');
      return;
    }

    setPasswordLoading(true);
    try {
      // Используем наш кастомный API для отправки письма сброса пароля
      const response = await fetch('/api/send-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Не удалось отправить письмо');
      }

      setPasswordSuccess('Письмо со ссылкой для смены пароля отправлено на вашу почту!');
      setTimeout(() => {
        setShowPasswordChange(false);
        setPasswordSuccess('');
      }, 3000);
    } catch (err: any) {
      console.error('Ошибка отправки письма:', err);
      setPasswordError(translateError(err.message) || 'Не удалось отправить письмо');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    setEmailError('');
    setEmailSuccess('');

    if (!newEmail || !newEmail.includes('@')) {
      setEmailError('Введите корректный email');
      return;
    }

    if (newEmail === user?.email) {
      setEmailError('Это ваш текущий email');
      return;
    }

    if (!supabase) {
      setEmailError('Ошибка инициализации');
      return;
    }

    setEmailLoading(true);
    try {
      console.log('Attempting to change email to:', newEmail);
      
      // Используем кастомный API - письмо придёт ТОЛЬКО на новую почту
      const response = await fetch('/api/send-change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentEmail: user?.email,
          newEmail: newEmail,
          userId: user?.id
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Ошибка отправки письма');
      }

      console.log('Email change result:', result);
      
      setEmailSuccess('Письмо отправлено на новый email! Проверьте почту и подтвердите смену.');
      setNewEmail('');
      setEmailLoading(false);
      setTimeout(() => {
        setShowEmailChange(false);
        setEmailSuccess('');
      }, 5000);
    } catch (err: any) {
      console.error('Ошибка смены email:', err);
      let errorMsg = translateError(err.message);
      if (err.message?.includes('rate limit') || err.message?.includes('exceeded')) {
        errorMsg = 'Превышен лимит запросов. Подождите несколько минут и попробуйте снова.';
      } else if (err.message?.includes('already registered') || err.message?.includes('already been registered') || err.message?.includes('уже используется')) {
        errorMsg = 'Этот email уже используется другим аккаунтом';
      }
      setEmailError(errorMsg || 'Не удалось отправить письмо');
    } finally {
      setEmailLoading(false);
    }
  };

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
      {/* GPU-optimized fade-in animation */}
      <div className="will-change-transform" style={{ animation: 'glassSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
        <style>{`
          @keyframes glassSlideUp {
            from { opacity: 0; transform: translate3d(0, 12px, 0); }
            to { opacity: 1; transform: translate3d(0, 0, 0); }
          }
          @keyframes glassPulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 0.8; }
          }
        `}</style>
        
        {/* Заголовок */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h2 className={`text-2xl sm:text-3xl font-black uppercase tracking-tight mb-1 sm:mb-2 bg-gradient-to-r bg-clip-text text-transparent ${isLight ? 'from-[#1a1535] to-[#5c5580]' : 'from-white to-zinc-400'}`}>
            Настройки
          </h2>
          <p className={`text-xs sm:text-sm ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>Управление профилем и настройками</p>
        </div>
        
        {/* ═══════════════════════════════════════════════════════════════════
            МОБИЛКА: Профиль → Telegram → Статус&Тема → Email → Admin
            ДЕСКТОП: [Профиль, Telegram, Admin] | [Статус&Тема, Email]
        ═══════════════════════════════════════════════════════════════════ */}
        
        {/* === 1. ПРОФИЛЬ - Glass Card === */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div 
            className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl relative overflow-hidden lg:row-span-2"
            style={glassStyles.glassCard}
          >
            {/* Декоративное свечение */}
            <div 
              className="absolute -top-20 -right-20 w-40 h-40 rounded-full pointer-events-none"
              style={{ 
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
                animation: 'glassPulse 4s ease-in-out infinite'
              }}
            />
            
            {/* Аватарка */}
            <div className="relative z-10 mb-5">
              <label className={`text-[10px] uppercase tracking-[0.2em] mb-3 block font-bold ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'}`}>
                Аватар профиля
              </label>
              <div className="flex items-center gap-4">
                <button 
                  onClick={onShowAvatarModal}
                  className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl ${avatar ? 'bg-cover bg-center' : `bg-gradient-to-br ${config.color}`} flex items-center justify-center text-3xl sm:text-4xl font-black overflow-hidden cursor-pointer transition-all duration-300 group/avatar hover:scale-[1.03]`}
                  style={{ 
                    boxShadow: `0 0 30px ${config.glowColor}, 0 8px 24px rgba(0,0,0,0.3)`,
                    backgroundImage: avatar ? `url(${avatar})` : 'none',
                    border: `2px solid ${isLight ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.15)'}`,
                  }}
                >
                  {!avatar && <span className="text-white drop-shadow-lg">{nickname.charAt(0).toUpperCase()}</span>}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-end pb-2">
                    <svg className="w-5 h-5 text-white mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-white text-[10px] font-bold">Изменить</span>
                  </div>
                </button>
                <div className="flex-1">
                  <p className={`text-sm mb-1 font-medium ${isLight ? 'text-[#3d3660]' : 'text-zinc-300'}`}>Нажмите на аватар</p>
                  <p className={`text-[10px] ${isLight ? 'text-[#7a7596]' : 'text-zinc-500'}`}>PNG, JPG до 2MB • 400×400px</p>
                </div>
              </div>
            </div>

            {/* Никнейм */}
            <div className="relative z-10 mb-4">
              <label className={`text-[10px] uppercase tracking-[0.2em] mb-2 block font-bold ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'}`}>
                Никнейм артиста
              </label>
              <input 
                value={nickname}
                disabled
                className={`w-full px-4 py-3 rounded-xl text-sm cursor-not-allowed font-medium transition-all ${isLight ? 'text-[#3d3660]' : 'text-zinc-300'}`}
                style={glassStyles.glassInput}
              />
              <p className={`text-[10px] mt-2 flex items-center gap-1 ${isLight ? 'text-[#7a7596]' : 'text-zinc-500'}`}>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Никнейм нельзя изменить
              </p>
            </div>
            
            {/* ID участника */}
            <div className="relative z-10">
              <label className={`text-[10px] uppercase tracking-[0.2em] mb-2 block font-bold ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'}`}>
                ID участника (тег)
              </label>
              <div className="flex items-center gap-2">
                <input 
                  value={memberId}
                  disabled
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-mono cursor-not-allowed ${isLight ? 'text-[#3d3660]' : 'text-zinc-300'}`}
                  style={glassStyles.glassInput}
                />
                <button 
                  onClick={() => copyToClipboard(memberId)}
                  className="group/copy px-3.5 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  style={glassStyles.glassSecondaryBtn}
                  title="Copy ID"
                >
                  <svg className={`w-5 h-5 transition-colors ${isLight ? 'text-[#6050ba] group-hover/copy:text-[#8070da]' : 'text-zinc-400 group-hover/copy:text-purple-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* === 2. TELEGRAM - Glass Card (только на десктопе в правой колонке, на мобилке после профиля) === */}
          <div 
            className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl relative overflow-hidden lg:hidden"
            style={glassStyles.glassCard}
          >
            <div className="relative z-10">
              <label className={`text-[10px] uppercase tracking-[0.2em] mb-3 block font-bold flex items-center gap-2 ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'}`}>
                <svg className="w-4 h-4 text-[#0088cc]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                Привязка Telegram
              </label>
              <SocialLinksManager 
                userId={user?.id} 
                onShowNotification={handleShowNotification}
              />
            </div>
          </div>

          {/* === 3. СТАТУС & ТЕМА - Glass Card (на мобилке после Telegram) === */}
          <div 
            className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl relative overflow-hidden"
            style={glassStyles.glassCard}
          >
            {/* Статус */}
            <div className="relative z-10 mb-6 sm:mb-8">
              <label className={`text-[10px] uppercase tracking-[0.2em] mb-3 block font-bold ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'}`}>
                Статус аккаунта
              </label>
              <div 
                className={`group inline-flex items-center gap-3 px-5 py-4 rounded-xl transition-all duration-300 hover:scale-[1.02] ${isLight && role === 'basic' ? 'bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400' : `bg-gradient-to-br ${config.color}`}`}
                style={{ 
                  boxShadow: `0 0 25px ${config.glowColor}, 0 4px 16px rgba(0,0,0,0.25)`,
                  border: `1px solid ${isLight ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)'}`,
                }}
              >
                <span className={`text-2xl ${isLight && role === 'basic' ? 'opacity-80' : ''}`}>{config.icon}</span>
                <div>
                  <div className={`text-sm font-bold uppercase tracking-wider ${isLight && role === 'basic' ? 'text-gray-700' : 'text-white'}`}>{config.shortLabel}</div>
                  <div className={`text-[10px] ${isLight && role === 'basic' ? 'text-gray-600' : 'text-white/70'}`}>{config.label}</div>
                </div>
              </div>
              {/* Подсказка под статусом - разная для каждой роли */}
              <div 
                className="mt-4 p-3 rounded-xl"
                style={{
                  background: role === 'basic' 
                    ? (isLight 
                        ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(245, 158, 11, 0.05) 100%)'
                        : 'linear-gradient(135deg, rgba(251, 191, 36, 0.12) 0%, rgba(245, 158, 11, 0.08) 100%)')
                    : role === 'exclusive'
                    ? (isLight 
                        ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)'
                        : 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)')
                    : (isLight 
                        ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(22, 163, 74, 0.05) 100%)'
                        : 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(22, 163, 74, 0.08) 100%)'),
                  border: role === 'basic' 
                    ? '1px solid rgba(251, 191, 36, 0.2)'
                    : role === 'exclusive'
                    ? '1px solid rgba(168, 85, 247, 0.2)'
                    : '1px solid rgba(34, 197, 94, 0.2)',
                }}
              >
                <p className={`text-xs leading-relaxed flex items-center gap-2 ${isLight ? 'text-[#5c5580]' : 'text-zinc-300'}`}>
                  {role === 'basic' ? (
                    <>
                      <svg className="w-4 h-4 flex-shrink-0 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span>Хотите стать <span className="text-[#fbbf24] font-bold">Exclusive</span>?{' '}
                      <button 
                        onClick={onSupportToggle}
                        className={`font-bold underline decoration-2 underline-offset-2 transition-colors ${isLight ? 'text-[#6050ba] hover:text-[#8070da]' : 'text-[#a090ea] hover:text-[#c4b5fd]'}`}
                      >
                        Напишите нам
                      </button></span>
                    </>
                  ) : role === 'exclusive' ? (
                    <>
                      <svg className="w-4 h-4 flex-shrink-0 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm2.5 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6.207.293a1 1 0 00-1.414 0l-6 6a1 1 0 101.414 1.414l6-6a1 1 0 000-1.414zM12.5 10a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" clipRule="evenodd" />
                      </svg>
                      <span>Вы получаете <span className="text-purple-400 font-bold">приоритетную</span> модерацию и расширенные возможности</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 flex-shrink-0 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>У вас <span className="text-emerald-400 font-bold">полный доступ</span> к управлению платформой</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Тема */}
            <div className="relative z-10">
              <label className={`text-[10px] uppercase tracking-[0.2em] mb-4 block font-bold ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'}`}>
                Тема интерфейса
              </label>
              <ThemeSelector />
            </div>
          </div>
        </div>

        {/* === Второй ряд: Telegram (десктоп) + Email === */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          {/* TELEGRAM - только для десктопа (на мобилке показан выше) */}
          <div 
            className="hidden lg:block p-4 sm:p-5 rounded-2xl sm:rounded-3xl relative overflow-hidden"
            style={glassStyles.glassCard}
          >
            <div className="relative z-10">
              <label className={`text-[10px] uppercase tracking-[0.2em] mb-3 block font-bold flex items-center gap-2 ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'}`}>
                <svg className="w-4 h-4 text-[#0088cc]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                Привязка Telegram
              </label>
              <SocialLinksManager 
                userId={user?.id} 
                onShowNotification={handleShowNotification}
              />
            </div>
          </div>

          {/* === 4. EMAIL & БЕЗОПАСНОСТЬ - Glass Card === */}
          <div 
            className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl relative overflow-hidden"
            style={glassStyles.glassCard}
          >
              {/* Email */}
              <div className="relative z-10 mb-4">
                <label className={`text-[10px] uppercase tracking-[0.2em] mb-2 block font-bold ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'}`}>
                  Email
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input 
                    value={user?.email || ''}
                    disabled
                    className={`flex-1 px-4 py-3 rounded-xl text-sm ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'}`}
                    style={glassStyles.glassInput}
                  />
                  <button 
                    onClick={() => copyToClipboard(user?.email || '')}
                    className="group px-3.5 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    style={glassStyles.glassSecondaryBtn}
                    title="Скопировать email"
                  >
                    <svg className={`w-5 h-5 transition ${isLight ? 'text-[#6050ba] group-hover:text-[#8070da]' : 'text-zinc-400 group-hover:text-purple-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>

                {!showEmailChange ? (
                  <button
                    onClick={() => setShowEmailChange(true)}
                    className={`text-xs font-semibold transition-all flex items-center gap-1.5 hover:gap-2 ${isLight ? 'text-[#6050ba] hover:text-[#8070da]' : 'text-[#a090ea] hover:text-[#c4b5fd]'}`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Изменить email
                  </button>
                ) : (
                  <div 
                    className="space-y-3 p-4 rounded-xl will-change-transform"
                    style={{ 
                      ...glassStyles.glassSection,
                      animation: 'glassSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-bold ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>Смена email</span>
                      <button
                        onClick={() => {
                          setShowEmailChange(false);
                          setNewEmail('');
                          setEmailError('');
                          setEmailSuccess('');
                        }}
                        className={`p-1 rounded-lg transition-all hover:scale-110 ${isLight ? 'text-gray-400 hover:text-gray-700 hover:bg-gray-100' : 'text-zinc-500 hover:text-white hover:bg-white/10'}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {emailError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-medium">
                        {emailError}
                      </div>
                    )}

                    {emailSuccess && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-medium">
                        {emailSuccess}
                      </div>
                    )}

                    <input 
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Новый email"
                      className={`w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#8070da]/50 ${isLight ? 'text-[#1a1535] placeholder:text-[#7a7596]' : 'text-white placeholder:text-zinc-500'}`}
                      style={glassStyles.glassInput}
                    />

                    <button
                      onClick={handleChangeEmail}
                      disabled={emailLoading || !newEmail}
                      className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                        emailLoading || !newEmail ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01] hover:shadow-lg hover:shadow-[#8070da]/30 active:scale-[0.99]'
                      }`}
                      style={emailLoading || !newEmail ? { background: 'rgba(128,112,218,0.2)', color: isLight ? '#9ca3af' : '#71717a' } : glassStyles.glassPrimaryBtn}
                    >
                      {emailLoading ? (
                        <span className="flex items-center justify-center gap-2 text-inherit">
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Сохранение...
                        </span>
                      ) : <span className="text-white">Изменить email</span>}
                    </button>

                    <p className={`text-[10px] ${isLight ? 'text-[#7a7596]' : 'text-zinc-500'}`}>
                      Письмо придёт на новую почту для подтверждения
                    </p>
                  </div>
                )}
              </div>

              {/* Безопасность */}
              <div className="relative z-10 pt-4 mt-4" style={{ borderTop: isLight ? '1px solid rgba(200, 180, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)' }}>
                <label className={`text-[10px] uppercase tracking-[0.2em] mb-3 block font-bold ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'}`}>
                  Безопасность
                </label>
                
                {!showPasswordChange ? (
                  <button
                    onClick={() => setShowPasswordChange(true)}
                    className="w-full py-3 px-4 text-sm font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2.5 hover:scale-[1.01] active:scale-[0.98]"
                    style={glassStyles.glassSecondaryBtn}
                  >
                    <svg className={`w-5 h-5 ${isLight ? 'text-[#6050ba]' : 'text-zinc-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className={isLight ? 'text-[#3d3660]' : 'text-zinc-200'}>Изменить пароль</span>
                  </button>
                ) : (
                  <div 
                    className="space-y-3 p-4 rounded-xl will-change-transform"
                    style={{ 
                      ...glassStyles.glassSection,
                      animation: 'glassSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className={`text-sm font-bold ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>Смена пароля</h3>
                      <button
                        onClick={() => {
                          setShowPasswordChange(false);
                          setPasswordError('');
                          setPasswordSuccess('');
                        }}
                        className={`p-1 rounded-lg transition-all hover:scale-110 ${isLight ? 'text-gray-400 hover:text-gray-700 hover:bg-gray-100' : 'text-zinc-500 hover:text-white hover:bg-white/10'}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {passwordError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-medium">
                        {passwordError}
                      </div>
                    )}

                    {passwordSuccess && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-medium">
                        {passwordSuccess}
                      </div>
                    )}

                    <p className={`text-xs leading-relaxed ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'}`}>
                      На вашу почту <span className={`font-semibold ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>{user?.email}</span> будет отправлено письмо.
                    </p>

                    <button
                      onClick={handleChangePassword}
                      disabled={passwordLoading}
                      className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                        passwordLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01] hover:shadow-lg hover:shadow-[#8070da]/30 active:scale-[0.99]'
                      }`}
                      style={passwordLoading ? { background: 'rgba(128,112,218,0.2)', color: isLight ? '#9ca3af' : '#71717a' } : glassStyles.glassPrimaryBtn}
                    >
                      {passwordLoading ? (
                        <span className="flex items-center justify-center gap-2 text-inherit">
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Отправка...
                        </span>
                      ) : <span className="text-white">Отправить письмо</span>}
                    </button>
                  </div>
                )}
              </div>
            </div>
        </div>

        {/* === Admin/Owner секции === */}
        {(role === 'admin' || role === 'owner' || originalRole === 'admin' || originalRole === 'owner') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
            {/* Account Management - Glass Card */}
            <div 
              className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl relative overflow-hidden group/card"
              style={{
                ...glassStyles.glassCard,
                background: isLight 
                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(236, 254, 255, 0.45) 100%)'
                  : 'linear-gradient(135deg, rgba(30, 27, 45, 0.6) 0%, rgba(22, 78, 99, 0.25) 100%)',
              }}
            >
              <div 
                className="absolute -top-16 -right-16 w-32 h-32 rounded-full pointer-events-none opacity-0 group-hover/card:opacity-100 transition-opacity duration-500"
                style={{ background: 'radial-gradient(circle, rgba(34, 211, 238, 0.15) 0%, transparent 70%)' }}
              />
              
              <label className={`text-[10px] uppercase tracking-[0.2em] mb-4 block font-bold flex items-center gap-2 ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Управление учетной записью
              </label>
              <AccountManager 
                userId={user?.id} 
                currentEmail={user?.email || ''} 
              />
            </div>

            {/* Developer Info - Glass Card */}
            {originalRole === 'owner' && (
              <div 
                className="p-4 rounded-2xl relative overflow-hidden"
                style={{
                  ...glassStyles.glassCard,
                  background: isLight 
                    ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(250, 245, 255, 0.45) 100%)'
                    : 'linear-gradient(135deg, rgba(30, 27, 45, 0.6) 0%, rgba(88, 28, 135, 0.15) 100%)',
                }}
              >
                <div className="flex items-start gap-3">
                  <div 
                    className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: isLight 
                        ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(236, 72, 153, 0.08) 100%)'
                        : 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(236, 72, 153, 0.12) 100%)',
                      border: '1px solid rgba(168, 85, 247, 0.2)',
                    }}
                  >
                    <svg className={`w-5 h-5 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-sm font-bold mb-1.5 ${isLight ? 'text-purple-700' : 'text-purple-300'}`}>Доступ Owner</h4>
                    <p className={`text-xs leading-relaxed ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'}`}>
                      У вас полный доступ ко всем ролям и функциям.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            5. КНОПКА ВЫХОДА - Красиво по центру снизу
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="mt-8 sm:mt-10 flex justify-center">
          <button 
            onClick={onSignOut}
            className="group relative w-full max-w-md px-8 sm:px-16 py-4 sm:py-5 text-sm sm:text-base font-bold uppercase tracking-wider rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
            style={{
              background: isLight 
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.06) 100%)'
                : 'linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(220, 38, 38, 0.12) 100%)',
              border: isLight 
                ? '1.5px solid rgba(239, 68, 68, 0.25)' 
                : '1.5px solid rgba(239, 68, 68, 0.3)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: isLight 
                ? '0 4px 24px rgba(239, 68, 68, 0.12), inset 0 1px 0 rgba(255,255,255,0.3)'
                : '0 4px 30px rgba(239, 68, 68, 0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            {/* Hover glow effect */}
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at center, rgba(239, 68, 68, 0.2) 0%, transparent 70%)',
              }}
            />
            <svg className={`relative z-10 w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-12 transition-all duration-300 ${isLight ? 'text-red-500' : 'text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className={`relative z-10 whitespace-nowrap ${isLight ? 'text-red-600' : 'text-red-400'}`}>Выйти из аккаунта</span>
          </button>
        </div>
      </div>
    </>
  );
}

