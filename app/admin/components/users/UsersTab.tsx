'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { copyToClipboard } from '@/lib/utils/clipboard';
import { 
  Profile, 
  Transaction, 
  Release, 
  Payout, 
  Ticket,
  getUserRole 
} from './types';
import { RoleStats } from './RoleStats';
import { UserFilters } from './UserFilters';
import { UserList } from './UserList';
import { UserProfileModal } from './UserProfileModal';

// Хук для управления пользователями
function useUsersManagement(supabase: any) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      setUsers(data || []);
    } catch (err) {
      console.error('Error loading users:', err);
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const updateRole = useCallback(async (userId: string, newRole: 'admin' | 'exclusive' | 'basic' | 'owner') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      return { success: true };
    } catch (err) {
      console.error('Error updating role:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Ошибка' };
    }
  }, [supabase]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return { users, loading, error, loadUsers, updateRole };
}

// Хук для просмотра профиля
function useProfileView(supabase: any) {
  const [viewingUser, setViewingUser] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [userReleases, setUserReleases] = useState<Release[]>([]);
  const [userPayouts, setUserPayouts] = useState<Payout[]>([]);
  const [userWithdrawals, setUserWithdrawals] = useState<any[]>([]);
  const [userTickets, setUserTickets] = useState<Ticket[]>([]);
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);

  const viewProfile = useCallback(async (user: Profile) => {
    setViewingUser(user);
    setEditNickname(user.nickname || '');
    setEditAvatar(user.avatar || '');
    setEditingProfile(false);
    setProfileLoading(true);

    try {
      const [releases, payouts, withdrawals, tickets, transactions] = await Promise.all([
        supabase.from('releases').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('payouts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('withdrawal_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('tickets').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      ]);

      setUserReleases(releases.data || []);
      setUserPayouts(payouts.data || []);
      setUserWithdrawals(withdrawals.data || []);
      setUserTickets(tickets.data || []);

      // Объединяем транзакции и заявки на вывод
      const txList = (transactions.data || []).map((t: any) => ({ ...t, source: 'transaction' }));
      const wdList = (withdrawals.data || []).map((w: any) => ({ 
        ...w, 
        source: 'withdrawal_request', 
        type: 'withdrawal' as const,
        amount: w.amount 
      }));
      const combined = [...txList, ...wdList].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setUserTransactions(combined as Transaction[]);
    } catch (err) {
      console.error('Error loading profile data:', err);
    } finally {
      setProfileLoading(false);
    }
  }, [supabase]);

  const saveProfile = useCallback(async () => {
    if (!viewingUser) return { success: false };
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ nickname: editNickname, avatar: editAvatar })
        .eq('id', viewingUser.id);
      
      if (error) throw error;
      setViewingUser(prev => prev ? { ...prev, nickname: editNickname, avatar: editAvatar } : null);
      setEditingProfile(false);
      return { success: true };
    } catch (err) {
      console.error('Error saving profile:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Ошибка' };
    }
  }, [supabase, viewingUser, editNickname, editAvatar]);

  const closeProfile = useCallback(() => {
    setViewingUser(null);
    setEditingProfile(false);
  }, []);

  return {
    viewingUser,
    profileLoading,
    editingProfile,
    setEditingProfile,
    editNickname,
    setEditNickname,
    editAvatar,
    setEditAvatar,
    userReleases,
    userPayouts,
    userTickets,
    userTransactions,
    viewProfile,
    saveProfile,
    closeProfile
  };
}

// Хук для Toast уведомлений
function useToast() {
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' | 'info' });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  }, []);

  return { toast, showToast };
}

