'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import ThemeSelector from './ThemeSelector';
import AdminRoleHUD from './AdminRoleHUD';
import AccountManager from './AccountManager';
import { UserRole, ROLE_CONFIG } from '../../lib/types';
import { supabase } from '../../lib/supabase';

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
}

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
}: SettingsTabProps) {
  const config = ROLE_CONFIG[role];
  
  // Fallback для onShowNotification
  const handleShowNotification = onShowNotification || ((message: string, type: 'success' | 'error') => {
    console.log(`[${type}] ${message}`);
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

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!supabase || !user?.email) {
      setPasswordError('Ошибка инициализации');
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setPasswordSuccess('Письмо со ссылкой для смены пароля отправлено на вашу почту!');
      setTimeout(() => {
        setShowPasswordChange(false);
        setPasswordSuccess('');
      }, 3000);
    } catch (err: any) {
      console.error('Ошибка отправки письма:', err);
      setPasswordError(err.message || 'Не удалось отправить письмо');
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
      const { error } = await supabase.auth.updateUser(
        { email: newEmail },
        { emailRedirectTo: `${window.location.origin}/change-email` }
      );

      if (error) throw error;

      setEmailSuccess('Письмо с подтверждением отправлено на новый email! Проверьте почту.');
      setNewEmail('');
      setTimeout(() => {
        setShowEmailChange(false);
        setEmailSuccess('');
      }, 5000);
    } catch (err: any) {
      console.error('Ошибка смены email:', err);
      setEmailError(err.message || 'Не удалось отправить письмо');
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
      {/* Плавающая панель управления ролями */}
      {(originalRole === 'admin' || originalRole === 'owner') && (
        <AdminRoleHUD
          currentRole={role}
          originalRole={originalRole}
          userId={user?.id}
        />
      )}

      <div className="animate-fade-up">
        <div className="mb-8">
          <h2 className="text-3xl font-black uppercase tracking-tight mb-2 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Настройки
          </h2>
          <p className="text-sm text-zinc-500">Управление профилем и настройками</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Левая колонка - основные настройки */}
          <div className="space-y-6">
        {/* Аватарка */}
        <div className="group">
          <label className="text-[10px] text-zinc-400 uppercase tracking-[0.2em] mb-3 block font-bold">
            Аватар профиля
          </label>
          <div className="flex items-center gap-4">
            <button 
              onClick={onShowAvatarModal}
              className={`relative w-28 h-28 rounded-2xl ${avatar ? 'bg-cover bg-center' : `bg-gradient-to-br ${config.color}`} flex items-center justify-center text-4xl font-black border-2 ${config.borderColor} overflow-hidden cursor-pointer hover:scale-105 transition-all duration-300 group/avatar`}
              style={{ 
                boxShadow: `0 0 30px ${config.glowColor}, 0 8px 16px rgba(0,0,0,0.4)`,
                backgroundImage: avatar ? `url(${avatar})` : 'none'
              }}
            >
              {!avatar && nickname.charAt(0).toUpperCase()}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-end pb-3">
                <svg className="w-6 h-6 text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-white text-xs font-bold">Изменить</span>
              </div>
              {/* Анимированная рамка */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300" 
                   style={{ 
                     background: `linear-gradient(45deg, ${config.glowColor} 0%, transparent 50%, ${config.glowColor} 100%)`,
                     filter: 'blur(8px)',
                     transform: 'scale(1.1)'
                   }}></div>
            </button>
            <div className="flex-1">
              <p className="text-sm text-zinc-300 mb-2 font-medium">Нажмите на аватар для изменения</p>
              <p className="text-[10px] text-zinc-600">PNG, JPG до 2MB • Рекомендуем 400x400px</p>
            </div>
          </div>
        </div>

        {/* Никнейм */}
        <div>
          <label className="text-[10px] text-zinc-400 uppercase tracking-[0.2em] mb-2 block font-bold">
            Никнейм артиста
          </label>
          <input 
            value={nickname}
            disabled
            className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-zinc-400 cursor-not-allowed font-medium transition-all hover:bg-white/[0.05]"
          />
          <p className="text-[10px] text-zinc-600 mt-2 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Никнейм нельзя изменить
          </p>
        </div>
        
        {/* ID участника */}
        <div>
          <label className="text-[10px] text-zinc-400 uppercase tracking-[0.2em] mb-2 block font-bold">
            ID участника (тег)
          </label>
          <div className="flex items-center gap-2">
            <input 
              value={memberId}
              disabled
              className="flex-1 px-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-sm font-mono text-zinc-300 cursor-not-allowed transition-all hover:bg-white/[0.05]"
            />
            <button 
              onClick={() => copyToClipboard(memberId)}
              className="group/copy px-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl hover:bg-gradient-to-br hover:from-purple-600/20 hover:to-blue-600/20 hover:border-purple-500/50 transition-all duration-300"
              title="Copy ID"
            >
              <svg className="w-5 h-5 text-zinc-400 group-hover/copy:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 block">Email</label>
          <div className="flex items-center gap-2 mb-2">
            <input 
              value={user?.email || ''}
              disabled
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-zinc-500"
            />
            <button 
              onClick={() => copyToClipboard(user?.email || '')}
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-purple-600/20 hover:border-purple-500/50 transition group"
              title="Скопировать email"
            >
              <svg className="w-5 h-5 text-zinc-400 group-hover:text-purple-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>

          {!showEmailChange ? (
            <button
              onClick={() => setShowEmailChange(true)}
              className="text-xs text-[#6050ba] hover:text-[#7060ca] transition flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Изменить email
            </button>
          ) : (
            <div className="space-y-3 p-3 bg-white/[0.03] border border-white/10 rounded-lg animate-[fadeIn_0.3s_ease-in-out]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">Смена email</span>
                <button
                  onClick={() => {
                    setShowEmailChange(false);
                    setNewEmail('');
                    setEmailError('');
                    setEmailSuccess('');
                  }}
                  className="text-zinc-500 hover:text-white transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {emailError && (
                <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-xs">
                  {emailError}
                </div>
              )}

              {emailSuccess && (
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-400 text-xs">
                  {emailSuccess}
                </div>
              )}

              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Новый email"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm outline-none focus:border-[#6050ba] focus:bg-white/10 transition placeholder-zinc-600"
              />

              <button
                onClick={handleChangeEmail}
                disabled={emailLoading || !newEmail}
                className={`w-full py-2 rounded text-xs font-bold uppercase tracking-widest transition-all ${
                  emailLoading || !newEmail
                    ? 'bg-[#6050ba]/30 cursor-not-allowed text-zinc-500'
                    : 'bg-gradient-to-r from-[#6050ba] to-[#7060ca] hover:shadow-lg hover:shadow-[#6050ba]/40 text-white'
                }`}
              >
                {emailLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Отправка...
                  </span>
                ) : 'Отправить подтверждение'}
              </button>

              <p className="text-[9px] text-zinc-500">
                На новый email будет отправлено письмо с подтверждением
              </p>
            </div>
          )}
        </div>

        {/* Секция смены пароля */}
        <div>
          <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3 block">Безопасность</label>
          
          {!showPasswordChange ? (
            <button
              onClick={() => setShowPasswordChange(true)}
              className="w-full py-3 px-4 bg-white/5 border border-white/10 text-zinc-300 text-sm font-medium rounded-xl hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Изменить пароль
            </button>
          ) : (
            <div className="space-y-4 p-4 bg-white/[0.03] border border-white/10 rounded-xl animate-[fadeIn_0.3s_ease-in-out]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold">Смена пароля</h3>
                <button
                  onClick={() => {
                    setShowPasswordChange(false);
                    setPasswordError('');
                    setPasswordSuccess('');
                  }}
                  className="text-zinc-500 hover:text-white transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {passwordError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs">
                  {passwordSuccess}
                </div>
              )}

              <p className="text-xs text-zinc-400 leading-relaxed">
                На вашу почту <span className="text-white font-medium">{user?.email}</span> будет отправлено письмо со ссылкой для смены пароля.
              </p>

              <button
                onClick={handleChangePassword}
                disabled={passwordLoading}
                className={`w-full py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                  passwordLoading
                    ? 'bg-[#6050ba]/30 cursor-not-allowed text-zinc-500'
                    : 'bg-gradient-to-r from-[#6050ba] to-[#7060ca] hover:shadow-lg hover:shadow-[#6050ba]/40 text-white'
                }`}
              >
                {passwordLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Отправка...
                  </span>
                ) : 'Отправить письмо для смены пароля'}
              </button>
            </div>
          )}
        </div>
        
        {/* Статус */}
        <div>
          <label className="text-[10px] text-zinc-400 uppercase tracking-[0.2em] mb-3 block font-bold">
            Статус аккаунта
          </label>
          <div 
            className={`group inline-flex items-center gap-3 px-5 py-3.5 rounded-xl bg-gradient-to-br ${config.color} border-2 ${config.borderColor} transition-all duration-300 hover:scale-105`}
            style={{ boxShadow: `0 0 25px ${config.glowColor}, 0 4px 12px rgba(0,0,0,0.3)` }}
          >
            <span className="text-2xl">{config.icon}</span>
            <div>
              <div className="text-sm font-bold text-white uppercase tracking-wider">{config.shortLabel}</div>
              <div className="text-[10px] text-white/70">{config.label}</div>
            </div>
          </div>
          {role === 'basic' && (
            <div className="mt-3 p-3 bg-gradient-to-r from-[#f59e0b]/10 to-[#fbbf24]/10 border border-[#fbbf24]/30 rounded-xl">
              <p className="text-xs text-zinc-300 leading-relaxed">
                ✨ Want to become <span className="text-[#fbbf24] font-bold">Exclusive</span>?{' '}
                <Link href="/contacts" className="text-[#6050ba] hover:text-[#7060ca] font-bold underline decoration-2 underline-offset-2">
                  Contact us
                </Link>
              </p>
            </div>
          )}
        </div>

        {/* Настройка темы */}
        <div>
          <label className="text-[10px] text-zinc-400 uppercase tracking-[0.2em] mb-3 block font-bold">
            Тема интерфейса
          </label>
          <ThemeSelector />
        </div>

        {/* Разделитель */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-[#0d0d0f] text-[10px] text-zinc-600 uppercase tracking-wider">Безопасность</span>
          </div>
        </div>

        {/* Кнопка выхода */}
        <button 
          onClick={onSignOut}
          className="group w-full py-3.5 px-4 bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/30 text-red-400 text-sm font-bold uppercase tracking-wider rounded-xl hover:from-red-500/20 hover:to-red-600/20 hover:border-red-500/50 hover:text-red-300 hover:shadow-lg hover:shadow-red-500/20 transition-all duration-300 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Выйти
        </button>
        </div>
        
        {/* Правая колонка - управление для Admin/Owner */}
        {(role === 'admin' || role === 'owner' || originalRole === 'admin' || originalRole === 'owner') && (
          <div className="space-y-6">
            {/* Account Management */}
            <div className="group/card">
              <label className="text-[10px] text-zinc-400 uppercase tracking-[0.2em] mb-3 block font-bold flex items-center gap-2">
                <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Управление учетной записью
              </label>
              <div className="p-6 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 border border-cyan-500/20 rounded-2xl hover:border-cyan-500/40 transition-all duration-300 group-hover/card:shadow-lg group-hover/card:shadow-cyan-500/10">
                <AccountManager 
                  userId={user?.id} 
                  currentEmail={user?.email || ''} 
                />
              </div>
            </div>

            {/* Developer Info */}
            {originalRole === 'owner' && (
              <div className="p-4 bg-gradient-to-br from-purple-500/5 to-pink-500/5 border border-purple-500/20 rounded-2xl">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-purple-300 mb-1">Доступ Owner</h4>
                    <p className="text-[10px] text-zinc-400 leading-relaxed">
                      Как owner, у вас есть полный доступ ко всем ролям и функциям. Панель тестирования появляется в правом нижнем углу для быстрого переключения.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
