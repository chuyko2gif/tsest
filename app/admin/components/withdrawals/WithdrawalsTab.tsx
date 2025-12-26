'use client';

import { useState, useEffect } from 'react';

export default function WithdrawalsTab({ supabase, currentUserRole }: { supabase: any; currentUserRole: 'admin' | 'owner' }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'completed'>('all');
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [adminComment, setAdminComment] = useState('');
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{show: boolean; message: string; type: 'success' | 'error'}>({show: false, message: '', type: 'success'});

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({show: true, message, type});
    setTimeout(() => setNotification(prev => ({...prev, show: false})), 3000);
  };

  const loadRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('withdrawal_requests')
        .select(`
          *,
          user:profiles!user_id (
            nickname,
            email,
            avatar,
            member_id,
            role
          )
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Загружаем transaction_id для каждой заявки
      if (data && data.length > 0) {
        const requestsWithTx = await Promise.all(
          data.map(async (request: any) => {
            const { data: tx } = await supabase
              .from('transactions')
              .select('id')
              .eq('reference_table', 'withdrawal_requests')
              .eq('reference_id', request.id)
              .maybeSingle();
            return { ...request, transaction_id: tx?.id || null };
          })
        );
        setRequests(requestsWithTx || []);
      } else {
        setRequests([]);
      }
    } catch (e: any) {
      showNotification('Ошибка загрузки: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [filter]);

  const handleStatusUpdate = async (requestId: string, newStatus: 'approved' | 'rejected' | 'completed') => {
    if (!selectedRequest) return;
    
    const statusMessages = {
      approved: 'одобрить',
      rejected: 'отклонить',
      completed: 'завершить'
    };

    if (!confirm(`Вы уверены, что хотите ${statusMessages[newStatus]} эту заявку?`)) return;

    setProcessing(true);
    try {
      if (selectedRequest.status !== 'pending' && newStatus === 'rejected') {
        showNotification('Можно отклонить только заявки в статусе "В обработке"', 'error');
        setProcessing(false);
        return;
      }

      const updateData: any = {
        status: newStatus,
        admin_comment: adminComment || null,
        processed_at: new Date().toISOString(),
      };

      if (newStatus === 'rejected') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', selectedRequest.user_id)
          .single();
        
        const currentBalance = Number(profile?.balance) || 0;
        const requestAmount = Number(selectedRequest.amount);
        const newBalance = currentBalance + requestAmount;
        
        await supabase
          .from('profiles')
          .update({ balance: newBalance })
          .eq('id', selectedRequest.user_id);
      }

      const { error } = await supabase
        .from('withdrawal_requests')
        .update(updateData)
        .eq('id', requestId);

      if (error) throw error;

      showNotification(`✓ Заявка ${statusMessages[newStatus]}а успешно`, 'success');
      setSelectedRequest(null);
      setAdminComment('');
      await loadRequests();
    } catch (e: any) {
      showNotification('Ошибка: ' + e.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'На рассмотрении' },
      approved: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Одобрено' },
      rejected: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Отклонено' },
      completed: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Выплачено' },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="space-y-6 relative">
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

      {/* Фильтры и поиск */}
      <div className="space-y-3">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по номеру заявки, никнейму или email..."
            className="w-full px-4 py-3 pl-10 bg-black/30 border border-white/10 rounded-xl text-sm outline-none focus:border-[#6050ba]/50 transition"
          />
          <svg className="w-5 h-5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'Все' },
            { id: 'pending', label: 'На рассмотрении' },
            { id: 'approved', label: 'Одобрено' },
            { id: 'completed', label: 'Выплачено' },
            { id: 'rejected', label: 'Отклонено' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                filter === f.id
                  ? 'bg-[#6050ba] text-white'
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Список заявок */}
      {loading ? (
        <div className="text-center py-12 text-zinc-500">Загрузка...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-zinc-500">Нет заявок</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests
            .filter(req => {
              if (!searchQuery.trim()) return true;
              const search = searchQuery.toLowerCase();
              return (
                req.id.toLowerCase().includes(search) ||
                req.user?.nickname?.toLowerCase().includes(search) ||
                req.user?.email?.toLowerCase().includes(search)
              );
            })
            .map((req) => (
            <div
              key={req.id}
              onClick={() => setSelectedRequest(req)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedRequest?.id === req.id
                  ? 'bg-[#6050ba]/20 border-[#6050ba]/50'
                  : 'bg-white/[0.02] border-white/5 hover:border-[#6050ba]/30'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Аватар */}
                  <div 
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${req.user.avatar ? 'bg-cover bg-center' : 'bg-[#6050ba]/20'}`}
                    style={req.user.avatar ? { backgroundImage: `url(${req.user.avatar})` } : {}}
                  >
                    {!req.user.avatar && (req.user.nickname?.charAt(0)?.toUpperCase() || '?')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">{req.user.nickname || 'Без никнейма'}</div>
                    <div className="text-xs text-zinc-500 truncate">{req.user.email}</div>
                    <div className="text-sm mt-1">
                      Сумма: <span className="font-bold text-emerald-400">{Number(req.amount).toLocaleString('ru-RU')} ₽</span>
                    </div>
                    <div className="text-[10px] text-zinc-600 mt-1">
                      {new Date(req.created_at).toLocaleString('ru-RU')}
                    </div>
                  </div>
                </div>
                {getStatusBadge(req.status)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Оверлей затемнения */}
      {selectedRequest && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => { setSelectedRequest(null); setAdminComment(''); }}
        />
      )}

      {/* Детали заявки - боковая панель */}
      {selectedRequest && (
        <div className="fixed top-0 right-0 h-full w-full md:w-[500px] bg-[#0a0a0a] border-l border-white/10 z-50 overflow-y-auto shadow-2xl">
          <div className="sticky top-0 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/10 p-6 z-10">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Детали заявки</h3>
              <button
                onClick={() => { setSelectedRequest(null); setAdminComment(''); }}
                className="p-2 hover:bg-white/10 rounded-xl transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Информация о пользователе */}
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <div className="text-xs text-zinc-500 mb-3 font-semibold">Пользователь</div>
              <div className="font-bold">{selectedRequest.user.nickname || 'Без никнейма'}</div>
              <div className="text-sm text-zinc-400">{selectedRequest.user.email}</div>
            </div>

            {/* Сумма */}
            <div className="p-5 bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/40 rounded-2xl">
              <div className="text-xs text-emerald-300 mb-2 font-semibold">Сумма к выводу</div>
              <div className="text-4xl font-black text-white">
                {Number(selectedRequest.amount).toLocaleString('ru-RU')} <span className="text-xl text-emerald-400">₽</span>
              </div>
            </div>

            {/* Реквизиты */}
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
              <div className="text-xs text-zinc-500 mb-3 font-semibold">Реквизиты для вывода</div>
              <div><span className="text-zinc-500">Банк:</span> {selectedRequest.bank_name}</div>
              <div><span className="text-zinc-500">Карта:</span> {selectedRequest.card_number}</div>
              <div><span className="text-zinc-500">Получатель:</span> {selectedRequest.recipient_name}</div>
            </div>

            {/* Transaction ID */}
            {selectedRequest.transaction_id && (
              <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20">
                <div className="text-xs text-emerald-400 mb-2 font-semibold flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd"/>
                  </svg>
                  Код транзакции
                </div>
                <div className="text-sm font-mono text-white bg-black/30 px-3 py-2 rounded-lg">
                  {selectedRequest.transaction_id}
                </div>
              </div>
            )}

            {/* Действия для owner */}
            {currentUserRole === 'owner' && selectedRequest.status === 'pending' && (
              <div className="space-y-3 pt-6 mt-6 border-t border-white/20">
                <div className="text-xs text-zinc-500 mb-2 font-semibold">Ваше решение</div>
                <textarea
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  placeholder="Комментарий (необязательно)..."
                  className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl text-sm resize-none h-24 focus:border-[#6050ba]/50 transition"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => handleStatusUpdate(selectedRequest.id, 'rejected')}
                    disabled={processing}
                    className="flex-1 py-4 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-2xl font-bold text-sm transition-all disabled:opacity-50"
                  >
                    ✕ Отклонить
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedRequest.id, 'approved')}
                    disabled={processing}
                    className="flex-1 py-4 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-2xl font-bold text-sm transition-all disabled:opacity-50"
                  >
                    ✓ Одобрить
                  </button>
                </div>
              </div>
            )}

            {currentUserRole === 'owner' && selectedRequest.status === 'approved' && (
              <div className="pt-6 mt-6 border-t border-white/20">
                <button
                  onClick={() => handleStatusUpdate(selectedRequest.id, 'completed')}
                  disabled={processing}
                  className="w-full py-4 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-2xl font-bold text-sm transition-all disabled:opacity-50"
                >
                  ✓✓ Отметить как выплачено
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
