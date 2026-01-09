"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageBackground from '@/components/ui/PageBackground';
import { SilverStarsGroup } from '@/components/ui/SilverStars';
import { supabase } from '@/lib/supabase/client';

/**
 * AuthPage - Refactored with PageBackground and semantic classes
 * Removed inline styles and theme conditionals
 * The form now appears as a "floating glass shard" in Light Mode
 */

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup' | 'waiting-confirmation' | 'forgot-password'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [notification, setNotification] = useState<{show: boolean; message: string; type: 'success' | 'error'}>({show: false, message: '', type: 'success'});
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Таймер для повторной отправки
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({show: true, message, type});
    setTimeout(() => setNotification(prev => ({...prev, show: false})), 4000);
  };

  const handleForgotPassword = async () => {
    if (!supabase || !email) {
      showNotification('Введите email или никнейм', 'error');
      return;
    }
    setLoading(true);
    try {
      let userEmail = email;
      if (!email.includes('@')) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('nickname', email)
          .single();
        
        if (!profile) {
          throw new Error('Пользователь с таким никнеймом не найден');
        }
        userEmail = (profile && typeof profile === 'object' && 'email' in profile) ? (profile as any).email : null;
      }

      const response = await fetch('/api/send-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не удалось отправить письмо');

      showNotification('Письмо со ссылкой для сброса пароля отправлено на почту', 'success');
      setMode('login');
      setEmail('');
    } catch (err: any) {
      showNotification(err.message || 'Не удалось отправить письмо', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resendConfirmation = async () => {
    if (!supabase || !email || resendTimer > 0) return;
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email: email });
      if (error) throw error;
      showNotification('Письмо отправлено повторно. Проверьте почту и папку "Спам".', 'success');
      setResendTimer(60);
    } catch (err: any) {
      showNotification(err.message || 'Не удалось отправить письмо', 'error');
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) { alert('Supabase не настроен'); return; }
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { data: authData, error: authError } = await supabase.auth.signUp({ 
          email, 
          password, 
          options: { 
            emailRedirectTo: `${window.location.origin}/cabinet`,
            data: { 
              nickname: nickname || email.split('@')[0],
              display_name: nickname || email.split('@')[0],
              full_name: nickname || email.split('@')[0]
            } 
          } 
        });
        
        if (authError) {
          if (authError.message?.includes('User already registered') || 
              authError.message?.includes('already registered')) {
            const { error: resendError } = await supabase.auth.resend({ type: 'signup', email });
            if (resendError) throw new Error('Email уже зарегистрирован. Проверьте почту или восстановите пароль.');
            showNotification('Письмо с подтверждением отправлено повторно. Проверьте почту.', 'success');
          } else throw authError;
        }
        
        await supabase.auth.signOut();
        setMode('waiting-confirmation');
        setPassword('');
        
      } else if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
          if (error.message?.includes('Email not confirmed')) {
            await supabase.auth.signOut();
            setMode('waiting-confirmation');
            return;
          }
          throw error;
        }
        
        if (data.user && !data.user.email_confirmed_at && !data.user.confirmed_at) {
          await supabase.auth.signOut();
          setMode('waiting-confirmation');
          return;
        }
        
        router.push('/cabinet');
      }
    } catch (err: any) {
      if (err.message?.includes('Invalid login credentials')) {
        showNotification('Неверный email или пароль. Проверьте данные и попробуйте снова.', 'error');
      } else if (err.message?.includes('Email not confirmed')) {
        showNotification('Email не подтверждён. Проверьте почту!', 'error');
        setMode('waiting-confirmation');
      } else if (err.message?.includes('User already registered')) {
        showNotification('Этот email уже зарегистрирован. Войдите или восстановите пароль.', 'error');
      } else if (err.message?.includes('Password should be at least')) {
        showNotification('Пароль должен быть не менее 6 символов', 'error');
      } else {
        showNotification(err.message || 'Произошла ошибка. Попробуйте позже.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Unified PageBackground component */}
      <PageBackground variant="full" shapeCount={10} particleCount={40} />
      
      {/* Серебряные 3D звёзды */}
      <SilverStarsGroup variant="auth" />

      {/* Уведомление */}
      {notification.show && (
        <div className="fixed top-6 right-6 z-[9999] animate-slide-in">
          <div className={`px-5 py-3.5 glass-panel border-2 shadow-2xl max-w-[380px] ${
            notification.type === 'success' 
              ? 'bg-success-bg border-success/50 shadow-success/20' 
              : 'bg-error-bg border-error/50 shadow-error/20'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                notification.type === 'success' ? 'bg-success/30 text-success' : 'bg-error/30 text-error'
              }`}>
                {notification.type === 'success' ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </div>
              <p className="text-sm text-heading font-medium leading-relaxed">{notification.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Кнопка "На главную" */}
      <div className="fixed top-6 left-6 z-50">
        <Link 
          href="/feed" 
          className="btn-glass inline-flex items-center gap-2 px-5 py-3 text-sm font-bold uppercase tracking-widest"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          На главную
        </Link>
      </div>

      {/* Контейнер: лого СБОКУ слева, форма справа */}
      <div className={`relative z-10 w-full transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        <div className="min-h-screen flex flex-col lg:flex-row items-center">
          
          {/* Мобильное лого вверху */}
          <div className="lg:hidden w-full pt-24 pb-10 flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="thqlabel" 
              className="h-24 w-auto object-contain drop-shadow-glow theme-logo"
            />
          </div>

          {/* Левая часть: большое лого (только desktop) */}
          <div className="hidden lg:block w-[500px] flex-shrink-0 pl-8">
            <div className="flex items-center justify-start">
              <img 
                src="/logo.png" 
                alt="thqlabel" 
                className="h-40 w-auto object-contain drop-shadow-glow-intense theme-logo"
                style={{ transform: 'scale(4)', transformOrigin: 'left center' }}
              />
            </div>
          </div>

          {/* Правая часть: форма - "floating glass shard" */}
          <div className="flex-1 flex items-center justify-center px-8 lg:px-12 w-full">
            <div className="w-full max-w-md lg:ml-auto lg:mr-12">
              {/* Форма авторизации - glass-panel-elevated for floating effect */}
              <div className="glass-panel-elevated p-8 md:p-10">
                {mode === 'waiting-confirmation' ? (
                  /* Экран ожидания подтверждения email */
                  <div className="text-center space-y-6">
                    <div className="w-20 h-20 mx-auto rounded-full bg-accent-bg flex items-center justify-center">
                      <svg className="w-10 h-10 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-black text-heading mb-2">Проверьте почту</h3>
                      <p className="text-sm text-body leading-relaxed">
                        Мы отправили письмо с подтверждением на<br/>
                        <span className="text-heading font-bold">{email}</span>
                      </p>
                    </div>

                    <div className="glass-panel-sunken p-4 text-left space-y-2">
                      <p className="text-xs text-body">• Откройте письмо и нажмите на ссылку подтверждения</p>
                      <p className="text-xs text-body">• Проверьте папку "Спам", если письмо не пришло</p>
                      <p className="text-xs text-body">• Письмо может прийти в течение 1-2 минут</p>
                    </div>

                    <button
                      onClick={resendConfirmation}
                      disabled={resendLoading || resendTimer > 0}
                      className={`w-full py-4 rounded-xl text-sm font-bold transition-all ${
                        resendLoading || resendTimer > 0
                          ? 'bg-surface text-foreground-muted cursor-not-allowed' 
                          : 'btn-glass'
                      }`}
                    >
                      {resendLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Отправка...
                        </span>
                      ) : resendTimer > 0 ? (
                        `Повторная отправка через ${resendTimer} сек.`
                      ) : (
                        'Отправить письмо повторно'
                      )}
                    </button>

                    <button
                      onClick={() => { setMode('login'); setPassword(''); }}
                      className="btn-glass w-full py-3 text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Вернуться к входу
                    </button>
                  </div>
                ) : mode === 'forgot-password' ? (
                  <form onSubmit={(e) => { e.preventDefault(); handleForgotPassword(); }} className="space-y-6 animate-fade-in">
                    <div className="flex items-center gap-4 mb-8">
                      <button
                        type="button"
                        onClick={() => setMode('login')}
                        className="text-foreground-muted hover:text-heading transition"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                      </button>
                      <h2 className="text-xl font-bold text-heading">Восстановление пароля</h2>
                    </div>

                    <p className="text-sm text-body leading-relaxed">
                      Введите email или никнейм от вашего аккаунта. Мы отправим письмо со ссылкой для сброса пароля.
                    </p>

                    <div>
                      <label className="text-label block mb-2">Email или никнейм</label>
                      <input 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        placeholder="email@example.com или ваш никнейм" 
                        className="input-glass w-full px-4 py-3.5 text-sm"
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={loading || !email}
                      className={`btn-primary w-full py-4 text-xs font-black uppercase tracking-widest ${
                        loading || !email ? 'opacity-50 cursor-wait' : ''
                      }`}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Отправка...
                        </span>
                      ) : 'Отправить письмо'}
                    </button>
                  </form>
                ) : (
                  <>
                    {/* Табы */}
                    <div className="flex gap-2 mb-8 glass-panel-sunken p-1.5 rounded-full">
                      <button 
                        onClick={() => setMode('login')} 
                        className={`flex-1 py-3 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${
                          mode === 'login' 
                            ? 'bg-accent text-white shadow-lg shadow-accent/30' 
                            : 'text-foreground-muted hover:text-heading'
                        }`}
                      >
                        Войти
                      </button>
                      <button 
                        onClick={() => setMode('signup')} 
                        className={`flex-1 py-3 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${
                          mode === 'signup' 
                            ? 'bg-accent text-white shadow-lg shadow-accent/30' 
                            : 'text-foreground-muted hover:text-heading'
                        }`}
                      >
                        Регистрация
                      </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                      {mode === 'signup' && (
                        <div className="animate-fade-in">
                          <label className="text-label block mb-2">Никнейм</label>
                          <input 
                            value={nickname} 
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="Твой псевдоним" 
                            className="input-glass w-full px-4 py-3.5 text-sm"
                          />
                        </div>
                      )}
                      
                      <div>
                        <label className="text-label block mb-2">Email</label>
                        <input 
                          required 
                          value={email} 
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="email@example.com" 
                          type="email" 
                          className="input-glass w-full px-4 py-3.5 text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="text-label block mb-2">Пароль</label>
                        <input 
                          required 
                          value={password} 
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••" 
                          type="password" 
                          className="input-glass w-full px-4 py-3.5 text-sm"
                        />
                      </div>
                      
                      <button 
                        type="submit" 
                        disabled={loading} 
                        className={`btn-primary w-full py-4 text-xs font-black uppercase tracking-widest mt-6 ${
                          loading ? 'opacity-50 cursor-wait' : ''
                        }`}
                      >
                        {loading ? 'Загрузка...' : (mode === 'login' ? 'Войти в аккаунт' : 'Создать аккаунт')}
                      </button>

                      {mode === 'login' && (
                        <div className="text-center mt-4">
                          <button
                            type="button"
                            onClick={() => setMode('forgot-password')}
                            className="text-sm text-foreground-muted hover:text-accent transition"
                          >
                            Забыли пароль?
                          </button>
                        </div>
                      )}
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
