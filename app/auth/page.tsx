"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import { SilverStarsGroup } from '@/components/ui/SilverStars';
import { supabase } from '@/lib/supabase/client';

// Летающие светящиеся частицы
const FloatingParticles = () => {
  const [particles, setParticles] = useState<any[]>([]);
  
  useEffect(() => {
    setParticles(Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      duration: 20 + Math.random() * 30,
      delay: Math.random() * -20,
      opacity: 0.3 + Math.random() * 0.5,
    })));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full bg-[#9d8df1]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            boxShadow: '0 0 10px #9d8df1, 0 0 20px #6050ba',
            animation: `particle-fly ${p.duration}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes particle-fly {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          25% { transform: translate(60px, -80px) scale(1.2); opacity: 0.8; }
          50% { transform: translate(-40px, 60px) scale(0.8); opacity: 0.5; }
          75% { transform: translate(80px, 40px) scale(1.1); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default function AuthPage() {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
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
      // Проверяем является ли это email или никнейм
      let userEmail = email;
      if (!email.includes('@')) {
        // Это никнейм - ищем email по нику
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

      // Отправляем через наш серверный API
      const response = await fetch('/api/send-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Не удалось отправить письмо');
      }

      showNotification('Письмо со ссылкой для сброса пароля отправлено на почту', 'success');
      setMode('login');
      setEmail('');
    } catch (err: any) {
      console.error('Ошибка сброса пароля:', err);
      showNotification(err.message || 'Не удалось отправить письмо', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resendConfirmation = async () => {
    if (!supabase || !email || resendTimer > 0) return;
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      if (error) throw error;
      showNotification('Письмо отправлено повторно. Проверьте почту и папку "Спам".', 'success');
      setResendTimer(60); // 60 секунд до следующей отправки
    } catch (err: any) {
      console.error('Ошибка повторной отправки:', err);
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
        // РЕГИСТРАЦИЯ с обязательным подтверждением email
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
          // Если ошибка говорит что пользователь уже существует
          if (authError.message?.includes('User already registered') || 
              authError.message?.includes('already registered')) {
            // Пробуем отправить письмо повторно
            const { error: resendError } = await supabase.auth.resend({
              type: 'signup',
              email: email,
            });
            
            if (resendError) {
              throw new Error('Email уже зарегистрирован. Проверьте почту или восстановите пароль.');
            }
            
            showNotification('Письмо с подтверждением отправлено повторно. Проверьте почту.', 'success');
          } else {
            throw authError;
          }
        }
        
        // Выходим из системы (на случай если автоматически вошли)
        await supabase.auth.signOut();
        
        // Переходим на экран ожидания подтверждения
        setMode('waiting-confirmation');
        setPassword('');
        
      } else if (mode === 'login') {
        // ВХОД - проверяем подтверждение email
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
          // Если ошибка про неподтверждённый email
          if (error.message?.includes('Email not confirmed')) {
            await supabase.auth.signOut();
            setMode('waiting-confirmation');
            return;
          }
          throw error;
        }
        
        // Дополнительная проверка подтверждения email
        if (data.user && !data.user.email_confirmed_at && !data.user.confirmed_at) {
          // Email НЕ подтверждён - блокируем вход!
          await supabase.auth.signOut();
          setMode('waiting-confirmation');
          return;
        }
        
        // Email подтверждён - пускаем в систему
        router.push('/cabinet');
      }
    } catch (err: any) {
      console.error('Ошибка авторизации:', err);
      
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
      {/* Анимированный фон с градиентами */}
      <div 
        className="fixed inset-0"
        style={{
          background: `
            radial-gradient(ellipse 100% 80% at 50% -20%, rgba(96, 80, 186, 0.5) 0%, transparent 50%),
            radial-gradient(ellipse 80% 60% at 100% 100%, rgba(157, 141, 241, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse 80% 60% at 0% 100%, rgba(96, 80, 186, 0.25) 0%, transparent 50%),
            #08080a
          `,
          zIndex: 0
        }}
      />

      {/* Летающие частицы */}
      <FloatingParticles />
      
      {/* Серебряные 3D звёзды */}
      <SilverStarsGroup variant="auth" />

      {/* Уведомление */}
      {notification.show && (
        <div className="fixed top-6 right-6 z-[9999] animate-[slideIn_0.4s_cubic-bezier(0.68,-0.55,0.265,1.55)]">
          <div className={`px-5 py-3.5 rounded-2xl backdrop-blur-2xl border-2 shadow-2xl max-w-[380px] ${
            notification.type === 'success' 
              ? 'bg-gradient-to-br from-emerald-500/20 to-green-600/20 border-emerald-400/50 shadow-emerald-500/20' 
              : 'bg-gradient-to-br from-red-500/20 to-rose-600/20 border-red-400/50 shadow-red-500/20'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                notification.type === 'success' 
                  ? 'bg-emerald-500/30 text-emerald-300' 
                  : 'bg-red-500/30 text-red-300'
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
              <div className="flex-1">
                <p className="text-sm text-white font-medium leading-relaxed">{notification.message}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        @keyframes slideIn {
          from { 
            transform: translateX(400px) scale(0.8); 
            opacity: 0; 
          }
          to { 
            transform: translateX(0) scale(1); 
            opacity: 1; 
          }
        }
      `}</style>

      {/* Кнопка "На главную" - фиксированная в верхнем левом углу */}
      <div className="fixed top-6 left-6 z-50">
        <Link 
          href="/feed" 
          className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/20 rounded-xl text-sm font-bold uppercase tracking-widest transition-all hover:scale-105 shadow-lg text-white hover:text-white"
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
              className={`h-24 w-auto object-contain drop-shadow-[0_0_50px_rgba(96,80,186,0.7)] ${isLight ? 'invert brightness-0' : ''}`}
            />
          </div>

          {/* Левая часть: большое лого фиксированной ширины (только desktop) */}
          <div className="hidden lg:block w-[500px] flex-shrink-0 pl-8">
            <div className="flex items-center justify-start">
              <img 
                src="/logo.png" 
                alt="thqlabel" 
                className={`h-40 w-auto object-contain drop-shadow-[0_0_80px_rgba(96,80,186,0.8)] ${isLight ? 'invert brightness-0' : ''}`}
                style={{ transform: 'scale(4)', transformOrigin: 'left center' }}
              />
            </div>
          </div>

          {/* Правая часть: форма нормального размера */}
          <div className="flex-1 flex items-center justify-center px-8 lg:px-12 w-full">
            <div className="w-full max-w-md lg:ml-auto lg:mr-12">
              {/* Форма авторизации/регистрации */}
              <div 
                className="bg-[#0c0c0e]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10"
                style={{ boxShadow: '0 0 80px rgba(96, 80, 186, 0.15)' }}
              >
                {mode === 'waiting-confirmation' ? (
                  /* Экран ожидания подтверждения email */
                  <div className="text-center space-y-6">
                    <div className="w-20 h-20 mx-auto rounded-full bg-[#6050ba]/10 flex items-center justify-center">
                      <svg className="w-10 h-10 text-[#6050ba]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-black text-white mb-2">Проверьте почту</h3>
                      <p className="text-sm text-zinc-400 leading-relaxed">
                        Мы отправили письмо с подтверждением на<br/>
                        <span className="text-white font-bold">{email}</span>
                      </p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left space-y-2">
                      <p className="text-xs text-zinc-400">• Откройте письмо и нажмите на ссылку подтверждения</p>
                      <p className="text-xs text-zinc-400">• Проверьте папку "Спам", если письмо не пришло</p>
                      <p className="text-xs text-zinc-400">• Письмо может прийти в течение 1-2 минут</p>
                    </div>

                    <button
                      onClick={resendConfirmation}
                      disabled={resendLoading || resendTimer > 0}
                      className={`w-full py-4 rounded-xl text-sm font-bold transition-all ${
                        resendLoading || resendTimer > 0
                          ? 'bg-white/5 text-zinc-500 cursor-not-allowed' 
                          : 'bg-white/10 hover:bg-white/15 text-white border border-white/20'
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
                      onClick={() => {
                        setMode('login');
                        setPassword('');
                      }}
                      className="w-full py-3 rounded-xl text-sm font-medium transition-all bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Вернуться к входу
                    </button>
                  </div>
                ) : mode === 'forgot-password' ? (
                  <form onSubmit={(e) => { e.preventDefault(); handleForgotPassword(); }} className="space-y-6 animate-[fadeIn_0.3s_ease-in-out]">
                    <div className="flex items-center gap-4 mb-8">
                      <button
                        type="button"
                        onClick={() => setMode('login')}
                        className="text-zinc-400 hover:text-white transition"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                      </button>
                      <h2 className="text-xl font-bold text-white">Восстановление пароля</h2>
                    </div>

                    <p className="text-sm text-zinc-400 leading-relaxed">
                      Введите email или никнейм от вашего аккаунта. Мы отправим письмо со ссылкой для сброса пароля.
                    </p>

                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-2">Email или никнейм</label>
                      <input 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        placeholder="email@example.com или ваш никнейм" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-[#6050ba] focus:bg-white/10 transition placeholder-zinc-500"
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={loading || !email}
                      className={`w-full py-4 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all text-white ${
                        loading || !email
                          ? 'bg-[#6050ba]/30 cursor-wait' 
                          : 'bg-gradient-to-r from-[#6050ba] to-[#7060ca] hover:shadow-lg hover:shadow-[#6050ba]/40'
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
                <div className="flex gap-2 mb-8 bg-white/[0.03] p-1.5 rounded-full">
                  <button 
                    onClick={() => setMode('login')} 
                    className={`flex-1 py-3 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${
                      mode === 'login' 
                        ? 'bg-[#6050ba] text-white shadow-lg shadow-[#6050ba]/30' 
                        : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    Войти
                  </button>
                  <button 
                    onClick={() => setMode('signup')} 
                    className={`flex-1 py-3 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${
                      mode === 'signup' 
                        ? 'bg-[#6050ba] text-white shadow-lg shadow-[#6050ba]/30' 
                        : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    Регистрация
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {mode === 'signup' && (
                    <div className="animate-[fadeIn_0.3s_ease-in-out]">
                      <label className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-2">Никнейм</label>
                      <input 
                        value={nickname} 
                        onChange={(e) => setNickname(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === 'Escape') {
                            e.currentTarget.blur();
                          }
                        }}
                        onBlur={(e) => e.target.blur()}
                        placeholder="Твой псевдоним" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-[#6050ba] focus:bg-white/10 transition placeholder-zinc-500"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-2">Email</label>
                    <input 
                      required 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'Escape') {
                          e.currentTarget.blur();
                        }
                      }}
                      onBlur={(e) => e.target.blur()}
                      placeholder="email@example.com" 
                      type="email" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-[#6050ba] focus:bg-white/10 transition placeholder-zinc-500"
                    />
                  </div>
                  
                  <div>
                    <label className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-2">Пароль</label>
                    <input 
                      required 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'Escape') {
                          e.currentTarget.blur();
                        }
                      }}
                      onBlur={(e) => e.target.blur()}
                      placeholder="••••••••" 
                      type="password" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-[#6050ba] focus:bg-white/10 transition placeholder-zinc-500"
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className={`w-full py-4 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all mt-6 text-white ${
                      loading 
                        ? 'bg-[#6050ba]/30 cursor-wait' 
                        : 'bg-[#6050ba] hover:bg-[#7060ca] hover:scale-[1.02] shadow-lg shadow-[#6050ba]/30'
                    }`}
                  >
                    {loading ? 'Загрузка...' : (mode === 'login' ? 'Войти в аккаунт' : 'Создать аккаунт')}
                  </button>

                  {mode === 'login' && (
                    <div className="text-center mt-4">
                      <button
                        type="button"
                        onClick={() => setMode('forgot-password')}
                        className="text-sm text-zinc-500 hover:text-[#6050ba] transition"
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