// Основной компонент
export default function UsersTab({ supabase, currentUserRole }: { supabase: any; currentUserRole: 'admin' | 'owner' }) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  const { users, loading, error, loadUsers, updateRole } = useUsersManagement(supabase);
  const profileView = useProfileView(supabase);
  const { toast, showToast } = useToast();
  
  // Фильтры и сортировка
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'email' | 'nickname' | 'role'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Фильтрованные и отсортированные пользователи
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = !searchTerm || 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.member_id?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = filterRole === 'all' || getUserRole(user) === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, filterRole]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      const order = sortOrder === 'asc' ? 1 : -1;
      if (sortBy === 'role') {
        const roleOrder = { owner: 0, admin: 1, exclusive: 2, basic: 3 };
        return (roleOrder[getUserRole(a) as keyof typeof roleOrder] - roleOrder[getUserRole(b) as keyof typeof roleOrder]) * order;
      }
      const aVal = String(a[sortBy] || '').toLowerCase();
      const bVal = String(b[sortBy] || '').toLowerCase();
      return aVal.localeCompare(bVal) * order;
    });
  }, [filteredUsers, sortBy, sortOrder]);

  // Подсчёт ролей
  const roleStats = useMemo(() => ({
    owners: users.filter(u => getUserRole(u) === 'owner').length,
    admins: users.filter(u => getUserRole(u) === 'admin').length,
    exclusive: users.filter(u => getUserRole(u) === 'exclusive').length,
    basic: users.filter(u => getUserRole(u) === 'basic').length,
  }), [users]);

  // Обработчики
  const handleRoleChange = useCallback(async (userId: string, newRole: 'admin' | 'exclusive' | 'basic' | 'owner') => {
    const result = await updateRole(userId, newRole);
    if (result.success) {
      showToast(`Роль пользователя изменена на ${newRole}`, 'success');
    } else {
      showToast(`Ошибка: ${result.error}`, 'error');
    }
  }, [updateRole, showToast]);

  const handleCopyEmail = useCallback((email: string) => {
    copyToClipboard(email);
    showToast('Email скопирован', 'success');
  }, [showToast]);

  const handleViewProfile = useCallback((user: Profile) => {
    profileView.viewProfile(user);
  }, [profileView]);

  const handleSaveProfile = useCallback(async () => {
    const result = await profileView.saveProfile();
    if (result.success) {
      showToast('Профиль обновлён', 'success');
      loadUsers();
    } else {
      showToast('Ошибка сохранения профиля', 'error');
    }
  }, [profileView, showToast, loadUsers]);

  return (
    <div className={`space-y-6 ${isLight ? 'text-zinc-800' : 'text-white'}`}>
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black">Управление пользователями</h2>
      </div>

      {/* Статистика по ролям */}
      <RoleStats
        ownersCount={roleStats.owners}
        adminsCount={roleStats.admins}
        exclusiveCount={roleStats.exclusive}
        basicCount={roleStats.basic}
      />

      {/* Фильтры */}
      <UserFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterRole={filterRole}
        setFilterRole={setFilterRole}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
      />

      {/* Список пользователей */}
      <UserList
        users={sortedUsers}
        loading={loading}
        error={error}
        totalCount={users.length}
        currentUserRole={currentUserRole}
        onRoleChange={handleRoleChange}
        onViewProfile={handleViewProfile}
        onCopyEmail={handleCopyEmail}
        onRefresh={loadUsers}
      />

      {/* Модальное окно профиля */}
      {profileView.viewingUser && (
        <UserProfileModal
          user={profileView.viewingUser}
          profileLoading={profileView.profileLoading}
          userReleases={profileView.userReleases}
          userPayouts={profileView.userPayouts}
          userTickets={profileView.userTickets}
          userTransactions={profileView.userTransactions}
          currentUserRole={currentUserRole}
          editingProfile={profileView.editingProfile}
          setEditingProfile={profileView.setEditingProfile}
          editNickname={profileView.editNickname}
          setEditNickname={profileView.setEditNickname}
          editAvatar={profileView.editAvatar}
          setEditAvatar={profileView.setEditAvatar}
          onSaveProfile={handleSaveProfile}
          onClose={profileView.closeProfile}
        />
      )}

      {/* Toast */}
      {toast.show && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className={`px-6 py-3 rounded-lg shadow-lg border pointer-events-auto backdrop-blur-sm animate-in fade-in zoom-in duration-300 ${
            toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' :
            toast.type === 'info' ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' :
            'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-xl">{toast.type === 'success' ? '✓' : toast.type === 'info' ? 'ℹ' : '✗'}</span>
              <span className="font-medium">{toast.message}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
