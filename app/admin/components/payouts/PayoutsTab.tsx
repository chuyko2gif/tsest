'use client';

import { useState, useEffect } from 'react';

export default function PayoutsTab({ supabase, currentAdmin, currentUserRole }: { supabase: any; currentAdmin: string | null; currentUserRole: 'admin' | 'owner' }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [quarter, setQuarter] = useState<number>(Math.ceil((new Date().getMonth() + 1) / 3));
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [notification, setNotification] = useState<{show: boolean; message: string; type: 'success' | 'error'}>({show: false, message: '', type: 'success'});

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({show: true, message, type});
    setTimeout(() => setNotification(prev => ({...prev, show: false})), 3000);
  };

  // Загрузка всех пользователей при монтировании
  useEffect(() => {
    const loadAllUsers = async () => {
      const { data } = await supabase.from('profiles').select('*').order('nickname', { ascending: true });
      setAllUsers(data || []);
    };
    loadAllUsers();
    loadAllHistory();
  }, []);

  // Поиск пользователей при вводе
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    
    const filtered = allUsers.filter(u => 
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.member_id?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResults(filtered.slice(0, 10));
    setShowDropdown(filtered.length > 0);
  }, [searchQuery, allUsers]);

  const loadUserHistory = async (userId: string) => {
    const { data: payouts } = await supabase
      .from('payouts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (payouts) {
      const payoutsWithTx = await Promise.all(
        payouts.map(async (payout: any) => {
          const { data: tx } = await supabase
            .from('transactions')
            .select('id')
            .eq('reference_table', 'payouts')
            .eq('reference_id', payout.id)
            .maybeSingle();
          return { ...payout, transactions: tx ? [tx] : [] };
        })
      );
      setHistory(payoutsWithTx);
    } else {
      setHistory([]);
    }
  };

  const loadAllHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data: payoutsData } = await supabase
        .from('payouts')
        .select('*, profiles!inner(nickname, email, avatar, member_id, role)')
        .order('created_at', { ascending: false });
      
      const { data: withdrawalsData } = await supabase
        .from('withdrawal_requests')
        .select('*, profiles!inner(nickname, email, avatar, member_id, role)')
        .order('created_at', { ascending: false });
      
      const payoutsWithTx = await Promise.all(
        (payoutsData || []).map(async (payout: any) => {
          const { data: tx } = await supabase
            .from('transactions')
            .select('id')
            .eq('reference_table', 'payouts')
            .eq('reference_id', payout.id)
            .maybeSingle();
          return { ...payout, transactions: tx ? [tx] : [], type: 'payout' };
        })
      );
      
      const withdrawalsWithTx = await Promise.all(
        (withdrawalsData || []).map(async (withdrawal: any) => {
          const { data: tx } = await supabase
            .from('transactions')
            .select('id')
            .eq('reference_table', 'withdrawal_requests')
            .eq('reference_id', withdrawal.id)
            .maybeSingle();
          return { ...withdrawal, transactions: tx ? [tx] : [], type: 'withdrawal' };
        })
      );
      
      const combined = [
        ...payoutsWithTx,
        ...withdrawalsWithTx
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 50);
      
      setHistory(combined);
    } finally {
      setLoadingHistory(false);
    }
  };

  const deleteSinglePayout = async (payoutId: number, userId: string, userNickname: string, amount: number, year: number, quarter: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту выплату?')) return;
    
    setLoading(true);
    try {
      const { data: transaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('reference_table', 'payouts')
        .eq('reference_id', payoutId)
        .eq('type', 'payout')
        .single();
      
      if (!transaction) {
        const { error: deleteError } = await supabase
          .from('payouts')
          .delete()
          .eq('id', payoutId);
          
        if (deleteError) throw deleteError;
        
        showNotification('✓ Выплата удалена (без транзакции)', 'success');
        await loadUserHistory(userId);
        const { data: updatedUsers } = await supabase.from('profiles').select('*').order('nickname', { ascending: true });
        setAllUsers(updatedUsers || []);
        setLoading(false);
        return;
      }

      const { data: currentUser } = await supabase.auth.getUser();
      
      const { error: cancelError } = await supabase.rpc('cancel_transaction', {
        p_transaction_id: transaction.id,
        p_cancelled_by: currentUser.user?.id || null,
        p_reason: `Отмена выплаты Q${quarter} ${year} администратором`
      });

      if (cancelError) {
        showNotification(`❌ ${cancelError.message}`, 'error');
        setLoading(false);
        return;
      }
      
      const { error: deleteError } = await supabase
        .from('payouts')
        .delete()
        .eq('id', payoutId);
      
      if (deleteError) throw deleteError;
      
      showNotification(`✓ Выплата отменена через систему транзакций`, 'success');
      
      if (selectedUser) {
        loadUserHistory(selectedUser.id);
      } else {
        loadAllHistory();
      }
    } catch (e: any) {
      showNotification('Ошибка: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectUser = (user: any) => {
    setSelectedUser(user);
    setSearchQuery('');
    setShowDropdown(false);
    loadUserHistory(user.id);
  };

  const clearSelection = () => {
    setSelectedUser(null);
    setHistory([]);
    loadAllHistory();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      showNotification('Выберите пользователя', 'error');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      showNotification('Введите сумму', 'error');
      return;
    }
    
    setLoading(true);
    try {
      const payoutPayload = {
        user_id: selectedUser.id,
        year,
        quarter,
        amount: Number(amount),
        note: note || null,
        paid_by: currentAdmin,
        is_read: false,
      };

      const { data: newPayout, error: payoutError } = await supabase
        .from('payouts')
        .insert(payoutPayload)
        .select()
        .single();
      
      if (payoutError) throw payoutError;

      showNotification('✓ Выплата сохранена', 'success');
      setNote('');
      setAmount('');
      await loadUserHistory(selectedUser.id);
      
      const { data: updatedUsers } = await supabase.from('profiles').select('*').order('nickname', { ascending: true });
      setAllUsers(updatedUsers || []);
    } catch (err: any) {
      console.error(err);
      showNotification('Ошибка: ' + (err.message || String(err)), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Уведомление */}
      {notification.show && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-6 py-3 rounded-xl shadow-2xl border backdrop-blur-sm ${
            notification.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="font-medium">{notification.message}</span>
            </div>
          </div>
        </div>
      )}

      <div className={`grid grid-cols-1 ${currentUserRole === 'owner' ? 'lg:grid-cols-2' : ''} gap-6`}>
        {/* Форма выплаты - только для owner */}
        {currentUserRole === 'owner' && (
        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
          <h3 className="font-black mb-4">Добавить выплату</h3>
          
          {/* Выбранный пользователь или поиск */}
          {selectedUser ? (
            <div className="p-4 bg-[#6050ba]/10 border border-[#6050ba]/30 rounded-xl mb-4 flex items-center gap-3">
              <div 
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${selectedUser.avatar ? 'bg-cover bg-center' : 'bg-[#6050ba]/20'}`}
                style={{ backgroundImage: selectedUser.avatar ? `url(${selectedUser.avatar})` : 'none' }}
              >
                {!selectedUser.avatar && (selectedUser.nickname?.charAt(0)?.toUpperCase() || '?')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{selectedUser.nickname || 'Без никнейма'}</div>
                <div className="text-xs text-zinc-500 truncate">{selectedUser.email}</div>
              </div>
              <button
                onClick={clearSelection}
                className="p-2 hover:bg-white/10 rounded-lg transition"
              >
                <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="relative mb-4">
              <input 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                placeholder="Поиск по email, никнейму или ID..." 
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#6050ba]" 
              />
              
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1f] border border-white/10 rounded-xl overflow-hidden z-50 max-h-64 overflow-y-auto">
                  {searchResults.map(user => (
                    <button
                      key={user.id}
                      onClick={() => selectUser(user)}
                      className="w-full p-3 hover:bg-white/5 flex items-center gap-3 text-left transition"
                    >
                      {/* Аватарка */}
                      <div 
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${user.avatar ? 'bg-cover bg-center' : 'bg-[#6050ba]/20'}`}
                        style={user.avatar ? { backgroundImage: `url(${user.avatar})` } : {}}
                      >
                        {!user.avatar && (user.nickname?.charAt(0)?.toUpperCase() || '?')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate">{user.nickname || 'Без никнейма'}</div>
                        <div className="text-xs text-zinc-500 truncate">{user.email}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Выбор периода */}
            <div className="space-y-2">
              <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Период выплаты</label>
              <div className="grid grid-cols-2 gap-3">
                <select 
                  value={String(year)} 
                  onChange={(e) => setYear(Number(e.target.value))} 
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm cursor-pointer"
                >
                  {Array.from({ length: 5 }).map((_, i) => {
                    const y = new Date().getFullYear() - i;
                    return <option key={y} value={y}>{y} год</option>;
                  })}
                </select>
                <select 
                  value={String(quarter)} 
                  onChange={(e) => setQuarter(Number(e.target.value))} 
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm cursor-pointer"
                >
                  <option value="1">Q1 (янв-мар)</option>
                  <option value="2">Q2 (апр-июн)</option>
                  <option value="3">Q3 (июл-сен)</option>
                  <option value="4">Q4 (окт-дек)</option>
                </select>
              </div>
            </div>
            
            {/* Сумма */}
            <div className="space-y-2">
              <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Сумма выплаты</label>
              <input 
                value={amount} 
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} 
                placeholder="Введите сумму" 
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#6050ba]" 
              />
            </div>
            
            {/* Примечание */}
            <div className="space-y-2">
              <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Примечание (необязательно)</label>
              <input 
                value={note} 
                onChange={(e) => setNote(e.target.value)} 
                placeholder="Например: Роялти за 4 квартал" 
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#6050ba]" 
              />
            </div>
            
            <button 
              type="submit"
              disabled={loading || !selectedUser} 
              className={`w-full py-3 rounded-xl text-sm font-bold transition ${
                loading || !selectedUser 
                  ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' 
                  : 'bg-[#6050ba] hover:bg-[#7060ca]'
              }`}
            >
              {loading ? 'Сохранение...' : 'Сохранить выплату'}
            </button>
          </form>
        </div>
        )}

        {/* История выплат */}
        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
          <div className="mb-4">
            <h3 className="font-black text-white text-sm mb-3">
              {selectedUser ? `История выплат: ${selectedUser.nickname || selectedUser.email}` : 'История выплат'}
            </h3>
            
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  placeholder="Поиск..."
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-sm outline-none focus:border-[#6050ba] pl-10"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button
                onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                className="px-3 py-2 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
              >
                {sortOrder === 'newest' ? '↓' : '↑'}
              </button>
            </div>
          </div>
          
          {history.length === 0 ? (
            <div className="text-zinc-600 py-8 text-center">
              <p className="text-xs text-zinc-500">История выплат пуста</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {[...history]
                .filter(h => {
                  if (!historySearchQuery.trim()) return true;
                  const query = historySearchQuery.toLowerCase();
                  if (h.profiles?.nickname?.toLowerCase().includes(query)) return true;
                  if (h.profiles?.email?.toLowerCase().includes(query)) return true;
                  if (h.note?.toLowerCase().includes(query)) return true;
                  return false;
                })
                .sort((a, b) => {
                  const dateA = new Date(a.created_at).getTime();
                  const dateB = new Date(b.created_at).getTime();
                  return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
                }).map(h => {
                  const isWithdrawal = h.type === 'withdrawal';
                  return (
                    <div 
                      key={h.id} 
                      className="p-3.5 bg-black/30 border border-white/5 rounded-xl hover:border-white/10 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        {!selectedUser && h.profiles && (
                          <div 
                            className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${h.profiles.avatar ? 'bg-cover bg-center' : 'bg-[#6050ba]/20'}`}
                            style={h.profiles.avatar ? { backgroundImage: `url(${h.profiles.avatar})` } : {}}
                          >
                            {!h.profiles.avatar && (h.profiles.nickname?.charAt(0)?.toUpperCase() || '?')}
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          {!selectedUser && h.profiles && (
                            <div className="text-xs text-zinc-400 truncate mb-1">{h.profiles.nickname || h.profiles.email}</div>
                          )}
                          <div className="text-xs text-zinc-500 space-y-0.5">
                            <div>
                              {h.created_at 
                                ? new Date(h.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                : `Квартал ${h.quarter}, ${h.year}`
                              }
                            </div>
                            {h.transactions && h.transactions[0] && (
                              <div className="text-[10px] text-emerald-400/70 font-mono flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd"/>
                                </svg>
                                TX: {h.transactions[0].id.slice(0, 8)}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right flex items-center gap-2">
                          <div className="text-base font-black text-white">
                            {isWithdrawal ? '−' : '+'}{Number(h.amount).toLocaleString('ru-RU')} ₽
                          </div>
                          {!isWithdrawal && currentUserRole === 'owner' && (
                            <button
                              onClick={() => deleteSinglePayout(h.id, h.user_id, h.profiles?.nickname || selectedUser?.nickname || 'Пользователь', Number(h.amount), h.year, h.quarter)}
                              disabled={loading}
                              className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded transition-all text-red-400"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
