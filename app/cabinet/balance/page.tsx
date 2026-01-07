'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { 
  Wallet, 
  Plus, 
  CreditCard, 
  QrCode, 
  Bitcoin, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Clock,
  CheckCircle,
  XCircle,
  Copy,
  ExternalLink,
  Sparkles,
  Globe
} from 'lucide-react';

// Форматирование валюты
const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Предустановленные суммы (RUB для РФ, USD для международных)
const PRESET_AMOUNTS_RUB = [500, 1000, 2000, 5000, 10000];
const PRESET_AMOUNTS_USD = [5, 10, 20, 50, 100];

// Методы оплаты
const PAYMENT_METHODS = [
  { 
    id: 'sbp', 
    name: 'СБП', 
    icon: QrCode, 
    provider: 'yookassa',
    description: 'Быстрый платёж по QR-коду',
    recommended: true,
    region: 'ru',
    currency: 'RUB',
  },
  { 
    id: 'card_ru', 
    name: 'Карта РФ', 
    icon: CreditCard, 
    provider: 'yookassa',
    description: 'Visa, Mastercard, МИР',
    region: 'ru',
    currency: 'RUB',
  },
  { 
    id: 'card_intl', 
    name: 'International Card', 
    icon: Globe, 
    provider: 'stripe',
    description: 'Visa, Mastercard worldwide',
    region: 'intl',
    currency: 'USD',
  },
  { 
    id: 'crypto', 
    name: 'Криптовалюта', 
    icon: Bitcoin, 
    provider: 'cryptocloud',
    description: 'BTC, ETH, USDT, TON',
    region: 'all',
    currency: 'RUB',
  },
];

