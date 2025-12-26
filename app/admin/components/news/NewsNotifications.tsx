'use client';

import { NotificationState, ConfirmDialogState } from './types';

interface NewsNotificationsProps {
  notification: NotificationState;
  confirmDialog: ConfirmDialogState;
  setConfirmDialog: (dialog: ConfirmDialogState) => void;
}

export function NewsNotifications({ notification, confirmDialog, setConfirmDialog }: NewsNotificationsProps) {
  return (
    <>
      {/* Уведомление */}
      {notification.show && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-6 py-3 rounded-xl shadow-2xl border backdrop-blur-sm ${
            notification.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="font-medium">{notification.message}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Диалог подтверждения */}
      {confirmDialog.show && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#1a1a1f] border border-white/10 rounded-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold mb-4">Подтверждение</h3>
            <p className="text-zinc-400 mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDialog({...confirmDialog, show: false})}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold transition"
              >
                Нет
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog({...confirmDialog, show: false});
                }}
                className="flex-1 py-3 bg-[#6050ba] hover:bg-[#7060ca] rounded-xl font-bold transition"
              >
                Да
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
