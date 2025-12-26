'use client';

import React from 'react';

interface UserProfileModalProps {
  viewingUser: any;
  profileLoading: boolean;
  userReleases: any[];
  userPayouts: any[];
  userTickets: any[];
  userTransactions: any[];
  onClose: () => void;
}

export default function UserProfileModal({
  viewingUser,
  profileLoading,
  userReleases,
  userPayouts,
  userTickets,
  userTransactions,
  onClose
}: UserProfileModalProps) {
  if (!viewingUser) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-blue-500/30 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Хедер профиля */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-900/50 to-purple-900/50 backdrop-blur-sm border-b border-blue-500/30 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            {viewingUser.avatar_url ? (
              <img src={viewingUser.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-blue-500/30" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-2xl font-bold">
                {(viewingUser.nickname || viewingUser.email || '?')[0].toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="text-xl font-black text-white">{viewingUser.nickname || 'Без никнейма'}</h3>
              <p className="text-sm text-blue-300">{viewingUser.email}</p>
              {viewingUser.telegram && (
                <p className="text-xs text-zinc-400">@{viewingUser.telegram}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-white/10 rounded-xl transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {profileLoading ? (
          <div className="p-12 text-center text-zinc-500">Загрузка данных...</div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Статистика */}
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                <div className="text-2xl font-black text-emerald-400">
                  {Number(viewingUser.balance || 0).toLocaleString('ru-RU', {minimumFractionDigits: 2, maximumFractionDigits: 2}).replace(/\s/g, '.')} ₽
                </div>
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
            
            {/* Транзакции */}
            <TransactionsList transactions={userTransactions} />
            
            {/* Дополнительная информация */}
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
              <h3 className="font-bold mb-4">Информация о профиле</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-zinc-500">ID пользователя:</span>
                  <span className="ml-2 text-zinc-300 font-mono text-xs">{viewingUser.id}</span>
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
  );
}

// Компонент списка транзакций
function TransactionsList({ transactions }: { transactions: any[] }) {
  return (
    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
      <h3 className="font-bold mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
        Все транзакции ({transactions.length})
      </h3>
      {transactions.length === 0 ? (
        <p className="text-zinc-500 text-sm">Нет транзакций</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {transactions.map((tx: any) => (
            <TransactionItem key={`${tx.source}-${tx.id}`} tx={tx} />
          ))}
        </div>
      )}
    </div>
  );
}

// Компонент одной транзакции
function TransactionItem({ tx }: { tx: any }) {
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
    <div className="p-3 bg-black/30 rounded-lg border border-white/5 hover:border-white/10 transition">
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
}
