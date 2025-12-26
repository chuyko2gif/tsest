'use client';

import { Payout, User } from './types';

interface PayoutHistoryProps {
  history: Payout[];
  selectedUser: User | null;
  historySearchQuery: string;
  setHistorySearchQuery: (value: string) => void;
  sortOrder: 'newest' | 'oldest';
  setSortOrder: (value: 'newest' | 'oldest') => void;
  loading: boolean;
  currentUserRole: 'admin' | 'owner';
  onDeletePayout: (payout: Payout) => void;
}

export function PayoutHistory({
  history,
  selectedUser,
  historySearchQuery,
  setHistorySearchQuery,
  sortOrder,
  setSortOrder,
  loading,
  currentUserRole,
  onDeletePayout,
}: PayoutHistoryProps) {
  const filteredHistory = [...history]
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
    });

  return (
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
            onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
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
          {filteredHistory.map(h => {
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
                        onClick={() => onDeletePayout(h)}
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
  );
}
