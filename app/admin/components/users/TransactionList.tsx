'use client';

import { Transaction } from './types';

interface TransactionListProps {
  transactions: Transaction[];
}

export function TransactionList({ transactions }: TransactionListProps) {
  const typeConfig: Record<string, { bg: string; text: string; label: string; icon: string }> = {
    payout: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', label: 'Выплата', icon: '+' },
    withdrawal: { bg: 'bg-red-500/20', text: 'text-red-300', label: 'Вывод', icon: '−' },
    refund: { bg: 'bg-blue-500/20', text: 'text-blue-300', label: 'Возврат', icon: '↺' },
    adjustment: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', label: 'Корректировка', icon: '±' },
  };

  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', label: 'В обработке' },
    approved: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Одобрено' },
    rejected: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Отклонено' },
    completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Завершена' },
    cancelled: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Отменена' },
    failed: { bg: 'bg-orange-500/10', text: 'text-orange-400', label: 'Ошибка' },
  };

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
          {transactions.map((tx: any) => {
            const isWithdrawalRequest = tx.source === 'withdrawal_request';
            const type = typeConfig[tx.type] || { bg: 'bg-zinc-500/20', text: 'text-zinc-300', label: tx.type, icon: '?' };
            if (isWithdrawalRequest && tx.type === 'withdrawal') {
              type.label = 'Заявка на вывод';
            }
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
  );
}
