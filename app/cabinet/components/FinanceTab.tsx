"use client";
import React from 'react';
import UserPayouts from './UserPayouts';
import UserReports from './UserReports';

interface FinanceTabProps {
  userId?: string | null;
  balance: number;
  onWithdraw: () => void;
}

// Вкладка финансов - баланс, отчёты и выплаты
export default function FinanceTab({ userId, balance, onWithdraw }: FinanceTabProps) {
  return (
    <div className="animate-fade-up">
      <h2 className="text-3xl font-black uppercase tracking-tight mb-2">Финансы</h2>
      <p className="text-sm text-zinc-500 mb-8">Баланс и отчёты</p>
      
      {/* Баланс и кнопка вывода */}
      <div className="p-8 bg-gradient-to-br from-emerald-500/10 to-green-500/5 border border-emerald-500/20 rounded-2xl mb-8"
           style={{ boxShadow: '0 0 40px rgba(16, 185, 129, 0.15)' }}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Ваш баланс</div>
              <div className="text-4xl md:text-5xl font-black text-emerald-400">{balance.toFixed(2)} ₽</div>
            </div>
          </div>
          <button 
            onClick={onWithdraw}
            disabled={balance < 1000}
            className={`px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
              balance >= 1000 
                ? 'bg-emerald-500 hover:bg-emerald-400 text-black hover:scale-105' 
                : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
            }`}
          >
            Вывести средства
          </button>
        </div>
        <p className="text-xs text-zinc-500 mt-4">
          Минимальная сумма для вывода: 1000 ₽. Выплаты производятся в течение 3-5 рабочих дней.
        </p>
      </div>
      
      {/* Отчёты */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Отчёты</h3>
        </div>
        
        <UserReports userId={userId} />
      </div>
      
      {/* История выплат */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">История выплат</h3>
        </div>
        
        <UserPayouts userId={userId} />
      </div>
      
      <div className="p-4 bg-zinc-800/30 border border-zinc-700/50 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
            </svg>
          </div>
          <p className="text-xs text-zinc-500">
            Отчёты загружаются автоматически каждый квартал. По вопросам — создайте тикет в разделе Поддержка
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
