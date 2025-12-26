'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

// Типы
interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  icon?: ReactNode;
}

interface NotifyOptions {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ModalContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  notify: (options: NotifyOptions) => void;
}

const ModalContext = createContext<ModalContextType | null>(null);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
};

// Иконки
const Icons = {
  danger: (
    <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  warning: (
    <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  info: (
    <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  success: (
    <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const typeColors = {
  danger: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    button: 'bg-red-500 hover:bg-red-400',
    glow: 'rgba(239, 68, 68, 0.2)',
  },
  warning: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    button: 'bg-yellow-500 hover:bg-yellow-400 text-black',
    glow: 'rgba(234, 179, 8, 0.2)',
  },
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    button: 'bg-blue-500 hover:bg-blue-400',
    glow: 'rgba(59, 130, 246, 0.2)',
  },
  success: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    button: 'bg-emerald-500 hover:bg-emerald-400',
    glow: 'rgba(16, 185, 129, 0.2)',
  },
  error: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    button: 'bg-red-500 hover:bg-red-400',
    glow: 'rgba(239, 68, 68, 0.2)',
  },
};

export function ModalProvider({ children }: { children: ReactNode }) {
  // Состояние для confirm диалога
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve: ((value: boolean) => void) | null;
  }>({
    isOpen: false,
    options: { message: '' },
    resolve: null,
  });

  // Состояние для уведомлений
  const [notifications, setNotifications] = useState<Array<NotifyOptions & { id: number }>>([]);
  const [notifyId, setNotifyId] = useState(0);

  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        options,
        resolve,
      });
    });
  };

  const handleConfirm = (result: boolean) => {
    if (confirmState.resolve) {
      confirmState.resolve(result);
    }
    setConfirmState({ isOpen: false, options: { message: '' }, resolve: null });
  };

  const notify = (options: NotifyOptions) => {
    const id = notifyId + 1;
    setNotifyId(id);
    setNotifications((prev) => [...prev, { ...options, id }]);
    
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, options.duration || 3000);
  };

  const { isOpen, options } = confirmState;
  const type = options.type || 'info';
  const colors = typeColors[type];

  return (
    <ModalContext.Provider value={{ confirm, notify }}>
      {children}

      {/* Confirm Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className={`bg-gradient-to-br from-[#1a1a1f] to-[#0d0d0f] border ${colors.border} rounded-3xl p-8 max-w-md w-full animate-in zoom-in-95 duration-200 relative overflow-hidden`}
            style={{ boxShadow: `0 0 60px ${colors.glow}` }}
          >
            {/* Декоративная линия сверху */}
            <div className={`absolute top-0 left-0 w-full h-1 ${colors.button.split(' ')[0]}`} />
            
            {/* Иконка */}
            <div className="flex justify-center mb-6">
              <div className={`w-16 h-16 ${colors.bg} ${colors.border} border-2 rounded-full flex items-center justify-center`}>
                {options.icon || Icons[type]}
              </div>
            </div>

            {/* Заголовок */}
            {options.title && (
              <h2 className="text-xl font-black text-center mb-2 text-white">
                {options.title}
              </h2>
            )}

            {/* Сообщение */}
            <p className="text-zinc-300 text-center mb-8 leading-relaxed">
              {options.message}
            </p>

            {/* Кнопки */}
            <div className="flex gap-3">
              <button
                onClick={() => handleConfirm(false)}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold transition-all"
              >
                {options.cancelText || 'Отмена'}
              </button>
              <button
                onClick={() => handleConfirm(true)}
                className={`flex-1 py-3 ${colors.button} rounded-xl font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98]`}
              >
                {options.confirmText || 'Подтвердить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className="fixed bottom-6 right-6 z-[9998] flex flex-col gap-3">
        {notifications.map((n) => {
          const nType = n.type || 'info';
          const nColors = typeColors[nType];
          return (
            <div
              key={n.id}
              className={`${nColors.bg} ${nColors.border} border rounded-xl p-4 min-w-[300px] max-w-md animate-in slide-in-from-right duration-300 flex items-center gap-3`}
              style={{ boxShadow: `0 0 20px ${nColors.glow}` }}
            >
              <div className="shrink-0">{Icons[nType]}</div>
              <p className="text-sm text-white">{n.message}</p>
            </div>
          );
        })}
      </div>
    </ModalContext.Provider>
  );
}

export default ModalProvider;
