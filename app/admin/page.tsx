"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import AnimatedBackground from '@/components/AnimatedBackground';
import Toast from '@/components/Toast';

// Импорты компонентов вкладок
import ReleasesModeration from './components/ReleasesModeration';
import DemosTab from './components/demos/DemosTab';
import ContractsTab from './components/contracts/ContractsTab';
import ArchiveTab from './components/archive/ArchiveTab';
import NewsTab from './components/news/NewsTab';
import PayoutsTab from './components/payouts/PayoutsTab';
import UsersTab from './components/UsersTab';
import AdminTicketsPanel from './components/AdminTicketsPanel';
import WithdrawalsTab from './components/withdrawals/WithdrawalsTab';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

        if (userError || !user) {
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

        if (profileError || !profile || (profile.role !== 'admin' && profile.role !== 'owner')) {
          const roleInfo = profile ? profile.role : 'не найдена';
          console.error('⛔ Доступ запрещен. Роль:', roleInfo);
          alert(`⛔ Доступ запрещен. Вы не являетесь администратором.\n\nВаш email: ${user.email}\nВаша роль: ${roleInfo}\n\n💡 Для получения прав администратора обратитесь к владельцу системы.`);
          router.push('/');
          return;
        }

        console.log('✅ Доступ разрешен. Роль:', profile.role);
        setUserEmail(user.email || null);
        setCurrentUser({ id: user.id, ...profile, email: user.email });
        setCurrentUserRole(profile.role as 'admin' | 'owner');
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
    <div className="min-h-screen text-white pt-20 relative">
      <AnimatedBackground />
      <div className="max-w-[1600px] mx-auto p-6 lg:p-8 flex flex-col lg:flex-row gap-8 items-stretch relative z-10">
        
        {/* Sidebar */}
        <aside className="lg:w-64 w-full bg-[#0d0d0f] border border-white/5 rounded-3xl p-6 flex flex-col self-stretch">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between gap-3 mb-2">
              <img 
                src="/logo.png" 
                alt="thqlabel" 
                className="h-24 w-auto drop-shadow-[0_0_25px_rgba(160,141,241,0.8)]"
              />
              <button 
                onClick={() => router.push('/cabinet')}
                className="w-10 h-10 bg-gradient-to-br from-[#6050ba]/20 to-[#8070da]/20 border border-[#9d8df1]/30 rounded-lg hover:from-[#6050ba]/30 hover:to-[#8070da]/30 hover:border-[#9d8df1]/50 transition-all flex items-center justify-center shrink-0 group"
                title="Назад в кабинет"
              >
                <svg className="w-5 h-5 text-[#9d8df1] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>
            </div>
            <span 
              className="text-[10px] font-bold uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 animate-pulse"
              style={{ 
                filter: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.6)) drop-shadow(0 0 12px rgba(236, 72, 153, 0.4))',
                backgroundSize: '200% 100%',
                animation: 'shimmer 3s ease-in-out infinite'
              }}
            >
              Админ панель
            </span>
            <p className="text-[10px] text-zinc-600 truncate mt-1">
              {userEmail}
            </p>
            <div className="mt-3">
              <span className={`text-[9px] px-2 py-1 rounded-full font-bold uppercase ${
                currentUserRole === 'owner' 
                  ? 'bg-purple-500/20 text-purple-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {currentUserRole === 'owner' ? '♛ OWNER' : '★ ADMIN'}
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2 flex-1">
            {tabs.map((tab) => {
              const isMainTab = ['users', 'releases', 'tickets', 'payouts', 'withdrawals', 'news'].includes(tab.id);
              return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left py-3 px-4 rounded-xl flex items-center gap-3 transition-all duration-300 ${
                  activeTab === tab.id 
                    ? isMainTab 
                      ? 'bg-gradient-to-r from-[#6050ba] to-[#8070da] text-white shadow-lg shadow-[#6050ba]/30 border border-[#9d8df1]/30' 
                      : 'bg-[#6050ba] text-white shadow-lg shadow-[#6050ba]/20'
                    : isMainTab
                      ? 'text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#6050ba]/30'
                      : 'text-zinc-400 bg-white/5 hover:bg-white/10 hover:text-white border border-white/10 hover:border-[#6050ba]/30'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className={`text-sm font-bold ${isMainTab ? 'tracking-wide' : ''}`}>{tab.label}</span>
              </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <section className="flex-1 bg-[#0d0d0f] border border-white/5 rounded-3xl p-8 min-h-[600px]">
          {activeTab === 'demos' && <DemosTab />}
          {activeTab === 'releases' && <ReleasesModeration supabase={supabase} />}
          {activeTab === 'news' && <NewsTab supabase={supabase} />}
          {activeTab === 'withdrawals' && <WithdrawalsTab supabase={supabase} currentUserRole={currentUserRole} />}
          {activeTab === 'payouts' && <PayoutsTab supabase={supabase} currentAdmin={userEmail} currentUserRole={currentUserRole} />}
          {activeTab === 'tickets' && <AdminTicketsPanel supabase={supabase} />}
          {activeTab === 'users' && <UsersTab supabase={supabase} currentUserRole={currentUserRole} />}
          {activeTab === 'contracts' && <ContractsTab />}
          {activeTab === 'archive' && <ArchiveTab />}
        </section>

      </div>
    </div>
  );
}
