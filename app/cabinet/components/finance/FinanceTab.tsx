'use client';
import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase/client';
import BalanceCard from './BalanceCard';
import WithdrawalForm from './WithdrawalForm';
import OperationsHistory from './OperationsHistory';
import DepositModal from './DepositModal';

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
  balance: initialBalance,
  setBalance,
  payouts,
  withdrawalRequests,
  showNotification,
  reloadRequests,
}: FinanceTabProps) {
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(initialBalance);
  const [transactions, setTransactions] = useState<any[]>([]);
  const { themeName } = useTheme();
  const isLight = themeName === 'light';

  const loadBalanceData = async () => {
    if (!supabase) return;
    try {
      // Загружаем баланс из user_balances
      const { data: balanceData, error: balanceError } = await supabase
        .from('user_balances')
        .select('balance, frozen_balance, total_deposited, total_withdrawn')
        .eq('user_id', userId)
        .single();

      if (balanceData) {
        setCurrentBalance(balanceData.balance || 0);
        setBalance(balanceData.balance || 0);
      }

      // Загружаем транзакции из новой таблицы
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (txData) {
        setTransactions(txData);
      }
    } catch (error) {
      console.error('Ошибка загрузки баланса:', error);
    }
  };

  // Загружаем баланс и транзакции из новых таблиц
  useEffect(() => {
    loadBalanceData();
  }, [userId]);

  // Обновляем данные после успешного пополнения
  const handleDepositClose = () => {
    setShowDepositModal(false);
    loadBalanceData();
  };

  return (
    <div className="animate-fade-up space-y-2 sm:space-y-4">
      {/* Заголовок */}
      <div className="mb-2 sm:mb-6">
        <h2 className={`text-lg sm:text-2xl font-black uppercase tracking-tight ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>Финансы</h2>
        <p className={`text-[10px] sm:text-sm mt-0.5 sm:mt-1 ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>Баланс, пополнение и вывод средств</p>
      </div>
      
      {/* Баланс */}
      <BalanceCard
        balance={currentBalance}
        onWithdrawClick={() => setShowWithdrawalForm(true)}
        onDepositClick={() => setShowDepositModal(true)}
        showWithdrawalForm={showWithdrawalForm}
      />
      
      {/* Форма вывода */}
      {showWithdrawalForm && (
        <WithdrawalForm
          userId={userId}
          balance={currentBalance}
          onClose={() => setShowWithdrawalForm(false)}
          onSuccess={(newBalance) => {
            setCurrentBalance(newBalance);
            setBalance(newBalance);
          }}
          showNotification={showNotification}
          reloadRequests={reloadRequests}
        />
      )}

      {/* Модальное окно пополнения */}
      {showDepositModal && (
        <DepositModal
          userId={userId}
          onClose={handleDepositClose}
          showNotification={showNotification}
        />
      )}
      
      {/* История операций */}
      <div className="mt-2 sm:mt-6">
        <div 
          className="p-2.5 sm:p-5 rounded-xl sm:rounded-2xl transition-all duration-300"
          style={{
            background: isLight 
              ? 'rgba(255, 255, 255, 0.65)' 
              : 'rgba(255, 255, 255, 0.02)',
            backdropFilter: isLight ? 'blur(20px) saturate(180%)' : 'none',
            border: isLight 
              ? '1px solid rgba(255, 255, 255, 0.8)' 
              : '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: isLight 
              ? '0 8px 32px rgba(138, 99, 210, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)' 
              : 'none'
          }}
        >
          
          {/* Заголовок */}
          <div 
            className="flex items-center gap-2 mb-2.5 sm:mb-5 pb-2 sm:pb-4"
            style={{
              borderBottom: isLight 
                ? '1px solid rgba(138, 99, 210, 0.15)' 
                : '1px solid rgba(255, 255, 255, 0.05)'
            }}
          >
            <div 
              className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: isLight 
                  ? 'linear-gradient(135deg, rgba(138, 99, 210, 0.15) 0%, rgba(167, 139, 250, 0.1) 100%)' 
                  : 'rgba(96, 80, 186, 0.2)'
              }}
            >
              <svg className={`w-4 h-4 sm:w-6 sm:h-6 ${isLight ? 'text-[#8a63d2]' : 'text-[#9d8df1]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`text-sm sm:text-xl font-bold ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>История операций</h3>
              <p className={`text-[9px] sm:text-xs ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>Все начисления и выводы</p>
            </div>
          </div>
          
          <OperationsHistory
            payouts={payouts}
            withdrawalRequests={withdrawalRequests}
            transactions={transactions}
          />
        </div>
      </div>
      
      {/* Информационная плашка */}
      <div 
        className="mt-2 sm:mt-8 p-2.5 sm:p-4 backdrop-blur-sm rounded-lg sm:rounded-2xl"
        style={{
          background: isLight 
            ? 'linear-gradient(135deg, rgba(138, 99, 210, 0.08) 0%, rgba(167, 139, 250, 0.05) 100%)' 
            : 'linear-gradient(to right, rgba(24, 24, 27, 0.5), rgba(0, 0, 0, 0.3))',
          border: isLight 
            ? '1px solid rgba(138, 99, 210, 0.2)' 
            : '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="flex items-start gap-2 sm:gap-3">
          <div 
            className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center"
            style={{
              background: isLight 
                ? 'rgba(245, 158, 11, 0.15)' 
                : 'rgba(245, 158, 11, 0.2)'
            }}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
            </svg>
          </div>
          <p className={`text-[10px] sm:text-xs leading-relaxed ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'}`}>
            Здесь отображаются все финансовые операции. <span className="font-semibold" style={{ color: '#e879f9' }}>Роялти</span> начисляются автоматически после обработки отчётов дистрибьютора.
          </p>
        </div>
      </div>
    </div>
  );
}
