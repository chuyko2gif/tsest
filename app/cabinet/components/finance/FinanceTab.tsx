'use client';
import React, { useState } from 'react';
import BalanceCard from './BalanceCard';
import WithdrawalForm from './WithdrawalForm';
import OperationsHistory from './OperationsHistory';

interface FinanceTabProps {
  userId: string;
  balance: number;
  setBalance: (b: number) => void;
  payouts: any[];
  withdrawalRequests: any[];
  showNotification: (message: string, type: 'success' | 'error') => void;
  reloadRequests: () => void;
}

export default function FinanceTab({
  userId,
  balance,
  setBalance,
  payouts,
  withdrawalRequests,
  showNotification,
  reloadRequests,
}: FinanceTabProps) {
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);

  return (
    <div className="animate-fade-up space-y-3 sm:space-y-4">
      {/* Заголовок */}
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">Финансы</h2>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1">Баланс и вывод средств</p>
      </div>
      
      {/* Баланс */}
      <BalanceCard
        balance={balance}
        onWithdrawClick={() => setShowWithdrawalForm(true)}
        showWithdrawalForm={showWithdrawalForm}
      />
      
      {/* Форма вывода */}
      {showWithdrawalForm && (
        <WithdrawalForm
          userId={userId}
          balance={balance}
          onClose={() => setShowWithdrawalForm(false)}
          onSuccess={setBalance}
          showNotification={showNotification}
          reloadRequests={reloadRequests}
        />
      )}
      
      {/* История операций */}
      <div className="mt-4 sm:mt-6">
        <div className="p-3 sm:p-5 bg-white/[0.02] border border-white/5 rounded-xl">
          
          {/* Заголовок */}
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 pb-3 sm:pb-4 border-b border-white/5">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-[#6050ba]/20 flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#9d8df1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-base sm:text-xl font-bold">История операций</h3>
              <p className="text-[10px] sm:text-xs text-zinc-500 mt-0.5">Все начисления и выводы</p>
            </div>
          </div>
          
          <OperationsHistory
            payouts={payouts}
            withdrawalRequests={withdrawalRequests}
          />
          
          {/* Информационная плашка */}
          <div className="mt-4 sm:mt-8 p-3 sm:p-4 bg-gradient-to-r from-zinc-900/50 to-black/30 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                </svg>
              </div>
              <p className="text-[10px] sm:text-xs text-zinc-400 leading-relaxed">
                Здесь отображаются все финансовые операции в хронологическом порядке: <span className="text-emerald-400 font-semibold">начисления на баланс</span> (зелёные карточки) и <span className="text-red-400 font-semibold">выводы средств</span> с различными статусами обработки.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
