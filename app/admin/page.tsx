"use client";
import React, { useState, useEffect, useCallback, useMemo, memo, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import dynamic from 'next/dynamic';
import Toast from '@/components/Toast';

// Ленивая загрузка тяжёлых компонентов для ускорения первоначальной загрузки
const AnimatedBackground = dynamic(() => import('@/components/AnimatedBackground'), { 
  ssr: false,
  loading: () => null 
});

// Ленивая загрузка вкладок - загружаются только при активации
const ReleasesModeration = lazy(() => import('./components/ReleasesModeration'));
const DemosTab = lazy(() => import('./components/demos/DemosTab'));
const ContractsTab = lazy(() => import('./components/contracts/ContractsTab'));
const ArchiveTab = lazy(() => import('./components/archive/ArchiveTab'));
const NewsTab = lazy(() => import('./components/news/NewsTab'));
const PayoutsTab = lazy(() => import('./components/payouts/PayoutsTab'));
const UsersTab = lazy(() => import('./components/UsersTab'));
const AdminTicketsPanel = lazy(() => import('./components/AdminTicketsPanel'));
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

type Tab = 'demos' | 'releases' | 'contracts' | 'archive' | 'payouts' | 'users' | 'news' | 'tickets' | 'withdrawals';

export default function AdminPage() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'owner'>('admin');
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('adminActiveTab');
      return (saved as Tab) || 'demos';
    }
    return 'demos';
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

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'users', label: 'Пользователи', icon: '' },
    { id: 'releases', label: 'Релизы', icon: '' },
    { id: 'tickets', label: 'Тикеты', icon: '' },
    { id: 'payouts', label: 'Выплаты', icon: '' },
    { id: 'withdrawals', label: 'Заявки', icon: '' },
    { id: 'news', label: 'Новости', icon: '' },
    { id: 'contracts', label: 'Договоры', icon: '' },
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
    <div className="min-h-screen text-white pt-16 sm:pt-20 relative">
      <AnimatedBackground />
      <div className="max-w-[1600px] mx-auto p-3 sm:p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 items-stretch relative z-10">
        
        {/* Sidebar - адаптивный */}
        <aside className="w-full lg:w-64 bg-[#0d0d0f] border border-white/5 rounded-2xl sm:rounded-3xl p-3 sm:p-4 lg:p-5 flex flex-col lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]">
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between gap-2 sm:gap-3 mb-2">
              <img 
                src="/logo.png" 
                alt="thqlabel" 
                className="h-10 sm:h-12 md:h-16 w-auto drop-shadow-[0_0_25px_rgba(160,141,241,0.8)]"
              />
              <button 
                onClick={() => router.push('/cabinet')}
                className="w-14 h-14 sm:w-10 sm:h-10 md:w-11 md:h-11 bg-gradient-to-br from-[#6050ba] to-[#8070da] border-2 border-[#9d8df1]/50 rounded-2xl hover:from-[#7060ca] hover:to-[#9080ea] hover:border-[#9d8df1] transition-all flex items-center justify-center shrink-0 group shadow-2xl shadow-[#6050ba]/40 hover:shadow-[#6050ba]/60 hover:scale-105"
                title="Назад в кабинет"
              >
                <svg className="w-7 h-7 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
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
            <p className="text-[9px] sm:text-[10px] text-zinc-600 truncate mt-1">
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
                      ? 'bg-gradient-to-r from-[#6050ba] to-[#8070da] text-white shadow-lg shadow-[#6050ba]/30 border border-[#9d8df1]/30' 
                      : 'bg-[#6050ba] text-white shadow-lg shadow-[#6050ba]/20'
                    : isMainTab
                      ? 'text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#6050ba]/30'
                      : 'text-zinc-400 bg-white/5 hover:bg-white/10 hover:text-white border border-white/10 hover:border-[#6050ba]/30'
                }`}
              >
                <span className="text-base sm:text-lg">{tab.icon}</span>
                <span className={`text-xs sm:text-sm font-bold ${isMainTab ? 'tracking-wide' : ''}`}>{tab.label}</span>
              </button>
              );
            })}
            </div>
          </nav>
        </aside>

        {/* Content */}
        <section className="flex-1 bg-[#0d0d0f] border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 min-h-[400px] sm:min-h-[600px]">
          <Suspense fallback={<TabLoader />}>
            {activeTab === 'demos' && <DemosTab />}
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
