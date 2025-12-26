'use client';
import React from 'react';

interface Operation {
  type: 'payout' | 'withdrawal';
  id: string;
  amount: number;
  date: string;
  quarter?: number;
  year?: number;
  status?: string;
  bank_name?: string;
  card_number?: string;
  admin_comment?: string;
  note?: string;
  transaction_id?: string | null;
  data: any;
}

interface OperationsHistoryProps {
  payouts: any[];
  withdrawalRequests: any[];
}

export default function OperationsHistory({ payouts, withdrawalRequests }: OperationsHistoryProps) {
  // Объединяем payouts и withdrawals в одну ленту
  const allOperations: Operation[] = [
    ...payouts.map(p => ({
      type: 'payout' as const,
      id: p.id,
      amount: p.amount,
      date: p.created_at,
      quarter: p.quarter,
      year: p.year,
      note: p.note,
      transaction_id: p.transaction_id,
      data: p
    })),
    ...withdrawalRequests.map(w => ({
      type: 'withdrawal' as const,
      id: w.id,
      amount: w.amount,
      date: w.created_at,
      status: w.status,
      bank_name: w.bank_name,
      card_number: w.card_number,
      admin_comment: w.admin_comment,
      transaction_id: w.transaction_id,
      data: w
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (allOperations.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
        <div className="text-4xl mb-4">📊</div>
        <p className="text-zinc-500">История операций пуста</p>
        <p className="text-xs text-zinc-600 mt-2">Здесь будут отображаться начисления на баланс и выводы средств</p>
      </div>
    );
  }

  const statusBadges: Record<string, { bg: string; text: string; label: string; icon: string }> = {
    pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Обработка', icon: '⏳' },
    approved: { bg: 'bg-[#6050ba]/20', text: 'text-[#9d8df1]', label: 'Одобрено', icon: '✓' },
    rejected: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Отклонено', icon: '✕' },
    completed: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Выплачено', icon: '✓✓' },
  };

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto pr-2" 
         style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      {allOperations.map((op) => {
        if (op.type === 'payout') {
          return (
            <div
              key={`payout-${op.id}`}
              className="group p-3 bg-black/20 border border-white/5 rounded-lg hover:border-emerald-500/50 transition-all flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-base flex-shrink-0">
                💰
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold">Начисление</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                    ✓ Выдано
                  </span>
                </div>
                <div className="text-xs text-zinc-500 space-y-0.5">
                  <div>Q{op.quarter} {op.year}</div>
                  {op.transaction_id ? (
                    <div className="text-[10px] text-emerald-400/80 font-mono flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd"/>
                      </svg>
                      TX: {op.transaction_id.slice(0, 8)}
                    </div>
                  ) : (
                    <div className="text-[10px] text-orange-400/60 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                      </svg>
                      ⚠ Без транзакции
                    </div>
                  )}
                </div>
              </div>
              <div className="text-base font-black text-emerald-400 flex-shrink-0">
                + {Number(op.amount).toLocaleString('ru-RU').replace(/\s/g, '.')} ₽
              </div>
            </div>
          );
        } else {
          const badge = statusBadges[op.status || 'pending'] || statusBadges.pending;
          
          return (
            <div
              key={`withdrawal-${op.id}`}
              className="group p-3 bg-black/20 border border-white/5 rounded-lg hover:border-red-500/50 transition-all flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center text-base flex-shrink-0">
                💸
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold">Вывод</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
                    {badge.icon} {badge.label}
                  </span>
                </div>
                <div className="text-xs text-zinc-500 space-y-0.5">
                  <div>{new Date(op.date).toLocaleDateString('ru-RU')}</div>
                  <div className="text-[10px] text-zinc-600 font-mono">№ {op.id.slice(0, 8)}</div>
                  {op.transaction_id ? (
                    <div className="text-[10px] text-red-400/80 font-mono flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd"/>
                      </svg>
                      TX: {op.transaction_id.slice(0, 8)}
                    </div>
                  ) : (
                    <div className="text-[10px] text-orange-400/60 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                      </svg>
                      ⚠ Без транзакции
                    </div>
                  )}
                </div>
              </div>
              <div className="text-base font-black text-red-400 flex-shrink-0">
                − {Number(op.amount).toLocaleString('ru-RU').replace(/\s/g, '.')} ₽
              </div>
            </div>
          );
        }
      })}
    </div>
  );
}
