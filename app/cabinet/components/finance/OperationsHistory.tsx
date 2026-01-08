'use client';
import React, { useState, useMemo, useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  description?: string;
  status: string;
  created_at: string;
  payment_method?: string;
  reference_id?: string;
}

interface Operation {
  type: 'payout' | 'withdrawal' | 'deposit' | 'purchase' | 'bonus' | 'adjustment' | 'correction' | 'refund' | 'freeze' | 'unfreeze';
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
  description?: string;
  payment_method?: string;
  service_name?: string; // для покупок
  data: any;
}

interface OperationsHistoryProps {
  payouts: any[];
  withdrawalRequests: any[];
  transactions?: Transaction[];
}

export default function OperationsHistory({ payouts, withdrawalRequests, transactions = [] }: OperationsHistoryProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'income' | 'withdrawal' | 'frozen' | 'purchase'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Функция копирования ID транзакции
  const copyTransactionId = useCallback(async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, []);

  // Обработчик изменения фильтра (стабильный)
  const handleFilterChange = useCallback((filterId: 'all' | 'income' | 'withdrawal' | 'frozen' | 'purchase') => {
    setActiveFilter(filterId);
  }, []);

  // Форматирование даты и времени
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const time = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    return { day, time, full: `${day} в ${time}` };
  };

  // Объединяем payouts, withdrawals и transactions в одну ленту (мемоизировано)
  const allOperations = useMemo<Operation[]>(() => [
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
    })),
    ...transactions.filter(t => t.type === 'deposit').map(t => ({
      type: 'deposit' as const,
      id: t.id,
      amount: t.amount,
      date: t.created_at,
      status: t.status,
      description: t.description,
      payment_method: t.payment_method,
      transaction_id: t.reference_id,
      data: t
    })),
    ...transactions.filter(t => t.type === 'purchase').map(t => ({
      type: 'purchase' as const,
      id: t.id,
      amount: t.amount,
      date: t.created_at,
      status: t.status,
      description: t.description,
      service_name: (t as any).metadata?.release_title || (t as any).metadata?.service_name || t.description || 'Услуга',
      transaction_id: t.id, // Используем ID транзакции, а не reference_id
      data: t
    })),
    // РОЯЛТИ ИЗ ТРАНЗАКЦИЙ (начисления за отчёты)
    ...transactions.filter(t => t.type === 'payout').map(t => ({
      type: 'payout' as const,
      id: t.id,
      amount: t.amount,
      date: t.created_at,
      quarter: (t as any).metadata?.quarter ? parseInt((t as any).metadata.quarter.replace('Q', '')) : undefined,
      year: (t as any).metadata?.year,
      note: t.description,
      transaction_id: t.id,
      description: t.description,
      data: t
    })),
    // БОНУСЫ
    ...transactions.filter(t => t.type === 'bonus').map(t => ({
      type: 'bonus' as const,
      id: t.id,
      amount: t.amount,
      date: t.created_at,
      status: t.status,
      description: t.description,
      transaction_id: t.id,
      data: t
    })),
    // КОРРЕКТИРОВКИ (adjustment)
    ...transactions.filter(t => t.type === 'adjustment').map(t => ({
      type: 'adjustment' as const,
      id: t.id,
      amount: t.amount,
      date: t.created_at,
      status: t.status,
      description: t.description,
      transaction_id: t.id,
      data: t
    })),
    // КОРРЕКЦИИ (correction)
    ...transactions.filter(t => t.type === 'correction').map(t => ({
      type: 'correction' as const,
      id: t.id,
      amount: t.amount,
      date: t.created_at,
      status: t.status,
      description: t.description,
      transaction_id: t.id,
      data: t
    })),
    // ВОЗВРАТЫ (refund)
    ...transactions.filter(t => t.type === 'refund').map(t => ({
      type: 'refund' as const,
      id: t.id,
      amount: t.amount,
      date: t.created_at,
      status: t.status,
      description: t.description,
      transaction_id: t.id,
      data: t
    })),
    // ЗАМОРОЗКА (freeze) - для выводов
    ...transactions.filter(t => t.type === 'freeze').map(t => ({
      type: 'freeze' as const,
      id: t.id,
      amount: t.amount,
      date: t.created_at,
      status: t.status,
      description: t.description || 'Заморозка средств для вывода',
      transaction_id: t.id,
      data: t
    })),
    // РАЗМОРОЗКА (unfreeze) - возврат при отклонении
    ...transactions.filter(t => t.type === 'unfreeze').map(t => ({
      type: 'unfreeze' as const,
      id: t.id,
      amount: t.amount,
      date: t.created_at,
      status: t.status,
      description: t.description || 'Возврат замороженных средств',
      transaction_id: t.id,
      data: t
    })),
    // ВЫВОДЫ ИЗ ТРАНЗАКЦИЙ (withdrawal) - только те, что НЕ связаны с withdrawal_requests
    // (избегаем дублирования)
    ...transactions.filter(t => {
      if (t.type !== 'withdrawal') return false;
      // Проверяем, нет ли уже такого вывода в withdrawal_requests
      const linkedToRequest = withdrawalRequests.some(
        wr => wr.transaction_id === t.id || wr.withdrawal_transaction_id === t.id
      );
      return !linkedToRequest;
    }).map(t => ({
      type: 'withdrawal' as const,
      id: t.id,
      amount: t.amount,
      date: t.created_at,
      status: 'completed' as const,
      bank_name: (t as any).metadata?.bank_name,
      card_number: (t as any).metadata?.card_masked,
      description: t.description,
      transaction_id: t.id,
      data: t
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [payouts, withdrawalRequests, transactions]);

  // Поиск по операциям
  const searchedOperations = useMemo(() => {
    if (!searchQuery.trim()) return allOperations;
    const query = searchQuery.toLowerCase().trim();
    return allOperations.filter(op => {
      // Поиск по ID
      if (op.id.toLowerCase().includes(query)) return true;
      if (op.transaction_id?.toLowerCase().includes(query)) return true;
      // Поиск по описанию
      if (op.description?.toLowerCase().includes(query)) return true;
      if (op.note?.toLowerCase().includes(query)) return true;
      if (op.service_name?.toLowerCase().includes(query)) return true;
      // Поиск по сумме
      if (String(op.amount).includes(query)) return true;
      // Поиск по банку/карте (для выводов)
      if (op.bank_name?.toLowerCase().includes(query)) return true;
      if (op.card_number?.replace(/\s/g, '').includes(query)) return true;
      // Поиск по типу
      const typeLabels: Record<string, string> = {
        payout: 'роялти',
        withdrawal: 'вывод',
        deposit: 'пополнение',
        purchase: 'покупка',
        bonus: 'бонус',
        adjustment: 'корректировка',
        correction: 'коррекция',
        refund: 'возврат',
        freeze: 'заморозка',
        unfreeze: 'разморозка'
      };
      if (typeLabels[op.type]?.includes(query)) return true;
      // Поиск по статусу
      const statusLabels: Record<string, string> = {
        pending: 'обработка ожидание',
        approved: 'одобрено',
        completed: 'выплачено завершено',
        rejected: 'отклонено'
      };
      if (op.status && statusLabels[op.status]?.includes(query)) return true;
      return false;
    });
  }, [allOperations, searchQuery]);

  // Фильтрация операций по категории (мемоизировано)
  const filteredOperations = useMemo(() => {
    return searchedOperations.filter(op => {
      switch (activeFilter) {
        case 'income':
          return ['payout', 'deposit', 'bonus', 'adjustment', 'correction', 'refund', 'unfreeze'].includes(op.type);
        case 'withdrawal':
          return op.type === 'withdrawal';
        case 'frozen':
          return op.type === 'freeze';
        case 'purchase':
          return op.type === 'purchase';
        default:
          return true;
      }
    });
  }, [searchedOperations, activeFilter]);

  // Подсчёт количества по категориям (мемоизировано)
  const counts = useMemo(() => ({
    all: searchedOperations.length,
    income: searchedOperations.filter(op => ['payout', 'deposit', 'bonus', 'adjustment', 'correction', 'refund', 'unfreeze'].includes(op.type)).length,
    withdrawal: searchedOperations.filter(op => op.type === 'withdrawal').length,
    frozen: searchedOperations.filter(op => op.type === 'freeze').length,
    purchase: searchedOperations.filter(op => op.type === 'purchase').length,
  }), [searchedOperations]);

  if (allOperations.length === 0) {
    return (
      <div 
        className="text-center py-12 rounded-2xl transition-all duration-300"
        style={{
          border: isLight 
            ? '1px dashed rgba(138, 99, 210, 0.3)' 
            : '1px dashed rgba(255, 255, 255, 0.1)',
          background: isLight 
            ? 'rgba(255, 255, 255, 0.4)' 
            : 'transparent'
        }}
      >
        <div 
          className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
          style={{
            background: isLight 
              ? 'linear-gradient(135deg, rgba(138, 99, 210, 0.15) 0%, rgba(167, 139, 250, 0.1) 100%)' 
              : 'rgba(96, 80, 186, 0.1)'
          }}
        >
          <svg className={`w-8 h-8 ${isLight ? 'text-[#8a63d2]' : 'text-[#9d8df1]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className={isLight ? 'text-[#5c5580]' : 'text-zinc-500'}>История операций пуста</p>
        <p className={`text-xs mt-2 ${isLight ? 'text-[#7a7596]' : 'text-zinc-600'}`}>Здесь будут отображаться начисления на баланс и выводы средств</p>
      </div>
    );
  }

  const statusBadges: Record<string, { bg: string; lightBg: string; text: string; lightText: string; label: string; icon: React.ReactNode }> = {
    pending: { bg: 'bg-yellow-500/20', lightBg: 'bg-yellow-100', text: 'text-yellow-400', lightText: 'text-yellow-600', label: 'Обработка', icon: <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/></svg> },
    approved: { bg: 'bg-[#6050ba]/20', lightBg: 'bg-violet-100', text: 'text-[#9d8df1]', lightText: 'text-violet-600', label: 'Одобрено', icon: <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg> },
    rejected: { bg: 'bg-red-500/20', lightBg: 'bg-red-100', text: 'text-red-400', lightText: 'text-red-600', label: 'Отклонено', icon: <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg> },
    completed: { bg: 'bg-emerald-500/20', lightBg: 'bg-emerald-100', text: 'text-emerald-400', lightText: 'text-emerald-600', label: 'Выплачено', icon: <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg> },
  };

  // Фильтры категорий - SVG иконки
  type FilterId = 'all' | 'income' | 'withdrawal' | 'frozen' | 'purchase';
  const filterButtons: Array<{ id: FilterId; label: string; icon: React.ReactNode; color: string; lightColor: string; iconColor: string; lightIconColor: string }> = [
    { id: 'all', label: 'Все', icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ), color: 'from-zinc-500/20 to-zinc-600/20 border-zinc-500/30', lightColor: 'from-gray-200 to-gray-300 border-gray-400', iconColor: 'text-zinc-400', lightIconColor: 'text-gray-600' },
    { id: 'purchase', label: 'Покупки', icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ), color: 'from-purple-500/20 to-violet-600/20 border-purple-500/30', lightColor: 'from-purple-100 to-purple-200 border-purple-400', iconColor: 'text-purple-400', lightIconColor: 'text-purple-600' },
    { id: 'income', label: 'Доходы', icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ), color: 'from-emerald-500/20 to-green-600/20 border-emerald-500/30', lightColor: 'from-emerald-100 to-emerald-200 border-emerald-400', iconColor: 'text-emerald-400', lightIconColor: 'text-emerald-600' },
    { id: 'withdrawal', label: 'Выводы', icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ), color: 'from-red-500/20 to-rose-600/20 border-red-500/30', lightColor: 'from-red-100 to-red-200 border-red-400', iconColor: 'text-red-400', lightIconColor: 'text-red-600' },
    { id: 'frozen', label: 'Заморозки', icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
      </svg>
    ), color: 'from-blue-500/20 to-cyan-600/20 border-blue-500/30', lightColor: 'from-blue-100 to-blue-200 border-blue-400', iconColor: 'text-blue-400', lightIconColor: 'text-blue-600' },
  ];

  return (
    <div className="space-y-2">
      {/* Поиск */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск..."
          className={`w-full px-2.5 py-1.5 sm:px-3 sm:py-2 pl-8 sm:pl-9 rounded-lg sm:rounded-xl text-xs sm:text-sm outline-none transition min-h-[36px] sm:min-h-[40px] ${
            isLight 
              ? 'bg-white/70 border border-[#8a63d2]/20 text-[#1a1535] placeholder:text-[#7a7596] focus:border-[#8a63d2]/50'
              : 'bg-black/30 border border-white/10 text-white placeholder:text-zinc-500 focus:border-[#6050ba]/50'
          }`}
        />
        <svg className={`w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-[#8a63d2]' : 'text-[#9d8df1]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className={`absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center transition ${
              isLight ? 'bg-[#8a63d2]/10 hover:bg-[#8a63d2]/20 text-[#8a63d2]' : 'bg-white/10 hover:bg-white/20 text-zinc-400'
            }`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Результаты поиска */}
      {searchQuery && (
        <div className={`text-xs px-1 ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>
          Найдено: {filteredOperations.length} операций
        </div>
      )}

      {/* Фильтры категорий */}
      <div className="flex gap-1.5 overflow-x-auto pb-1.5 -mx-1 px-1 sm:gap-2 sm:pb-2 sm:-mx-2 sm:px-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {filterButtons.map((btn) => {
          const count = counts[btn.id];
          if (count === 0 && btn.id !== 'all') return null;
          
          const buttonColor = isLight ? (btn.lightColor || btn.color) : btn.color;
          const buttonIconColor = isLight ? (btn.lightIconColor || btn.iconColor) : btn.iconColor;
          
          return (
            <button
              key={btn.id}
              onClick={() => handleFilterChange(btn.id)}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold transition-all whitespace-nowrap border min-h-[32px] sm:min-h-[36px] ${
                activeFilter === btn.id
                  ? `bg-gradient-to-r ${buttonColor} ${isLight ? '!text-gray-800' : 'text-white'} shadow-lg`
                  : isLight 
                    ? 'bg-white/50 text-[#5c5580] border-white/50 hover:bg-white/70'
                    : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10'
              }`}
            >
              <span className={activeFilter === btn.id ? (isLight ? '!text-gray-700' : 'text-white') : buttonIconColor}>{btn.icon}</span>
              <span className="hidden sm:inline">{btn.label}</span>
              {count > 0 && (
                <span className={`sm:ml-1 px-1 sm:px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] ${
                  activeFilter === btn.id 
                    ? (isLight ? 'bg-gray-800/20 !text-gray-800' : 'bg-white/20')
                    : isLight ? 'bg-[#8a63d2]/10 text-[#8a63d2]' : 'bg-white/10'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Список операций */}
      <div className="space-y-1.5 sm:space-y-2 max-h-52 sm:max-h-96 overflow-y-auto pr-0.5 sm:pr-2" 
           style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        
        {filteredOperations.length === 0 ? (
          <div className={`text-center py-8 rounded-xl ${isLight ? 'bg-white/30' : 'bg-white/5'}`}>
            <p className={isLight ? 'text-[#5c5580]' : 'text-zinc-500'}>Нет операций в этой категории</p>
          </div>
        ) : filteredOperations.map((op) => {
        if (op.type === 'deposit') {
          const statusBadge = op.status === 'completed' 
            ? { bg: 'bg-emerald-500/20', lightBg: 'bg-emerald-100', text: 'text-emerald-400', lightText: 'text-emerald-600', label: 'Успешно', icon: <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg> }
            : { bg: 'bg-yellow-500/20', lightBg: 'bg-yellow-100', text: 'text-yellow-400', lightText: 'text-yellow-600', label: 'Обработка', icon: <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/></svg> };
          
          const paymentMethodLabels: Record<string, string> = {
            sbp: 'СБП',
            card_ru: 'Карта РФ',
            card_international: 'Карта Международная',
            liqpay: 'LiqPay',
            crypto: 'Криптовалюта',
            yookassa: 'YooKassa',
            stripe: 'Stripe',
            test: 'Тест'
          };
          
          return (
            <div
              key={`deposit-${op.id}`}
              className="group p-2 sm:p-3 rounded-lg sm:rounded-xl hover:border-[#6050ba]/50 transition-all flex items-center gap-2 sm:gap-3"
              style={{
                background: isLight 
                  ? 'rgba(255, 255, 255, 0.6)' 
                  : 'rgba(0, 0, 0, 0.2)',
                border: isLight 
                  ? '1px solid rgba(138, 99, 210, 0.2)' 
                  : '1px solid rgba(255, 255, 255, 0.05)',
                boxShadow: isLight ? '0 2px 8px rgba(138, 99, 210, 0.08)' : 'none'
              }}
            >
              <div 
                className="w-7 h-7 sm:w-10 sm:h-10 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: isLight 
                    ? 'rgba(138, 99, 210, 0.15)' 
                    : 'rgba(96, 80, 186, 0.2)'
                }}
              >
                <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-[#9d8df1]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 sm:gap-2 sm:mb-1">
                  <span className={`text-[11px] sm:text-sm font-bold ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>Пополнение</span>
                  <span className={`text-[8px] sm:text-[10px] px-1 sm:px-2 py-0.5 rounded-full ${isLight ? statusBadge.lightBg : statusBadge.bg} ${isLight ? statusBadge.lightText : statusBadge.text} inline-flex items-center gap-0.5 sm:gap-1`}>
                    {statusBadge.icon} {statusBadge.label}
                  </span>
                </div>
                {/* Мобильная версия - только дата */}
                <div className={`sm:hidden text-[9px] ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>
                  {formatDateTime(op.date).day}
                </div>
                {/* Десктоп версия - полная информация */}
                <div className={`hidden sm:block text-xs space-y-0.5 ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDateTime(op.date).full}
                  </div>
                  {op.payment_method && (
                    <div className={`text-[10px] ${isLight ? 'text-[#7a7596]' : 'text-zinc-600'}`}>
                      {paymentMethodLabels[op.payment_method] || op.payment_method}
                    </div>
                  )}
                  {op.transaction_id && (
                    <button 
                      onClick={() => copyTransactionId(op.transaction_id!)}
                      className="text-[10px] text-[#9d8df1]/80 font-mono flex items-center gap-1 hover:text-[#9d8df1] transition-colors cursor-pointer"
                      title="Нажмите для копирования"
                    >
                      {copiedId === op.transaction_id ? (
                        <>
                          <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                          <span className="text-emerald-500">Скопировано!</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/>
                            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"/>
                          </svg>
                          TX: {op.transaction_id.slice(0, 8)}...
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
              <div className={`text-xs sm:text-base font-black flex-shrink-0 ${isLight ? 'text-violet-600' : 'text-[#9d8df1]'}`}>
                <span className="sm:hidden">+{Number(op.amount).toLocaleString('ru-RU').replace(/\s/g, '.')}₽</span>
                <span className="hidden sm:inline">+ {Number(op.amount).toLocaleString('ru-RU').replace(/\s/g, '.')} ₽</span>
              </div>
            </div>
          );
        } else if (op.type === 'purchase') {
          return (
            <div
              key={`purchase-${op.id}`}
              className="group p-2 sm:p-3 rounded-lg sm:rounded-xl hover:border-orange-500/50 transition-all flex items-center gap-2 sm:gap-3"
              style={{
                background: isLight 
                  ? 'rgba(255, 255, 255, 0.6)' 
                  : 'rgba(0, 0, 0, 0.2)',
                border: isLight 
                  ? '1px solid rgba(138, 99, 210, 0.2)' 
                  : '1px solid rgba(255, 255, 255, 0.05)',
                boxShadow: isLight ? '0 2px 8px rgba(138, 99, 210, 0.08)' : 'none'
              }}
            >
              <div 
                className="w-7 h-7 sm:w-10 sm:h-10 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: isLight 
                    ? 'rgba(249, 115, 22, 0.15)' 
                    : 'rgba(249, 115, 22, 0.2)'
                }}
              >
                <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 sm:gap-2 sm:mb-1">
                  <span className={`text-[11px] sm:text-sm font-bold ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>Покупка</span>
                  <span className={`hidden sm:inline text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ${isLight ? 'bg-orange-100 text-orange-600' : 'bg-orange-500/20 text-orange-400'}`}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Оплачено
                  </span>
                </div>
                {/* Мобильная версия */}
                <div className={`sm:hidden text-[9px] truncate ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>
                  {op.service_name ? op.service_name.slice(0, 20) : formatDateTime(op.date).day}
                </div>
                {/* Десктоп версия */}
                <div className={`hidden sm:block text-xs space-y-0.5 ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDateTime(op.date).full}
                  </div>
                  {op.service_name && (
                    <div className={`text-[10px] ${isLight ? 'text-[#7a7596]' : 'text-zinc-600'}`}>
                      {op.service_name}
                    </div>
                  )}
                  {op.transaction_id && (
                    <button 
                      onClick={() => copyTransactionId(op.transaction_id!)}
                      className="text-[10px] text-orange-500/80 font-mono flex items-center gap-1 hover:text-orange-500 transition-colors cursor-pointer"
                      title="Нажмите для копирования"
                    >
                      {copiedId === op.transaction_id ? (
                        <>
                          <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                          <span className="text-emerald-500">Скопировано!</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/>
                            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"/>
                          </svg>
                          TX: {op.transaction_id.slice(0, 8)}...
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
              <div className="text-xs sm:text-base font-black text-orange-500 flex-shrink-0">
                <span className="sm:hidden">−{Number(op.amount).toLocaleString('ru-RU').replace(/\s/g, '.')}₽</span>
                <span className="hidden sm:inline">− {Number(op.amount).toLocaleString('ru-RU').replace(/\s/g, '.')} ₽</span>
              </div>
            </div>
          );
        } else if (op.type === 'payout') {
          return (
            <div
              key={`payout-${op.id}`}
              className="group p-2 sm:p-3 rounded-lg sm:rounded-xl hover:border-[#e879f9]/50 transition-all flex items-center gap-2 sm:gap-3"
              style={{
                background: isLight 
                  ? 'rgba(255, 255, 255, 0.6)' 
                  : 'rgba(0, 0, 0, 0.2)',
                border: isLight 
                  ? '1px solid rgba(138, 99, 210, 0.2)' 
                  : '1px solid rgba(255, 255, 255, 0.05)',
                boxShadow: isLight ? '0 2px 8px rgba(138, 99, 210, 0.08)' : 'none'
              }}
            >
              <div 
                className="w-7 h-7 sm:w-10 sm:h-10 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: isLight 
                    ? 'linear-gradient(135deg, rgba(232, 121, 249, 0.15) 0%, rgba(192, 132, 252, 0.12) 100%)' 
                    : 'linear-gradient(135deg, rgba(232, 121, 249, 0.2) 0%, rgba(192, 132, 252, 0.15) 100%)'
                }}
              >
                <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="url(#sparklesGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <defs>
                    <linearGradient id="sparklesGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f0abfc" />
                      <stop offset="100%" stopColor="#c084fc" />
                    </linearGradient>
                  </defs>
                  <path d="M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm0 -12a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm-7 12a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 sm:gap-2 sm:mb-1">
                  <span className={`text-[11px] sm:text-sm font-bold ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>Роялти</span>
                  <span className={`hidden sm:inline-flex text-[10px] px-2 py-0.5 rounded-full items-center gap-0.5 ${isLight ? 'bg-fuchsia-100 text-fuchsia-600' : 'bg-fuchsia-500/15 text-fuchsia-400'}`}>
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    Начислено
                  </span>
                  {op.quarter && op.year && (
                    <span className={`text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded-full ${isLight ? 'bg-[#c084fc]/10 text-[#a855f7]' : 'bg-[#c084fc]/15 text-[#d8b4fe]'}`}>
                      Q{op.quarter}<span className="hidden sm:inline"> {op.year}</span><span className="sm:hidden">'{String(op.year).slice(-2)}</span>
                    </span>
                  )}
                </div>
                {/* Мобильная версия */}
                <div className={`sm:hidden text-[9px] ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>
                  {formatDateTime(op.date).day}
                </div>
                {/* Десктоп версия */}
                <div className={`hidden sm:block text-xs space-y-0.5 ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDateTime(op.date).full}
                  </div>
                  {op.transaction_id && (
                    <button 
                      onClick={() => copyTransactionId(op.transaction_id!)}
                      className="text-[10px] text-fuchsia-400/80 font-mono flex items-center gap-1 hover:text-fuchsia-400 transition-colors cursor-pointer"
                      title="Нажмите для копирования"
                    >
                      {copiedId === op.transaction_id ? (
                        <>
                          <svg className="w-3 h-3 text-fuchsia-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                          <span>Скопировано!</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/>
                            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"/>
                          </svg>
                          TX: {op.transaction_id.slice(0, 8)}...
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
              <div className={`text-xs sm:text-base font-black flex-shrink-0 ${isLight ? 'text-fuchsia-600' : ''}`} style={{ color: isLight ? undefined : '#e879f9' }}>
                <span className="sm:hidden">+{Number(op.amount).toLocaleString('ru-RU').replace(/\s/g, '.')}₽</span>
                <span className="hidden sm:inline">+ {Number(op.amount).toLocaleString('ru-RU').replace(/\s/g, '.')} ₽</span>
              </div>
            </div>
          );
        } else if (op.type === 'bonus' || op.type === 'adjustment' || op.type === 'correction' || op.type === 'refund' || op.type === 'freeze' || op.type === 'unfreeze') {
          // БОНУСЫ, КОРРЕКТИРОВКИ, ВОЗВРАТЫ, ЗАМОРОЗКИ
          const typeConfig: Record<string, { name: string; shortName: string; color: string; bgColor: string; icon: React.ReactNode }> = {
            bonus: {
              name: 'Бонус',
              shortName: 'Бонус',
              color: 'text-emerald-400',
              bgColor: 'rgba(16, 185, 129, 0.2)',
              icon: (
                <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm4.707 3.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 9H10a3 3 0 013 3v1a1 1 0 102 0v-1a5 5 0 00-5-5H8.414l1.293-1.293z" clipRule="evenodd" />
                </svg>
              )
            },
            adjustment: {
              name: 'Корректировка',
              shortName: 'Корр.',
              color: 'text-blue-400',
              bgColor: 'rgba(59, 130, 246, 0.2)',
              icon: (
                <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              )
            },
            correction: {
              name: 'Коррекция',
              shortName: 'Корр.',
              color: 'text-amber-400',
              bgColor: 'rgba(245, 158, 11, 0.2)',
              icon: (
                <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              )
            },
            refund: {
              name: 'Возврат',
              shortName: 'Возвр.',
              color: 'text-cyan-400',
              bgColor: 'rgba(34, 211, 238, 0.2)',
              icon: (
                <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm4.707 3.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 9H10a3 3 0 013 3v1a1 1 0 102 0v-1a5 5 0 00-5-5H8.414l1.293-1.293z" clipRule="evenodd" />
                </svg>
              )
            },
            freeze: {
              name: 'Заморозка',
              shortName: 'Замор.',
              color: 'text-blue-400',
              bgColor: 'rgba(59, 130, 246, 0.2)',
              icon: (
                <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                </svg>
              )
            },
            unfreeze: {
              name: 'Разморозка',
              shortName: 'Размор.',
              color: 'text-emerald-400',
              bgColor: 'rgba(16, 185, 129, 0.2)',
              icon: (
                <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm4.707 3.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 9H10a3 3 0 013 3v1a1 1 0 102 0v-1a5 5 0 00-5-5H8.414l1.293-1.293z" clipRule="evenodd" />
                </svg>
              )
            }
          };
          
          const config = typeConfig[op.type] || typeConfig.bonus;
          const isPositive = op.amount > 0;
          
          return (
            <div
              key={`${op.type}-${op.id}`}
              className="group p-2 sm:p-3 rounded-lg sm:rounded-xl hover:border-emerald-500/50 transition-all flex items-center gap-2 sm:gap-3"
              style={{
                background: isLight 
                  ? 'rgba(255, 255, 255, 0.6)' 
                  : 'rgba(0, 0, 0, 0.2)',
                border: isLight 
                  ? '1px solid rgba(138, 99, 210, 0.2)' 
                  : '1px solid rgba(255, 255, 255, 0.05)',
                boxShadow: isLight ? '0 2px 8px rgba(138, 99, 210, 0.08)' : 'none'
              }}
            >
              <div 
                className="w-7 h-7 sm:w-10 sm:h-10 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: config.bgColor }}
              >
                {config.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 sm:gap-2 sm:mb-1">
                  <span className={`text-[11px] sm:text-sm font-bold ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>
                    <span className="sm:hidden">{config.shortName}</span>
                    <span className="hidden sm:inline">{config.name}</span>
                  </span>
                  <span className={`hidden sm:inline-flex text-[10px] px-2 py-0.5 rounded-full items-center gap-0.5 ${isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    Начислено
                  </span>
                </div>
                {/* Мобильная версия */}
                <div className={`sm:hidden text-[9px] ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>
                  {formatDateTime(op.date).day}
                </div>
                {/* Десктоп версия */}
                <div className={`hidden sm:block text-xs space-y-0.5 ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDateTime(op.date).full}
                  </div>
                  {op.description && (
                    <div className={`text-[10px] truncate ${isLight ? 'text-[#7a7596]' : 'text-zinc-600'}`}>
                      {op.description}
                    </div>
                  )}
                  {op.transaction_id && (
                    <button 
                      onClick={() => copyTransactionId(op.transaction_id!)}
                      className={`text-[10px] font-mono flex items-center gap-1 hover:opacity-80 transition-colors cursor-pointer ${config.color}`}
                      title="Нажмите для копирования"
                    >
                      {copiedId === op.transaction_id ? (
                        <>
                          <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                          <span className="text-emerald-500">Скопировано!</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/>
                            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"/>
                          </svg>
                          TX: {op.transaction_id.slice(0, 8)}...
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
              <div className={`text-xs sm:text-base font-black flex-shrink-0 ${isPositive ? config.color : 'text-red-500'}`}>
                <span className="sm:hidden">{isPositive ? '+' : '−'}{Math.abs(Number(op.amount)).toLocaleString('ru-RU').replace(/\s/g, '.')}₽</span>
                <span className="hidden sm:inline">{isPositive ? '+' : '−'} {Math.abs(Number(op.amount)).toLocaleString('ru-RU').replace(/\s/g, '.')} ₽</span>
              </div>
            </div>
          );
        } else {
          // ВЫВОД (withdrawal)
          const badge = statusBadges[op.status || 'pending'] || statusBadges.pending;
          
          return (
            <div
              key={`withdrawal-${op.id}`}
              className="group p-2 sm:p-3 rounded-lg sm:rounded-xl hover:border-red-500/50 transition-all flex items-center gap-2 sm:gap-3"
              style={{
                background: isLight 
                  ? 'rgba(255, 255, 255, 0.6)' 
                  : 'rgba(0, 0, 0, 0.2)',
                border: isLight 
                  ? '1px solid rgba(138, 99, 210, 0.2)' 
                  : '1px solid rgba(255, 255, 255, 0.05)',
                boxShadow: isLight ? '0 2px 8px rgba(138, 99, 210, 0.08)' : 'none'
              }}
            >
              <div 
                className="w-7 h-7 sm:w-10 sm:h-10 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: isLight 
                    ? 'rgba(239, 68, 68, 0.15)' 
                    : 'rgba(239, 68, 68, 0.2)'
                }}
              >
                <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm2.5 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6.207.293a1 1 0 00-1.414 0l-6 6a1 1 0 101.414 1.414l6-6a1 1 0 000-1.414zM12.5 10a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 sm:gap-2 sm:mb-1">
                  <span className={`text-[11px] sm:text-sm font-bold ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>Вывод</span>
                  <span className={`text-[8px] sm:text-[10px] px-1 sm:px-2 py-0.5 rounded-full ${isLight ? badge.lightBg : badge.bg} ${isLight ? badge.lightText : badge.text} inline-flex items-center gap-0.5 sm:gap-1`}>
                    {badge.icon} {badge.label}
                  </span>
                </div>
                {/* Мобильная версия */}
                <div className={`sm:hidden text-[9px] ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>
                  {formatDateTime(op.date).day}
                </div>
                {/* Десктоп версия */}
                <div className={`hidden sm:block text-xs space-y-0.5 ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDateTime(op.date).full}
                  </div>
                  <button 
                    onClick={() => copyTransactionId(op.id)}
                    className={`text-[10px] font-mono flex items-center gap-1 hover:opacity-80 transition-colors cursor-pointer ${isLight ? 'text-[#7a7596]' : 'text-zinc-600'}`}
                    title="Нажмите для копирования"
                  >
                    {copiedId === op.id ? (
                      <>
                        <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                        <span className="text-emerald-500">Скопировано!</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/>
                          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"/>
                        </svg>
                        № {op.id.slice(0, 8)}...
                      </>
                    )}
                  </button>
                  {op.transaction_id && (
                    <button 
                      onClick={() => copyTransactionId(op.transaction_id!)}
                      className="text-[10px] text-red-500/80 font-mono flex items-center gap-1 hover:text-red-500 transition-colors cursor-pointer"
                      title="Нажмите для копирования"
                    >
                      {copiedId === op.transaction_id ? (
                        <>
                          <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                          <span className="text-emerald-500">Скопировано!</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/>
                            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"/>
                          </svg>
                          TX: {op.transaction_id.slice(0, 8)}...
                        </>
                      )}
                    </button>
                  )}
                </div>
                {/* Причина отклонения */}
                {op.status === 'rejected' && op.admin_comment && (
                  <div className={`mt-1 p-1.5 sm:p-2 rounded text-[9px] sm:text-xs border ${
                    isLight 
                      ? 'bg-red-50 border-red-200 text-red-700' 
                      : 'bg-red-500/10 border-red-500/30 text-red-300'
                  }`}>
                    <div className="flex items-start gap-1.5">
                      <svg className="hidden sm:block w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                      </svg>
                      <div>
                        <span className="font-semibold">Причина:</span> 
                        <span className="sm:hidden">{op.admin_comment.slice(0, 30)}{op.admin_comment.length > 30 ? '...' : ''}</span>
                        <span className="hidden sm:inline">{op.admin_comment}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="text-xs sm:text-base font-black text-red-500 flex-shrink-0">
                <span className="sm:hidden">−{Number(op.amount).toLocaleString('ru-RU').replace(/\s/g, '.')}₽</span>
                <span className="hidden sm:inline">− {Number(op.amount).toLocaleString('ru-RU').replace(/\s/g, '.')} ₽</span>
              </div>
            </div>
          );
        }
      })}
      </div>
    </div>
  );
}
