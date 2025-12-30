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
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#6050ba]/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-[#9d8df1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-zinc-500">История операций пуста</p>
        <p className="text-xs text-zinc-600 mt-2">Здесь будут отображаться начисления на баланс и выводы средств</p>
      </div>
    );
  }

  const statusBadges: Record<string, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
    pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Обработка', icon: <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/></svg> },
    approved: { bg: 'bg-[#6050ba]/20', text: 'text-[#9d8df1]', label: 'Одобрено', icon: <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg> },
    rejected: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Отклонено', icon: <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg> },
    completed: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Выплачено', icon: <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg> },
  };

  return (
    <div className="space-y-2 max-h-64 sm:max-h-96 overflow-y-auto pr-1 sm:pr-2" 
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
              className="group p-2 sm:p-3 bg-black/20 border border-white/5 rounded-lg hover:border-emerald-500/50 transition-all flex items-center gap-2 sm:gap-3"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                  <span className="text-xs sm:text-sm font-bold">Начисление</span>
                  <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                    ✓ Выдано
                  </span>
                </div>
                <div className="text-[10px] sm:text-xs text-zinc-500 space-y-0.5">
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
                      Без транзакции
                    </div>
                  )}
                </div>
              </div>
              <div className="text-sm sm:text-base font-black text-emerald-400 flex-shrink-0">
                + {Number(op.amount).toLocaleString('ru-RU').replace(/\s/g, '.')} ₽
              </div>
            </div>
          );
        } else {
          const badge = statusBadges[op.status || 'pending'] || statusBadges.pending;
          
          return (
            <div
              key={`withdrawal-${op.id}`}
              className="group p-2 sm:p-3 bg-black/20 border border-white/5 rounded-lg hover:border-red-500/50 transition-all flex items-center gap-2 sm:gap-3"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm2.5 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6.207.293a1 1 0 00-1.414 0l-6 6a1 1 0 101.414 1.414l6-6a1 1 0 000-1.414zM12.5 10a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                  <span className="text-xs sm:text-sm font-bold">Вывод</span>
                  <span className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full ${badge.bg} ${badge.text} inline-flex items-center gap-1`}>
                    {badge.icon} {badge.label}
                  </span>
                </div>
                <div className="text-[10px] sm:text-xs text-zinc-500 space-y-0.5">
                  <div>{new Date(op.date).toLocaleDateString('ru-RU')}</div>
                  <div className="text-[9px] sm:text-[10px] text-zinc-600 font-mono">№ {op.id.slice(0, 8)}</div>
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
                      Без транзакции
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
