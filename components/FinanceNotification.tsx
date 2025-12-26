'use client';

import { useEffect, useState } from 'react';

export interface FinanceNotification {
  id: string;
  type: 'payout' | 'withdrawal_approved' | 'withdrawal_rejected' | 'withdrawal_completed' | 'withdrawal_pending';
  amount: number;
  message: string;
  timestamp: Date;
}

interface FinanceNotificationToastProps {
  notification: FinanceNotification;
  onClose: (id: string) => void;
}

const FinanceNotificationToast: React.FC<FinanceNotificationToastProps> = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Появление
    setTimeout(() => setIsVisible(true), 10);

    // Автоматическое исчезновение через 5 секунд
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(notification.id);
    }, 300); // Время анимации
  };

  const config = {
    payout: {
      icon: '💰',
      bg: 'bg-emerald-500/20',
      border: 'border-emerald-500/50',
      text: 'text-emerald-400',
      iconBg: 'bg-emerald-500/30',
    },
    withdrawal_approved: {
      icon: '✓',
      bg: 'bg-blue-500/20',
      border: 'border-blue-500/50',
      text: 'text-blue-400',
      iconBg: 'bg-blue-500/30',
    },
    withdrawal_rejected: {
      icon: '✕',
      bg: 'bg-red-500/20',
      border: 'border-red-500/50',
      text: 'text-red-400',
      iconBg: 'bg-red-500/30',
    },
    withdrawal_completed: {
      icon: '✓✓',
      bg: 'bg-emerald-500/20',
      border: 'border-emerald-500/50',
      text: 'text-emerald-400',
      iconBg: 'bg-emerald-500/30',
    },
    withdrawal_pending: {
      icon: '⏳',
      bg: 'bg-yellow-500/20',
      border: 'border-yellow-500/50',
      text: 'text-yellow-400',
      iconBg: 'bg-yellow-500/30',
    },
  };

  const style = config[notification.type];

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border backdrop-blur-xl
        ${style.bg} ${style.border}
        transition-all duration-300 ease-out
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        shadow-2xl
      `}
      style={{ minWidth: '320px', maxWidth: '400px' }}
    >
      {/* Иконка */}
      <div className={`w-10 h-10 rounded-lg ${style.iconBg} flex items-center justify-center text-lg flex-shrink-0`}>
        {style.icon}
      </div>

      {/* Контент */}
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-bold ${style.text} mb-1`}>
          {notification.message}
        </div>
        <div className="text-xs text-zinc-400">
          {Number(notification.amount).toLocaleString('ru-RU').replace(/\s/g, '.')} ₽
        </div>
      </div>

      {/* Кнопка закрытия */}
      <button
        onClick={handleClose}
        className="flex-shrink-0 w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all text-xs"
      >
        ✕
      </button>
    </div>
  );
};

interface FinanceNotificationContainerProps {
  notifications: FinanceNotification[];
  onClose: (id: string) => void;
}

export const FinanceNotificationContainer: React.FC<FinanceNotificationContainerProps> = ({ notifications, onClose }) => {
  return (
    <div className="fixed top-20 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      <div className="flex flex-col gap-3 pointer-events-auto">
        {notifications.map((notification) => (
          <FinanceNotificationToast
            key={notification.id}
            notification={notification}
            onClose={onClose}
          />
        ))}
      </div>
    </div>
  );
};
