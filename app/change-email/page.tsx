'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

// Перевод ошибок Supabase
function translateError(message: string): string {
  const translations: Record<string, string> = {
    'Email rate limit exceeded': 'Превышен лимит запросов. Подождите несколько минут.',
    'rate limit exceeded': 'Превышен лимит запросов. Подождите несколько минут.',
    'Invalid token': 'Недействительная или истекшая ссылка',
    'Token expired': 'Срок действия ссылки истёк',
    'Email link is invalid or has expired': 'Ссылка недействительна или истекла',
  };
  
  for (const [eng, rus] of Object.entries(translations)) {
    if (message.toLowerCase().includes(eng.toLowerCase())) {
      return rus;
    }
  }
  return message;
}

export default function ChangeEmailPage() {
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [notification, setNotification] = useState<{show: boolean; message: string; type: 'success' | 'error'}>({show: false, message: '', type: 'success'});
  const [newEmail, setNewEmail] = useState('');
  const router = useRouter();

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({show: true, message, type});
    setTimeout(() => setNotification(prev => ({...prev, show: false})), 4000);
  };

  useEffect(() => {
    setMounted(true);
    
    let processed = false;
    let timeoutId: NodeJS.Timeout;
    
    const processEmailChange = async () => {
      if (processed) return;
      if (!supabase) {
        showNotification('Ошибка подключения. Перезагрузите страницу.', 'error');
        setLoading(false);
        return;
      }
      
      try {
        console.log('=== Processing email change ===');
        console.log('Full URL:', window.location.href);
        console.log('Hash:', window.location.hash);
        console.log('Search:', window.location.search);
        
        // Проверяем ошибку в query параметрах (после ?)
        const urlParams = new URLSearchParams(window.location.search);
        const queryError = urlParams.get('error');
        const queryErrorCode = urlParams.get('error_code');
        const queryErrorDesc = urlParams.get('error_description');
        
        if (queryError || queryErrorCode || queryErrorDesc) {
          console.log('Error in query params:', queryError, queryErrorCode, queryErrorDesc);
          let errorMsg = 'Ссылка недействительна или истекла';
          if (queryErrorCode === 'otp_expired' || queryErrorDesc?.includes('expired')) {
            errorMsg = 'Ссылка недействительна или истекла. Запросите смену email повторно.';
          } else if (queryErrorCode === 'access_denied') {
            errorMsg = 'Доступ запрещён. Попробуйте запросить смену email повторно.';
          } else {
            errorMsg = translateError(queryErrorDesc || queryErrorCode || queryError || errorMsg);
          }
          showNotification(errorMsg, 'error');
          setLoading(false);
          setTimeout(() => router.push('/cabinet'), 3000);
          return;
        }
        
        // Проверяем токен в URL hash (после #)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        const errorCode = hashParams.get('error_code');
        const errorDescription = hashParams.get('error_description');
        
        // Проверяем ошибку в hash (rate limit и т.д.)
        if (errorCode || errorDescription) {
          console.log('Error in URL hash:', errorCode, errorDescription);
          const errorMsg = translateError(errorDescription || errorCode || 'Неизвестная ошибка');
          showNotification(errorMsg, 'error');
          setLoading(false);
          setTimeout(() => router.push('/cabinet'), 3000);
          return;
        }
        
        console.log('Type:', type);
        console.log('Has access token:', !!accessToken);
        
        if (accessToken && (type === 'email_change' || type === 'email')) {
          console.log('Setting session with token...');
          
          // Устанавливаем сессию с токеном
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          });
          
          if (error) {
            console.error('Session error:', error);
            throw error;
          }
          
          console.log('Session data:', data);
          console.log('User email:', data.user?.email);
          console.log('User new_email:', data.user?.new_email);
          console.log('User metadata:', data.user?.user_metadata);
          
          // Получаем новый email - может быть в разных местах
          const confirmedEmail = data.user?.email || 
                                 data.user?.new_email || 
                                 data.user?.user_metadata?.new_email ||
                                 '';
          
          if (confirmedEmail) {
            processed = true;
            setNewEmail(confirmedEmail);
            setLoading(false);
            
            // Обновляем email в profiles
            if (data.user?.id) {
              const { error: profileError } = await supabase
                .from('profiles')
                .update({ 
                  email: confirmedEmail,
                  updated_at: new Date().toISOString()
                })
                .eq('id', data.user.id);
              
              if (profileError) {
                console.error('Profile update error:', profileError);
              } else {
                console.log('Profile email updated to:', confirmedEmail);
              }
            }
            
            showNotification(`Email успешно изменён на ${confirmedEmail}`, 'success');
            
            // Очищаем URL от токенов
            window.history.replaceState({}, '', '/change-email');
            
            setTimeout(() => router.push('/cabinet'), 2500);
            return;
          }
        }
        
        // Fallback: проверяем события auth
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth event:', event);
          
          if (event === 'USER_UPDATED' && session?.user && !processed && supabase) {
            processed = true;
            const updatedEmail = session.user.email || '';
            setNewEmail(updatedEmail);
            setLoading(false);
            
            // Обновляем профиль
            await supabase
              .from('profiles')
              .update({ email: updatedEmail })
              .eq('id', session.user.id);
            
            showNotification(`Email успешно изменён на ${updatedEmail}`, 'success');
            setTimeout(() => router.push('/cabinet'), 2500);
          }
        });
        
        // Проверяем текущую сессию
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && !processed) {
          // Проверяем, есть ли pending email change
          const pendingEmail = session.user.new_email || session.user.user_metadata?.new_email;
          
          if (pendingEmail) {
            console.log('Pending email found:', pendingEmail);
            // Email ещё не подтверждён полностью
            setLoading(false);
            showNotification('Ожидаем подтверждение нового email...', 'success');
          } else {
            processed = true;
            setNewEmail(session.user.email || '');
            setLoading(false);
            showNotification('Email подтверждён', 'success');
            setTimeout(() => router.push('/cabinet'), 2500);
          }
          return;
        }
        
        // Если ничего не найдено после 3 секунд
        await new Promise(resolve => setTimeout(resolve, 3000));
        if (!processed) {
          setLoading(false);
          showNotification('Ссылка недействительна или истекла', 'error');
          setTimeout(() => router.push('/auth'), 2500);
        }
        
        return () => {
          subscription.unsubscribe();
        };
        
      } catch (err: any) {
        console.error('Error processing email change:', err);
        setLoading(false);
        if (!processed) {
          // Переводим английские ошибки
          let errorMsg = err.message || 'Неизвестная ошибка';
          if (errorMsg.includes('invalid') || errorMsg.includes('expired')) {
            errorMsg = 'Ссылка недействительна или истекла';
          }
          showNotification('Ошибка: ' + errorMsg, 'error');
          setTimeout(() => router.push('/cabinet'), 2500);
        }
      }
    };

    processEmailChange();

    // Таймаут на случай если ничего не произойдет
    timeoutId = setTimeout(() => {
      if (!processed) {
        setLoading(false);
        showNotification('Превышено время ожидания', 'error');
        setTimeout(() => router.push('/cabinet'), 2500);
      }
    }, 10000); // 10 секунд максимум

    return () => {
      clearTimeout(timeoutId);
    };
  }, [router]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#08080a] via-[#0c0c0e] to-[#08080a] flex items-center justify-center p-4 relative overflow-hidden">
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
        <div className="bg-[#0c0c0e]/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6050ba] to-[#9d8df1] mb-6">
            {loading ? (
              <svg className="animate-spin h-8 w-8 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )}
          </div>
          <h1 className="text-2xl font-bold mb-2 text-white">
            {loading ? 'Подтверждение email' : 'Email подтверждён'}
          </h1>
          <p className="text-zinc-400">
            {loading ? 'Проверка ссылки подтверждения...' : (
              <>
                Ваш новый email: <span className="text-white font-semibold">{newEmail}</span>
                <br />
                <span className="text-xs mt-2 block">Перенаправление в кабинет...</span>
              </>
            )}
          </p>
        </div>
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
