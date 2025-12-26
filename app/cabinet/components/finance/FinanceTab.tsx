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
    <div className="animate-fade-up space-y-4">
      {/* Заголовок */}
      <div className="mb-6">
        <h2 className="text-2xl font-black uppercase tracking-tight">Финансы</h2>
        <p className="text-sm text-zinc-500 mt-1">Баланс и вывод средств</p>
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
      <div className="mt-6">
        <div className="p-5 bg-white/[0.02] border border-white/5 rounded-xl">
          
          {/* Заголовок */}
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/5">
            <div className="w-11 h-11 rounded-lg bg-[#6050ba]/20 flex items-center justify-center text-xl">
              📊
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold">История операций</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Все начисления и выводы</p>
            </div>
          </div>
          
          <OperationsHistory
            payouts={payouts}
            withdrawalRequests={withdrawalRequests}
          />
          
          {/* Информационная плашка */}
          <div className="mt-8 p-4 bg-gradient-to-r from-zinc-900/50 to-black/30 backdrop-blur-sm border border-white/10 rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="text-2xl flex-shrink-0">💡</div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Здесь отображаются все финансовые операции в хронологическом порядке: <span className="text-emerald-400 font-semibold">начисления на баланс</span> (зелёные карточки) и <span className="text-red-400 font-semibold">выводы средств</span> с различными статусами обработки.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
