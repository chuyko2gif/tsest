"use client";
import React, { useState, useEffect, useCallback, useMemo, memo, lazy, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Toast from '@/components/ui/Toast';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase/client';
import { AdminMobileNav } from './components/ui';

// Ленивая загрузка тяжёлых компонентов для ускорения первоначальной загрузки
const AnimatedBackground = dynamic(() => import('@/components/ui/AnimatedBackground'), { 
  ssr: false,
  loading: () => null 
});

// Ленивая загрузка вкладок - загружаются только при активации
const ReleasesModeration = lazy(() => import('./components/releases/ReleasesModeration'));
const ContractsTab = lazy(() => import('./components/contracts/ContractsTab'));
const ArchiveTab = lazy(() => import('./components/archive/ArchiveTab'));
const NewsTab = lazy(() => import('./components/news/NewsTab'));
const UsersTab = lazy(() => import('./components/users/UsersTab'));
const AdminTicketsPanel = lazy(() => import('./components/tickets/AdminTicketsPanel'));
const WithdrawalsTab = lazy(() => import('./components/withdrawals/WithdrawalsTab'));
const ReportsTab = lazy(() => import('./components/reports/ReportsTab'));
const TransactionsTab = lazy(() => import('./components/finance/TransactionsTab'));

// Компонент загрузки для Suspense
const TabLoader = memo(() => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6050ba]"></div>
  </div>
));
TabLoader.displayName = 'TabLoader';