export default function BalancePage() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [depositLoading, setDepositLoading] = useState(false);
  
  // Форма пополнения
  const [amount, setAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState('sbp');
  const [showSuccess, setShowSuccess] = useState(false);
  const [region, setRegion] = useState<'ru' | 'intl'>('ru'); // Регион пользователя

  // Проверяем статус после возврата с оплаты
  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'success') {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [searchParams]);

  // Загрузка данных - ОДИН РАЗ
  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      try {
        if (!supabase) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!mounted) return;
        
        if (user) {
          setUser(user);
          
          // Загружаем данные параллельно
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token;
          
          if (token && mounted) {
            // Баланс
            try {
              const balanceRes = await fetch('/api/balance', {
                headers: { 'Authorization': `Bearer ${token}` },
              });
              const contentType = balanceRes.headers.get('content-type');
              if (balanceRes.ok && contentType?.includes('application/json')) {
                const balanceData = await balanceRes.json();
                if (mounted) setBalance(balanceData);
              }
            } catch (e) {
              console.error('Balance error:', e);
            }
            
            // Транзакции
            try {
              if (mounted) setTransactionsLoading(true);
              const txRes = await fetch('/api/balance/transactions?limit=50', {
                headers: { 
                  'Authorization': `Bearer ${token}`,
                  'Cache-Control': 'no-cache',
                },
                cache: 'no-store',
              });
              const contentType = txRes.headers.get('content-type');
              if (txRes.ok && contentType?.includes('application/json')) {
                const txData = await txRes.json();
                if (mounted) setTransactions(txData.transactions || []);
              }
            } catch (e) {
              console.error('Transactions error:', e);
            } finally {
              if (mounted) setTransactionsLoading(false);
            }
          }
        }
      } catch (e) {
        console.error('Init error:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    init();
    
    return () => { mounted = false; };
  }, []);

  const loadBalance = useCallback(async () => {
    try {
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;
      
      const response = await fetch('/api/balance', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setBalance(data);
    } catch (error) {
      console.error('Balance load error:', error);
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    setTransactionsLoading(true);
    try {
      if (!supabase) {
        setTransactionsLoading(false);
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        setTransactionsLoading(false);
        return;
      }
      
      const response = await fetch('/api/balance/transactions?limit=50', {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store',
      });
      
      // Проверяем content-type
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        console.error('API returned non-JSON:', await response.text());
        return;
      }
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Transactions load error:', error);
    } finally {
      setTransactionsLoading(false);
    }
  }, []);

  // Создание платежа
  const handleDeposit = async () => {
    const finalAmount = customAmount ? parseFloat(customAmount) : amount;
    
    if (finalAmount < 100) {
      alert('Минимальная сумма: 100 ₽');
      return;
    }

    setDepositLoading(true);

    try {
      const method = PAYMENT_METHODS.find(m => m.id === selectedMethod);
      
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmount,
          provider: method?.provider || 'yookassa',
          paymentMethod: selectedMethod,
          userId: user.id,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка создания платежа');
      }

      // Перенаправляем на страницу оплаты
      window.location.href = data.paymentUrl;

    } catch (error: any) {
      console.error('Deposit error:', error);
      alert(error.message || 'Ошибка создания платежа');
    } finally {
      setDepositLoading(false);
    }
  };

  // Иконка типа транзакции
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="w-4 h-4 text-green-400" />;
      case 'payout':
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      case 'purchase':
        return <ArrowUpRight className="w-4 h-4 text-red-400" />;
      case 'refund':
        return <ArrowDownLeft className="w-4 h-4 text-blue-400" />;
      case 'bonus':
        return <Sparkles className="w-4 h-4 text-yellow-400" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-orange-400" />;
      case 'correction':
      case 'adjustment':
        return <ArrowDownLeft className="w-4 h-4 text-cyan-400" />;
      default:
        return <Clock className="w-4 h-4 text-zinc-400" />;
    }
  };

  // Название типа транзакции
  const getTransactionTypeName = (type: string) => {
    switch (type) {
      case 'deposit': return 'Пополнение';
      case 'payout': return 'Роялти';
      case 'purchase': return 'Покупка';
      case 'withdrawal': return 'Вывод';
      case 'refund': return 'Возврат';
      case 'bonus': return 'Бонус';
      case 'correction': return 'Коррекция';
      case 'adjustment': return 'Корректировка';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-2 border-[#6050ba] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Уведомление об успешной оплате */}
      {showSuccess && (
        <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-green-300">Платёж успешно обработан! Баланс обновлён.</span>
        </div>
      )}

      {/* Карточка баланса */}
      <div className="bg-gradient-to-br from-[#6050ba]/30 to-[#9d8df1]/20 rounded-2xl p-6 border border-[#6050ba]/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-[#6050ba]/30 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-[#9d8df1]" />
          </div>
          <div>
            <p className="text-sm text-zinc-400">Ваш баланс</p>
            <p className="text-3xl font-bold text-white">
              {formatMoney(balance?.balance || 0)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-zinc-500">Всего пополнено</p>
            <p className="text-white font-medium">{formatMoney(balance?.total_deposited || 0)}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-zinc-500">Всего потрачено</p>
            <p className="text-white font-medium">{formatMoney(balance?.total_spent || 0)}</p>
          </div>
        </div>
      </div>

      {/* Форма пополнения */}
      <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-[#9d8df1]" />
          Пополнить баланс
        </h2>

        {/* Переключатель региона */}
        <div className="mb-4">
          <p className="text-sm text-zinc-400 mb-2">Регион</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setRegion('ru');
                setSelectedMethod('sbp');
                setAmount(1000);
                setCustomAmount('');
              }}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                region === 'ru'
                  ? 'bg-[#6050ba] text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              🇷🇺 Россия
            </button>
            <button
              onClick={() => {
                setRegion('intl');
                setSelectedMethod('card_intl');
                setAmount(10);
                setCustomAmount('');
              }}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                region === 'intl'
                  ? 'bg-[#6050ba] text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              🌍 International
            </button>
          </div>
        </div>

        {/* Предустановленные суммы */}
        <div className="mb-4">
          <p className="text-sm text-zinc-400 mb-2">Выберите сумму</p>
          <div className="flex flex-wrap gap-2">
            {(region === 'ru' ? PRESET_AMOUNTS_RUB : PRESET_AMOUNTS_USD).map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  setAmount(preset);
                  setCustomAmount('');
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  amount === preset && !customAmount
                    ? 'bg-[#6050ba] text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {region === 'ru' ? formatMoney(preset) : `$${preset}`}
              </button>
            ))}
          </div>
        </div>

        {/* Кастомная сумма */}
        <div className="mb-4">
          <p className="text-sm text-zinc-400 mb-2">Или введите свою сумму</p>
          <div className="relative">
            <input
              type="number"
              min={region === 'ru' ? '100' : '5'}
              placeholder={region === 'ru' ? 'Минимум 100 ₽' : 'Minimum $5'}
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder:text-zinc-500 focus:border-[#6050ba] focus:outline-none"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">
              {region === 'ru' ? '₽' : '$'}
            </span>
          </div>
        </div>

        {/* Методы оплаты */}
        <div className="mb-6">
          <p className="text-sm text-zinc-400 mb-2">Способ оплаты</p>
          <div className="space-y-2">
            {PAYMENT_METHODS
              .filter(m => m.region === region || m.region === 'all')
              .map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                  selectedMethod === method.id
                    ? 'bg-[#6050ba]/20 border-2 border-[#6050ba]'
                    : 'bg-zinc-800 border-2 border-transparent hover:border-zinc-600'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  selectedMethod === method.id ? 'bg-[#6050ba]' : 'bg-zinc-700'
                }`}>
                  <method.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{method.name}</span>
                    {method.recommended && (
                      <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">
                        Рекомендуем
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">{method.description}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedMethod === method.id 
                    ? 'border-[#6050ba] bg-[#6050ba]' 
                    : 'border-zinc-600'
                }`}>
                  {selectedMethod === method.id && (
                    <CheckCircle className="w-3 h-3 text-white" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Кнопка оплаты */}
        <button
          onClick={handleDeposit}
          disabled={depositLoading}
          className="w-full py-3 bg-gradient-to-r from-[#6050ba] to-[#9d8df1] text-white font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {depositLoading ? (
            <>
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              Создание платежа...
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              Пополнить на {formatMoney(customAmount ? parseFloat(customAmount) || 0 : amount)}
            </>
          )}
        </button>
      </div>

      {/* История транзакций */}
      <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#9d8df1]" />
          История операций
          {transactionsLoading && (
            <div className="animate-spin w-4 h-4 border-2 border-[#6050ba] border-t-transparent rounded-full ml-2" />
          )}
          {/* Debug кнопка */}
          <button
            onClick={async () => {
              if (!supabase) {
                alert('Supabase не инициализирован!');
                return;
              }
              const { data: { session } } = await supabase.auth.getSession();
              const token = session?.access_token;
              if (!token) {
                alert('Нет токена!');
                return;
              }
              const res = await fetch('/api/balance/transactions/test', {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              const data = await res.json();
              alert(`UserID: ${data.userId}\nEmail: ${data.userEmail}\nTotal: ${data.totalCount}\nLoaded: ${data.transactionsCount}`);
              if (data.transactions?.length) {
                setTransactions(data.transactions);
              }
            }}
            className="ml-auto text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded hover:bg-yellow-500/30"
          >
            🔍 Debug
          </button>
        </h2>

        {transactionsLoading && transactions.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-[#6050ba] border-t-transparent rounded-full" />
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-center text-zinc-500 py-8">
            У вас пока нет операций
          </p>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => {
              // Получаем информацию о квартале для роялти
              const isRoyalty = tx.type === 'payout' && tx.metadata?.source === 'royalty_report';
              const quarterInfo = isRoyalty && tx.metadata?.quarter && tx.metadata?.year 
                ? `${tx.metadata.quarter} ${tx.metadata.year}` 
                : null;
              
              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800/70 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isRoyalty ? 'bg-purple-500/20' : 'bg-zinc-700'
                  }`}>
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {tx.description || getTransactionTypeName(tx.type)}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <span>{new Date(tx.created_at).toLocaleString('ru-RU')}</span>
                      {quarterInfo && (
                        <>
                          <span>•</span>
                          <span className="text-purple-400">{quarterInfo}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${
                      // Определяем цвет по типу или изменению баланса
                      ['deposit', 'refund', 'bonus', 'payout'].includes(tx.type)
                        ? 'text-green-400'
                        : ['withdrawal', 'purchase', 'fee'].includes(tx.type)
                          ? 'text-red-400'
                          : (tx.balance_after ?? 0) >= (tx.balance_before ?? 0) ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {['deposit', 'refund', 'bonus', 'payout'].includes(tx.type) 
                        ? '+' 
                        : ['withdrawal', 'purchase', 'fee'].includes(tx.type)
                          ? '-'
                          : (tx.balance_after ?? 0) >= (tx.balance_before ?? 0) ? '+' : '-'
                      }
                      {formatMoney(Math.abs(tx.amount))}
                    </div>
                    {tx.balance_after !== undefined && (
                      <div className="text-xs text-zinc-500">
                        → {formatMoney(tx.balance_after)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
