"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { UserRole, ROLE_CONFIG } from '../lib/types';
import { supabase } from '../lib/supabase';
import ThemeSelector from './settings/ThemeSelector';

interface SettingsTabProps {
  nickname: string;
  memberId: string;
  email: string;
  role: UserRole;
  avatar: string;
  onCopyMemberId: () => void;
  onOpenAvatarModal: () => void;
  onShowToast?: () => void;
  onSignOut: () => void;
}

// Вкладка настроек профиля
export default function SettingsTab({ 
  nickname, 
  memberId, 
  email, 
  role, 
  avatar, 
  onCopyMemberId,
  onOpenAvatarModal,
  onShowToast,
  onSignOut
}: SettingsTabProps) {
  const config = ROLE_CONFIG[role];
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError('Новый пароль должен быть не менее 6 символов');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Пароли не совпадают');
      return;
    }

    if (!supabase) {
      setPasswordError('Ошибка инициализации');
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setPasswordSuccess('Пароль успешно изменён!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordChange(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (err: any) {
      console.error('Ошибка смены пароля:', err);
      setPasswordError(err.message || 'Не удалось изменить пароль');
    } finally {
      setPasswordLoading(false);
    }
  };
  
  return (
    <div className="animate-fade-up">
      <h2 className="text-3xl font-black uppercase tracking-tight mb-2">Настройки</h2>
      <p className="text-sm text-zinc-500 mb-8">Управление профилем</p>
      
      <div className="space-y-6 max-w-md">
        {/* Аватарка */}
        <div>
          <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3 block">Аватар профиля</label>
          <div className="flex items-center gap-4">
            <button 
              onClick={onOpenAvatarModal}
              className={`w-24 h-24 rounded-2xl ${avatar ? 'bg-cover bg-center' : `bg-gradient-to-br ${config.color}`} flex items-center justify-center text-3xl font-black border-2 ${config.borderColor} overflow-hidden cursor-pointer hover:opacity-80 transition-opacity group relative`}
              style={{ 
                boxShadow: `0 0 20px ${config.glowColor}`,
                backgroundImage: avatar ? `url(${avatar})` : 'none'
              }}
            >
              {!avatar && nickname.charAt(0).toUpperCase()}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-xs font-bold">Изменить</span>
              </div>
            </button>
            <div className="flex-1">
              <p className="text-sm text-zinc-400 mb-2">Нажмите на аватар для изменения</p>
              <p className="text-[9px] text-zinc-600">PNG, JPG до 2MB</p>
            </div>
          </div>
        </div>

        <div>
          <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 block">Никнейм артиста</label>
          <input 
            value={nickname}
            disabled
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-zinc-500 cursor-not-allowed"
          />
          <p className="text-[9px] text-zinc-600 mt-1">Никнейм нельзя изменить</p>
        </div>
        
        <div>
          <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 block">ID участника (тег)</label>
          <div className="flex items-center gap-2">
            <input 
              value={memberId}
              disabled
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-mono text-zinc-400 cursor-not-allowed"
            />
            <button 
              onClick={onCopyMemberId}
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-purple-600/20 hover:border-purple-500/50 transition group"
              title="Скопировать ID"
            >
              <svg className="w-5 h-5 text-zinc-400 group-hover:text-purple-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
        <div>
          <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 block">Email</label>
          <div className="flex items-center gap-2">
            <input 
              value={email}
              disabled
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-zinc-500 cursor-not-allowed"
            />
            <button 
              onClick={() => {
                if (navigator?.clipboard?.writeText) {
                  navigator.clipboard.writeText(email);
                } else {
                  const ta = document.createElement('textarea');
                  ta.value = email;
                  document.body.appendChild(ta);
                  ta.select();
                  document.execCommand('copy');
                  document.body.removeChild(ta);
                }
                onShowToast?.();
              }}
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-purple-600/20 hover:border-purple-500/50 transition group"
              title="Скопировать email"
            >
              <svg className="w-5 h-5 text-zinc-400 group-hover:text-purple-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
        
        <div>
          <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 block">Статус</label>
          <div 
            className={`inline-flex items-center px-4 py-2 rounded-xl ${config.bgColor} ${config.textColor} border ${config.borderColor}`}
            style={{ boxShadow: `0 0 15px ${config.glowColor}` }}
          >
            <span className="text-sm font-bold">{config.label}</span>
          </div>
          {role === 'basic' && (
            <p className="text-[10px] text-zinc-600 mt-2">
              Хотите стать Exclusive? <Link href="/contacts" className="text-[#6050ba]">Свяжитесь с нами</Link>
            </p>
          )}
        </div>

        {/* Секция выбора темы */}
        <div>
          <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3 block">Тема оформления</label>
          <ThemeSelector />
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
                    setNewPassword('');
                    setConfirmPassword('');
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

              <div>
                <label className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-2">
                  Новый пароль
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Минимум 6 символов"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm outline-none focus:border-[#6050ba] focus:bg-white/10 transition placeholder-zinc-600"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-2">
                  Подтвердите пароль
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Повторите новый пароль"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm outline-none focus:border-[#6050ba] focus:bg-white/10 transition placeholder-zinc-600"
                />
              </div>

              <button
                onClick={handleChangePassword}
                disabled={passwordLoading || !newPassword || !confirmPassword}
                className={`w-full py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                  passwordLoading || !newPassword || !confirmPassword
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
                    Сохранение...
                  </span>
                ) : 'Сохранить новый пароль'}
              </button>
            </div>
          )}
        </div>

        {/* Разделитель */}
        <div className="h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent my-6"></div>

        {/* Кнопка выхода */}
        <button 
          onClick={onSignOut}
          className="w-full py-3 px-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-300 transition-all"
        >
          Выйти
        </button>
      </div>
    </div>
  );
}
