'use client';

import { useState, useEffect } from 'react';

export default function UsersTab({ supabase, currentUserRole }: { supabase: any; currentUserRole: 'admin' | 'owner' }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [balanceEdit, setBalanceEdit] = useState<{userId: string, balance: string} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'email' | 'nickname' | 'role' | 'created_at'>('role');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [toast, setToast] = useState<{show: boolean, message: string, type: 'success' | 'error' | 'info'}>({show: false, message: '', type: 'success'});
  
  const [viewingUser, setViewingUser] = useState<any>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [userReleases, setUserReleases] = useState<any[]>([]);
  const [userPayouts, setUserPayouts] = useState<any[]>([]);
  const [userWithdrawals, setUserWithdrawals] = useState<any[]>([]);
  const [userTickets, setUserTickets] = useState<any[]>([]);
  const [userTransactions, setUserTransactions] = useState<any[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({show: true, message, type});
    setTimeout(() => setToast({show: false, message: '', type: 'success'}), 5000);
  };

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      let { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (profilesError) {
        console.error('Profiles error:', profilesError);
        setError('Ошибка получения пользователей: ' + profilesError.message);
        setUsers([]);
        setLoading(false);
        return;
      }
      
      const allUsers = (profilesData || []).map((profile: any) => {
        const normalizedRole = (profile.role && profile.role !== '') ? profile.role : 'basic';
        
        return {
          id: profile.id,
          email: profile.email || 'Нет email',
          nickname: profile.nickname || profile.email?.split('@')[0] || 'User',
          member_id: profile.member_id || 'THQ-' + Math.floor(1000 + Math.random() * 9000),
          balance: profile.balance || 0,
          role: normalizedRole,
          avatar: profile.avatar || null,
          created_at: profile.created_at,
          email_confirmed: true,
          last_sign_in: profile.updated_at,
        };
      });
      
      console.log('Загружено пользователей:', allUsers.length);
      setUsers(allUsers);
      
      if (allUsers.length === 0) {
        setError('Нет зарегистрированных пользователей в таблице profiles.');
      }
    } catch (e: any) {
      console.error('Ошибка загрузки пользователей:', e);
      setError(e.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const getUserRole = (user: any): 'admin' | 'exclusive' | 'basic' | 'owner' => {
    const role = user.role;
    if (!role || role === '' || role === 'undefined' || role === 'null') {
      return 'basic';
    }
    return role;
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'exclusive' | 'basic' | 'owner') => {
    if (currentUserRole === 'admin' && (newRole === 'admin' || newRole === 'owner')) {
      showToast('Только Owner может назначать администраторов', 'error');
      await loadUsers();
      return;
    }
    
    const targetUser = users.find(u => u.id === userId);
    if (currentUserRole === 'admin' && targetUser && (targetUser.role === 'admin' || targetUser.role === 'owner')) {
      showToast('Вы не можете изменять роли других администраторов', 'error');
      await loadUsers();
      return;
    }
    
    if (targetUser && targetUser.role === 'owner') {
      showToast('Роль Owner нельзя изменить', 'error');
      await loadUsers();
      return;
    }
    
    // Только ADMIN не может понижать других админов
    // OWNER может понижать кого угодно (кроме других owner)
    if (currentUserRole === 'admin' && targetUser && targetUser.role === 'admin' && (newRole === 'basic' || newRole === 'exclusive')) {
      showToast('Admin не может понизить другого Admin. Обратитесь к Owner.', 'error');
      await loadUsers();
      return;
    }
    
    try {
      console.log('Обновление роли:', userId, 'на', newRole);
      const { data, error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
      
      if (error) {
        console.error('Ошибка обновления роли:', error);
        showToast('Ошибка обновления роли: ' + error.message, 'error');
        await loadUsers();
        return;
      }
      
      console.log('Роль успешно обновлена:', data);
      await loadUsers();
      const roleNames: Record<string, string> = { owner: 'Владелец', admin: 'Администратор', exclusive: 'Эксклюзив', basic: 'Базовый' };
      showToast(`Роль успешно изменена на ${roleNames[newRole] || newRole}!`, 'success');
    } catch (e: any) {
      console.error('Исключение при обновлении роли:', e);
      showToast('Ошибка: ' + e.message, 'error');
      await loadUsers();
    }
  };

  const updateBalance = async (userId: string, newBalance: number) => {
    try {
      await supabase.from('profiles').update({ balance: newBalance }).eq('id', userId);
      await loadUsers();
      setBalanceEdit(null);
      alert('Баланс обновлён!');
    } catch (e: any) {
      alert('Ошибка: ' + e.message);
    }
  };

  const viewUserProfile = async (user: any) => {
    setViewingUser(user);
    setEditNickname(user.nickname || '');
    setEditAvatar(user.avatar || '');
    setProfileLoading(true);
    
    try {
      // Загружаем релизы пользователя (исключая черновики)
      const { data: releases } = await supabase
        .from('releases')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'draft')
        .order('created_at', { ascending: false });
      setUserReleases(releases || []);
      
      // Загружаем выплаты пользователя с транзакциями
      const { data: payouts } = await supabase
        .from('payouts')
        .select(`
          *,
          transactions(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setUserPayouts(payouts || []);
      
      // Загружаем заявки на вывод пользователя
      const { data: withdrawals } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setUserWithdrawals(withdrawals || []);
      
      // Загружаем тикеты пользователя
      const { data: tickets } = await supabase
        .from('tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setUserTickets(tickets || []);
      
      // Загружаем транзакции пользователя
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      // Объединяем транзакции и заявки на вывод
      const allTransactions = [
        ...(transactions || []).map((tx: any) => ({ ...tx, source: 'transaction' })),
        ...(withdrawals || []).map((wr: any) => ({ 
          ...wr, 
          source: 'withdrawal_request',
          type: 'withdrawal',
          status: wr.status,
          description: `${wr.bank_name} - ${wr.card_number}`
        }))
      ].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setUserTransactions(allTransactions);
    } catch (e) {
      console.error('Ошибка загрузки профиля:', e);
    } finally {
      setProfileLoading(false);
    }
  };
  
  const saveUserProfile = async () => {
    if (!viewingUser || currentUserRole !== 'owner') return;
    
    try {
      await supabase.from('profiles').update({
        nickname: editNickname,
        avatar: editAvatar,
      }).eq('id', viewingUser.id);
      
      showToast('Профиль обновлён', 'success');
      setEditingProfile(false);
      await loadUsers();
      setViewingUser({ ...viewingUser, nickname: editNickname, avatar: editAvatar });
    } catch (e: any) {
      showToast('Ошибка: ' + e.message, 'error');
    }
  };

  const filteredUsers = users.filter(u => 
    !search || 
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.nickname?.toLowerCase().includes(search.toLowerCase())
  );

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aVal: any = a[sortBy];
    let bVal: any = b[sortBy];
    
    if (sortBy === 'role') {
      const roleOrder: Record<string, number> = { owner: 0, admin: 1, exclusive: 2, basic: 3 };
      aVal = roleOrder[a.role || 'basic'] ?? 99;
      bVal = roleOrder[b.role || 'basic'] ?? 99;
    }
    
    if (sortBy === 'created_at') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }
    
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const registeredOwners = users.filter((u: any) => u.role === 'owner');
  const registeredAdmins = users.filter((u: any) => {
    const role = (u.role && u.role !== '') ? u.role : 'basic';
    return role === 'admin';
  });
  const registeredExclusive = users.filter((u: any) => {
    const role = (u.role && u.role !== '') ? u.role : 'basic';
    return role === 'exclusive';
  });
  const registeredBasic = users.filter((u: any) => {
    const role = (u.role && u.role !== '') ? u.role : 'basic';
    return role === 'basic';
  });

  const roleColors: Record<string, any> = {
    owner: { bg: 'bg-[#8b5cf6]/20', text: 'text-[#a78bfa]', border: 'border-[#8b5cf6]/30', label: 'OWNER', icon: '♛' },
    admin: { bg: 'bg-[#ff4757]/20', text: 'text-[#ff6b81]', border: 'border-[#ff4757]/30', label: 'ADMIN', icon: '★' },
    exclusive: { bg: 'bg-[#f59e0b]/20', text: 'text-[#fbbf24]', border: 'border-[#f59e0b]/30', label: 'EXCLUSIVE', icon: '◆' },
    basic: { bg: 'bg-zinc-800/50', text: 'text-zinc-400', border: 'border-zinc-700', label: 'BASIC', icon: '○' },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <p className="text-zinc-500 text-sm">Управление пользователями и балансами</p>
          <p className="text-xs text-zinc-600 mt-1">
            Зарегистрировано: {users.length}
          </p>
        </div>
        <div className="flex gap-2 items-center w-full md:w-auto">
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Поиск по email или никнейму..."
            className="flex-1 md:w-64 bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-[#6050ba]"
          />
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm"
          >
            <option value="created_at">Дата регистрации</option>
            <option value="email">Email</option>
            <option value="nickname">Никнейм</option>
            <option value="role">Роль</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 bg-white/5 rounded-xl hover:bg-white/10 transition"
            title={sortOrder === 'asc' ? 'По возрастанию' : 'По убыванию'}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Статистика по ролям */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-[#8b5cf6]/5 border border-[#8b5cf6]/20 rounded-xl text-center">
          <div className="text-3xl font-black text-[#a78bfa]">{registeredOwners.length}</div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Владельцев</div>
        </div>
        <div className="p-4 bg-[#ff4757]/5 border border-[#ff4757]/20 rounded-xl text-center">
          <div className="text-3xl font-black text-[#ff6b81]">{registeredAdmins.length}</div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Администраторов</div>
        </div>
        <div className="p-4 bg-[#f59e0b]/5 border border-[#f59e0b]/20 rounded-xl text-center">
          <div className="text-3xl font-black text-[#fbbf24]">{registeredExclusive.length}</div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Exclusive</div>
        </div>
        <div className="p-4 bg-zinc-800/30 border border-zinc-700/50 rounded-xl text-center">
          <div className="text-3xl font-black text-zinc-400">{registeredBasic.length}</div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Basic</div>
        </div>
      </div>

      {/* Список пользователей */}
      <div className="space-y-2">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-sm">Зарегистрированные пользователи ({sortedUsers.length})</h3>
          <button onClick={loadUsers} className="text-[10px] px-3 py-1 bg-white/5 rounded-lg hover:bg-white/10 transition">
            Обновить
          </button>
        </div>
        
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
            <p className="text-red-400 text-sm">Ошибка: {error}</p>
          </div>
        )}
        
        {loading ? (
          <div className="text-zinc-600 py-8 text-center">Загрузка пользователей...</div>
        ) : sortedUsers.length === 0 ? (
          <div className="text-zinc-600 py-8 text-center">
            <p>Пользователей не найдено</p>
            <p className="text-xs mt-2">Всего в базе: {users.length}</p>
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto space-y-2 pr-2" style={{ scrollbarWidth: 'none' }}>
          {sortedUsers.map(user => {
            const role = getUserRole(user) || 'basic';
            const rc = roleColors[role] || roleColors.basic;
            return (
              <div key={user.id} 
                   className={`p-4 ${rc.bg} border ${rc.border} rounded-xl flex items-center gap-4 hover:scale-[1.005] transition-all`}>
                {/* Аватар */}
                <div 
                  className={`w-12 h-12 rounded-xl ${!user.avatar && rc.bg} flex items-center justify-center text-xl ${rc.text} font-black border ${rc.border} ${user.avatar ? 'bg-cover bg-center' : ''}`}
                  style={user.avatar ? { backgroundImage: `url(${user.avatar})` } : {}}
                >
                  {!user.avatar && (user.nickname?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white truncate">{user.nickname || 'Без никнейма'}</span>
                    <select 
                      value={role}
                      onChange={(e) => updateUserRole(user.id, e.target.value as 'admin' | 'exclusive' | 'basic' | 'owner')}
                      className="text-[9px] px-2 py-1 bg-black/30 border border-white/20 rounded-full font-bold cursor-pointer hover:bg-black/50 transition"
                      disabled={currentUserRole === 'admin' && (role === 'admin' || role === 'owner')}
                    >
                      <option value="basic">○ BASIC</option>
                      <option value="exclusive">◆ EXCLUSIVE</option>
                      {currentUserRole === 'owner' && <option value="admin">★ ADMIN</option>}
                      {currentUserRole === 'owner' && <option value="owner">♛ OWNER</option>}
                      {currentUserRole === 'admin' && role === 'admin' && <option value="admin">★ ADMIN</option>}
                      {currentUserRole === 'admin' && role === 'owner' && <option value="owner">♛ OWNER</option>}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                    <button
                      onClick={() => {
                        navigator?.clipboard?.writeText(user.email);
                        showToast('Email скопирован', 'success');
                      }}
                      className="p-1 hover:bg-white/10 rounded transition flex-shrink-0"
                    >
                      <svg className="w-3 h-3 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                  <div className="text-[10px] text-zinc-600">ID: {user.member_id || user.id?.slice(0, 8)}</div>
                </div>
                
                {/* Баланс */}
                <div className="text-right">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Баланс</div>
                  <div className="text-lg font-black text-[#9d8df1]">
                    {Number(user.balance || 0).toLocaleString('ru-RU', {minimumFractionDigits: 2}).replace(/\s/g, '.')} ₽
                  </div>
                  <div className="text-[9px] text-zinc-700 mt-0.5">
                    {user.created_at && new Date(user.created_at).toLocaleDateString('ru-RU')}
                  </div>
                </div>
                
                {/* Кнопка просмотра профиля */}
                <button
                  onClick={() => viewUserProfile(user)}
                  className="p-3 bg-[#6050ba]/20 hover:bg-[#6050ba]/40 border border-[#6050ba]/30 rounded-xl transition-all"
                  title="Просмотреть профиль"
                >
                  <svg className="w-5 h-5 text-[#9d8df1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            );
          })}
          </div>
        )}
      </div>

      {/* Модальное окно профиля пользователя */}
      {viewingUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gradient-to-br from-[#1a1a1f] to-[#0d0d0f] border border-white/10 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Шапка профиля */}
            <div className="sticky top-0 bg-[#1a1a1f]/95 backdrop-blur border-b border-white/10 p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-4">
                <div 
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black border-2 overflow-hidden ${viewingUser.avatar ? 'bg-cover bg-center' : 'bg-gradient-to-br from-[#6050ba] to-[#4a3d8f]'} border-[#6050ba]/50`}
                  style={{ backgroundImage: viewingUser.avatar ? `url(${viewingUser.avatar})` : 'none' }}
                >
                  {!viewingUser.avatar && (viewingUser.nickname?.charAt(0)?.toUpperCase() || '?')}
                </div>
                <div>
                  <h2 className="text-xl font-black">{viewingUser.nickname || 'Без никнейма'}</h2>
                  <p className="text-sm text-zinc-400">{viewingUser.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      viewingUser.role === 'owner' ? 'bg-purple-500/20 text-purple-300' :
                      viewingUser.role === 'admin' ? 'bg-red-500/20 text-red-300' :
                      viewingUser.role === 'exclusive' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-zinc-500/20 text-zinc-300'
                    }`}>
                      {viewingUser.role?.toUpperCase() || 'BASIC'}
                    </span>
                    <span className="text-[10px] text-zinc-500">{viewingUser.member_id}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Кнопка редактирования (только для Owner) */}
                {currentUserRole === 'owner' && (
                  <button
                    onClick={() => setEditingProfile(!editingProfile)}
                    className={`p-3 rounded-xl transition ${editingProfile ? 'bg-[#8b5cf6]/30 text-[#a78bfa]' : 'hover:bg-white/10'}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => { setViewingUser(null); setEditingProfile(false); }}
                  className="p-3 hover:bg-white/10 rounded-xl transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {profileLoading ? (
              <div className="p-12 text-center text-zinc-500">Загрузка данных...</div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Форма редактирования (только для Owner) */}
                {currentUserRole === 'owner' && editingProfile && (
                  <div className="p-4 bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 rounded-xl space-y-4">
                    <h3 className="font-bold text-[#a78bfa] flex items-center gap-2">
                      <span>♛</span> Редактирование профиля (Owner)
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-zinc-500 block mb-1">Никнейм</label>
                        <input
                          value={editNickname}
                          onChange={(e) => setEditNickname(e.target.value)}
                          className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500 block mb-1">URL аватара</label>
                        <input
                          value={editAvatar}
                          onChange={(e) => setEditAvatar(e.target.value)}
                          placeholder="https://..."
                          className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={saveUserProfile}
                        className="px-4 py-2 bg-[#8b5cf6] hover:bg-[#7c4dff] rounded-xl text-sm font-bold transition"
                      >
                        Сохранить изменения
                      </button>
                      <button
                        onClick={() => setEditingProfile(false)}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm transition"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Статистика */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                    <div className="text-2xl font-black text-emerald-400">{Number(viewingUser.balance || 0).toLocaleString('ru-RU', {minimumFractionDigits: 2, maximumFractionDigits: 2}).replace(/\s/g, '.')} ₽</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Баланс</div>
                  </div>
                  <div className="p-4 bg-[#6050ba]/10 border border-[#6050ba]/20 rounded-xl text-center">
                    <div className="text-2xl font-black text-[#9d8df1]">{userReleases.length}</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Релизов</div>
                  </div>
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
                    <div className="text-2xl font-black text-amber-400">{userPayouts.length}</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Выплат</div>
                  </div>
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-center">
                    <div className="text-2xl font-black text-blue-400">{userTickets.length}</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Тикетов</div>
                  </div>
                </div>
                
                {/* Все транзакции */}
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    Все транзакции ({userTransactions.length})
                  </h3>
                  {userTransactions.length === 0 ? (
                    <p className="text-zinc-500 text-sm">Нет транзакций</p>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {userTransactions.map((tx: any) => {
                        const isWithdrawalRequest = tx.source === 'withdrawal_request';
                        
                        const typeConfig: Record<string, { bg: string; text: string; label: string; icon: string }> = {
                          payout: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', label: 'Выплата', icon: '+' },
                          withdrawal: { bg: 'bg-red-500/20', text: 'text-red-300', label: isWithdrawalRequest ? 'Заявка на вывод' : 'Вывод', icon: '−' },
                          refund: { bg: 'bg-blue-500/20', text: 'text-blue-300', label: 'Возврат', icon: '↺' },
                          adjustment: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', label: 'Корректировка', icon: '±' },
                        };
                        const type = typeConfig[tx.type] || { bg: 'bg-zinc-500/20', text: 'text-zinc-300', label: tx.type, icon: '?' };
                        
                        const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
                          pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', label: 'В обработке' },
                          approved: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Одобрено' },
                          rejected: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Отклонено' },
                          completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Завершена' },
                          cancelled: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Отменена' },
                          failed: { bg: 'bg-orange-500/10', text: 'text-orange-400', label: 'Ошибка' },
                        };
                        const status = statusConfig[tx.status] || statusConfig.pending;
                        
                        return (
                          <div key={`${tx.source}-${tx.id}`} className="p-3 bg-black/30 rounded-lg border border-white/5 hover:border-white/10 transition">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm px-2 py-1 rounded ${type.bg} ${type.text} font-bold`}>
                                  {type.icon} {type.label}
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
                                  {status.label}
                                </span>
                              </div>
                              <div className={`font-bold text-sm ${tx.type === 'withdrawal' ? 'text-red-400' : 'text-emerald-400'}`}>
                                {tx.type === 'withdrawal' ? '−' : '+'}{Number(tx.amount).toLocaleString('ru-RU')} ₽
                              </div>
                            </div>
                            <div className="space-y-1">
                              {isWithdrawalRequest ? (
                                <>
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="text-red-400 font-mono font-bold">№ ЗАЯВКИ:</span>
                                    <span className="text-red-300 font-mono text-[10px]">{tx.id}</span>
                                  </div>
                                  {tx.bank_name && (
                                    <div className="text-xs text-zinc-500">
                                      <span className="text-zinc-600">Банк:</span> {tx.bank_name} | <span className="text-zinc-600">Карта:</span> {tx.card_number}
                                    </div>
                                  )}
                                  {tx.admin_comment && (
                                    <div className="text-xs text-blue-400">Комментарий: {tx.admin_comment}</div>
                                  )}
                                </>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="text-purple-400 font-mono font-bold">TX:</span>
                                    <span className="text-purple-300 font-mono text-[10px]">{tx.id}</span>
                                  </div>
                                  {tx.reference_id && (
                                    <div className="flex items-center gap-2 text-xs">
                                      <span className="text-blue-400 font-mono font-bold">REF:</span>
                                      <span className="text-blue-300 font-mono text-[10px]">{tx.reference_id}</span>
                                    </div>
                                  )}
                                  {tx.description && (
                                    <div className="text-xs text-zinc-500">{tx.description}</div>
                                  )}
                                </>
                              )}
                              <div className="text-[10px] text-zinc-600">
                                {new Date(tx.created_at).toLocaleString('ru-RU', { 
                                  day: 'numeric', 
                                  month: 'long', 
                                  year: 'numeric', 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                {/* Дополнительная информация */}
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                  <h3 className="font-bold mb-4">Информация о профиле</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-zinc-500">ID пользователя:</span>
                      <span className="ml-2 text-zinc-300 font-mono text-xs">{viewingUser.id}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Member ID:</span>
                      <span className="ml-2 text-zinc-300">{viewingUser.member_id || '—'}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Дата регистрации:</span>
                      <span className="ml-2 text-zinc-300">{viewingUser.created_at ? new Date(viewingUser.created_at).toLocaleDateString('ru-RU') : '—'}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Роль:</span>
                      <span className="ml-2 text-zinc-300">{viewingUser.role || 'basic'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast уведомление */}
      {toast.show && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-6 py-3 rounded-lg shadow-lg border ${
            toast.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
              : toast.type === 'info'
              ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          } backdrop-blur-sm`}>
            <div className="flex items-center gap-3">
              <span className="text-xl">{toast.type === 'success' ? '✓' : toast.type === 'info' ? 'ℹ' : '✗'}</span>
              <span className="font-medium whitespace-pre-line">{toast.message}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
