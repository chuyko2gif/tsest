'use client';
import React from 'react';

interface BalanceCardProps {
  balance: number;
  onWithdrawClick: () => void;
  showWithdrawalForm: boolean;
}

export default function BalanceCard({ balance, onWithdrawClick, showWithdrawalForm }: BalanceCardProps) {
  return (
    <div className="p-5 bg-white/[0.02] border border-white/5 rounded-xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Доступно</div>
          <div className="text-3xl font-black text-emerald-400">{balance.toFixed(2)} ₽</div>
          <div className="text-[10px] text-zinc-600 mt-1">Мин. для вывода: 1000 ₽</div>
        </div>
        {!showWithdrawalForm && (
          <button 
            onClick={onWithdrawClick}
            disabled={balance < 1000}
            className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${
              balance >= 1000 
                ? 'bg-emerald-500 hover:bg-emerald-400 text-black' 
                : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
            }`}
          >
            Вывести
          </button>
        )}
      </div>
    </div>
  );
}
