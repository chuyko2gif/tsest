import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../../lib/supabase';
import { 
  calculatePaymentAmount, 
  formatPrice, 
  getReleaseTypeName,
  type ReleaseType 
} from '@/lib/utils/calculatePayment';
import { useTheme } from '@/contexts/ThemeContext';

// Компактный компонент успешной оплаты (модальное окно, не на весь экран)
function PaymentSuccessOverlay({ 
  amount, 
  onContinue,
  isLight
}: { 
  amount: number; 
  onContinue: () => void;
  isLight: boolean;
}) {
  // Автозакрытие через 2 секунды
  useEffect(() => {
    const timer = setTimeout(() => {
      onContinue();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [onContinue]);
  
  return (
    <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`${isLight ? 'bg-white border-gray-200' : 'bg-zinc-900 border-white/10'} border rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in`}>
        {/* Иконка успеха */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        
        {/* Текст */}
        <h3 className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'} text-center mb-1`}>
          Оплата успешна
        </h3>
        <p className={`text-center ${isLight ? 'text-gray-600' : 'text-zinc-400'} text-sm mb-3`}>
          Списано с баланса
        </p>
        <div className="text-center text-2xl font-bold text-emerald-400 mb-4">
          {formatPrice(amount)}
        </div>
        
        {/* Индикатор загрузки */}
        <div className="flex justify-center">
          <div className={`flex items-center gap-1.5 text-xs ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            Сохраняем...
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes scale-in {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

interface PaymentStepProps {
  onNext: () => void;
  onBack: () => void;
  onPaymentComplete: (transactionId: string, alreadyPaid?: boolean) => void;
  onPayLater?: () => void;
  canPayLater?: boolean;
  userId?: string | null;
  releaseId?: string | null; // ID релиза для привязки оплаты
  releaseType?: ReleaseType | null;
  tracksCount: number;
  releaseTitle?: string;
  releaseArtist?: string;
  onOpenDeposit?: () => void;
  isPaid?: boolean; // Если релиз уже оплачен
  onEnsureDraft?: () => Promise<string | null>; // Функция для создания черновика перед оплатой
}

interface BalanceData {
  balance: number;
  frozen_balance: number;
  currency: string;
}

export default function PaymentStep({ 
  onNext, 
  onBack, 
  onPaymentComplete, 
  onPayLater, 
  canPayLater = false, 
  userId,
  releaseId,
  releaseType, 
  tracksCount,
  releaseTitle,
  releaseArtist,
  onOpenDeposit,
  isPaid = false,
  onEnsureDraft
}: PaymentStepProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  
  // Расчёт стоимости
  const { total: paymentAmount, breakdown } = calculatePaymentAmount(releaseType, tracksCount);
  const releaseTypeName = getReleaseTypeName(releaseType);
  
  // Проверка минимального количества треков для типа релиза
  const getMinTracksForType = (type: ReleaseType | null | undefined): number => {
    switch (type) {
      case 'single': return 1;
      case 'ep': return 2;
      case 'album': return 8;
      default: return 1;
    }
  };
  
  const minTracksRequired = getMinTracksForType(releaseType);
  const hasEnoughTracks = tracksCount >= minTracksRequired;
  const tracksMissing = minTracksRequired - tracksCount;
  
  // Состояние
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(isPaid); // Если уже оплачен - сразу success
  const [alreadyPaid, setAlreadyPaid] = useState(isPaid);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false); // Для красивого overlay
  const [mounted, setMounted] = useState(false); // Для portal

  // Mount effect для portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Проверяем статус оплаты при загрузке (на случай если isPaid не передан)
  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (releaseId && !isPaid && supabase) {
        try {
          const { data, error } = await supabase
            .from('releases_basic')
            .select('is_paid, payment_transaction_id')
            .eq('id', releaseId)
            .single();
          
          if (!error && data?.is_paid) {
            setAlreadyPaid(true);
            setSuccess(true);
            if (data.payment_transaction_id) {
              onPaymentComplete(data.payment_transaction_id, true);
            }
          }
        } catch {
          // Некритичная ошибка проверки статуса оплаты
        }
      }
    };
    
    checkPaymentStatus();
  }, [releaseId, isPaid]);

  // Загрузка баланса
  useEffect(() => {
    loadBalance();
  }, [userId]);

  const loadBalance = async () => {
    if (!userId || !supabase) {
      setLoading(false);
      return;
    }

    try {
      // Получаем токен авторизации
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('No auth session');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/balance', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      
      if (response.ok) {
        setBalance({
          balance: data.balance,
          frozen_balance: data.frozen_balance,
          currency: data.currency || 'RUB'
        });
      } else {
        console.error('Balance load error:', data.error);
      }
    } catch (err) {
      console.error('Failed to load balance:', err);
    } finally {
      setLoading(false);
    }
  };

  const isEnoughBalance = balance ? balance.balance >= paymentAmount : false;
  const shortage = balance ? Math.max(0, paymentAmount - balance.balance) : paymentAmount;

  const handlePayFromBalance = async () => {
    // Если уже оплачено - просто переходим дальше
    if (alreadyPaid) {
      onNext();
      return;
    }

    if (!userId || !supabase) {
      setError('Ошибка: пользователь не авторизован');
      return;
    }

    if (!isEnoughBalance) {
      setError(`Недостаточно средств. Не хватает ${formatPrice(shortage)}`);
      return;
    }

    setPaymentLoading(true);
    setError(null);

    try {
      // ВАЖНО: Сначала убеждаемся что черновик создан
      let currentReleaseId = releaseId;
      if (!currentReleaseId && onEnsureDraft) {
        currentReleaseId = await onEnsureDraft();
        if (!currentReleaseId) {
          setError('Не удалось сохранить релиз. Попробуйте ещё раз.');
          setPaymentLoading(false);
          return;
        }
      }

      // Получаем токен авторизации
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Ошибка авторизации');
        setPaymentLoading(false);
        return;
      }

      const response = await fetch('/api/balance/purchase', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          amount: paymentAmount,
          description: `Оплата релиза: ${releaseTitle || releaseTypeName}`,
          releaseId: currentReleaseId, // Привязываем к релизу (гарантированно есть)
          releaseTitle: releaseTitle || releaseTypeName,
          releaseArtist: releaseArtist,
          releaseType: 'basic',
          tracksCount: tracksCount
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'INSUFFICIENT_BALANCE') {
          setError(`Недостаточно средств. Не хватает ${formatPrice(data.shortage)}`);
          await loadBalance();
        } else {
          setError(data.error || 'Ошибка оплаты');
        }
        return;
      }

      // Проверяем если был уже оплачен
      if (data.alreadyPaid) {
        setAlreadyPaid(true);
        setSuccess(true);
        onPaymentComplete(data.transactionId, true);
        setTimeout(() => onNext(), 1000);
        return;
      }

      setSuccess(true);
      setAlreadyPaid(true); // Показываем блок "Оплата подтверждена" после закрытия overlay
      
      if (balance) {
        setBalance({ ...balance, balance: data.newBalance });
      }

      onPaymentComplete(data.transactionId, false);

      // Показываем красивый overlay вместо автоперехода
      setShowSuccessOverlay(true);

    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Произошла ошибка при оплате');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Обработчик продолжения после успешной оплаты
  // НЕ переходим автоматически - пользователь сам решит когда перейти
  const handleContinueAfterPayment = () => {
    setShowSuccessOverlay(false);
    // Не вызываем onNext() - остаёмся на шаге оплаты
    // Пользователь увидит блок "Оплата подтверждена" и сам нажмёт "Продолжить"
  };

  return (
    <>
      {/* Overlay успешной оплаты */}
      {mounted && showSuccessOverlay && createPortal(
        <PaymentSuccessOverlay 
          amount={paymentAmount} 
          onContinue={handleContinueAfterPayment}
          isLight={isLight}
        />,
        document.body
      )}
      
      <div className="animate-fade-up">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center ring-1 ${isLight ? 'ring-gray-200' : 'ring-white/10'} ${
            alreadyPaid 
              ? 'bg-gradient-to-br from-emerald-500/20 to-green-500/20' 
              : 'bg-gradient-to-br from-amber-500/20 to-orange-500/20'
          }`}>
            {alreadyPaid ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400 sm:w-7 sm:h-7">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-300 sm:w-7 sm:h-7">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            )}
          </div>
          <div>
            <h2 className={`text-xl sm:text-3xl font-black bg-gradient-to-r ${isLight ? 'from-gray-900 to-gray-600' : 'from-white to-zinc-400'} bg-clip-text text-transparent`}>
              {alreadyPaid ? 'Релиз оплачен' : 'Оплата релиза'}
            </h2>
            <p className={`text-xs sm:text-sm ${isLight ? 'text-gray-500' : 'text-zinc-500'} mt-0.5 sm:mt-1`}>
              {alreadyPaid 
                ? 'Этот релиз уже был оплачен ранее' 
                : 'Оплатите размещение релиза с баланса'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Сообщение об уже оплаченном релизе - красиво по центру */}
      {alreadyPaid && (
        <div className="flex flex-col items-center justify-center min-h-[400px] py-10">
          {/* Центрированный контент */}
          <div className="text-center max-w-md mx-auto">
            {/* Иконка с анимацией */}
            <div className="relative mb-6">
              <div className="w-20 h-20 mx-auto relative">
                <div className="absolute -inset-2 bg-emerald-500/10 rounded-full blur-xl" />
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500/90 to-green-600/90 flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Заголовок */}
            <h3 className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'} mb-2`}>
              Оплата подтверждена
            </h3>
            
            {/* Сумма */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-4">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-emerald-400 font-medium">{formatPrice(paymentAmount)}</span>
              <span className={`${isLight ? 'text-gray-400' : 'text-zinc-500'}`}>•</span>
              <span className={`${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>{releaseTypeName}</span>
            </div>
            
            {/* Описание */}
            <p className={`${isLight ? 'text-gray-600' : 'text-zinc-400'} text-sm mb-8 leading-relaxed`}>
              Этот релиз уже был оплачен ранее. Вы можете продолжить редактирование 
              или отправить релиз на модерацию. Повторная оплата не требуется.
            </p>
            
            {/* Кнопка */}
            <button
              onClick={onNext}
              className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 mx-auto"
            >
              Продолжить
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Обычный UI оплаты - показываем только если не оплачено */}
      {!alreadyPaid && (
        <>
          {/* Карточка баланса */}
          <div className={`p-6 bg-gradient-to-br from-[#6050ba]/20 to-[#9d8df1]/10 border ${isLight ? 'border-[#6050ba]/40' : 'border-[#6050ba]/30'} rounded-2xl mb-6`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#9d8df1]">
                  <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
                  <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
                  <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4Z"/>
                </svg>
                <span className={`text-sm ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>Ваш баланс</span>
              </div>
              <button 
                onClick={loadBalance}
                className={`text-xs ${isLight ? 'text-gray-500 hover:text-gray-900' : 'text-zinc-500 hover:text-white'} transition flex items-center gap-1`}
                disabled={loading}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={loading ? 'animate-spin' : ''}>
                  <path d="M21 12a9 9 0 11-9-9"/>
                  <polyline points="21 3 21 9 15 9"/>
                </svg>
                Обновить
              </button>
        </div>
        <div className={`text-2xl sm:text-3xl font-black ${isLight ? 'text-gray-900' : 'text-white'}`}>
          {loading ? (
            <span className={`${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>Загрузка...</span>
          ) : balance ? (
            formatPrice(balance.balance)
          ) : (
            formatPrice(0)
          )}
        </div>
        {!loading && !isEnoughBalance && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-red-400">
              Не хватает {formatPrice(shortage)}
            </span>
            {onOpenDeposit && (
              <button
                onClick={onOpenDeposit}
                className="text-sm text-amber-400 hover:text-amber-300 underline underline-offset-2 transition"
              >
                Пополнить
              </button>
            )}
          </div>
        )}
      </div>

      {/* Информация о стоимости */}
      <div className={`p-4 sm:p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border ${isLight ? 'border-amber-500/40' : 'border-amber-500/30'} rounded-2xl mb-4 sm:mb-6`}>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div>
            <div className={`text-xs sm:text-sm ${isLight ? 'text-gray-600' : 'text-zinc-400'} mb-1`}>Стоимость {releaseTypeName.toLowerCase()}</div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400">{formatPrice(paymentAmount)}</div>
          </div>
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400 sm:w-8 sm:h-8">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
        </div>
        
        {/* Детализация расчёта по трекам */}
        <div className={`mb-4 p-3 ${isLight ? 'bg-amber-500/15' : 'bg-amber-500/10'} rounded-lg space-y-2`}>
          <div className="flex items-center justify-between text-sm">
            <span className={`${isLight ? 'text-gray-600' : 'text-zinc-400'} flex items-center gap-2`}>
              <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18V5l12-2v13" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="6" cy="18" r="3"/>
                <circle cx="18" cy="16" r="3"/>
              </svg>
              Тип релиза:
            </span>
            <span className="font-bold text-amber-300">{releaseTypeName}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className={`${isLight ? 'text-gray-600' : 'text-zinc-400'} flex items-center gap-2`}>
              <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              Количество треков:
            </span>
            <span className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{tracksCount}</span>
          </div>
          
          {/* Детализация по диапазонам (только для EP/Альбома) */}
          {breakdown.length > 1 && (
            <div className={`pt-2 mt-2 border-t ${isLight ? 'border-amber-500/30' : 'border-amber-500/20'} space-y-1`}>
              {breakdown.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className={`${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
                    Треки {item.range}: {item.count} × {formatPrice(item.pricePerTrack)}
                  </span>
                  <span className="text-amber-400/80">{formatPrice(item.subtotal)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className={`text-xs ${isLight ? 'text-gray-600' : 'text-zinc-400'} space-y-1`}>
          <p>• Единоразовый платёж за дистрибуцию релиза</p>
          <p>• Размещение на всех выбранных площадках</p>
          <p>• Без роялти и скрытых платежей</p>
        </div>
      </div>

      {/* Статус успешной оплаты */}
      {success && (
        <div className={`p-4 ${isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-500/10 border-emerald-500/30'} border rounded-xl mb-6`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div>
              <div className="font-bold text-emerald-400">Оплата успешно произведена!</div>
              <div className={`text-sm ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>С вашего баланса списано {formatPrice(paymentAmount)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Ошибка */}
      {error && (
        <div className={`p-4 ${isLight ? 'bg-red-50 border-red-200' : 'bg-red-500/10 border-red-500/30'} border rounded-xl mb-6`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <div>
              <div className="font-bold text-red-400">Ошибка оплаты</div>
              <div className={`text-sm ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Кнопка пополнения если не хватает */}
      {!loading && !isEnoughBalance && onOpenDeposit && (
        <div className={`p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border ${isLight ? 'border-amber-500/40' : 'border-amber-500/30'} rounded-xl mb-4 sm:mb-6`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <div className="font-bold text-amber-300 mb-1 text-sm sm:text-base">Недостаточно средств</div>
              <div className={`text-xs sm:text-sm ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>
                Пополните баланс на {formatPrice(shortage)} или более
              </div>
            </div>
            <button
              onClick={onOpenDeposit}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl transition flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Пополнить баланс
            </button>
          </div>
        </div>
      )}

      {/* Навигация */}
      {!alreadyPaid && (
        <div className={`mt-6 sm:mt-8 pt-4 sm:pt-6 border-t ${isLight ? 'border-gray-200' : 'border-white/10'} flex flex-col sm:flex-row justify-between gap-3`}>
          <button 
            onClick={onBack} 
            className={`px-4 sm:px-6 py-2.5 sm:py-3 ${isLight ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-white/5 hover:bg-white/10 text-white'} rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm sm:text-base`}
            disabled={paymentLoading || success}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="15 18 9 12 15 6" strokeWidth="2"/>
            </svg>
            Назад
          </button>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {/* Кнопка "Оплатить позже" */}
            {onPayLater && !success && (
              <div className="relative group">
                <button 
                  onClick={onPayLater}
                  disabled={paymentLoading || !canPayLater}
                  className={`w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 border rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm sm:text-base ${
                    canPayLater && !paymentLoading
                      ? isLight 
                        ? 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700 hover:text-gray-900 cursor-pointer'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:text-white cursor-pointer'
                      : isLight
                        ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  Оплатить позже
                </button>
                {!canPayLater && (
                  <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 ${isLight ? 'bg-gray-800 border-gray-700' : 'bg-zinc-800 border-zinc-700'} border rounded-lg text-xs text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl`}>
                    Заполните все обязательные шаги
                    <div className={`absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent ${isLight ? 'border-t-gray-800' : 'border-t-zinc-800'}`}></div>
                  </div>
                )}
              </div>
            )}
            
            {/* Кнопка оплаты с баланса */}
            {!success ? (
              <div className="relative group">
                <button 
                  onClick={handlePayFromBalance}
                  disabled={!isEnoughBalance || paymentLoading || loading || !hasEnoughTracks}
                  className={`w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm sm:text-base ${
                    isEnoughBalance && !paymentLoading && !loading && hasEnoughTracks
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black cursor-pointer' 
                      : isLight
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                }`}
            >
              {paymentLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Оплата...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
                    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
                    <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4Z"/>
                  </svg>
                  Оплатить с баланса
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="9 18 15 12 9 6" strokeWidth="2"/>
                  </svg>
                </>
              )}
            </button>
                {!hasEnoughTracks && (
                  <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 ${isLight ? 'bg-red-100 border-red-300 text-red-700' : 'bg-red-900/90 border-red-700 text-red-200'} border rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl`}>
                    Для {releaseType === 'ep' ? 'EP' : 'Альбома'} нужно минимум {minTracksRequired} трек{minTracksRequired === 8 ? 'ов' : 'а'}. Добавьте ещё {tracksMissing}.
                    <div className={`absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent ${isLight ? 'border-t-red-100' : 'border-t-red-900/90'}`}></div>
                  </div>
                )}
              </div>
          ) : (
            <button 
              onClick={onNext}
              className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black text-sm sm:text-base"
            >
              Продолжить
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="9 18 15 12 9 6" strokeWidth="2"/>
              </svg>
            </button>
          )}
        </div>
      </div>
      )}
      </>
      )}
    </div>
    </>
  );
}