// Компонент красивой ошибки доступа
const AccessDeniedScreen = memo(({ 
  userEmail, 
  userRole, 
  type,
  onRedirect 
}: { 
  userEmail?: string; 
  userRole?: string;
  type: 'not_authorized' | 'not_admin';
  onRedirect: () => void;
}) => {
  const [countdown, setCountdown] = useState(5);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onRedirect();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onRedirect]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <AnimatedBackground />
      
      {/* Декоративные элементы */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      <div className="relative z-10 max-w-md w-full mx-4">
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl animate-fade-up">
          {/* Иконка */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center border border-red-500/30 animate-pulse">
              <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          
          {/* Заголовок */}
          <h1 className="text-2xl font-black text-center mb-2 text-white">
            Доступ запрещён
          </h1>
          
          <p className="text-zinc-400 text-center mb-6">
            {type === 'not_authorized' 
              ? 'Для доступа к админ-панели необходима авторизация'
              : 'У вас недостаточно прав для доступа к админ-панели'
            }
          </p>
          
          {/* Информация о пользователе */}
          {type === 'not_admin' && (
            <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
              <div className="space-y-2 text-sm">
                {userEmail && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Email:</span>
                    <span className="text-zinc-300 font-medium">{userEmail}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-500">Ваша роль:</span>
                  <span className={`font-medium ${userRole === 'exclusive' ? 'text-yellow-400' : 'text-zinc-400'}`}>
                    {userRole === 'exclusive' ? '◆ Exclusive' : userRole === 'basic' ? '○ Basic' : userRole || 'Не определена'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Требуется:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-semibold">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6z"/>
                      </svg>
                      Admin
                    </span>
                    <span className="text-zinc-600">или</span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L9 9H2l6 5-2 7 6-4 6 4-2-7 6-5h-7z"/>
                      </svg>
                      Owner
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Таймер */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-white/5 rounded-full px-4 py-2 border border-white/10">
              <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              <span className="text-zinc-400 text-sm">
                Перенаправление через <span className="text-white font-bold">{countdown}</span> сек.
              </span>
            </div>
          </div>
          
          {/* Кнопки */}
          <div className="flex gap-3">
            {type === 'not_authorized' ? (
              <button
                onClick={onRedirect}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-[#6050ba] to-[#8070da] hover:from-[#7060ca] hover:to-[#9080ea] rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-white shadow-lg shadow-purple-500/20"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Войти в аккаунт
              </button>
            ) : (
              <>
                <button
                  onClick={onRedirect}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#6050ba] to-[#8070da] hover:from-[#7060ca] hover:to-[#9080ea] rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-white shadow-lg shadow-purple-500/20"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  В кабинет
                </button>
              </>
            )}
          </div>
          
          {/* Подсказка */}
          {type === 'not_admin' && (
            <div className="mt-6 flex items-start gap-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-blue-200 leading-relaxed">
                  <span className="font-semibold text-blue-100">Нужны права администратора?</span>
                  <br />
                  <span className="text-blue-300/80">Свяжитесь с владельцем системы для получения доступа к админ-панели</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
AccessDeniedScreen.displayName = 'AccessDeniedScreen';

type Tab = 'releases' | 'contracts' | 'archive' | 'users' | 'news' | 'tickets' | 'withdrawals' | 'reports' | 'transactions';

export default function AdminPage() {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  const searchParams = useSearchParams();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [accessDenied, setAccessDenied] = useState<{ type: 'not_authorized' | 'not_admin'; email?: string; role?: string } | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'owner'>('admin');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [initialTicketId, setInitialTicketId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (typeof window !== 'undefined') {
      // Сначала проверяем URL параметр tab
      const urlParams = new URLSearchParams(window.location.search);
      const tabFromUrl = urlParams.get('tab') as Tab;
      const validTabs: Tab[] = ['releases', 'contracts', 'archive', 'users', 'news', 'tickets', 'withdrawals', 'reports', 'transactions'];
      if (tabFromUrl && validTabs.includes(tabFromUrl)) {
        return tabFromUrl;
      }
      // Затем localStorage
      const saved = localStorage.getItem('adminActiveTab') as Tab;
      // Проверяем, что сохраненная вкладка валидна, иначе открываем 'users'
      if (saved && validTabs.includes(saved)) {
        return saved;
      }
      return 'users';
    }
    return 'users';
  });
  const router = useRouter();
  
  const [toast, setToast] = useState<{show: boolean; message: string; type: 'success' | 'error' | 'info'}>({
    show: false,
    message: '',
    type: 'success'
  });

  // Читаем ticket ID из URL при монтировании
  useEffect(() => {
    const ticketParam = searchParams.get('ticket');
    if (ticketParam) {
      setInitialTicketId(ticketParam);
      // Сбрасываем URL параметр после чтения
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminActiveTab', activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    // Принудительное обновление данных при загрузке
    router.refresh();
    
    const checkAdmin = async () => {
      try {
        if (!supabase) {
          setAccessDenied({ type: 'not_authorized' });
          setCheckingAuth(false);
          return;
        }
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user || !user.email) {
          setAccessDenied({ type: 'not_authorized' });
          setCheckingAuth(false);
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, email')
          .eq('email', user.email)
          .single();

        if (profileError || !profile || typeof profile !== 'object' || !('role' in profile) || ((profile as any).role !== 'admin' && (profile as any).role !== 'owner')) {
          const roleInfo = (profile && typeof profile === 'object' && 'role' in profile) ? (profile as any).role : undefined;
          setAccessDenied({ type: 'not_admin', email: user.email, role: roleInfo });
          setCheckingAuth(false);
          return;
        }

        setUserEmail(user.email || null);
        setCurrentUser({ id: user.id, ...(profile as any), email: user.email });
        setCurrentUserRole((profile as any).role as 'admin' | 'owner');
        setCheckingAuth(false);
      } catch (e) {
        setAccessDenied({ type: 'not_authorized' });
        setCheckingAuth(false);
      }
    };
    checkAdmin();
  }, [router]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'users', label: 'Пользователи', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
    { id: 'releases', label: 'Релизы', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg> },
    { id: 'tickets', label: 'Тикеты', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg> },
    { id: 'transactions', label: 'Транзакции', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
    { id: 'withdrawals', label: 'Заявки на вывод', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg> },
    { id: 'news', label: 'Новости', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg> },
    { id: 'contracts', label: 'Договоры', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { id: 'reports', label: 'Отчёты', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
  ];

  // Показываем красивый экран отказа в доступе
  if (accessDenied) {
    return (
      <AccessDeniedScreen
        type={accessDenied.type}
        userEmail={accessDenied.email}
        userRole={accessDenied.role}
        onRedirect={() => router.push(accessDenied.type === 'not_authorized' ? '/auth' : '/cabinet')}
      />
    );
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <AnimatedBackground />
        <div className="text-zinc-600 text-sm animate-pulse relative z-10">Проверка доступа...</div>
      
      <Toast 
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({...prev, show: false}))}
      />
      
      </div>
    );
  }

  return (
    <div className={`min-h-screen pt-4 sm:pt-6 relative ${isLight ? 'text-gray-800' : 'text-white'}`}>
      <AnimatedBackground />
      
      {/* Mobile Navigation - только на мобильных */}
      <AdminMobileNav
        currentTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as Tab)}
        tabs={tabs}
        userEmail={userEmail}
        userRole={currentUserRole}
        isLight={isLight}
      />
      
      <div className="max-w-[1600px] mx-auto p-3 sm:p-4 md:p-5 lg:p-6 flex flex-col lg:flex-row gap-4 sm:gap-5 lg:gap-6 items-stretch relative z-10">
        
        {/* Sidebar - скрыт на мобильных, управляется через AdminMobileNav */}
        {!sidebarCollapsed && (
        <aside 
          className={`hidden lg:flex backdrop-blur-xl rounded-2xl sm:rounded-3xl flex-col lg:sticky lg:top-4 shadow-2xl transition-all duration-500 ease-in-out w-full lg:w-64 p-3 sm:p-4 lg:p-5 lg:h-[calc(100vh-2rem)] overflow-hidden ${
            isLight 
              ? 'bg-white/50 border border-white/60' 
              : 'bg-[#0d0d0f]/40 border border-white/10'
          }`} 
          style={{ 
            boxShadow: isLight ? '0 8px 32px rgba(96, 80, 186, 0.1)' : '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
          }}
        >
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between gap-2 sm:gap-3 mb-2">
              <img 
                src="/logo.png" 
                alt="thqlabel" 
                className="h-10 sm:h-12 md:h-16 w-auto"
                style={{ 
                  filter: isLight 
                    ? 'brightness(0) saturate(100%)' 
                    : 'drop-shadow(0 0 25px rgba(160,141,241,0.8))' 
                }}
              />
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setSidebarCollapsed(true)}
                  className={`hidden lg:flex w-10 h-10 md:w-11 md:h-11 rounded-2xl transition-all items-center justify-center shrink-0 group ${
                    isLight 
                      ? 'bg-gray-100 hover:bg-gray-200 border border-gray-200 hover:border-purple-500/50' 
                      : 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50'
                  }`}
                  title="Скрыть панель"
                >
                  <svg className={`w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform ${isLight ? 'text-gray-600' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button 
                  onClick={() => router.push('/cabinet')}
                  className="w-14 h-14 sm:w-10 sm:h-10 md:w-11 md:h-11 bg-gradient-to-br from-violet-500/90 to-indigo-600/90 border-2 border-violet-400/40 rounded-2xl hover:from-violet-400 hover:to-indigo-500 hover:border-violet-300/60 transition-all flex items-center justify-center shrink-0 group shadow-2xl shadow-violet-500/30 hover:shadow-violet-400/50 hover:scale-105"
                  title="Назад в кабинет"
                >
                  <svg className="w-7 h-7 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </button>
              </div>
            </div>
            <span 
              className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 animate-pulse"
              style={{ 
                filter: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.6)) drop-shadow(0 0 12px rgba(236, 72, 153, 0.4))',
                backgroundSize: '200% 100%',
                animation: 'shimmer 3s ease-in-out infinite'
              }}
            >
              Админ панель
            </span>
            <p className={`text-[9px] sm:text-[10px] truncate mt-1 ${isLight ? 'text-gray-500' : 'text-zinc-600'}`}>
              {userEmail}
            </p>
            <div className="mt-1.5 sm:mt-2">
              <span className={`text-[8px] sm:text-[9px] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-bold uppercase ${
                currentUserRole === 'owner' 
                  ? 'bg-purple-500/20 text-purple-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {currentUserRole === 'owner' ? '♛ OWNER' : '★ ADMIN'}
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1 sm:space-y-1.5 flex-1 overflow-x-auto lg:overflow-visible">
            <div className="flex lg:flex-col gap-2 lg:gap-1.5 pb-2 lg:pb-0">
            {tabs.map((tab) => {
              const isMainTab = ['users', 'releases', 'tickets', 'transactions', 'withdrawals', 'news'].includes(tab.id);
              return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 lg:w-full text-left py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl flex items-center gap-2 sm:gap-3 transition-all duration-300 whitespace-nowrap ${
                  activeTab === tab.id 
                    ? isMainTab 
                      ? isLight
                        ? 'bg-gradient-to-r from-[#6050ba] to-[#8070da] backdrop-blur-md text-white shadow-lg border border-[#6050ba]/30'
                        : 'bg-gradient-to-r from-[#6050ba]/30 to-[#8070da]/30 backdrop-blur-md text-white shadow-lg border border-[#9d8df1]/40'
                      : isLight
                        ? 'bg-[#6050ba] backdrop-blur-md text-white shadow-lg border border-[#6050ba]/25'
                        : 'bg-[#6050ba]/30 backdrop-blur-md text-white shadow-lg border border-[#6050ba]/40'
                    : isMainTab
                      ? isLight
                        ? 'text-gray-700 bg-white/40 backdrop-blur-sm hover:bg-white/60 border border-white/50 hover:border-[#6050ba]/30'
                        : 'text-white bg-white/5 backdrop-blur-sm hover:bg-white/10 border border-white/10 hover:border-[#6050ba]/30'
                      : isLight
                        ? 'text-gray-500 bg-white/30 backdrop-blur-sm hover:bg-white/50 hover:text-gray-700 border border-white/40 hover:border-[#6050ba]/25'
                        : 'text-zinc-400 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:text-white border border-white/10 hover:border-[#6050ba]/30'
                }`}
              >
                <span className="shrink-0">{tab.icon}</span>
                <span className={`text-xs sm:text-sm font-bold ${isMainTab ? 'tracking-wide' : ''}`}>{tab.label}</span>
              </button>
              );
            })}
            </div>
          </nav>
        </aside>
        )}

        {/* Кнопка раскрытия сайдбара (когда свёрнут) */}
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className={`hidden lg:flex fixed left-4 top-1/2 -translate-y-1/2 z-50 w-10 h-20 items-center justify-center rounded-r-xl transition-all duration-300 hover:w-12 ${
              isLight 
                ? 'bg-white/80 border border-white/60 hover:bg-white shadow-lg' 
                : 'bg-[#0d0d0f]/80 border border-white/10 hover:bg-[#1a1a1f]'
            }`}
            title="Показать панель навигации"
          >
            <svg className={`w-5 h-5 ${isLight ? 'text-[#6050ba]' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Content */}
        <section 
          className={`flex-1 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 min-h-[400px] sm:min-h-[600px] shadow-2xl transition-all duration-500 ${
            isLight 
              ? 'bg-white/50 border border-white/60' 
              : 'bg-[#0d0d0f]/40 border border-white/10'
          }`} 
          style={{ boxShadow: isLight ? '0 8px 32px rgba(96, 80, 186, 0.1)' : '0 8px 32px 0 rgba(0, 0, 0, 0.37)' }}
        >
          <Suspense fallback={<TabLoader />}>
            {activeTab === 'releases' && supabase && <ReleasesModeration supabase={supabase} onSidebarCollapse={setSidebarCollapsed} />}
            {activeTab === 'news' && supabase && <NewsTab supabase={supabase} />}
            {activeTab === 'withdrawals' && supabase && <WithdrawalsTab supabase={supabase} currentUserRole={currentUserRole} />}
            {activeTab === 'tickets' && supabase && <AdminTicketsPanel supabase={supabase} initialTicketId={initialTicketId} onTicketOpened={() => setInitialTicketId(null)} />}
            {activeTab === 'users' && supabase && <UsersTab supabase={supabase} currentUserRole={currentUserRole} />}
            {activeTab === 'contracts' && <ContractsTab />}
            {activeTab === 'archive' && supabase && <ArchiveTab supabase={supabase} />}
            {activeTab === 'reports' && supabase && <ReportsTab supabase={supabase} />}
            {activeTab === 'transactions' && supabase && <TransactionsTab supabase={supabase} currentUserRole={currentUserRole} />}
          </Suspense>
        </section>

      </div>
    </div>
  );
}
