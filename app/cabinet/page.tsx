"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AnimatedBackground from '@/components/AnimatedBackground';

// Локальные модули
import { supabase } from './lib/supabase';
import { fetchWithAuth } from './lib/fetchWithAuth';
import { UserRole, ROLE_CONFIG } from './lib/types';
import { useSupportWidget } from '@/lib/useSupportWidget';

// Компоненты экранов
import { LoadingScreen, UnauthorizedScreen } from './components/screens';

// Компоненты модалок
import { 
  CopyToast,
  NotificationModal,
  ConfirmDialog,
  AvatarUploadModal 
} from './components/modals';

// Компоненты вкладок
import UserReleases from './components/UserReleases';
import { FinanceTab } from './components/finance';
import { SettingsTab } from './components/settings';

// Компоненты сайдбара
import ProfileSidebar from './components/sidebar/ProfileSidebar';
import CreateReleaseSidebar from './components/sidebar/CreateReleaseSidebar';

// Хуки
import { useNotifications } from './hooks/useNotifications';

export default function CabinetPage() {
  const router = useRouter();
  
  // Основные состояния
  const [tab, setTab] = useState<'releases' | 'finance' | 'settings'>('releases');
  const [creatingRelease, setCreatingRelease] = useState(false);
  const [createTab, setCreateTab] = useState<'release'|'tracklist'|'countries'|'contract'|'platforms'|'localization'|'send'|'events'|'promo'>('release');
  
  // Данные пользователя
  const [user, setUser] = useState<any>(null);
  const [nickname, setNickname] = useState('');
  const [memberId, setMemberId] = useState('');
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole>('basic');
  const [originalRole, setOriginalRole] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [avatar, setAvatar] = useState<string>('');
  
  // Финансовые данные
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  
  // UI состояние
  const [showToast, setShowToast] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // Уведомления
  const { 
    notification, 
    confirmDialog, 
    showNotification,
    hideNotification,
    confirm,
    handleConfirm,
    handleCancel
  } = useNotifications();
  
  // Виджет поддержки
  const supportWidget = useSupportWidget();
  const [unreadTicketsCount, setUnreadTicketsCount] = useState(0);

  const config = ROLE_CONFIG[role];

  // Загрузка заявок на вывод
  const loadWithdrawalRequests = useCallback(async () => {
    if (!supabase || !user?.id) return;
    
    try {
      const { data: requestsData } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (requestsData && requestsData.length > 0) {
        const requestsWithTx = await Promise.all(
          requestsData.map(async (request) => {
            if (!supabase) return { ...request, transaction_id: null };
            const { data: tx } = await supabase
              .from('transactions')
              .select('id')
              .eq('reference_table', 'withdrawal_requests')
              .eq('reference_id', request.id)
              .maybeSingle();
            return { ...request, transaction_id: tx?.id || null };
          })
        );
        setWithdrawalRequests(requestsWithTx);
      } else {
        setWithdrawalRequests([]);
      }
    } catch (e) {
      console.warn('Не удалось загрузить заявки на вывод:', e);
    }
  }, [user?.id]);

  // Загрузка данных пользователя
  useEffect(() => {
    const getUser = async () => {
      if (!supabase) { setLoading(false); return; }
      
      const { data: { user } } = await supabase.auth.getUser();
    
      if (!user) {
        setLoading(false);
        setUser(null);
        return;
      }
    
      setUser(user);
      const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Artist';
      setNickname(displayName);
      
      // Загружаем профиль
      try {
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (!existingProfile) {
          // Для новых профилей member_id будет сгенерирован триггером в БД
          const newProfileData = {
            id: user.id,
            email: user.email,
            nickname: displayName,
            balance: 0,
            created_at: user.created_at
          };
          
          const { data: insertedProfile } = await supabase.from('profiles').insert(newProfileData).select().single();
          setRole((insertedProfile?.role as UserRole) || 'basic');
          // Устанавливаем member_id из созданного профиля (сгенерирован триггером с правильным форматом THQ-)
          if (insertedProfile?.member_id) {
            setMemberId(insertedProfile.member_id);
          }
        } else {
          // Загружаем данные из существующего профиля
          console.log('🔍 Загружен профиль из БД:', existingProfile);
          console.log('🔍 member_id из БД:', existingProfile.member_id);
          
          setBalance(Number(existingProfile.balance) || 0);
          if (existingProfile.nickname) setNickname(existingProfile.nickname);
          
          // КРИТИЧНО: Устанавливаем member_id из БД (правильный формат THQ-)
          if (existingProfile.member_id) {
            console.log('✅ Устанавливаем member_id:', existingProfile.member_id);
            setMemberId(existingProfile.member_id);
          } else {
            console.error('❌ member_id отсутствует в профиле БД!');
          }
          
          if (existingProfile.avatar) setAvatar(existingProfile.avatar);
          
          // Загружаем original_role
          if (existingProfile.original_role) {
            console.log('✅ Загружена original_role:', existingProfile.original_role);
            setOriginalRole(existingProfile.original_role);
          } else {
            console.log('⚠️ original_role отсутствует в БД');
          }
          
          const dbRole = existingProfile.role as UserRole;
          if (!dbRole) {
            const { data: recheckProfile } = await supabase.from('profiles').select('role').eq('email', user.email).single();
            setRole((recheckProfile?.role as UserRole) || 'basic');
          } else {
            setRole(dbRole);
          }
        }
      } catch (e) {
        console.warn('Не удалось загрузить/создать профиль:', e);
        setRole('basic');
      }
      
      // Загружаем заявки на вывод
      try {
        const { data: requestsData } = await supabase
          .from('withdrawal_requests')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (requestsData && requestsData.length > 0) {
          const requestsWithTx = await Promise.all(
            requestsData.map(async (request) => {
              if (!supabase) return { ...request, transaction_id: null };
              const { data: tx } = await supabase
                .from('transactions')
                .select('id')
                .eq('reference_table', 'withdrawal_requests')
                .eq('reference_id', request.id)
                .maybeSingle();
              return { ...request, transaction_id: tx?.id || null };
            })
          );
          setWithdrawalRequests(requestsWithTx);
        }
      } catch (e) {
        console.warn('Не удалось загрузить заявки на вывод:', e);
      }
      
      // Загружаем историю начислений
      try {
        const { data: payoutsData } = await supabase
          .from('payouts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (payoutsData && payoutsData.length > 0) {
          const payoutsWithTx = await Promise.all(
            payoutsData.map(async (payout) => {
              if (!supabase) return { ...payout, transaction_id: null };
              const { data: tx } = await supabase
                .from('transactions')
                .select('id')
                .eq('reference_table', 'payouts')
                .eq('reference_id', payout.id)
                .maybeSingle();
              return { ...payout, transaction_id: tx?.id || null };
            })
          );
          setPayouts(payoutsWithTx);
        }
      } catch (e) {
        console.warn('Не удалось загрузить историю начислений:', e);
      }
      
      setLoading(false);
    };
    
    getUser();
    
    return () => {
      if ((window as any).__cleanupSubscriptions) {
        (window as any).__cleanupSubscriptions();
      }
    };
  }, [router]);

  // Polling для непрочитанных тикетов
  useEffect(() => {
    if (!user) return;

    const loadUnreadCount = async () => {
      try {
        const response = await fetchWithAuth('/api/support/unread-count');
        if (response.ok) {
          const data = await response.json();
          setUnreadTicketsCount(data.count || 0);
        }
      } catch (err) {
        console.error('Error loading unread count:', err);
      }
    };

    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // Слушаем изменения auth состояния
  useEffect(() => {
    if (!supabase) return;
    
    const handleAuthChange = async (event: string, session: any) => {
      if (event === 'USER_UPDATED' && session?.user && supabase) {
        await supabase
          .from('profiles')
          .update({ email: session.user.email })
          .eq('id', session.user.id);
        
        window.location.reload();
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);
    return () => { subscription.unsubscribe(); };
  }, []);

  // Обработчики
  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut();
    router.push('/auth');
  };

  const handleShowToast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleAvatarFileSelect = (file: File) => {
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleAvatarSave = async () => {
    if (!avatarFile || !supabase || !user) return;
    
    setUploadingAvatar(true);
    try {
      if (avatar && avatar.includes('avatars/')) {
        const oldPath = avatar.split('/avatars/')[1];
        await supabase.storage.from('avatars').remove([oldPath]);
      }
      
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      await supabase.from('profiles').update({ avatar: publicUrl }).eq('email', user.email);
      
      setAvatar(publicUrl);
      setShowAvatarModal(false);
      setAvatarPreview(null);
      setAvatarFile(null);
      showNotification('Аватар обновлён', 'success');
    } catch (error: any) {
      showNotification('Ошибка загрузки: ' + error.message, 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarDelete = () => {
    if (!confirm('Удалить текущий аватар?')) return;
    
    (async () => {
      if (!supabase || !user) return;
      try {
        if (avatar.includes('avatars/')) {
          const filePath = avatar.split('/avatars/')[1];
          await supabase.storage.from('avatars').remove([filePath]);
        }
        await supabase.from('profiles').update({ avatar: null }).eq('email', user.email);
        setAvatar('');
        setShowAvatarModal(false);
        showNotification('Аватар удалён', 'success');
      } catch (error: any) {
        showNotification('Ошибка удаления: ' + error.message, 'error');
      }
    })();
  };

  const handleCloseAvatarModal = () => {
    setShowAvatarModal(false);
    setAvatarPreview(null);
    setAvatarFile(null);
  };

  // Экран загрузки
  if (loading) {
    return <LoadingScreen />;
  }

  // Экран для неавторизованных
  if (!user) {
    return <UnauthorizedScreen />;
  }

  return (
    <div className="min-h-screen pt-20 text-white relative z-10">
      <AnimatedBackground />
      <div className="max-w-[1600px] mx-auto p-6 lg:p-8 flex flex-col lg:flex-row gap-8 items-start relative z-10">
        
        {/* Сайдбар */}
        <aside className="lg:w-64 w-full bg-[#0d0d0f] border border-white/5 rounded-3xl p-6 flex flex-col lg:sticky lg:top-24">
          {creatingRelease ? (
            <CreateReleaseSidebar
              createTab={createTab}
              onCreateTabChange={setCreateTab}
              onBack={() => { setCreatingRelease(false); setCreateTab('release'); }}
            />
          ) : (
            <ProfileSidebar
              user={user}
              nickname={nickname}
              memberId={memberId}
              role={role}
              avatar={avatar}
              activeTab={tab}
              unreadTicketsCount={unreadTicketsCount}
              onTabChange={setTab}
              onShowAvatarModal={() => setShowAvatarModal(true)}
              onSupportToggle={() => supportWidget.toggle()}
              showToast={handleShowToast}
            />
          )}
        </aside>

        {/* Контент */}
        <section className="flex-1 bg-[#0d0d0f] border border-white/5 rounded-3xl p-10 min-h-[600px]">
          
          {tab === 'releases' && (
            <div className="animate-fade-up">
              <UserReleases 
                userId={user?.id} 
                nickname={nickname} 
                onOpenUpload={() => router.push('/cabinet/release/create')} 
                userRole={role}
                showNotification={showNotification}
              />
            </div>
          )}
          
          {tab === 'finance' && (
            <FinanceTab
              userId={user?.id}
              balance={balance}
              setBalance={setBalance}
              payouts={payouts}
              withdrawalRequests={withdrawalRequests}
              showNotification={showNotification}
              reloadRequests={loadWithdrawalRequests}
            />
          )}
          
          {tab === 'settings' && (
            <SettingsTab
              user={user}
              nickname={nickname}
              memberId={memberId}
              role={role}
              originalRole={originalRole}
              avatar={avatar}
              onSignOut={handleSignOut}
              onShowAvatarModal={() => setShowAvatarModal(true)}
              showToast={handleShowToast}
            />
          )}
        </section>
      </div>

      {/* Toast уведомление о копировании */}
      <CopyToast show={showToast} />
      
      {/* Уведомление сверху */}
      <NotificationModal 
        show={notification.show} 
        message={notification.message} 
        type={notification.type}
        onClose={hideNotification}
      />
      
      {/* Диалог подтверждения */}
      <ConfirmDialog
        show={confirmDialog.show}
        message={confirmDialog.message}
        description={confirmDialog.description}
        type={confirmDialog.type}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
      
      {/* Модалка аватара */}
      <AvatarUploadModal
        show={showAvatarModal}
        onClose={handleCloseAvatarModal}
        avatar={avatar}
        avatarPreview={avatarPreview}
        nickname={nickname}
        role={role}
        uploadingAvatar={uploadingAvatar}
        onFileSelect={handleAvatarFileSelect}
        onSave={handleAvatarSave}
        onDelete={handleAvatarDelete}
        onClearPreview={() => { setAvatarPreview(null); setAvatarFile(null); }}
        showNotification={showNotification}
      />
    </div>
  );
}
