"use client";
import React, { useState, useEffect, useCallback, useMemo, memo, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import dynamic from 'next/dynamic';
import Toast from '@/components/ui/Toast';
import { useTheme } from '@/contexts/ThemeContext';

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
const PayoutsTab = lazy(() => import('./components/payouts/PayoutsTab'));
const UsersTab = lazy(() => import('./components/users/UsersTab'));
const AdminTicketsPanel = lazy(() => import('./components/tickets/AdminTicketsPanel'));
const WithdrawalsTab = lazy(() => import('./components/withdrawals/WithdrawalsTab'));

// Оптимизация: singleton паттерн для supabase клиента
let supabaseInstance: ReturnType<typeof createClient> | null = null;
const getSupabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return supabaseInstance;
};
const supabase = getSupabase();

// Компонент загрузки для Suspense
const TabLoader = memo(() => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6050ba]"></div>
  </div>
));
TabLoader.displayName = 'TabLoader';

type Tab = 'releases' | 'contracts' | 'archive' | 'payouts' | 'users' | 'news' | 'tickets' | 'withdrawals';

export default function AdminPage() {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'owner'>('admin');
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('adminActiveTab') as Tab;
      const validTabs: Tab[] = ['releases', 'contracts', 'archive', 'payouts', 'users', 'news', 'tickets', 'withdrawals'];
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminActiveTab', activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        console.log('🔍 Проверка прав доступа:', { user: user?.email, userError });

        if (userError || !user || !user.email) {
          console.warn('⛔ Пользователь не авторизован:', userError);
          alert("⛔ Доступ запрещен. Необходима авторизация.");
          router.push('/auth');
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, email')
          .eq('email', user.email)
          .single();

        console.log('[Профиль] Из БД по email:', { email: user.email, profile, profileError });

        if (profileError || !profile || typeof profile !== 'object' || !('role' in profile) || ((profile as any).role !== 'admin' && (profile as any).role !== 'owner')) {
          const roleInfo = (profile && typeof profile === 'object' && 'role' in profile) ? (profile as any).role : 'не найдена';
          console.error('⛔ Доступ запрещен. Роль:', roleInfo);
          alert(`⛔ Доступ запрещен. Вы не являетесь администратором.\n\nВаш email: ${user.email}\nВаша роль: ${roleInfo}\n\n💡 Для получения прав администратора обратитесь к владельцу системы.`);
          router.push('/');
          return;
        }

        console.log('✅ Доступ разрешен. Роль:', (profile as any).role);
        setUserEmail(user.email || null);
        setCurrentUser({ id: user.id, ...(profile as any), email: user.email });
        setCurrentUserRole((profile as any).role as 'admin' | 'owner');
        setCheckingAuth(false);
      } catch (e) {
        console.error('❌ Ошибка проверки прав доступа:', e);
        alert("⛔ Ошибка проверки прав доступа: " + (e as Error).message);
        router.push('/');
      }
    };
    checkAdmin();
  }, [router]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'users', label: 'Пользователи', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
    { id: 'releases', label: 'Релизы', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg> },
    { id: 'tickets', label: 'Тикеты', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg> },
    { id: 'payouts', label: 'Выплаты', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { id: 'withdrawals', label: 'Заявки', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg> },
    { id: 'news', label: 'Новости', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg> },
    { id: 'contracts', label: 'Договоры', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
  ];

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
      <div className="max-w-[1600px] mx-auto p-3 sm:p-4 md:p-5 lg:p-6 flex flex-col lg:flex-row gap-4 sm:gap-5 lg:gap-6 items-stretch relative z-10">
        
        {/* Sidebar - адаптивный */}
        <aside 
          className={`w-full lg:w-64 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-3 sm:p-4 lg:p-5 flex flex-col lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] shadow-2xl ${
            isLight 
              ? 'bg-white/50 border border-white/60' 
              : 'bg-[#0d0d0f]/40 border border-white/10'
          }`} 
          style={{ boxShadow: isLight ? '0 8px 32px rgba(96, 80, 186, 0.1)' : '0 8px 32px 0 rgba(0, 0, 0, 0.37)' }}
        >
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between gap-2 sm:gap-3 mb-2">
              <img 
                src="/logo.png" 
                alt="thqlabel" 
                className={`h-10 sm:h-12 md:h-16 w-auto drop-shadow-[0_0_25px_rgba(160,141,241,0.8)] ${isLight ? 'invert brightness-0' : ''}`}
              />
              <button 
                onClick={() => router.push('/cabinet')}
                className="w-14 h-14 sm:w-10 sm:h-10 md:w-11 md:h-11 bg-gradient-to-br from-[#6050ba] to-[#8070da] border-2 border-[#9d8df1]/50 rounded-2xl hover:from-[#7060ca] hover:to-[#9080ea] hover:border-[#9d8df1] transition-all flex items-center justify-center shrink-0 group shadow-2xl shadow-[#6050ba]/40 hover:shadow-[#6050ba]/60 hover:scale-105"
                title="Назад в кабинет"
              >
                <svg className="w-7 h-7 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
              </button>
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
              const isMainTab = ['users', 'releases', 'tickets', 'payouts', 'withdrawals', 'news'].includes(tab.id);
              return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 lg:w-full text-left py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl flex items-center gap-2 sm:gap-3 transition-all duration-300 whitespace-nowrap ${
                  activeTab === tab.id 
                    ? isMainTab 
                      ? isLight
                        ? 'bg-gradient-to-r from-[#6050ba]/20 to-[#8070da]/20 backdrop-blur-md text-[#6050ba] shadow-lg border border-[#6050ba]/30'
                        : 'bg-gradient-to-r from-[#6050ba]/30 to-[#8070da]/30 backdrop-blur-md text-white shadow-lg border border-[#9d8df1]/40'
                      : isLight
                        ? 'bg-[#6050ba]/15 backdrop-blur-md text-[#6050ba] shadow-lg border border-[#6050ba]/25'
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

        {/* Content */}
        <section 
          className={`flex-1 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 min-h-[400px] sm:min-h-[600px] shadow-2xl ${
            isLight 
              ? 'bg-white/50 border border-white/60' 
              : 'bg-[#0d0d0f]/40 border border-white/10'
          }`} 
          style={{ boxShadow: isLight ? '0 8px 32px rgba(96, 80, 186, 0.1)' : '0 8px 32px 0 rgba(0, 0, 0, 0.37)' }}
        >
          <Suspense fallback={<TabLoader />}>
            {activeTab === 'releases' && <ReleasesModeration supabase={supabase} />}
            {activeTab === 'news' && <NewsTab supabase={supabase} />}
            {activeTab === 'withdrawals' && <WithdrawalsTab supabase={supabase} currentUserRole={currentUserRole} />}
            {activeTab === 'payouts' && <PayoutsTab supabase={supabase} currentAdmin={userEmail} currentUserRole={currentUserRole} />}
            {activeTab === 'tickets' && <AdminTicketsPanel supabase={supabase} />}
            {activeTab === 'users' && <UsersTab supabase={supabase} currentUserRole={currentUserRole} />}
            {activeTab === 'contracts' && <ContractsTab />}
            {activeTab === 'archive' && <ArchiveTab />}
          </Suspense>
        </section>

      </div>
    </div>
  );
}
