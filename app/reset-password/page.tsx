'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [notification, setNotification] = useState<{show: boolean; message: string; type: 'success' | 'error'}>({show: false, message: '', type: 'success'});
  const [isValidToken, setIsValidToken] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    setIsValidToken(true); // Показываем форму сразу
    
    let cleanup = false;

    const handleAuthChange = async () => {
      if (!supabase) return;
      // Проверяем есть ли сессия
      const { data: { session } } = await supabase.auth.getSession();
      // Не перенаправляем сразу, даем возможность работать с формой
    };

    handleAuthChange();

    return () => {
      cleanup = true;
    };
  }, [router]);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({show: true, message, type});
    setTimeout(() => setNotification(prev => ({...prev, show: false})), 4000);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      showNotification('Пароли не совпадают', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showNotification('Пароль должен быть не менее 6 символов', 'error');
      return;
    }

    setLoading(true);
    
    try {
      // Проверяем URL параметры (query) и hash параметры
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      const tokenHash = searchParams.get('token') || hashParams.get('access_token');
      
      if (!tokenHash) {
        throw new Error('Токен восстановления не найден в URL. Запросите новую ссылку.');
      }
      
      // Отправляем запрос на серверный API endpoint
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: tokenHash,
          newPassword: newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Не удалось обновить пароль');
      }

      showNotification('Пароль обновлен успешно', 'success');
      
      setTimeout(() => {
        router.push('/auth');
      }, 2000);
      
    } catch (err: any) {
      showNotification(err.message || 'Не удалось сменить пароль. Запросите новую ссылку.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b from-[#08080a] via-[#0c0c0e] to-[#08080a] flex justify-center p-4 relative overflow-hidden ${
      isValidToken ? 'items-end pb-8' : 'items-center'
    }`}>
      {/* Animated background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#6050ba] rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#9d8df1] rounded-full blur-[120px] animate-pulse delay-1000"></div>
      </div>

      {/* Notification */}
      {notification.show && (
        <div 
          className="fixed bottom-6 right-6 z-[9999] animate-slideInRight"
        >
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300 ${
            notification.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            {notification.type === 'success' ? (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="font-medium text-sm">{notification.message}</span>
          </div>
        </div>
      )}

      <div className="relative z-10 w-full max-w-md">
        {!isValidToken ? (
          <div className="bg-[#0c0c0e]/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6050ba] to-[#9d8df1] mb-6">
              <svg className="animate-spin h-8 w-8 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="text-zinc-400">Проверка ссылки восстановления...</p>
          </div>
        ) : (
        <div className="bg-[#0c0c0e]/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6050ba] to-[#9d8df1] mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2 text-white">Новый пароль</h1>
            <p className="text-sm text-zinc-400">Придумайте надёжный пароль для вашего аккаунта</p>
          </div>

          {/* Form */}
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-2">
                Новый пароль
              </label>
              <input 
                required
                type="password"
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                placeholder="Минимум 6 символов" 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-[#6050ba] focus:bg-white/10 transition placeholder-zinc-500"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-2">
                Подтвердите пароль
              </label>
              <input 
                required
                type="password"
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                placeholder="Повторите пароль" 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-[#6050ba] focus:bg-white/10 transition placeholder-zinc-500"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading || !newPassword || !confirmPassword}
              className={`w-full py-4 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all mt-6 text-white ${
                loading || !newPassword || !confirmPassword
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
                  Сохранение...
                </span>
              ) : 'Изменить пароль'}
            </button>
          </form>

          {/* Info block */}
          <div className="mt-6 p-4 bg-white/[0.03] border border-white/10 rounded-xl">
            <p className="text-xs text-zinc-400 leading-relaxed">
              • Используйте минимум 6 символов<br/>
              • Используйте сочетание букв, цифр и символов<br/>
              • Не используйте простые пароли
            </p>
          </div>
        </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-slideInRight {
          animation: slideInRight 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
